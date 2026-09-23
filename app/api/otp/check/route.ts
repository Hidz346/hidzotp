import { NextResponse } from "next/server";
import { isE164 } from "@/lib/phone";
import { checkVerification } from "@/lib/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!isE164(phone) || !/^\d{4,10}$/.test(code)) {
      return NextResponse.json({ error: "Nomor atau kode OTP tidak valid." }, { status: 400 });
    }

    const verification = await checkVerification(phone, code);

    return NextResponse.json({
      ok: true,
      status: verification.status ?? "pending",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verifikasi OTP gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
