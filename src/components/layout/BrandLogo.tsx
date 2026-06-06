export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/" className={`brand-logo ${compact ? "brand-logo-compact" : ""}`} aria-label="UniSpora home">
      <img src="/assets/unispora-logo-official-blended.png" alt="UniSpora" />
    </a>
  );
}
