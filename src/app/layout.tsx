import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZALUT · Admin",
  description: "Panel interno de administración de Zalut.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${onest.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
