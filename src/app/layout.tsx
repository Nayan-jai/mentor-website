import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Navbar from "@/components/navbar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mentor Platform | Learning Lab",
  description: "Connect with experienced mentors and track your study progress",
  icons: {
    icon: [
      { url: "/app-icon.svg", type: "image/svg+xml" },
      { url: "/app-icon.png", type: "image/png" },
    ],
    shortcut: "/app-icon.svg",
    apple: "/app-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/app-icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/app-icon.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b0f19" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </head>
      <body className={`${inter.className} h-full relative`} suppressHydrationWarning>
        <Providers>
          <div className="flex flex-col min-h-screen relative z-[1]">
            <Navbar />
            <main className="flex-1 flex flex-col w-full">
              {children}
            </main>
          </div>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
} 