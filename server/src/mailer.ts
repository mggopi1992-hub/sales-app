import nodemailer from 'nodemailer';

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendOtp(to: string, code: string) {
  if (!transport) {
    console.log(`[DEV] OTP for ${to}: ${code}`); // no SMTP configured -> read OTP from console
    return;
  }
  await transport.sendMail({
    from: process.env.MAIL_FROM, to, subject: 'Your verification code',
    text: `Your OTP is ${code}. It is valid for 5 minutes.`,
  });
}
