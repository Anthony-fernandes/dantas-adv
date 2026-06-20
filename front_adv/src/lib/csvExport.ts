type Row = Record<string, string | number | boolean | null | undefined>;

function escape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(filename: string, headers: { key: string; label: string }[], rows: Row[]) {
  const headerRow = headers.map((h) => escape(h.label)).join(',');
  const dataRows = rows.map((row) =>
    headers.map((h) => escape(row[h.key])).join(',')
  );
  const csv = [headerRow, ...dataRows].join('\n');
  const bom = '﻿'; // BOM for Excel UTF-8
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatCsvDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso ?? '';
  return d.toLocaleDateString('pt-BR');
}

export function formatCsvCurrency(value?: number | string | null): string {
  const n = Number(value ?? 0);
  if (!isFinite(n)) return '0,00';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
