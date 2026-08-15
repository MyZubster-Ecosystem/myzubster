const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtps.aruba.it',
  port: 465,
  secure: true,
  auth: {
    user: 'ionidaniel@pec.it',
    pass: process.env.PEC_PASSWORD
  }
});

async function sendPEC(to, subject, text, attachments = []) {
  try {
    const info = await transporter.sendMail({
      from: '"Daniel Ioni" <ionidaniel@pec.it>',
      to,
      subject,
      text,
      attachments
    });
    console.log('📧 PEC inviata:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Errore invio PEC:', error);
    throw error;
  }
}

module.exports = { sendPEC };
