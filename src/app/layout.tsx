import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Navbar from "@/components/navbar";
import { StagewiseWrapper } from "@/components/stagewise-wrapper";
import { AnimatedBackground } from "@/components/animated-background";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UPSC Mentorship Platform",
  description: "Connect with experienced mentors for UPSC preparation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={`${inter.className} h-full relative`}>
        <AnimatedBackground />
        <Providers>
          <div className="flex flex-col min-h-screen relative z-[1]">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
              {children}
            </div>
          </div>
          {/* <StagewiseWrapper /> */}
        </Providers>
      </body>
    </html>
  );
} 