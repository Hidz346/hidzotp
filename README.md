# HidzOtp

Private OTP verification playground for Hidz Project.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vonage Verify V2
- Vercel

## Channels

HidzOtp uses the official Vonage Verify V2 API for the app's own phone verification flow:

- WhatsApp
- SMS
- Voice call

The recipient number is entered manually. The application does not include bulk targets, third-party platform OTP triggering, proxy rotation, or automated nonstop sending.

## Local setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Fill in `VONAGE_API_KEY` and `VONAGE_API_SECRET`.
5. Run `npm run dev`.

## Supabase + Vercel

HidzOtp stores verification request metadata and the server-side cooldown state in Supabase.

Add these Environment Variables to Vercel:

- `VONAGE_API_KEY`
- `VONAGE_API_SECRET`
- `SUPABASE_URL=https://jkboiocwdxujsblyygjf.supabase.co`
- `SUPABASE_SECRET_KEY`

`SUPABASE_SECRET_KEY` is server-only. Never add it to client-side code, commit it to Git, or expose it with a `NEXT_PUBLIC_` prefix.

This implementation uses Vonage Verify V2 Basic Authentication with the API key and secret. Phone numbers are sent in E.164 format. WhatsApp verification requires a Vonage WhatsApp Business Account (WABA) configured for Verify; SMS and Voice depend on Verify channel availability for the destination.

## Notes

The server applies a short per-number/per-channel cooldown to prevent accidental duplicate requests. Provider-side restrictions still apply.

Vonage returns a `request_id` for each verification. HidzOtp keeps that identifier in the browser state and sends it to the server only when checking the OTP code.
