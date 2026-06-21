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

const BASE = 'https://api-publica.datajud.cnj.jus.br';

// CNJ format: NNNNNNN-DD.AAAA.J.TT.OOOO
// J = justice segment, TT = tribunal code
// Mapping TT code → Datajud index name
const TRIBUNAL_INDEX: Record<string, string> = {
  // Estaduais (J=8)
  '8_01': 'api_publica_tjac',
  '8_02': 'api_publica_tjal',
  '8_03': 'api_publica_tjap',
  '8_04': 'api_publica_tjam',
  '8_05': 'api_publica_tjba',
  '8_06': 'api_publica_tjce',
  '8_07': 'api_publica_tjdf',
  '8_08': 'api_publica_tjes',
  '8_09': 'api_publica_tjgo',
  '8_10': 'api_publica_tjma',
  '8_11': 'api_publica_tjmt',
  '8_12': 'api_publica_tjms',
  '8_13': 'api_publica_tjmg',
  '8_14': 'api_publica_tjpa',
  '8_15': 'api_publica_tjpb',
  '8_16': 'api_publica_tjpr',
  '8_17': 'api_publica_tjpe',
  '8_18': 'api_publica_tjpi',
  '8_19': 'api_publica_tjrj',
  '8_20': 'api_publica_tjrn',
  '8_21': 'api_publica_tjrs',
  '8_22': 'api_publica_tjro',
  '8_23': 'api_publica_tjrr',
  '8_24': 'api_publica_tjsc',
  '8_25': 'api_publica_tjsp',
  '8_26': 'api_publica_tjse',
  '8_27': 'api_publica_tjto',
  // Trabalho (J=5)
  '5_01': 'api_publica_trt1',
  '5_02': 'api_publica_trt2',
  '5_03': 'api_publica_trt3',
  '5_04': 'api_publica_trt4',
  '5_05': 'api_publica_trt5',
  '5_06': 'api_publica_trt6',
  '5_07': 'api_publica_trt7',
  '5_08': 'api_publica_trt8',
  '5_09': 'api_publica_trt9',
  '5_10': 'api_publica_trt10',
  '5_11': 'api_publica_trt11',
  '5_12': 'api_publica_trt12',
  '5_13': 'api_publica_trt13',
  '5_14': 'api_publica_trt14',
  '5_15': 'api_publica_trt15',
  '5_16': 'api_publica_trt16',
  '5_17': 'api_publica_trt17',
  '5_18': 'api_publica_trt18',
  '5_19': 'api_publica_trt19',
  '5_20': 'api_publica_trt20',
  '5_21': 'api_publica_trt21',
  '5_22': 'api_publica_trt22',
  '5_23': 'api_publica_trt23',
  '5_24': 'api_publica_trt24',
  // Federal (J=4)
  '4_01': 'api_publica_trf1',
  '4_02': 'api_publica_trf2',
  '4_03': 'api_publica_trf3',
  '4_04': 'api_publica_trf4',
  '4_05': 'api_publica_trf5',
  '4_06': 'api_publica_trf6',
  // STJ (J=3, TT=00)
  '3_00': 'api_publica_stj',
  // STF (J=1, TT=00)
  '1_00': 'api_publica_stf',
  // TST (J=5, TT=00)
  '5_00': 'api_publica_tst',
  // Eleitoral (J=6)
  '6_00': 'api_publica_tse',
  // Militar (J=7)
  '7_01': 'api_publica_stm',
};

function cnjToIndexKey(cnj: string): string | null {
  // Accepts formatted (0000000-00.0000.J.TT.OOOO) or raw digits
  const digits = digitsOnly(cnj);
  if (digits.length < 20) return null;
  // Format: 7 + 2 + 4 + 1(J) + 2(TT) + 4
  const j = digits[13];
  const tt = digits.slice(14, 16).replace(/^0+/, '') || '0';
  return `${j}_${tt.padStart(2, '0')}`;
}

function formatCnjForQuery(cnj: string): string {
  const d = digitsOnly(cnj);
  if (d.length < 20) return cnj;
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d[13]}.${d.slice(14, 16)}.${d.slice(16, 20)}`;
}

export function useCnjLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(cnj: string): Promise<CnjLookupResult | null> {
    const digits = digitsOnly(cnj);
    if (digits.length < 20) return null;

    setLoading(true);
    setError(null);

    const key = cnjToIndexKey(cnj);
    const index = key ? TRIBUNAL_INDEX[key] : null;

    if (!index) {
      setError('Tribunal não identificado pelo número CNJ.');
      setLoading(false);
      return null;
    }

    const formatted = formatCnjForQuery(cnj);

    try {
      const res = await fetch(`${BASE}/${index}/_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: { match: { numeroProcesso: formatted } },
          size: 1,
        }),
      });

      if (!res.ok) {
        setError('CNJ não encontrado na base pública do Datajud.');
        return null;
      }

      const json = await res.json();
      const hit: CnjProcess | undefined = json?.hits?.hits?.[0]?._source;

      if (!hit) {
        setError('Processo não encontrado na base pública do CNJ.');
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
