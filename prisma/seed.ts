import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create test mentor
  const mentor = await prisma.user.upsert({
    where: { email: "mentor@example.com" },
    update: {},
    create: {
      email: "mentor@example.com",
      name: "Test Mentor",
      password: await hash("mentor123", 12),
    },
  });

  // Create test student
  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      email: "student@example.com",
      name: "Test Student",
      password: await hash("student123", 12),
    },
  });

  // Create a mentor slot
  const mentorSlot = await prisma.mentorSlot.create({
    data: {
      mentorId: mentor.id,
      title: "Test Session Slot",
      description: "A test session slot for demonstration",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
      isAvailable: true,
    },
  });

  // Create a session
  const session = await prisma.session.create({
    data: {
      sessionToken: "test-session-token",
      userId: student.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  // Create a booking
  const booking = await prisma.booking.create({
    data: {
      menteeId: student.id,
      slotId: mentorSlot.id,
      sessionId: session.id,
      status: "PENDING",
    },
  });

  console.log({ mentor, student, mentorSlot, session, booking });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 