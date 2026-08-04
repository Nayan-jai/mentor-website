"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<"en" | "hi">("en");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const triggerGoogleTranslate = useCallback((lang: "en" | "hi") => {
    // Set root cookies
    document.cookie = `googtrans=/en/${lang}; path=/`;
    if (typeof window !== "undefined" && window.location.hostname) {
      document.cookie = `googtrans=/en/${lang}; domain=${window.location.hostname}; path=/`;
    }

    const selectEl = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (selectEl && selectEl.value !== lang) {
      selectEl.value = lang;
      selectEl.dispatchEvent(new Event("change"));
    }

    // Sync language choice to any child iframes (e.g. Study Tracker)
    try {
      const iframes = document.querySelectorAll("iframe");
      iframes.forEach((iframe) => {
        iframe.contentWindow?.postMessage({ type: "CHANGE_LANG", lang }, "*");
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("app_language");
    if (saved === "hi" || saved === "en") {
      setCurrentLang(saved as "en" | "hi");
    }

    // Callback for Google Translate script initialization
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi",
            autoDisplay: false,
          },
          "google_translate_element"
        );

        const currentSaved = localStorage.getItem("app_language");
        if (currentSaved === "hi") {
          setTimeout(() => {
            triggerGoogleTranslate("hi");
          }, 300);
        }
      }
    };

    // Dynamically insert Google Translate script if not loaded
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [triggerGoogleTranslate]);

  // Re-trigger translation cleanly on route changes without looping
  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("app_language") as "en" | "hi";
    if (saved === "hi") {
      const timer = setTimeout(() => {
        triggerGoogleTranslate("hi");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, mounted, triggerGoogleTranslate]);

  // Clean up top banner frame once on mount
  useEffect(() => {
    const removeBanner = () => {
      const banner = document.querySelector(".goog-te-banner-frame");
      if (banner) banner.remove();
      document.body.style.top = "0px";
      document.body.style.marginTop = "0px";
    };
    removeBanner();
    const t = setTimeout(removeBanner, 1000);
    return () => clearTimeout(t);
  }, []);

  const changeLanguage = (lang: "en" | "hi") => {
    setCurrentLang(lang);
    localStorage.setItem("app_language", lang);
    triggerGoogleTranslate(lang);
    
    // Quick reload ensures all pages and components render cleanly in selected language
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  if (!mounted) return null;

  return (
    <div className="relative inline-flex items-center notranslate" translate="no">
      <div id="google_translate_element" className="hidden" style={{ display: "none" }}></div>

      <div className="flex items-center bg-gray-950/80 hover:bg-gray-900 border border-indigo-500/30 rounded-full p-0.5 transition-all duration-200 shadow-inner text-xs font-medium notranslate" translate="no">
        <button
          onClick={() => changeLanguage("en")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-200 notranslate ${
            currentLang === "en"
              ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md font-bold"
              : "text-gray-300 hover:text-white"
          }`}
          translate="no"
          title="Switch to English"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="notranslate" translate="no">EN</span>
        </button>

        <button
          onClick={() => changeLanguage("hi")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-200 notranslate ${
            currentLang === "hi"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md font-bold"
              : "text-gray-300 hover:text-white"
          }`}
          translate="no"
          title="हिन्दी में बदलें (Switch to Hindi)"
        >
          <span className="notranslate" translate="no">हिन्दी</span>
        </button>
      </div>
    </div>
  );
}
