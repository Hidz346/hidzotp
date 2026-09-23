const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

function assertConfig() {
  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase belum dikonfigurasi di Environment Variables.");
  }
}

async function request(path: string, init?: RequestInit) {
  assertConfig();

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: secretKey!,
      Authorization: `Bearer ${secretKey!}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string" ? data.message :
      typeof data?.hint === "string" ? data.hint :
      "Supabase request gagal.";
    throw new Error(message);
  }

  return data;
}

export async function getLatestOtpRequest(phone: string, channel: "whatsapp" | "sms" | "call") {
  const query = new URLSearchParams({
    phone: `eq.${phone}`,
    channel: `eq.${channel}`,
    order: "created_at.desc",
    limit: "1",
  });

  const rows = await request(`otp_requests?${query.toString()}`);
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function createOtpRequest(input: {
  phone: string;
  channel: "whatsapp" | "sms" | "call";
  providerRequestId: string;
  status?: string;
}) {
  const rows = await request("otp_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      phone: input.phone,
      channel: input.channel,
      provider_request_id: input.providerRequestId,
      status: input.status ?? "pending",
    }),
  });

  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function markOtpVerified(providerRequestId: string) {
  await request(
    `otp_requests?provider_request_id=eq.${encodeURIComponent(providerRequestId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "verified",
        verified_at: new Date().toISOString(),
      }),
    },
  );
}
