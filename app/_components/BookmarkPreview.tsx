import DomainMonogram, {domainOf} from './DomainMonogram';

// A still of the real list, using the same row language as the dashboard.
const SAMPLE = [
  {url: 'https://github.com/sindresorhus/awesome', title: 'Awesome lists', tag: 'code'},
  {url: 'https://arxiv.org/abs/1706.03762', title: 'Attention Is All You Need', tag: 'research'},
  {url: 'https://figma.com/community', title: 'Figma community files', tag: 'design'},
  {url: 'https://smittenkitchen.com/recipes', title: 'Weeknight recipes', tag: 'cooking'},
];

export default function BookmarkPreview() {
  return (
    <div className="rounded-2xl border bg-card p-2 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-heading text-sm font-semibold">Your bookmarks</span>
        <span className="font-mono text-xs text-muted-foreground">{SAMPLE.length}</span>
      </div>
      <div className="flex flex-col gap-1">
        {SAMPLE.map((item) => (
          <div key={item.url} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60">
            <DomainMonogram url={item.url} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{domainOf(item.url)}</p>
            </div>
            <span className="mark shrink-0 font-mono text-[0.7rem] text-foreground">{item.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
