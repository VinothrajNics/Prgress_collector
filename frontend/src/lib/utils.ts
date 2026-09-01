export function uid(p: string): string {
  return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(d: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function esc(s: unknown): string {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function retentionText(years: string, months: string): string {
  return years || months ? [years ? years + 'y' : '', months ? months + 'm' : ''].filter(Boolean).join(' ') : '-';
}
