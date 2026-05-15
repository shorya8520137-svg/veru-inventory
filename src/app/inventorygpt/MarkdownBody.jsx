'use client';

function parseInline(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let m;
  let key = 0;
  const s = String(text ?? '');

  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(<span key={key++}>{s.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith('_')) {
      parts.push(
        <em key={key++} className="text-slate-600 not-italic">
          {tok.slice(1, -1)}
        </em>
      );
    } else if (tok.startsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-violet-50 px-1.5 py-0.5 text-[13px] font-medium text-[#5850EC] border border-violet-100"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push(<span key={key++}>{s.slice(last)}</span>);
  return parts.length ? parts : s;
}

export default function MarkdownBody({ content, className = '' }) {
  const raw = String(content ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const lines = raw.split('\n');
  const blocks = [];
  let listItems = [];
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={key++} className="my-2 ml-4 list-disc space-y-2 text-sm text-slate-700">
        {listItems}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      listItems.push(<li key={listItems.length}>{parseInline(trimmed.slice(2))}</li>);
      continue;
    }
    flushList();
    if (!trimmed) {
      blocks.push(<div key={key++} className="h-2" aria-hidden />);
      continue;
    }
    if (trimmed.startsWith('```')) continue;
    blocks.push(
      <p key={key++} className="text-sm leading-relaxed text-slate-700 mb-1.5 last:mb-0">
        {parseInline(line)}
      </p>
    );
  }
  flushList();

  return <div className={className}>{blocks}</div>;
}
