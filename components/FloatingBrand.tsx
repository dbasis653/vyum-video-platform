"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface FloatingBrandProps {
  className?: string;
  zIndex?: string;
}

export default function FloatingBrand({
  className = "bottom-6 right-6",
  zIndex = "z-50",
}: FloatingBrandProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed flex flex-col items-end gap-1 ${zIndex} ${className}`}
    >
      <Image
        src="/images/content-vault.png"
        alt="Content Vault"
        width={220}
        height={55}
        className="object-contain drop-shadow-lg"
      />
      <Image
        src="/images/vyum-logo.png"
        alt="VYUM"
        width={280}
        height={110}
        className="object-contain drop-shadow-xl"
      />
    </div>,
    document.body,
  );
}
