import { describe, it, expect } from 'vitest';
import { maskCPF, maskCNPJ, maskCpfCnpj, maskPhoneBR, maskCNJ, isValidCPF, isValidCNPJ } from '@/lib/masks';

describe('maskCPF', () => {
  it('formats a raw CPF string', () => {
    expect(maskCPF('12345678900')).toBe('123.456.789-00');
  });
  it('handles partial input', () => {
    expect(maskCPF('123')).toBe('123');
  });
});

describe('maskCNPJ', () => {
  it('formats a raw CNPJ string', () => {
    expect(maskCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('maskCpfCnpj', () => {
  it('routes to CPF for 11 digits', () => {
    expect(maskCpfCnpj('12345678900')).toBe('123.456.789-00');
  });
  it('routes to CNPJ for 14 digits', () => {
    expect(maskCpfCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('maskPhoneBR', () => {
  it('formats a cellphone with 9 digits', () => {
    expect(maskPhoneBR('85999990000')).toBe('(85) 99999-0000');
  });
  it('formats a landline with 8 digits', () => {
    expect(maskPhoneBR('8530000000')).toBe('(85) 3000-0000');
  });
});

describe('maskCNJ', () => {
  it('formats a 20-digit CNJ string', () => {
    const result = maskCNJ('00000010220258260004');
    expect(result).toContain('-');
    expect(result.startsWith('0000001-')).toBe(true);
  });
});

describe('isValidCPF', () => {
  it('validates a known valid CPF', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });
  it('rejects all-same-digit CPF', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
  });
  it('rejects invalid CPF', () => {
    expect(isValidCPF('123.456.789-00')).toBe(false);
  });
});

describe('isValidCNPJ', () => {
  it('validates a known valid CNPJ', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
  });
  it('rejects invalid CNPJ', () => {
    expect(isValidCNPJ('00.000.000/0000-00')).toBe(false);
  });
});
