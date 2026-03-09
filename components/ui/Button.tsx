"use client";

import React from "react";

export type ButtonVariant =
  | "primary"    // solid cyan — main CTA / save
  | "ghost"      // faint cyan bg — secondary actions
  | "cyan"       // stronger cyan bg — download, active
  | "danger"     // faint red — delete trigger
  | "blue"       // solid blue — download / landing CTA
  | "cancel";    // no bg, faint border — dismiss / cancel

export type ButtonSize = "xs" | "sm" | "md";

const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "#22D3EE",
    color: "#0B1220",
  },
  ghost: {
    background: "rgba(34,211,238,0.06)",
    border: "1px solid rgba(34,211,238,0.12)",
    color: "rgba(186,230,255,0.55)",
  },
  cyan: {
    background: "rgba(34,211,238,0.12)",
    border: "1px solid rgba(34,211,238,0.22)",
    color: "#22D3EE",
  },
  danger: {
    background: "rgba(248,113,113,0.07)",
    border: "1px solid rgba(248,113,113,0.18)",
    color: "rgba(248,113,113,0.75)",
  },
  blue: {
    background: "#3B82F6",
    color: "#0B1220",
  },
  cancel: {
    border: "1px solid rgba(34,211,238,0.12)",
    color: "rgba(186,230,255,0.4)",
  },
};

const sizeClass: Record<ButtonSize, string> = {
  xs: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  sm: "px-4 py-2   text-xs rounded-lg gap-2",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** When true the button is disabled (pointer-events removed) */
  loading?: boolean;
}

/**
 * Reusable Button — handles hover (brightness + scale) and
 * active/click (scale-down + brightness-down) effects automatically.
 * Pass `loading` to disable while an async action is running.
 * Style the content (icons, spinner, text) via children.
 */
export default function Button({
  variant = "primary",
  size = "xs",
  loading = false,
  disabled,
  children,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-mono select-none",
        "transition-all duration-150 ease-out",
        // hover effect
        "hover:brightness-110 hover:scale-[1.03] hover:-translate-y-px",
        // click / active effect
        "active:scale-[0.96] active:brightness-90 active:translate-y-0",
        // disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        sizeClass[size],
        className,
      ]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()}
      style={{ ...variantStyle[variant], ...style }}
    >
      {children}
    </button>
  );
}
