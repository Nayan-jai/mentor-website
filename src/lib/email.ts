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