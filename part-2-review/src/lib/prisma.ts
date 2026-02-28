import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient to avoid exhausting database connections
const prisma = new PrismaClient();

export default prisma;
