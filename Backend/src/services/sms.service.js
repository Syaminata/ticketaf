const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendOtpSms = async (phone, otp) => {
  const message = `Votre code de réinitialisation est : ${otp}. Valable 5 minutes.`;

  const msg = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone.startsWith('+') ? phone : `+221${phone}` 
  });
};

module.exports = {
  sendOtpSms
};
