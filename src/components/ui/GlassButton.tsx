import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost";
};

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
};

const styles = {
  primary: "glass-button glass-button-primary",
  ghost: "glass-button glass-button-ghost",
};

export function GlassButton({ children, variant = "ghost", className = "", ...props }: ButtonProps) {
  return (
    <button className={`${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function GlassLink({ children, variant = "ghost", className = "", ...props }: AnchorProps) {
  return (
    <a className={`${styles[variant]} ${className}`} {...props}>
      {children}
    </a>
  );
}
