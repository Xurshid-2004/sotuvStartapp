"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

export default function NetworkBanner() {
  const { t } = useLocale();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-[var(--danger)] text-white text-center text-xs font-bold py-2 px-4 shadow-md">
      {t("common.offline")}
    </div>
  );
}
