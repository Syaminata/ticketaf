const axios = require('axios');

const sendWhatsAppMessage = async (to, message) => {
  try {
    // Validation des paramètres
    if (!to || !message) {
      throw new Error('Le numéro de téléphone et le message sont requis');
    }

    // Formatage du numéro (supprime les espaces et le +)
    const formattedNumber = to.replace(/\s+/g, '').replace(/^\+/, '');

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedNumber,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // Timeout de 10 secondes
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur WhatsApp API:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

module.exports = { sendWhatsAppMessage };