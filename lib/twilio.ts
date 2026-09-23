type Channel = "whatsapp" | "sms" | "call";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

function assertConfig() {
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error("Twilio Verify belum dikonfigurasi di Environment Variables.");
  }
}

function authHeader() {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

async function twilioRequest(path: string, body: URLSearchParams) {
  assertConfig();

  const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : "Twilio Verify request gagal.";
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return data as { sid?: string; status?: string; channel?: string };
}

export async function sendVerification(to: string, channel: Channel) {
  const body = new URLSearchParams({ To: to, Channel: channel });
  return twilioRequest("/Verifications", body);
}

export async function checkVerification(to: string, code: string) {
  const body = new URLSearchParams({ To: to, Code: code });
  return twilioRequest("/VerificationCheck", body);
}
