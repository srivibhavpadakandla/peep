"use client";

import type { ReactNode } from "react";
import { SEVERITY, type Severity } from "./data";

// ───── Pill ─────────────────────────────────────────────────────────────
export function Pill({
  children,
  color = "#9a9a96",
  bg,
  className = "",
  solid,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  className?: string;
  solid?: boolean;
}) {
  const style: React.CSSProperties = solid
    ? { background: color, color: "#0a0a0a" }
    : { color, background: bg || `${color}14`, boxShadow: `inset 0 0 0 1px ${color}33` };
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[11px] font-medium tracking-wide " +
        className
      }
      style={style}
    >
      {children}
    </span>
  );
}

// ───── SeverityChip ─────────────────────────────────────────────────────
export function SeverityChip({ sev, mini }: { sev: Severity; mini?: boolean }) {
  const s = SEVERITY[sev];
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 font-mono uppercase tracking-wider " +
        (mini ? "text-[10px]" : "text-[11px]")
      }
      style={{ color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

// ───── Mono ─────────────────────────────────────────────────────────────
export function Mono({
  children,
  className = "",
  muted,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span className={"font-mono " + (muted ? "text-ink-400 " : "text-ink-100 ") + className}>
      {children}
    </span>
  );
}

// ───── Surface ──────────────────────────────────────────────────────────
export function Surface({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={"bg-ink-850 rounded-xl hairline " + className} {...rest}>
      {children}
    </div>
  );
}

// ───── Btn ──────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type BtnSize = "sm" | "md" | "lg";

export function Btn({
  children,
  variant = "ghost",
  size = "md",
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center gap-2 rounded-md font-medium transition-colors select-none";
  const sizes: Record<BtnSize, string> = {
    sm: "h-7 px-2.5 text-[12px]",
    md: "h-8 px-3 text-[13px]",
    lg: "h-9 px-3.5 text-[13px]",
  };
  const variants: Record<BtnVariant, string> = {
    primary: "bg-em text-ink-950 hover:bg-emerald-400 disabled:opacity-50",
    secondary: "bg-ink-800 text-ink-100 hover:bg-ink-750 hairline",
    ghost: "text-ink-200 hover:bg-ink-800",
    danger: "bg-ink-800 text-red-400 hover:bg-red-500/10 hairline",
    outline: "text-ink-100 hairline hover:bg-ink-800",
  };
  return (
    <button className={[base, sizes[size], variants[variant], className].join(" ")} {...rest}>
      {children}
    </button>
  );
}

// ───── Toggle ───────────────────────────────────────────────────────────
export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button onClick={() => onChange(!on)} className="inline-flex items-center gap-2 group" aria-pressed={on}>
      <span className={"relative w-8 h-[18px] rounded-full transition-colors " + (on ? "bg-em" : "bg-ink-700")}>
        <span
          className={
            "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-ink-100 transition-all " +
            (on ? "left-[16px]" : "left-[2px]")
          }
        />
      </span>
      {label && <span className="text-[13px] text-ink-200">{label}</span>}
    </button>
  );
}

// ───── StatusDot ────────────────────────────────────────────────────────
export function StatusDot({ color = "#10b981", pulse }: { color?: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {pulse && (
        <span className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: color }} />
      )}
    </span>
  );
}

// ───── Kbd ──────────────────────────────────────────────────────────────
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-mono bg-ink-800 text-ink-300 hairline">
      {children}
    </kbd>
  );
}

// ───── SectionLabel ────────────────────────────────────────────────────
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"text-[10px] uppercase tracking-[0.12em] text-ink-400 font-medium " + className}>{children}</div>
  );
}

// ───── Divider ─────────────────────────────────────────────────────────
export function Divider({ vertical, className = "" }: { vertical?: boolean; className?: string }) {
  return vertical ? (
    <span className={"inline-block w-px h-3 bg-ink-700 " + className} />
  ) : (
    <div className={"h-px bg-ink-700/60 " + className} />
  );
}

// ───── Slider ──────────────────────────────────────────────────────────
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <Mono className="text-[12px] tabular-nums w-[88px] text-right text-ink-200">
        {format ? format(value) : String(value)}
      </Mono>
    </div>
  );
}

// ───── Chip ────────────────────────────────────────────────────────────
export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "h-7 px-2.5 rounded-md text-[12px] transition-colors hairline " +
        (active ? "bg-em-soft text-em" : "bg-ink-850 text-ink-300 hover:bg-ink-800")
      }
    >
      {children}
    </button>
  );
}
