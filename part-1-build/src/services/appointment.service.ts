import { AppointmentStatus, Role } from "@prisma/client";
import prisma from "../lib/prisma";
import { CreateAppointmentInput, AppointmentQuery } from "../validators/appointment.validators";
import { JwtPayload } from "../types";
import { AppError, ErrorCode } from "../lib/errors";

// Select clause to include nested patient/doctor info without passwords
const appointmentInclude = {
  patient: {
    select: { id: true, name: true, email: true },
  },
  doctor: {
    select: { id: true, name: true, email: true },
  },
} as const;

export class AppointmentService {
  /**
   * List appointments with role-based filtering, pagination, and sorting.
   */
  async list(
    user: JwtPayload,
    filters: AppointmentQuery
  ) {
    const { status, date, page, limit, sortBy, sortOrder } = filters;

    // Build where clause based on role
    const where: Record<string, unknown> = {};

    if (user.role === Role.PATIENT) {
      where.patientId = user.id;
    } else if (user.role === Role.DOCTOR) {
      where.doctorId = user.id;
    }

    // Apply optional filters
    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.dateTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: appointmentInclude,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single appointment by ID, with role-based access check.
   */
  async getById(appointmentId: string, user: JwtPayload) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: appointmentInclude,
    });

    if (!appointment) {
      throw new AppError(
        "Appointment not found",
        404,
        ErrorCode.APPOINTMENT_NOT_FOUND
      );
    }

    // Access control
    if (
      user.role === Role.PATIENT &&
      appointment.patientId !== user.id
    ) {
      throw new AppError(
        "You do not have permission to view this appointment",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    if (
      user.role === Role.DOCTOR &&
      appointment.doctorId !== user.id
    ) {
      throw new AppError(
        "You do not have permission to view this appointment",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    return appointment;
  }

  /**
   * Create a new appointment.
   * - Only PATIENTs can create.
   * - Checks doctor conflicts AND patient double-booking.
   */
  async create(input: CreateAppointmentInput, user: JwtPayload) {
    if (user.role !== Role.PATIENT) {
      throw new AppError(
        "Only patients can create appointments",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const { doctorId, dateTime: dateTimeStr, duration, notes } = input;
    const dateTime = new Date(dateTimeStr);

    // dateTime must be in the future
    if (dateTime <= new Date()) {
      throw new AppError(
        "Appointment date must be in the future",
        400,
        ErrorCode.APPOINTMENT_IN_PAST
      );
    }

    // Verify doctor exists and has DOCTOR role
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== Role.DOCTOR || doctor.deletedAt) {
      throw new AppError("Doctor not found", 404, ErrorCode.DOCTOR_NOT_FOUND);
    }

    // --- Conflict detection ---
    const newEnd = new Date(dateTime.getTime() + duration * 60 * 1000);

    // Check doctor schedule conflicts
    const doctorConflicts = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Appointment"
      WHERE "doctorId" = ${doctorId}
        AND "status" = 'SCHEDULED'
        AND "dateTime" < ${newEnd}
        AND ("dateTime" + ("duration" * interval '1 minute')) > ${dateTime}
      LIMIT 1
    `;

    if (doctorConflicts.length > 0) {
      throw new AppError(
        "This time slot conflicts with an existing appointment for this doctor",
        409,
        ErrorCode.APPOINTMENT_CONFLICT
      );
    }

    // Check patient double-booking
    const patientConflicts = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Appointment"
      WHERE "patientId" = ${user.id}
        AND "status" = 'SCHEDULED'
        AND "dateTime" < ${newEnd}
        AND ("dateTime" + ("duration" * interval '1 minute')) > ${dateTime}
      LIMIT 1
    `;

    if (patientConflicts.length > 0) {
      throw new AppError(
        "You already have an appointment during this time slot",
        409,
        ErrorCode.PATIENT_CONFLICT
      );
    }

    // Create appointment
    return prisma.appointment.create({
      data: {
        patientId: user.id,
        doctorId,
        dateTime,
        duration,
        status: AppointmentStatus.SCHEDULED,
        notes: notes || null,
      },
      include: appointmentInclude,
    });
  }

  /**
   * Cancel an appointment with role-based access checks.
   */
  async cancel(appointmentId: string, user: JwtPayload) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new AppError(
        "Appointment not found",
        404,
        ErrorCode.APPOINTMENT_NOT_FOUND
      );
    }

    // Access control
    if (
      user.role === Role.PATIENT &&
      appointment.patientId !== user.id
    ) {
      throw new AppError(
        "You do not have permission to cancel this appointment",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    if (
      user.role === Role.DOCTOR &&
      appointment.doctorId !== user.id
    ) {
      throw new AppError(
        "You do not have permission to cancel this appointment",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new AppError(
        "Appointment is already cancelled",
        400,
        ErrorCode.ALREADY_CANCELLED
      );
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new AppError(
        "Cannot cancel a completed appointment",
        400,
        ErrorCode.CANNOT_COMPLETE
      );
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
      include: appointmentInclude,
    });
  }

  /**
   * Mark an appointment as COMPLETED. Only the assigned DOCTOR or ADMIN can do this.
   */
  async complete(appointmentId: string, user: JwtPayload) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new AppError(
        "Appointment not found",
        404,
        ErrorCode.APPOINTMENT_NOT_FOUND
      );
    }

    // Only the assigned doctor or admin can complete
    if (user.role === Role.PATIENT) {
      throw new AppError(
        "Only doctors or admins can complete appointments",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    if (
      user.role === Role.DOCTOR &&
      appointment.doctorId !== user.id
    ) {
      throw new AppError(
        "You do not have permission to complete this appointment",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new AppError(
        `Cannot complete an appointment with status: ${appointment.status}`,
        400,
        ErrorCode.CANNOT_COMPLETE
      );
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.COMPLETED },
      include: appointmentInclude,
    });
  }

  /**
   * Get available time slots for a doctor on a given date.
   * Assumes 9 AM – 5 PM working hours with 30-minute slots.
   */
  async getDoctorAvailability(doctorId: string, date: string) {
    // Verify doctor exists
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== Role.DOCTOR || doctor.deletedAt) {
      throw new AppError("Doctor not found", 404, ErrorCode.DOCTOR_NOT_FOUND);
    }

    // Get all scheduled appointments for this doctor on the given date
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: AppointmentStatus.SCHEDULED,
        dateTime: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { dateTime: "asc" },
    });

    // Generate all possible 30-min slots from 09:00 to 17:00 (UTC)
    const SLOT_DURATION = 30; // minutes
    const WORK_START_HOUR = 9;
    const WORK_END_HOUR = 17;
    const slots: { start: string; end: string; available: boolean }[] = [];

    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
      for (let min = 0; min < 60; min += SLOT_DURATION) {
        const slotStart = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000Z`);
        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000);

        // Check if this slot overlaps with any existing appointment
        const isBooked = appointments.some((appt) => {
          const apptEnd = new Date(
            appt.dateTime.getTime() + appt.duration * 60 * 1000
          );
          return slotStart < apptEnd && appt.dateTime < slotEnd;
        });

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: !isBooked,
        });
      }
    }

    return {
      doctorId,
      doctorName: doctor.name,
      date,
      slots,
    };
  }
}

export const appointmentService = new AppointmentService();
