import {
  dataLocal,
  diasParaVencer,
  dataMinimaValidade,
  erroDeValidade,
  situacaoValidade,
  lotesAtivos,
  piorSituacao,
  nivelEmAlerta,
} from '../src/utils';

// "hoje" fixo: 6 de novembro de 2026
const HOJE = new Date(2026, 10, 6, 15, 0);

describe('dataLocal e diasParaVencer', () => {
  it('lê data simples e ISO com hora sem trocar de dia', () => {
    expect(dataLocal('2026-12-01').getDate()).toBe(1);
    expect(dataLocal('2026-12-01T03:00:00.000Z').getDate()).toBe(1); // 00:00 em São Paulo
  });

  it('devolve null para vazio ou inválido', () => {
    expect(dataLocal('')).toBeNull();
    expect(dataLocal(null)).toBeNull();
    expect(dataLocal('abc')).toBeNull();
  });

  it('conta dias a partir de hoje, ignorando a hora', () => {
    expect(diasParaVencer('2026-11-06', HOJE)).toBe(0);
    expect(diasParaVencer('2026-11-16', HOJE)).toBe(10);
    expect(diasParaVencer('2026-11-04', HOJE)).toBe(-2);
    expect(diasParaVencer(null, HOJE)).toBeNull();
  });
});

describe('regra dos 30 dias no cadastro', () => {
  it('a data mínima é hoje + 30 dias', () => {
    expect(dataMinimaValidade(HOJE)).toBe('2026-12-06');
    expect(dataMinimaValidade(new Date(2026, 11, 20))).toBe('2027-01-19');
  });

  it('aceita validade vazia (produto sem prazo)', () => {
    expect(erroDeValidade('', HOJE)).toBe('');
    expect(erroDeValidade(null, HOJE)).toBe('');
  });

  it('recusa produto já vencido', () => {
    expect(erroDeValidade('2026-11-05', HOJE)).toMatch(/já está vencido/);
  });

  it('recusa vencimento em menos de 30 dias e diz a data mínima', () => {
    const msg = erroDeValidade('2026-12-05', HOJE);
    expect(msg).toMatch(/pelo menos 30 dias/);
    expect(msg).toContain('06/12/2026');
    expect(erroDeValidade('2026-11-06', HOJE)).toMatch(/pelo menos 30 dias/);
  });

  it('aceita 30 dias ou mais', () => {
    expect(erroDeValidade('2026-12-06', HOJE)).toBe('');
    expect(erroDeValidade('2027-03-01', HOJE)).toBe('');
  });
});

describe('situacaoValidade', () => {
  const nivel = (v) => situacaoValidade(v, HOJE).nivel;

  it('sem validade', () => {
    expect(situacaoValidade(null, HOJE)).toMatchObject({ nivel: 'sem', texto: 'Sem validade' });
  });

  it('vencido', () => {
    expect(situacaoValidade('2026-11-05', HOJE)).toMatchObject({ nivel: 'vencido', texto: 'Venceu ontem' });
    expect(situacaoValidade('2026-11-01', HOJE)).toMatchObject({ nivel: 'vencido', texto: 'Vencido há 5 dias' });
  });

  it('urgente: vence hoje até 7 dias', () => {
    expect(situacaoValidade('2026-11-06', HOJE)).toMatchObject({ nivel: 'urgente', texto: 'Vence hoje' });
    expect(situacaoValidade('2026-11-07', HOJE)).toMatchObject({ nivel: 'urgente', texto: 'Vence amanhã' });
    expect(situacaoValidade('2026-11-13', HOJE)).toMatchObject({ nivel: 'urgente', texto: 'Vence em 7 dias' });
  });

  it('atenção: de 8 a 30 dias', () => {
    expect(nivel('2026-11-14')).toBe('atencao');
    expect(nivel('2026-12-06')).toBe('atencao');
  });

  it('ok: mais de 30 dias', () => {
    expect(nivel('2026-12-07')).toBe('ok');
  });

  it('só vencido, urgente e atenção entram em alerta', () => {
    expect(['vencido', 'urgente', 'atencao'].every(nivelEmAlerta)).toBe(true);
    expect(['ok', 'sem'].some(nivelEmAlerta)).toBe(false);
  });
});

describe('lotesAtivos e piorSituacao', () => {
  const lotes = [
    { id: 1, quantidade: 5, validade: '2027-01-10' },
    { id: 2, quantidade: 0, validade: '2026-10-01' }, // sem saldo: não conta
    { id: 3, quantidade: 8, validade: '2026-11-20' },
    { id: 4, quantidade: 2, validade: null },
  ];

  it('ignora lotes sem saldo e ordena pela validade (sem validade por último)', () => {
    expect(lotesAtivos(lotes).map((l) => l.id)).toEqual([3, 1, 4]);
  });

  it('não altera a lista original', () => {
    const copia = [...lotes];
    lotesAtivos(lotes);
    expect(lotes).toEqual(copia);
  });

  it('lida com lista vazia ou indefinida', () => {
    expect(lotesAtivos(undefined)).toEqual([]);
    expect(piorSituacao([], HOJE)).toBeNull();
  });

  it('pega o lote em pior situação', () => {
    const pior = piorSituacao(lotes, HOJE);
    expect(pior.nivel).toBe('atencao');
    expect(pior.validade).toBe('2026-11-20');
  });

  it('um lote vencido com saldo vira o pior alerta', () => {
    const pior = piorSituacao([...lotes, { id: 9, quantidade: 1, validade: '2026-11-01' }], HOJE);
    expect(pior.nivel).toBe('vencido');
  });
});
