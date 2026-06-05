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
