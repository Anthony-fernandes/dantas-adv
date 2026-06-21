import { useState } from 'react';
import { digitsOnly } from '@/lib/masks';

type CepResult = {
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export type CepFields = {
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export function useCepLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(cep: string): Promise<CepFields | null> {
    const digits = digitsOnly(cep);
    if (digits.length !== 8) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!res.ok) throw new Error('CEP não encontrado');
      const data: CepResult = await res.json();
      if (data.erro) {
        setError('CEP não encontrado');
        return null;
      }
      return {
        street: data.logradouro || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      };
    } catch {
      setError('Erro ao buscar CEP');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading, error };
}
