import { NextResponse } from "next/server";
import { checkVerification } from "@/lib/vonage";
import { markOtpVerified } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!requestId || !/^\d{4,10}$/.test(code)) {
      return NextResponse.json({ error: "Request ID atau kode OTP tidak valid." }, { status: 400 });
    }

    const verification = await checkVerification(requestId, code);
    const status = verification.status ?? "pending";

    if (status === "verified") {
      await markOtpVerified(requestId);
    }

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verifikasi OTP gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
