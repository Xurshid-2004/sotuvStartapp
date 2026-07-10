"use client";

import { LocaleProvider } from "./LocaleProvider";
import { ThemeProvider } from "./ThemeProvider";
import { CartProvider } from "./CartProvider";
import NetworkBanner from "./NetworkBanner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <CartProvider>
          <NetworkBanner />
          {children}
        </CartProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
