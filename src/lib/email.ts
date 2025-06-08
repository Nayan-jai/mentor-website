import nodemailer from 'nodemailer';

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface SessionEmailData {
  mentorName: string;
  mentorEmail: string;
  studentName: string;
  studentEmail: string;
  sessionTitle: string;
  startTime: Date;
  endTime: Date;
  meetLink: string;
}

export async function sendSessionBookingEmails(data: SessionEmailData) {
  const { mentorName, mentorEmail, studentName, studentEmail, sessionTitle, startTime, endTime, meetLink } = data;

  // Format the date and time
  const formattedDate = startTime.toLocaleDateString();
  const formattedStartTime = startTime.toLocaleTimeString();
  const formattedEndTime = endTime.toLocaleTimeString();

  // Email to student
  const studentEmailContent = {
    from: process.env.EMAIL_USER,
    to: studentEmail,
    subject: `Session Booked: ${sessionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5fcf80;">Session Booking Confirmation</h2>
        <p>Dear ${studentName},</p>
        <p>Your session with ${mentorName} has been successfully booked.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #37423b; margin-top: 0;">Session Details:</h3>
          <p><strong>Title:</strong> ${sessionTitle}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
          <p><strong>Mentor:</strong> ${mentorName}</p>
          <p><strong>Google Meet Link:</strong> <a href="${meetLink}" style="color: #5fcf80;">${meetLink}</a></p>
        </div>
        <p>Please join the session using the Google Meet link provided above.</p>
        <p>Best regards,<br>UPSC Mentor Team</p>
      </div>
    `,
  };

  // Email to mentor
  const mentorEmailContent = {
    from: process.env.EMAIL_USER,
    to: mentorEmail,
    subject: `New Session Booking: ${sessionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5fcf80;">New Session Booking</h2>
        <p>Dear ${mentorName},</p>
        <p>${studentName} has booked a session with you.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #37423b; margin-top: 0;">Session Details:</h3>
          <p><strong>Title:</strong> ${sessionTitle}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Google Meet Link:</strong> <a href="${meetLink}" style="color: #5fcf80;">${meetLink}</a></p>
        </div>
        <p>Please join the session using the Google Meet link provided above.</p>
        <p>Best regards,<br>UPSC Mentor Team</p>
      </div>
    `,
  };

  try {
    // Send emails
    await transporter.sendMail(studentEmailContent);
    await transporter.sendMail(mentorEmailContent);
    return true;
  } catch (error) {
    console.error('Error sending emails:', error);
    return false;
  }
} 