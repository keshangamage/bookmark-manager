export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Stable hue per hostname, so the same site always reads the same colour.
function hueOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
}

export default function DomainMonogram({url, className = ''}: {url: string; className?: string}) {
  const domain = domainOf(url);
  return (
    <span
      aria-hidden
      style={{'--h': hueOf(domain)} as React.CSSProperties}
      className={`monogram flex size-9 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-semibold uppercase ${className}`}
    >
      {domain.charAt(0)}
    </span>
  );
}
