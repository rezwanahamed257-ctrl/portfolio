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

/* ─── ENVIRONMENT VARIABLE VALIDATION ────────────── */
const REQUIRED_ENV = ['EMAIL_USER', 'EMAIL_PASS'];
const missingVars = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.error(
    `[FATAL] Missing required environment variables: ${missingVars.join(', ')}\n` +
    'Copy .env.example to .env and fill in your values.'
  );
  process.exit(1);
}

/* ─── MIDDLEWARE ────────────────────────────────── */

// Allow requests from your frontend domain
// In production: replace '*' with your actual frontend URL
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST']
}));

// Parse incoming JSON request bodies with a size limit to prevent abuse
app.use(express.json({ limit: '100kb' }));

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

// Verify transporter connection at startup
transporter.verify()
  .then(() => console.log('[OK] Email transporter verified — SMTP credentials are valid.'))
  .catch(err => {
    console.error(
      '[WARN] Email transporter verification failed:', err.message,
      '\nEmails will likely fail to send. Check EMAIL_USER and EMAIL_PASS in your .env file.'
    );
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

    // Send both emails independently so a failure in one doesn't block the other
    const [notificationResult, autoReplyResult] = await Promise.allSettled([
      transporter.sendMail(mailToYou),
      transporter.sendMail(mailToVisitor)
    ]);

    // The notification email to you is critical; if it fails, report an error
    if (notificationResult.status === 'rejected') {
      console.error('[ERROR] Failed to send notification email:', notificationResult.reason.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to deliver your message. Please try again later.'
      });
    }

    // Auto-reply failure is non-critical — log it but still report success to the visitor
    if (autoReplyResult.status === 'rejected') {
      console.error('[WARN] Auto-reply email failed:', autoReplyResult.reason.message);
    }

    // Success response
    res.json({
      success: true,
      message: 'Message sent successfully!'
    });

  } catch (error) {
    console.error('[ERROR] Unexpected failure in /api/contact:', error.message);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
});

/* ─── GLOBAL ERROR HANDLING MIDDLEWARE ───────────── */
// Catches unhandled errors thrown in route handlers
app.use((err, req, res, _next) => {
  console.error('[ERROR] Unhandled route error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error.'
  });
});

/* ─── START SERVER ───────────────────────────────── */
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is already in use. Choose a different port or stop the other process.`);
  } else {
    console.error('[FATAL] Server failed to start:', err.message);
  }
  process.exit(1);
});

/* ─── PROCESS-LEVEL ERROR HANDLERS ──────────────── */
process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message);
  process.exit(1);
});
