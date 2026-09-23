"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Channel = "whatsapp" | "sms" | "call";

const channels: Array<{ id: Channel; label: string; note: string; icon: string }> = [
  { id: "whatsapp", label: "WhatsApp", note: "OTP via WhatsApp", icon: "WA" },
  { id: "sms", label: "SMS", note: "OTP via SMS", icon: "SMS" },
  { id: "call", label: "Telepon", note: "OTP via panggilan", icon: "TEL" },
];

function normalizePhone(value: string) {
  const raw = value.trim().replace(/[\s()-]/g, "");
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("62")) return `+${raw}`;
  if (raw.startsWith("0")) return `+62${raw.slice(1)}`;
  return raw;
}

export default function Home() {
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [dark, setDark] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const normalized = useMemo(() => normalizePhone(phone), [phone]);
  const canSend = confirmed && Boolean(normalized) && !busy && cooldown === 0;

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!confirmed) {
      setError("Konfirmasi nomor tujuan terlebih dahulu.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, channel }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Pengiriman OTP gagal.");

      setVerificationId(data.verificationId || "");
      setStatus(`OTP dikirim melalui ${channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "telepon"}.`);
      setCooldown(Number(data.cooldownSeconds) || 30);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!verificationId || !/^\d{4,10}$/.test(code.trim())) {
      setError("Masukkan kode OTP yang valid.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/otp/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, code: code.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verifikasi gagal.");

      setStatus(data.status === "approved" ? "OTP benar. Nomor berhasil diverifikasi." : "OTP belum terverifikasi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="mono inline-flex border-[3px] border-[var(--ink)] bg-[var(--accent)] px-3 py-1 text-xs font-black uppercase text-black shadow-[4px_4px_0_var(--ink)]">
              HIDZ PROJECT
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-6xl">HidzOtp</h1>
            <p className="mt-2 max-w-xl text-sm font-bold text-[var(--muted)] sm:text-base">
              Private OTP verification playground. Nomor tujuan selalu dimasukkan manual.
            </p>
          </div>
          <button
            type="button"
            aria-label="Ganti tema"
            onClick={() => setDark((value) => !value)}
            className="neo panel grid h-12 w-12 shrink-0 place-items-center text-lg font-black"
          >
            {dark ? "☀" : "☾"}
          </button>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <section className="neo panel p-5 sm:p-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-[var(--ink)] pb-5">
              <div>
                <p className="mono text-xs font-black uppercase">Metode input target</p>
                <h2 className="mt-1 text-2xl font-black uppercase">Single Target</h2>
              </div>
              <span className="border-[3px] border-[var(--ink)] bg-[var(--accent-2)] px-3 py-1 text-xs font-black uppercase text-black">
                Manual input
              </span>
            </div>

            <form onSubmit={sendOtp} className="space-y-7">
              <div>
                <label htmlFor="phone" className="mono mb-2 block text-xs font-black uppercase">
                  Nomor WhatsApp / SMS / Telepon
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setConfirmed(false);
                    setVerificationId("");
                    setStatus("");
                    setError("");
                  }}
                  placeholder="08xxxxxxxxxx atau +628xxxxxxxxxx"
                  inputMode="tel"
                  autoComplete="tel"
                  className="neo w-full bg-[var(--panel)] px-4 py-4 text-base font-bold outline-none placeholder:text-[var(--muted)] focus:bg-[var(--accent)] focus:text-black"
                />
                <p className="mono mt-2 text-xs text-[var(--muted)]">Format yang dikirim: {normalized || "—"}</p>
              </div>

              <div className="neo-soft bg-[var(--accent)] p-4 text-black">
                <p className="mono text-xs font-black uppercase">Konfirmasi tujuan</p>
                <p className="mt-1 break-all text-lg font-black">{normalized || "Masukkan nomor terlebih dahulu"}</p>
                <label className="mt-4 flex items-start gap-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-1 h-5 w-5 accent-black"
                  />
                  <span>Saya sudah memastikan nomor tujuan benar dan saya memiliki akses ke nomor tersebut.</span>
                </label>
              </div>

              <div>
                <p className="mono mb-3 text-xs font-black uppercase">Pilih kanal OTP</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {channels.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChannel(item.id)}
                      className={`neo-soft p-4 text-left transition-transform active:translate-x-1 active:translate-y-1 ${channel === item.id ? "bg-[var(--accent)] text-black" : "panel"}`}
                    >
                      <span className="mono text-xs font-black">{item.icon}</span>
                      <strong className="mt-2 block text-lg font-black">{item.label}</strong>
                      <span className="mt-1 block text-xs font-bold opacity-70">{item.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!canSend}
                className="neo w-full bg-[var(--accent-2)] px-5 py-4 text-base font-black uppercase text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Memproses..." : cooldown > 0 ? `Coba lagi dalam 00:${String(cooldown).padStart(2, "0")}` : "Kirim OTP"}
              </button>

              {status && <div className="neo-soft bg-[var(--accent)] p-4 text-sm font-black text-black">{status}</div>}
              {error && <div className="neo-soft bg-[#ff6b6b] p-4 text-sm font-black text-black">{error}</div>}
            </form>
          </section>

          <aside className="space-y-6">
            <section className="neo panel p-5 sm:p-6">
              <p className="mono text-xs font-black uppercase">Verify</p>
              <h2 className="mt-2 text-3xl font-black uppercase">Masukkan OTP</h2>
              <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                Kode yang diterima digunakan untuk memeriksa verifikasi nomor pada sesi terakhir.
              </p>

              <form onSubmit={verifyOtp} className="mt-6 space-y-4">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="••••••"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="neo w-full bg-[var(--panel)] px-4 py-5 text-center font-mono text-3xl font-black tracking-[.35em] outline-none focus:bg-[var(--accent)] focus:text-black"
                />
                <button
                  disabled={busy || !verificationId}
                  className="neo w-full bg-[var(--ink)] px-4 py-4 text-sm font-black uppercase text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Verifikasi OTP
                </button>
              </form>
            </section>

            <section className="neo bg-[var(--ink)] p-5 text-[var(--bg)] sm:p-6">
              <p className="mono text-xs font-black uppercase text-[var(--accent)]">Catatan</p>
              <ul className="mt-3 space-y-3 text-sm font-bold">
                <li>• Tidak ada nomor tujuan bawaan.</li>
                <li>• Tidak ada bulk target atau loop otomatis.</li>
                <li>• Cooldown mengikuti konfigurasi aplikasi/provider.</li>
                <li>• Kredensial provider hanya berada di server/Vercel Environment Variables.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
