/*
 * ═══════════════════════════════════════════════════
 *  PORTFOLIO BACKEND — server.js
 *  Node.js + Express + Nodemailer
 *
 *  This server handles contact form submissions and
 *  sends an email to your inbox using Nodemailer.
 *
 *  SETUP STEPS (read carefully):
 *  1. Run: npm install
 *  2. Copy .env.example to .env and fill in your values
 *  3. Run: node server.js
 * ═══════════════════════════════════════════════════
 */

// Load environment variables from .env file
require('dotenv').config();

const express  = require('express');
const nodemailer = require('nodemailer');
const cors     = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─── MIDDLEWARE ────────────────────────────────── */

// Allow requests from your frontend domain
// In production: replace '*' with your actual frontend URL
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST']
}));

// Parse incoming JSON request bodies
app.use(express.json());

/* ─── NODEMAILER TRANSPORTER ────────────────────── */
// This creates the email "sender" using Gmail
// Make sure you enable "App Passwords" in your Google account
// (not your normal Gmail password — see README for instructions)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS  // your Gmail App Password
  }
});

/* ─── HEALTH CHECK ENDPOINT ─────────────────────── */
// Visit: https://your-backend-url.com/
// This confirms your server is running
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Rezwan Ahamed Portfolio API is running ✓'
  });
});

/* ─── CONTACT FORM ENDPOINT ─────────────────────── */
// Your frontend sends a POST request to /api/contact
// with JSON body: { name, email, message }
app.post('/api/contact', async (req, res) => {

  // Extract fields from request body
  const { name, email, message } = req.body;

  // Validate — all fields are required
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Please provide name, email, and message.'
    });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address.'
    });
  }

  try {
    // Email that goes to YOUR inbox
    const mailToYou = {
      from:    `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_TO || process.env.EMAIL_USER, // your inbox
      subject: `New Project Inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff4d00; border-bottom: 2px solid #ff4d00; padding-bottom: 10px;">
            New Message from Your Portfolio
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; background: #f5f5f5; font-weight: bold; width: 120px;">Name</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f5f5f5; font-weight: bold;">Email</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <a href="mailto:${email}">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f5f5f5; font-weight: bold;">Message</td>
              <td style="padding: 12px;">${message.replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Sent from your portfolio contact form
          </p>
        </div>
      `
    };

    // Auto-reply email that goes to the VISITOR
    const mailToVisitor = {
      from:    `"Rezwan Ahamed" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: 'Got your message! I\'ll be in touch soon.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff4d00;">Hey ${name},</h2>
          <p>Thanks for reaching out! I've received your message and will get back to you within 24 hours.</p>
          <p style="color: #888;">Here's what you sent:</p>
          <blockquote style="border-left: 3px solid #ff4d00; padding-left: 16px; color: #666;">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <p>Talk soon,<br><strong>Rezwan Ahamed</strong><br>Video Editor & Motion Designer</p>
        </div>
      `
    };

    // Send both emails at the same time
    await Promise.all([
      transporter.sendMail(mailToYou),
      transporter.sendMail(mailToVisitor)
    ]);

    // Success response
    res.json({
      success: true,
      message: 'Message sent successfully!'
    });

  } catch (error) {
    console.error('Email sending failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send email. Please try again later.'
    });
  }
});

/* ─── START SERVER ───────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/\n`);
});
