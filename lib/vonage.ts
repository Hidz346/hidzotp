type Channel = "whatsapp" | "sms" | "call";

const apiKey = process.env.VONAGE_API_KEY;
const apiSecret = process.env.VONAGE_API_SECRET;

function assertConfig() {
  if (!apiKey || !apiSecret) throw new Error("Vonage Verify belum dikonfigurasi di Environment Variables.");
}

function authHeader() {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

function mapChannel(channel: Channel) {
  return channel === "call" ? "voice" : channel;
}

function toVonageNumber(to: string) {
  return to.replace(/^\+/, "");
}

async function requestVerify(path: string, body: unknown) {
  assertConfig();
  const response = await fetch(`https://api.nexmo.com/v2/verify${path}`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.title === "string" ? data.title :
      typeof data?.detail === "string" ? data.detail :
      typeof data?.message === "string" ? data.message :
      "Vonage Verify request gagal.";
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data as { request_id?: string; status?: string };
}

export async function sendVerification(to: string, channel: Channel) {
  return requestVerify("", {
    brand: "HidzOtp",
    code_length: 6,
    workflow: [{ channel: mapChannel(channel), to: toVonageNumber(to) }],
  });
}

export async function checkVerification(requestId: string, code: string) {
  return requestVerify(`/${encodeURIComponent(requestId)}`, { code });
}
