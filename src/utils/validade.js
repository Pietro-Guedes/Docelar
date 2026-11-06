// Regra de validade dos lotes: não pode estar vencida nem vencer em menos de 30 dias.
const DIAS_MINIMOS_VALIDADE = 30;
const DIA_MS = 24 * 60 * 60 * 1000;

const doisDigitos = (n) => String(n).padStart(2, '0');

// Aceita "2026-12-31", "2026-12-31T03:00:00.000Z" ou Date. Devolve a data (sem hora) em UTC, ou null se inválida.
function lerData(valor) {
  if (valor instanceof Date) {
    return isNaN(valor) ? null : Date.UTC(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ts = Date.UTC(ano, mes - 1, dia);
  const conferida = new Date(ts);
  // evita datas que "viram" outro dia (ex.: 2026-02-31)
  if (conferida.getUTCFullYear() !== ano || conferida.getUTCMonth() !== mes - 1 || conferida.getUTCDate() !== dia) return null;
  return ts;
}

// Quantos dias faltam (negativo = já passou), contando a partir do dia de hoje no horário do servidor.
function diasParaVencer(validade, agora = new Date()) {
  const alvo = lerData(validade);
  if (alvo === null) return null;
  const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((alvo - hoje) / DIA_MS);
}

function dataMinimaValidade(agora = new Date(), dias = DIAS_MINIMOS_VALIDADE) {
  const d = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()) + dias * DIA_MS);
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}`;
}

// Lança { status: 400, mensagem } quando a validade não é aceita. Validade vazia é permitida (produto sem prazo).
function validarValidade(validade, agora = new Date()) {
  if (validade === undefined || validade === null || validade === '') return;

  const dias = diasParaVencer(validade, agora);
  if (dias === null) throw { status: 400, mensagem: 'Validade inválida' };
  if (dias < 0) throw { status: 400, mensagem: 'Produto já vencido: a validade não pode ser anterior a hoje' };
  if (dias < DIAS_MINIMOS_VALIDADE) {
    throw {
      status: 400,
      mensagem: `Validade muito curta: o produto precisa vencer em pelo menos ${DIAS_MINIMOS_VALIDADE} dias (a partir de ${dataMinimaValidade(agora)})`,
    };
  }
}

module.exports = { DIAS_MINIMOS_VALIDADE, diasParaVencer, dataMinimaValidade, validarValidade };
