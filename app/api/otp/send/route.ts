import { NextResponse } from "next/server";
import { isE164 } from "@/lib/phone";
import { sendVerification } from "@/lib/vonage";
import { createOtpRequest, getLatestOtpRequest } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOLDOWN_SECONDS = 30;

type Channel = "whatsapp" | "sms" | "call";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const channel = body?.channel as Channel;

    if (!isE164(phone)) {
      return NextResponse.json(
        { error: "Nomor harus menggunakan format E.164, misalnya +628xxxxxxxxxx." },
        { status: 400 },
      );
    }

    if (!["whatsapp", "sms", "call"].includes(channel)) {
      return NextResponse.json({ error: "Kanal OTP tidak valid." }, { status: 400 });
    }

    const latest = await getLatestOtpRequest(phone, channel);
    if (latest?.created_at) {
      const elapsed = Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 1000);
      const remaining = COOLDOWN_SECONDS - elapsed;

      if (remaining > 0) {
        return NextResponse.json(
          { error: `Tunggu ${remaining} detik sebelum request berikutnya.`, cooldownSeconds: remaining },
          { status: 429 },
        );
      }
    }

    const verification = await sendVerification(phone, channel);
    const verificationId = verification.request_id ?? "";

    if (!verificationId) {
      throw new Error("Provider tidak mengembalikan request ID.");
    }

    await createOtpRequest({
      phone,
      channel,
      providerRequestId: verificationId,
      status: verification.status ?? "pending",
    });

    return NextResponse.json({
      ok: true,
      verificationId,
      status: verification.status ?? "pending",
      cooldownSeconds: COOLDOWN_SECONDS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pengiriman OTP gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
