import {domainOf, hueOf} from '@/lib/url';

export {domainOf};

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
