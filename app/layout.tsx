import type { Metadata } from "next";
import "./globals.css";
import Providers from "./components/Providers";

export const metadata: Metadata = {
  title: "SavdoMarket — Sotuvchi & Ishlab chiqaruvchi",
  description: "Sotuvchi va ishlab chiqaruvchi o'rtasidagi murojaat tizimi",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          // Theme + lang ni hidratsiyadan oldin qo'llaymiz (FOUC oldini olish)
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('savdomarket_theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');var l=localStorage.getItem('savdomarket_locale');if(l==='uz'||l==='ru'||l==='en'){document.documentElement.lang=l;}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans font-medium text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
