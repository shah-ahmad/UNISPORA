import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

export const GlassCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function GlassCard({ className = "", ...props }, ref) {
  return <div ref={ref} className={`glass-card ${className}`} {...props} />;
});
