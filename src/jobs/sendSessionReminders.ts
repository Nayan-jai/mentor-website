import prisma from '../lib/prisma';
import { sendSessionReminderEmail } from '../lib/email';
import { formatSessionTime } from '../lib/utils';

async function main() {
  const now = new Date();
  const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
  const tenMinutesFromNowStart = new Date(tenMinutesFromNow);
  tenMinutesFromNowStart.setSeconds(0, 0);
  const tenMinutesFromNowEnd = new Date(tenMinutesFromNow);
  tenMinutesFromNowEnd.setSeconds(59, 999);

  // Find all sessions starting in exactly 10 minutes
  const sessions = await prisma.mentorSlot.findMany({
    where: {
      startTime: {
        gte: tenMinutesFromNowStart,
        lte: tenMinutesFromNowEnd,
      },
    },
    include: {
      mentor: { select: { name: true } },
      bookings: {
        include: {
          mentee: { select: { email: true, name: true } },
        },
      },
    },
  });

  for (const session of sessions) {
    const sessionTime = formatSessionTime(session.startTime);
    for (const booking of session.bookings) {
      if (!booking.mentee?.email) continue;
      await sendSessionReminderEmail(
        booking.mentee.email,
        session.title,
        sessionTime,
        session.mentor.name || 'Mentor',
        session.meetingLink || undefined
      );
      console.log(`Sent reminder to ${booking.mentee.email} for session '${session.title}' at ${sessionTime}`);
    }
  }
}

main()
  .then(() => {
    console.log('Session reminders sent.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error sending session reminders:', err);
    process.exit(1);
  }); 