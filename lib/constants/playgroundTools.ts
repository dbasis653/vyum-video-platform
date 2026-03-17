import React from "react";
import { Scissors, Wand2 } from "lucide-react";

export type ToolId = "crop" | "bg-remove";

export const TOOLS: { id: ToolId; label: string; icon: React.ReactNode; comingSoon?: boolean }[] = [
  { id: "crop",      label: "Crop",      icon: React.createElement(Scissors, { size: 13 }) },
  { id: "bg-remove", label: "BG Remove", icon: React.createElement(Wand2,    { size: 13 }) },
];
