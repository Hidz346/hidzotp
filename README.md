# HidzOtp

Private OTP verification playground for Hidz Project.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Twilio Verify
- Vercel

## Channels

HidzOtp uses an official verification provider for the app's own verification flow:

- WhatsApp
- SMS
- Voice call

The recipient number is entered manually. The application does not include bulk targets, third-party platform OTP triggering, proxy rotation, or automated nonstop sending.

## Local setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Fill in the Twilio Verify credentials.
5. Run `npm run dev`.

## Vercel

Add these Environment Variables to the project:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

Never expose the Twilio credentials in client-side code.

Twilio Verify requires a Verification Service, and phone numbers must be sent in E.164 format. WhatsApp also requires the appropriate WhatsApp sender configuration. See the official Twilio Verify documentation before enabling each channel.

## Notes

The server applies a short per-number/per-channel cooldown to prevent accidental duplicate requests. Provider-side restrictions still apply.

For a Twilio trial account, the recipient number must be verified in Twilio before trial messages/calls can be sent.
