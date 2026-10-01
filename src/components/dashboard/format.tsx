// Text helpers shared by the dashboard sheets and the Neighbourhood Scorecard.

// ── Date formatter — "2026-04-15" → "April 2026" ─────────────────────────────

export function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00'); // force local-date parse
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// ── Action-step template resolver ─────────────────────────────────────────────
// Supported placeholders (set in Firestore, resolved at render time):
//   {ward_num}   → raw ward number, e.g. "12"
//   {ward_phone} → ward marshal phone, e.g. "9448197012"  (9448197 + 3-digit padded ward_num)

export function resolveStep(text: string, wardNum: number): string {
  const phone = `9448197${String(wardNum).padStart(3, '0')}`;
  return text.replace(/\{ward_num\}/g, String(wardNum)).replace(/\{ward_phone\}/g, phone);
}

// ── Link renderer (supports [text](url) and bare https:// URLs in quote text) ──

export function renderWithLinks(text: string): React.ReactNode {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|https?:\/\/\S+/g;
  const nodes: React.ReactNode[] = [];
  let last = 0, match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const label = match[1];
    const href  = match[2] ?? match[0];
    nodes.push(
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer"
        className="underline text-blue-600 hover:text-blue-800 break-all">
        {label ?? href}
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
}
