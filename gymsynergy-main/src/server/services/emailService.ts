import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: EmailOptions) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    ...options,
  };

  return transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (to: string, name: string, type: 'client' | 'instructor') => {
  const subject = `Welcome to GymSynergy!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Welcome to GymSynergy, ${name}!</h1>
      
      ${type === 'client' ? `
        <p>Thank you for joining GymSynergy! We're excited to help you achieve your fitness goals.</p>
        <p>As a client, you can:</p>
        <ul>
          <li>Browse and book sessions with our expert instructors</li>
          <li>Access workout videos and training materials</li>
          <li>Track your progress and set fitness goals</li>
          <li>Connect with our fitness community</li>
        </ul>
      ` : `
        <p>Welcome to the GymSynergy instructor team! We're thrilled to have you on board.</p>
        <p>As an instructor, you can:</p>
        <ul>
          <li>Create and manage your training schedule</li>
          <li>Upload workout videos and training content</li>
          <li>Connect with clients and track their progress</li>
          <li>Build your personal training business</li>
        </ul>
      `}
      
      <p>Please verify your email address to get started.</p>
      
      <p>Best regards,<br>The GymSynergy Team</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const subject = 'Reset Your GymSynergy Password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Reset Your Password</h1>
      
      <p>We received a request to reset your GymSynergy password.</p>
      
      <p>Click the button below to reset your password:</p>
      
      <a href="${resetLink}" style="
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        margin: 16px 0;
      ">Reset Password</a>
      
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
      
      <p>Best regards,<br>The GymSynergy Team</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
};

export const sendVerificationEmail = async (to: string, verificationLink: string) => {
  const subject = 'Verify Your GymSynergy Email';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Verify Your Email</h1>
      
      <p>Thank you for signing up with GymSynergy! Please verify your email address to get started.</p>
      
      <p>Click the button below to verify your email:</p>
      
      <a href="${verificationLink}" style="
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        margin: 16px 0;
      ">Verify Email</a>
      
      <p>If you didn't create a GymSynergy account, you can safely ignore this email.</p>
      
      <p>Best regards,<br>The GymSynergy Team</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
};
