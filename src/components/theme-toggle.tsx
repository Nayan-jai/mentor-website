"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("app-user-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
    } catch (e) {}
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center p-2 rounded-full bg-gray-950/80 hover:bg-gray-900 border border-indigo-500/30 text-amber-400 hover:text-amber-300 transition-all duration-200 shadow-inner group"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform duration-300 shrink-0" />
      )}
    </button>
  );
}
