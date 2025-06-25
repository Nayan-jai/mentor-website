import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset Your Password",
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendSessionReminderEmail(email: string, sessionTitle: string, sessionTime: string, mentorName: string, meetingLink?: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Reminder: Your session '${sessionTitle}' starts in 10 minutes!`,
    html: `
      <h1>Session Reminder</h1>
      <p>Hi,</p>
      <p>This is a reminder that your session <strong>${sessionTitle}</strong> with mentor <strong>${mentorName}</strong> will start at <strong>${sessionTime}</strong> (in 10 minutes).</p>
      ${meetingLink ? `<p>Join your session: <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
      <p>Good luck and have a great session!</p>
      <p style="color: #888; font-size: 0.9em;">If you did not book this session, you can ignore this email.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendSessionBookingConfirmationEmail(email: string, sessionTitle: string, sessionTime: string, mentorName: string, meetingLink?: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Session Booked: '${sessionTitle}' with ${mentorName}`,
    html: `
      <h1>Session Booked!</h1>
      <p>Hi,</p>
      <p>Your session <strong>${sessionTitle}</strong> with mentor <strong>${mentorName}</strong> is scheduled for <strong>${sessionTime}</strong>.</p>
      ${meetingLink ? `<p>Join your session: <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
      <p>You'll also get a reminder 10 minutes before the session starts.</p>
      <p>Good luck and have a great session!</p>
    `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendNewSessionNotificationEmail(email: string, sessionTitle: string, sessionTime: string, mentorName: string, meetingLink?: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `New Session Scheduled: '${sessionTitle}' with ${mentorName}`,
    html: `
      <h1>New Session Scheduled!</h1>
      <p>Hi,</p>
      <p>A new session <strong>${sessionTitle}</strong> with mentor <strong>${mentorName}</strong> is scheduled for <strong>${sessionTime}</strong>.</p>
      ${meetingLink ? `<p>Join the session: <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
      <p>Book your spot now if you're interested!</p>
    `,
  };
  await transporter.sendMail(mailOptions);
} 