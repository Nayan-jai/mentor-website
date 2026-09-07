"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Sparkles, Check } from "lucide-react";

const COMMON_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com"
];

const DOMAIN_TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.co": "gmail.com",
  "gmail.co": "gmail.com",
  "gmaill.co": "gmail.com",
  "gmai.co": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaili.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahou.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmali.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlok.co": "outlook.com",
  "outlook.co": "outlook.com",
  "iclud.com": "icloud.com",
  "icould.com": "icloud.com"
};

interface EmailInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  name?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectSuggestion?: (fixedEmail: string) => void;
}

export function EmailInput({
  id = "email",
  name = "email",
  className = "",
  value: externalValue,
  onChange: externalOnChange,
  onSelectSuggestion,
  ...props
}: EmailInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state if controlled externally
  const emailVal = externalValue !== undefined ? externalValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (externalOnChange) {
      externalOnChange(e);
    } else {
      setInternalValue(e.target.value);
    }
  };

  const applyEmail = (newEmail: string) => {
    // Create synthetic event if controlled or update internal state
    if (externalOnChange) {
      const event = {
        target: { name, value: newEmail },
        currentTarget: { name, value: newEmail }
      } as React.ChangeEvent<HTMLInputElement>;
      externalOnChange(event);
    } else {
      setInternalValue(newEmail);
    }
    if (onSelectSuggestion) {
      onSelectSuggestion(newEmail);
    }
    setIsFocused(false);
  };

  // Reset highlight index when email input changes
  useEffect(() => {
    setHighlightedIdx(-1);
  }, [emailVal]);

  // Determine typo suggestion & autocomplete matches
  let typoSuggestion: string | null = null;
  let matches: string[] = [];

  const trimmedVal = emailVal.trim();
  if (trimmedVal.length > 0) {
    const atIdx = trimmedVal.indexOf("@");
    if (atIdx >= 0) {
      const username = trimmedVal.slice(0, atIdx);
      const domain = trimmedVal.slice(atIdx + 1).toLowerCase();

      if (username.length > 0) {
        // 1. Exact Typo Match
        if (domain && DOMAIN_TYPOS[domain]) {
          typoSuggestion = `${username}@${DOMAIN_TYPOS[domain]}`;
        }

        // 2. Matching suggestions as user types domain
        matches = COMMON_DOMAINS
          .filter(d => d.startsWith(domain) && d !== domain)
          .map(d => `${username}@${d}`);
      }
    } else {
      // User entered text without '@', suggest common domains
      matches = COMMON_DOMAINS.map(d => `${trimmedVal}@${d}`);
    }
  }

  // Handle key navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalOptions = (typoSuggestion ? 1 : 0) + matches.length;

    if (totalOptions > 0 && isFocused) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIdx(prev => (prev + 1) % totalOptions);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIdx(prev => (prev - 1 + totalOptions) % totalOptions);
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (highlightedIdx >= 0) {
          e.preventDefault();
          if (typoSuggestion && highlightedIdx === 0) {
            applyEmail(typoSuggestion);
          } else {
            const matchIdx = typoSuggestion ? highlightedIdx - 1 : highlightedIdx;
            if (matches[matchIdx]) {
              applyEmail(matches[matchIdx]);
            }
          }
        }
      } else if (e.key === "Escape") {
        setIsFocused(false);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = isFocused && (!!typoSuggestion || matches.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        id={id}
        name={name}
        type="email"
        value={emailVal}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        autoComplete="email"
        className={className}
        {...props}
      />

      {/* Typo Correction Banner / Suggestion Pill */}
      {typoSuggestion && (
        <div className="mt-1.5 flex items-center justify-between px-3 py-1.5 text-xs bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 rounded-lg text-amber-900 dark:text-amber-200 animate-fadeIn">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">
              Did you mean <strong className="font-semibold text-amber-950 dark:text-white">{typoSuggestion}</strong>?
            </span>
          </div>
          <button
            type="button"
            onClick={() => applyEmail(typoSuggestion!)}
            className="shrink-0 inline-flex items-center px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] rounded shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-3 h-3 mr-0.5" /> Fix
          </button>
        </div>
      )}

      {/* Dropdown Suggestions Menu */}
      {showDropdown && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden py-1 divide-y divide-slate-100 dark:divide-slate-800">
          {typoSuggestion && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                applyEmail(typoSuggestion!);
              }}
              onClick={() => applyEmail(typoSuggestion!)}
              className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                highlightedIdx === 0
                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 font-semibold"
                  : "bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/80"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{typoSuggestion}</span>
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">Suggested Fix</span>
            </div>
          )}

          {matches.map((match, idx) => {
            const currentIdx = typoSuggestion ? idx + 1 : idx;
            const isHighlighted = highlightedIdx === currentIdx;
            const atIndex = match.indexOf("@");
            const userPart = atIndex >= 0 ? match.slice(0, atIndex) : match;
            const domainPart = atIndex >= 0 ? match.slice(atIndex) : "";

            return (
              <div
                key={match}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyEmail(match);
                }}
                onClick={() => applyEmail(match)}
                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  isHighlighted
                    ? "bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 font-medium"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
              >
                <span>
                  {userPart}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{domainPart}</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Select ↵</span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
