---
name: testing-portfolio-backend
description: Test the portfolio backend API end-to-end. Use when verifying server.js changes, contact form logic, or email handling.
---

# Testing the Portfolio Backend

## Prerequisites

- Node.js >=18
- Dependencies installed (`npm install`)

## Devin Secrets Needed

None required for testing — unit tests mock nodemailer. SMTP credentials (EMAIL_USER, EMAIL_PASS) are only needed for live email testing.

## Running Unit Tests

```bash
cd /home/ubuntu/repos/portfolio
npm test
```

This runs Jest with coverage. Expected output: 18 tests passing, ~87% statement coverage.

The only uncovered lines are the `app.listen()` block (lines 161-164), which is guarded by `require.main === module` and unreachable in test imports.

## Manual Endpoint Testing

Start the server (no .env file needed for validation/health tests):

```bash
node server.js &
```

Verify endpoints:

```bash
# Health check
curl -s http://localhost:3000/
# Expected: {"status":"OK","message":"Rezwan Ahamed Portfolio API is running ✓"}

# Validation: missing fields
curl -s -w "\nHTTP:%{http_code}" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"email":"test@x.com","message":"hi"}'
# Expected: HTTP 400, error about required fields

# Validation: invalid email
curl -s -w "\nHTTP:%{http_code}" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"bad","message":"hi"}'
# Expected: HTTP 400, error about valid email

# SMTP failure (no credentials)
curl -s -w "\nHTTP:%{http_code}" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"hello"}'
# Expected: HTTP 500, generic error (no internals leaked)
```

Kill the server when done: `pkill -f "node server.js"`

## Architecture Notes

- `server.js` exports the Express app via `module.exports = app` for testability
- `app.listen()` only runs when executed directly (`require.main === module`)
- Nodemailer is mocked in tests via `jest.mock('nodemailer')`
- Tests are in `__tests__/server.test.js`
- No CI is configured — tests run locally only
- All testing is shell-based (no browser UI to test)
