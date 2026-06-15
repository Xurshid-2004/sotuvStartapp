import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sotuv tizimi — Sotuvchi & Ishlab chiqaruvchi",
  description: "Sotuvchi va ishlab chiqaruvchi o'rtasidagi murojaat tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
