"use client";

import React from "react";

interface BrandLogoProps {
  variant?: "navbar" | "card" | "full";
  className?: string;
}

export default function BrandLogo({ variant = "navbar", className = "" }: BrandLogoProps) {
  if (variant === "card" || variant === "full") {
    return (
      <div className={`logo-reveal-container inline-flex justify-center items-center ${className}`}>
        <div className="logo-card relative w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md rounded-3xl flex flex-col justify-center items-center overflow-hidden shadow-2xl border border-slate-800">
          <div className="frame-border absolute inset-0 rounded-3xl border border-sky-400/20" />

          <div className="icon-wrapper w-20 h-20 text-sky-400">
            <svg
              className="graduation-icon w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                className="draw-path path-1"
                d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
              />
              <path className="draw-path path-2" d="M22 10v6" />
              <path
                className="draw-path path-3"
                d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"
              />
            </svg>
          </div>

          <div className="brand-text mt-5 text-center notranslate" translate="no">
            <span className="title block font-sans font-bold text-sm tracking-[0.4em] text-slate-100 uppercase mr-[-0.4em]">
              MENTOR
            </span>
            <span className="subtitle block font-sans font-medium text-[10px] tracking-[0.25em] text-sky-400/80 uppercase mt-1.5 mr-[-0.25em]">
              LEARNING LAB
            </span>
          </div>
        </div>

        <style jsx>{`
          .draw-path {
            stroke-dasharray: 80;
            stroke-dashoffset: 80;
            animation: strokeDraw 1.3s ease-out forwards;
          }
          .path-1 {
            animation-delay: 0.1s;
          }
          .path-2 {
            animation-delay: 0.35s;
          }
          .path-3 {
            animation-delay: 0.45s;
          }
          .icon-wrapper {
            animation: iconSpring 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .frame-border {
            animation: frameFadeIn 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .brand-text {
            animation: textSlideUp 1s ease-out forwards;
            animation-delay: 0.8s;
            opacity: 0;
            transform: translateY(8px);
          }
          @keyframes strokeDraw {
            to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes iconSpring {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.08);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes frameFadeIn {
            0% {
              opacity: 0;
              transform: scale(0.92);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes textSlideUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Compact Navbar variant
  return (
    <div className={`inline-flex items-center gap-3 group ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-md group-hover:scale-105 transition-transform duration-300">
        <svg
          className="w-5 h-5 graduation-icon transition-transform duration-300 group-hover:rotate-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            className="draw-path path-1"
            d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
          />
          <path className="draw-path path-2" d="M22 10v6" />
          <path
            className="draw-path path-3"
            d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"
          />
        </svg>
      </div>
      <div className="flex flex-col notranslate" translate="no">
        <span className="text-base font-extrabold tracking-[0.25em] bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent leading-none">
          MENTOR
        </span>
        <span className="text-[9px] font-semibold tracking-[0.2em] text-sky-400/80 uppercase mt-0.5 leading-none">
          LEARNING LAB
        </span>
      </div>

      <style jsx>{`
        .draw-path {
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: strokeDraw 1.2s ease-out forwards;
        }
        .path-1 {
          animation-delay: 0.1s;
        }
        .path-2 {
          animation-delay: 0.3s;
        }
        .path-3 {
          animation-delay: 0.4s;
        }
        @keyframes strokeDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
