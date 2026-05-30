const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, destination, message } = req.body;

    // Validate
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'theloveandlayover@gmail.com',
      replyTo: email,
      subject: `New Contact: ${name} - ${destination || 'Not specified'}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Destination:</strong> ${destination || 'Not specified'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
