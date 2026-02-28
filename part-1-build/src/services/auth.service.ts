import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { env } from "../config/env";
import { RegisterInput, LoginInput } from "../validators/auth.validators";
import { JwtPayload, UserResponse, AuthTokens } from "../types";
import { AppError, ErrorCode } from "../lib/errors";

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = 900; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Pre-hashed dummy password for timing-attack protection
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", SALT_ROUNDS);

export class AuthService {
  // ─── Helpers ──────────────────────────────────────────

  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: "HS256",
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  private buildUserResponse(user: {
    id: string;
    email: string;
    name: string;
    role: any;
  }): UserResponse {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  // ─── Register ─────────────────────────────────────────

  async register(input: RegisterInput): Promise<{ user: UserResponse }> {
    const { email, password, name, role } = input;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(
        "A user with this email already exists",
        409,
        ErrorCode.DUPLICATE_EMAIL
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
    });

    return { user: this.buildUserResponse(user) };
  }

  // ─── Login ────────────────────────────────────────────

  async login(
    input: LoginInput
  ): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({ where: { email } });

    // Timing-attack protection: always run bcrypt.compare even if user doesn't exist
    const isValidPassword = await bcrypt.compare(
      password,
      user?.password ?? DUMMY_HASH
    );

    if (!user || !isValidPassword) {
      throw new AppError(
        "Invalid email or password",
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Check if user is soft-deleted
    if (user.deletedAt) {
      throw new AppError(
        "This account has been deactivated",
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: this.buildUserResponse(user),
    };
  }

  // ─── Refresh Tokens ───────────────────────────────────

  async refreshTokens(
    token: string
  ): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError(
        "Invalid refresh token",
        401,
        ErrorCode.INVALID_TOKEN
      );
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AppError(
        "Refresh token has expired",
        401,
        ErrorCode.TOKEN_EXPIRED
      );
    }

    // Check if user is soft-deleted
    if (storedToken.user.deletedAt) {
      await prisma.refreshToken.deleteMany({ where: { userId: storedToken.userId } });
      throw new AppError(
        "This account has been deactivated",
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Token rotation
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const payload: JwtPayload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(storedToken.user.id);

    return {
      accessToken,
      refreshToken,
      user: this.buildUserResponse(storedToken.user),
    };
  }

  // ─── Logout ───────────────────────────────────────────

  async logout(token: string): Promise<void> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      throw new AppError(
        "Invalid refresh token",
        400,
        ErrorCode.INVALID_TOKEN
      );
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  }

  async logoutAll(userId: string): Promise<{ count: number }> {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { count: result.count };
  }
}

export const authService = new AuthService();
