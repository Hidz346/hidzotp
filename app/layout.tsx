import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HidzOtp",
  description: "Private OTP verification playground for Hidz Project.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
