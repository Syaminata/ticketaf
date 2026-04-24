const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'senegaltaftaf@gmail.com',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

const sendWelcomeEmailToClient = async (email, name) => {
  try {
    const mailOptions = {
      from: `"Ticketaf" <${process.env.EMAIL_USER || 'senegaltaftaf@gmail.com'}>`,
      to: email,
      subject: 'Bienvenue sur Ticketaf ! 🎉',
      html: `<h1>Bienvenue ${name}</h1><p>Merci d'avoir rejoint Ticketaf.</p>`
    };
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenue envoyé');
  } catch (error) {
    console.warn('⚠️ Erreur envoi email bienvenue:', error.message);
  }
};

const sendNewClientNotification = async (user) => {
  try {
    console.log(`🔔 Nouveau client enregistré: ${user.name} (${user.numero})`);
    // Logique pour notifier l'admin
  } catch (error) {
    console.warn('⚠️ Erreur notification admin:', error.message);
  }
};

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Ticketaf" <${process.env.EMAIL_USER || 'senegaltaftaf@gmail.com'}>`,
      to,
      subject,
      html
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Erreur sendEmail:', error);
    throw error;
  }
};

module.exports = { sendWelcomeEmailToClient, sendNewClientNotification, sendEmail };
