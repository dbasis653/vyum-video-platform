"use client";

import React from "react";

export type IconButtonVariant = "cyan" | "ghost" | "danger";
export type IconButtonSize = "sm" | "md";

const variantStyle: Record<IconButtonVariant, React.CSSProperties> = {
  cyan: {
    background: "rgba(34,211,238,0.12)",
    border: "1px solid rgba(34,211,238,0.22)",
    color: "#22D3EE",
  },
  ghost: {
    background: "rgba(34,211,238,0.06)",
    border: "1px solid rgba(34,211,238,0.1)",
    color: "rgba(186,230,255,0.5)",
  },
  danger: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.18)",
    color: "rgba(248,113,113,0.7)",
  },
};

const sizeClass: Record<IconButtonSize, string> = {
  sm: "w-5 h-5 rounded",
  md: "w-7 h-7 rounded-lg",
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  iconSize?: IconButtonSize;
}

/**
 * Reusable square icon button (no label).
 * Larger hover/active scale than Button since the target area is tiny.
 * Pass `disabled` to suppress all interaction feedback.
 */
export default function IconButton({
  variant = "ghost",
  iconSize = "md",
  disabled,
  children,
  className = "",
  style,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        "flex items-center justify-center select-none",
        "transition-all duration-150 ease-out",
        // hover — more pronounced scale for small targets
        "hover:brightness-125 hover:scale-[1.18] hover:-translate-y-px",
        // click / active
        "active:scale-[0.88] active:brightness-90 active:translate-y-0",
        // disabled
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        sizeClass[iconSize],
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
