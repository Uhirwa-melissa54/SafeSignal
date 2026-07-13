import africastalking from 'africastalking';

const ats = africastalking({
  apiKey: process.env.ATS_API_KEY!,
  username: process.env.ATS_USERNAME!,
});

const sms = ats.SMS;

export async function sendVerificationSMS(to: string, token: string) {
  const verifyLink = `${process.env.FRONTEND_URL}/verify/${token}`;
  
  const message = `SafeSignal\n\nYour parent wants to protect this phone using SafeSignal.\n\nIf you agree, tap the link below.\n\n${verifyLink}\n\nThis link expires in 30 minutes.`;

  try {
    await sms.send({
      to: [to],
      message,
      // from: 'SAFESIGNAL' // Optional: if you have a registered shortcode or alphanumeric sender ID
    });
  } catch (error) {
    console.error('Error sending SMS via Africa\'s Talking:', error);
  }
}
