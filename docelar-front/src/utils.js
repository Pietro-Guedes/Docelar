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

// ---------------------------------------------------------------- validade dos lotes
export const DIAS_MINIMOS_VALIDADE = 30; // não dá para cadastrar lote que vence antes disso
export const DIAS_ALERTA_VALIDADE = 30;  // a partir daqui o lote aparece com alerta
export const DIAS_ALERTA_URGENTE = 7;    // e daqui em diante o alerta fica vermelho

const doisDigitos = (n) => String(n).padStart(2, '0');
const textoData = (d) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

// Data (à meia-noite, no fuso do computador) de "2026-10-02" ou "2026-10-02T03:00:00.000Z"
export function dataLocal(valor) {
  if (!valor) return null;
  const s = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [a, m, d] = s.split('-').map(Number);
    return new Date(a, m - 1, d);
  }
  const dt = new Date(s);
  if (isNaN(dt)) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

// Quantos dias faltam para vencer (negativo = já venceu). null quando não há data válida.
export function diasParaVencer(validade, agora = new Date()) {
  const alvo = dataLocal(validade);
  if (!alvo) return null;
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((alvo - hoje) / 86400000);
}

// Primeira data aceita para uma validade nova, no formato do <input type="date">
export function dataMinimaValidade(agora = new Date()) {
  const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + DIAS_MINIMOS_VALIDADE);
  return textoData(d);
}

// Mensagem de erro quando a validade não pode ser cadastrada; '' quando está tudo certo (ou vazia).
export function erroDeValidade(validade, agora = new Date()) {
  if (!validade) return '';
  const dias = diasParaVencer(validade, agora);
  if (dias === null) return 'Validade inválida.';
  if (dias < 0) return 'Esse produto já está vencido. Informe uma validade futura.';
  if (dias < DIAS_MINIMOS_VALIDADE) {
    return `A validade precisa ser de pelo menos ${DIAS_MINIMOS_VALIDADE} dias (a partir de ${dataBR(dataMinimaValidade(agora))}).`;
  }
  return '';
}

// Situação de um lote: { nivel: 'vencido' | 'urgente' | 'atencao' | 'ok' | 'sem', dias, texto }
export function situacaoValidade(validade, agora = new Date()) {
  const dias = diasParaVencer(validade, agora);
  if (dias === null) return { nivel: 'sem', dias: null, texto: 'Sem validade' };
  if (dias < 0) return { nivel: 'vencido', dias, texto: dias === -1 ? 'Venceu ontem' : `Vencido há ${-dias} dias` };
  if (dias === 0) return { nivel: 'urgente', dias, texto: 'Vence hoje' };
  const texto = dias === 1 ? 'Vence amanhã' : `Vence em ${dias} dias`;
  if (dias <= DIAS_ALERTA_URGENTE) return { nivel: 'urgente', dias, texto };
  if (dias <= DIAS_ALERTA_VALIDADE) return { nivel: 'atencao', dias, texto };
  return { nivel: 'ok', dias, texto: `${dias} dias` };
}

// Lotes que ainda têm saldo, do que vence primeiro para o que vence depois (sem validade por último)
export function lotesAtivos(lotes) {
  return (lotes || [])
    .filter((l) => Number(l.quantidade) > 0)
    .sort((a, b) => {
      if (!a.validade && !b.validade) return 0;
      if (!a.validade) return 1;
      if (!b.validade) return -1;
      return dataLocal(a.validade) - dataLocal(b.validade);
    });
}

// O pior alerta entre os lotes de um produto (para mostrar no resumo da linha)
const PESO = { vencido: 4, urgente: 3, atencao: 2, ok: 1, sem: 0 };
export function piorSituacao(lotes, agora = new Date()) {
  let pior = null;
  for (const l of lotesAtivos(lotes)) {
    const s = situacaoValidade(l.validade, agora);
    if (!pior || PESO[s.nivel] > PESO[pior.nivel]) pior = { ...s, validade: l.validade };
  }
  return pior;
}
export const nivelEmAlerta = (nivel) => nivel === 'vencido' || nivel === 'urgente' || nivel === 'atencao';
