import { useCallback, useEffect, useState } from 'react';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const dinheiro = (v) => brl.format(Number(v) || 0);

// "R$ 3.988" e ",00" separados, como nos cartões do Figma
export function dinheiroPartes(v) {
  const [inteiro, centavos] = brl.format(Number(v) || 0).split(',');
  return { inteiro, centavos: ',' + (centavos ?? '00') };
}

export const numero = (v) => new Intl.NumberFormat('pt-BR').format(Number(v) || 0);

// aceita "2026-10-02" ou "2026-10-02T03:00:00.000Z" (formato que o MySQL devolve)
export function dataBR(valor, comHora = false) {
  if (!valor) return '';
  const s = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [a, m, d] = s.split('-');
    return `${d}/${m}/${a}`;
  }
  const dt = new Date(s);
  if (isNaN(dt)) return s;
  return comHora
    ? dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : dt.toLocaleDateString('pt-BR');
}

export function tempoAtras(valor) {
  const diff = Date.now() - new Date(valor).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

export const pad2 = (n) => String(n).padStart(2, '0');

// regra do estoque usada nos chips "Em estoque / Baixo / Crítico"
export function statusEstoque({ quantidade, minimo }) {
  const q = Number(quantidade) || 0;
  const m = Number(minimo) || 0;
  if (q <= 0 || q <= m * 0.5) return 'critico';
  if (q < m) return 'baixo';
  return 'ok';
}

export const STATUS_LABEL = { ok: 'OK', baixo: 'Baixo', critico: 'Crítico' };

// carrega dados de uma função assíncrona e devolve { data, loading, error, reload }
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await run();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  }, [run]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}

export function gerarProtocolo() {
  const ano = new Date().getFullYear();
  return `#${ano}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export const mensagemErro = (e) => e?.message || 'Algo deu errado. Tente novamente.';

// máscaras simples
const soDigitos = (v) => String(v || '').replace(/\D/g, '');
export function mascaraCnpj(v) {
  const d = soDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}
export function mascaraTelefone(v) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}
export const cnpjValido = (v) => soDigitos(v).length === 14;
