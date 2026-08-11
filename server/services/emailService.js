const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sender = {
  name: 'Vorexa',
  email: process.env.BREVO_SENDER_EMAIL,
};

const sendVerificationEmail = async (to, name, code) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender,
    to: [{ email: to, name }],
    subject: 'Your Vorexa verification code',
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Welcome to Vorexa, ${name}</h2>
        <p>Enter this code to verify your email address:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0F172A; background: #F1F5F9; padding: 16px 20px; border-radius: 8px; text-align: center; margin: 16px 0;">${code}</div>
        <p style="color:#64748B; font-size:13px; margin-top:16px;">This code expires in 15 minutes.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (to, name, resetUrl) => {
  // NOTE: password reset still uses a link — only email verification was switched to a code
  await brevo.transactionalEmails.sendTransacEmail({
    sender,
    to: [{ email: to, name }],
    subject: 'Reset your Vorexa password',
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Password reset request</h2>
        <p>Hi ${name}, click below to reset your password.</p>
        <a href="${resetUrl}" style="display:inline-block; background:#2563EB; color:#F8FAFC; padding:12px 20px; border-radius:8px; text-decoration:none; margin-top:12px;">Reset password</a>
        <p style="color:#64748B; font-size:13px; margin-top:16px;">If you didn't request this, ignore this email. This link expires in 1 hour.</p>
      </div>
    `,
  });
};

const sendTwoFactorCode = async (to, name, code) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender,
    to: [{ email: to, name }],
    subject: 'Your Vorexa login code',
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Confirm it's you, ${name}</h2>
        <p>Enter this code to finish logging in:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0F172A; background: #F1F5F9; padding: 16px 20px; border-radius: 8px; text-align: center; margin: 16px 0;">${code}</div>
        <p style="color:#64748B; font-size:13px; margin-top:16px;">This code expires in 10 minutes. If you didn't try to log in, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorCode };
