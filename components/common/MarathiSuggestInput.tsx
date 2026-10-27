"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { autoBilingualName, isDevanagari, transliterateEnglishToMarathi } from "@/utils/transliterate";
import { Sparkles, Check } from "lucide-react";

export interface MarathiSuggestInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBilingualChange?: (pair: { mr: string; en: string }) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  autoFocus?: boolean;
}

export function MarathiSuggestInput({
  id,
  name,
  value,
  onChange,
  onBilingualChange,
  placeholder,
  required = false,
  className = "",
  disabled = false,
  icon,
  autoFocus = false,
}: MarathiSuggestInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [rawEnglish, setRawEnglish] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions from Google Input Tools + local Marathi engine
  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isDevanagari(trimmed)) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setRawEnglish(trimmed);

    // 1. Get primary candidate from our curated local phonetic & Maharashtra dictionary
    const localMr = transliterateEnglishToMarathi(trimmed);

    const candidatesSet = new Set<string>();
    if (localMr) {
      candidatesSet.add(localMr);
    }

    try {
      // 2. Fetch live statistical candidates from Google Input Tools
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
        trimmed
      )}&itc=mr-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;

      const response = await fetch(url, { signal: AbortSignal.timeout(1800) });
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] === "SUCCESS" && data[1] && data[1][0] && data[1][0][1]) {
          const googleCandidates: string[] = data[1][0][1];
          googleCandidates.forEach((c) => {
            if (c && c.trim()) candidatesSet.add(c.trim());
          });
        }
      }
    } catch {
      // If offline or network timeout, local candidatesSet already has the local phonetic result
    }

    // 3. Add original English as final option so user can choose to keep English
    const candidateList = Array.from(candidatesSet);
    if (!candidateList.includes(trimmed)) {
      candidateList.push(trimmed);
    }

    if (candidateList.length > 0) {
      setSuggestions(candidateList);
      setSelectedIndex(0);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, []);

  // Debounced input change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && !isDevanagari(value)) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [value, fetchSuggestions]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSuggestion = (selectedText: string) => {
    onChange(selectedText);
    setIsOpen(false);

    if (onBilingualChange) {
      if (isDevanagari(selectedText)) {
        const enVal = rawEnglish || autoBilingualName(selectedText).en;
        onBilingualChange({ mr: selectedText, en: enVal });
      } else {
        const pair = autoBilingualName(selectedText);
        onBilingualChange({ mr: pair.mr, en: selectedText });
      }
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || (e.key === " " && selectedIndex === 0 && !isDevanagari(value))) {
      // Enter or Space accepts the active recommendation
      if (suggestions[selectedIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (onBilingualChange) {
      const pair = autoBilingualName(val);
      onBilingualChange(pair);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value && suggestions.length > 0 && !isDevanagari(value)) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium ${
            icon ? "pl-10" : ""
          } ${className}`}
          autoComplete="off"
        />
      </div>

      {/* Floating Auto-suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1 text-brand-primary">
              <Sparkles className="w-3 h-3" />
              <span>मराठी शब्द सूचना (Marathi Suggestions)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Space किंवा Enter दाबा</span>
          </div>

          <ul className="max-h-56 overflow-y-auto divide-y divide-slate-50 py-1">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isMarathi = isDevanagari(item);

              return (
                <li
                  key={`${item}-${idx}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => selectSuggestion(item)}
                  className={`px-3.5 py-2 text-sm flex items-center justify-between cursor-pointer transition select-none ${
                    isSelected
                      ? "bg-brand-primary/10 text-brand-dark font-bold border-l-4 border-brand-primary"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? "bg-brand-primary text-white font-bold"
                          : "bg-slate-100 text-slate-500 font-medium"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className={`${isMarathi ? "font-marathi text-base font-semibold" : "font-sans text-xs text-slate-500"}`}>
                      {item}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold ml-1">
                        शिफारस (Top)
                      </span>
                    )}
                    {!isMarathi && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium ml-1">
                        English
                      </span>
                    )}
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-brand-primary" />}
                </li>
              );
            })}
          </ul>

          <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>↑↓ बाण वापरा</span>
            <span>Esc: बंद करा</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarathiSuggestInput;
