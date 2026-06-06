const request = require('supertest');
const nodemailer = require('nodemailer');

// Mock nodemailer before requiring server
jest.mock('nodemailer');

const mockSendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

const app = require('../server');

describe('Portfolio Backend API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ─── GET / — Health Check ────────────────────── */
  describe('GET / — Health Check', () => {
    it('should return 200 with status OK', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.message).toContain('Portfolio API is running');
    });
  });

  /* ─── POST /api/contact — Validation ──────────── */
  describe('POST /api/contact — Validation', () => {
    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ email: 'test@example.com', message: 'Hello' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/name/i);
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'Test User', message: 'Hello' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/email/i);
    });

    it('should return 400 when message is missing', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'Test User', email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/message/i);
    });

    it('should return 400 when all fields are missing', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'Test User', email: 'not-an-email', message: 'Hello' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/valid email/i);
    });

    it('should return 400 for email without domain', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'Test', email: 'user@', message: 'Hi' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for email with spaces', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'Test', email: 'user @domain.com', message: 'Hi' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  /* ─── POST /api/contact — Success Path ────────── */
  describe('POST /api/contact — Success', () => {
    const validPayload = {
      name: 'Test User',
      email: 'visitor@example.com',
      message: 'I would like to work together!'
    };

    it('should return 200 and success when emails send', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'abc123' });

      const res = await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/sent successfully/i);
    });

    it('should send two emails (to owner and auto-reply to visitor)', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'abc123' });

      await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it('should include sender name in the email subject', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'abc123' });

      await request(app)
        .post('/api/contact')
        .send(validPayload);

      const ownerEmailCall = mockSendMail.mock.calls[0][0];
      expect(ownerEmailCall.subject).toContain('Test User');
    });

    it('should send auto-reply to the visitor email address', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'abc123' });

      await request(app)
        .post('/api/contact')
        .send(validPayload);

      const visitorEmailCall = mockSendMail.mock.calls[1][0];
      expect(visitorEmailCall.to).toBe('visitor@example.com');
    });

    it('should include the message content in the owner email HTML', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'abc123' });

      await request(app)
        .post('/api/contact')
        .send(validPayload);

      const ownerEmailCall = mockSendMail.mock.calls[0][0];
      expect(ownerEmailCall.html).toContain('I would like to work together!');
    });

    it('should handle multiline messages by converting newlines to <br>', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'abc123' });

      await request(app)
        .post('/api/contact')
        .send({ ...validPayload, message: 'Line 1\nLine 2' });

      const ownerEmailCall = mockSendMail.mock.calls[0][0];
      expect(ownerEmailCall.html).toContain('Line 1<br>Line 2');
    });
  });

  /* ─── POST /api/contact — Error Handling ──────── */
  describe('POST /api/contact — Error Handling', () => {
    const validPayload = {
      name: 'Test User',
      email: 'visitor@example.com',
      message: 'Hello there'
    };

    it('should return 500 when email sending fails', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

      const res = await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/failed/i);
    });

    it('should not expose internal error details to the client', async () => {
      mockSendMail.mockRejectedValue(new Error('Auth credentials invalid'));

      const res = await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(res.body.error).not.toContain('Auth credentials');
    });
  });

  /* ─── CORS & Middleware ───────────────────────── */
  describe('Middleware', () => {
    it('should accept JSON content type', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'abc123' });

      const res = await request(app)
        .post('/api/contact')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          message: 'Hello'
        }));

      expect(res.status).toBe(200);
    });

    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.status).toBe(404);
    });
  });
});
