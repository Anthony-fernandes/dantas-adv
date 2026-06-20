import { useState } from 'react';
import { digitsOnly } from '@/lib/masks';

type CnjProcess = {
  numeroProcesso: string;
  tribunal?: string;
  classe?: { nome?: string };
  assuntos?: Array<{ nome?: string }>;
  orgaoJulgador?: { nome?: string };
  partes?: Array<{
    nome: string;
    tipo: string;
    advogados?: Array<{ nome: string }>;
  }>;
  movimentos?: Array<{ dataHora: string; nome: string }>;
  dataAjuizamento?: string;
  grau?: string;
};

export type CnjLookupResult = {
  cnj: string;
  tribunal: string;
  classe: string;
  assunto: string;
  orgaoJulgador: string;
  dataAjuizamento: string;
  grau: string;
  partes: Array<{ nome: string; tipo: string }>;
};

// Datajud public API (CNJ)
const DATAJUD_URL = 'https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search';

export function useCnjLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(cnj: string): Promise<CnjLookupResult | null> {
    const digits = digitsOnly(cnj);
    if (digits.length < 20) return null;

    setLoading(true);
    setError(null);

    try {
      // Datajud public API — no auth needed for public queries
      const res = await fetch(DATAJUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: { match: { numeroProcesso: cnj.replace(/\D/g, '').replace(/^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/, '$1-$2.$3.$4.$5.$6') } },
          size: 1,
        }),
      });

      if (!res.ok) {
        setError('CNJ não encontrado na base pública.');
        return null;
      }

      const json = await res.json();
      const hit: CnjProcess | undefined = json?.hits?.hits?.[0]?._source;

      if (!hit) {
        setError('CNJ não encontrado na base pública do CNJ.');
        return null;
      }

      return {
        cnj: hit.numeroProcesso ?? cnj,
        tribunal: hit.tribunal ?? '',
        classe: hit.classe?.nome ?? '',
        assunto: hit.assuntos?.[0]?.nome ?? '',
        orgaoJulgador: hit.orgaoJulgador?.nome ?? '',
        dataAjuizamento: hit.dataAjuizamento?.slice(0, 10) ?? '',
        grau: hit.grau ?? '',
        partes: (hit.partes ?? []).map((p) => ({ nome: p.nome, tipo: p.tipo })),
      };
    } catch {
      setError('Erro ao consultar a base pública do CNJ.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading, error };
}
