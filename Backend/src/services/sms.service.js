const twilio = require('twilio');

// Twilio client - lazy initialization pour éviter les erreurs en dev
let client = null;

const initTwilioClient = () => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Vérifier que les credentials sont valides
    if (!accountSid || !authToken || accountSid === 'your_twilio_account_sid' || authToken === 'your_twilio_auth_token') {
      console.warn('⚠️ Twilio non configuré - SMS désactivé en développement');
      return null;
    }

    return twilio(accountSid, authToken);
  } catch (err) {
    console.warn('⚠️ Erreur Twilio:', err.message);
    return null;
  }
};

const sendOtpSms = async (phone, otp) => {
  try {
    // Initialiser le client si nécessaire
    if (!client) {
      client = initTwilioClient();
    }

    // Si pas de client valide, log et retour
    if (!client) {
      console.log('💬 SMS non envoyé (Twilio non configuré) - OTP:', otp, 'Phone:', phone);
      return { success: false, message: 'Twilio non configuré' };
    }

    const message = `Votre code de réinitialisation est : ${otp}. Valable 5 minutes.`;

    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+221${phone}`
    });

    return { success: true, messageSid: msg.sid };
  } catch (err) {
    console.error('❌ Erreur envoi SMS:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendOtpSms
};
