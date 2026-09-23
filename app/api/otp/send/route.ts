import { NextResponse } from "next/server";
import { isE164 } from "@/lib/phone";
import { sendVerification } from "@/lib/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recent = new Map<string, number>();
const COOLDOWN_SECONDS = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const channel = body?.channel;

    if (!isE164(phone)) {
      return NextResponse.json({ error: "Nomor harus menggunakan format E.164, misalnya +628xxxxxxxxxx." }, { status: 400 });
    }

    if (!["whatsapp", "sms", "call"].includes(channel)) {
      return NextResponse.json({ error: "Kanal OTP tidak valid." }, { status: 400 });
    }

    const key = `${phone}:${channel}`;
    const last = recent.get(key) ?? 0;
    const remaining = Math.ceil((last + COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);

    if (remaining > 0) {
      return NextResponse.json(
        { error: `Tunggu ${remaining} detik sebelum request berikutnya.`, cooldownSeconds: remaining },
        { status: 429 },
      );
    }

    const verification = await sendVerification(phone, channel);
    recent.set(key, Date.now());

    return NextResponse.json({
      ok: true,
      verificationId: verification.sid ?? "",
      status: verification.status ?? "pending",
      cooldownSeconds: COOLDOWN_SECONDS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pengiriman OTP gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
