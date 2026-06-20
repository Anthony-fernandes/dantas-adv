export function digitsOnly(value: string) {
  return (value || "").replace(/\D/g, "");
}

export function maskCPF(value: string) {
  const v = digitsOnly(value).slice(0, 11);
  return v
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function maskCNPJ(value: string) {
  const v = digitsOnly(value).slice(0, 14);
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskCpfCnpj(value: string) {
  const v = digitsOnly(value);
  return v.length <= 11 ? maskCPF(v) : maskCNPJ(v);
}

export function maskCEP(value: string) {
  const v = digitsOnly(value).slice(0, 8);
  return v.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function maskPhoneBR(value: string) {
  const v = digitsOnly(value).slice(0, 11);
  if (v.length <= 10) {
    return v
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskUF(value: string) {
  return (value || "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

export function maskMoneyBRInput(value: string) {
  const v = digitsOnly(value);
  if (!v) return "";
  const cents = Number(v);
  const amount = cents / 100;
  return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function moneyToApiDecimal(value: string) {
  const normalized = (value || "").replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}

/** CNJ process number: 0000000-00.0000.0.00.0000 */
export function maskCNJ(value: string) {
  const v = digitsOnly(value).slice(0, 20);
  return v
    .replace(/^(\d{7})(\d)/, '$1-$2')
    .replace(/-(\d{2})(\d)/, '-$1.$2')
    .replace(/\.(\d{4})(\d)/, '.$1.$2')
    .replace(/\.(\d{1})(\d)/, '.$1.$2')
    .replace(/\.(\d{2})(\d)/, '.$1.$2');
}

/** OAB: letters + digits, e.g. SP 123456 */
export function maskOAB(value: string) {
  const upper = (value || '').toUpperCase();
  const letters = upper.replace(/[^A-Z]/g, '').slice(0, 2);
  const digits = upper.replace(/[^0-9]/g, '').slice(0, 7);
  if (!letters && !digits) return '';
  if (!digits) return letters;
  return `${letters} ${digits}`;
}

/** Date: dd/mm/yyyy */
export function maskDate(value: string) {
  const v = digitsOnly(value).slice(0, 8);
  return v
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

/** Validate CPF */
export function isValidCPF(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  if (rem !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  return rem === parseInt(digits[10]);
}

/** Validate CNPJ */
export function isValidCNPJ(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (s: string, w: number[]) => {
    const sum = w.reduce((acc, wt, i) => acc + parseInt(s[i]) * wt, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return (
    calc(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === parseInt(d[12]) &&
    calc(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === parseInt(d[13])
  );
}
