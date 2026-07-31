"use client";

import { useEffect, useState } from "react";

export function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true);
    }
    function handleOnline() {
      setIsOffline(false);
    }

    if (typeof window !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col items-center justify-center p-0 m-0 w-screen h-screen">
      <iframe
        src="/offline.html"
        className="w-full h-full border-0"
        title="Lost Signal Offline Game"
      />
    </div>
  );
}
