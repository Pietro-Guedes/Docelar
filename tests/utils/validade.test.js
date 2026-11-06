const { DIAS_MINIMOS_VALIDADE, diasParaVencer, dataMinimaValidade, validarValidade } = require('../../src/utils/validade');

// "hoje" fixo nos testes: 6 de novembro de 2026
const HOJE = new Date(2026, 10, 6, 15, 30);

const erroDe = (validade) => {
  try {
    validarValidade(validade, HOJE);
  } catch (e) {
    return e;
  }
  return null;
};

describe('regra de validade dos lotes', () => {
  it('exige no mínimo 30 dias', () => {
    expect(DIAS_MINIMOS_VALIDADE).toBe(30);
  });

  describe('diasParaVencer', () => {
    it('conta os dias a partir de hoje, ignorando a hora', () => {
      expect(diasParaVencer('2026-11-06', HOJE)).toBe(0);
      expect(diasParaVencer('2026-11-07', HOJE)).toBe(1);
      expect(diasParaVencer('2026-11-05', HOJE)).toBe(-1);
      expect(diasParaVencer('2026-12-06', HOJE)).toBe(30);
    });

    it('aceita Date e texto ISO com hora', () => {
      expect(diasParaVencer(new Date(2026, 10, 10), HOJE)).toBe(4);
      expect(diasParaVencer('2026-11-10T03:00:00.000Z', HOJE)).toBe(4);
    });

    it('devolve null para datas inválidas', () => {
      expect(diasParaVencer('abc', HOJE)).toBeNull();
      expect(diasParaVencer('2026-02-31', HOJE)).toBeNull();
      expect(diasParaVencer(new Date('x'), HOJE)).toBeNull();
    });
  });

  describe('dataMinimaValidade', () => {
    it('é hoje mais 30 dias', () => {
      expect(dataMinimaValidade(HOJE)).toBe('2026-12-06');
    });

    it('atravessa a virada de ano', () => {
      expect(dataMinimaValidade(new Date(2026, 11, 20))).toBe('2027-01-19');
    });
  });

  describe('validarValidade', () => {
    it('permite lote sem validade', () => {
      expect(erroDe(undefined)).toBeNull();
      expect(erroDe(null)).toBeNull();
      expect(erroDe('')).toBeNull();
    });

    it('recusa produto já vencido', () => {
      const e = erroDe('2026-11-05');
      expect(e).toMatchObject({ status: 400 });
      expect(e.mensagem).toMatch(/já vencido/);
    });

    it('recusa vencimento hoje e dentro de 30 dias', () => {
      expect(erroDe('2026-11-06').mensagem).toMatch(/muito curta/);
      expect(erroDe('2026-12-05').mensagem).toMatch(/muito curta/);
    });

    it('a mensagem informa a primeira data aceita', () => {
      expect(erroDe('2026-11-20').mensagem).toContain('2026-12-06');
    });

    it('aceita exatamente 30 dias ou mais', () => {
      expect(erroDe('2026-12-06')).toBeNull();
      expect(erroDe('2027-06-01')).toBeNull();
    });

    it('recusa datas inválidas', () => {
      expect(erroDe('amanhã')).toMatchObject({ status: 400, mensagem: 'Validade inválida' });
      expect(erroDe('2026-13-45')).toMatchObject({ status: 400, mensagem: 'Validade inválida' });
    });
  });
});
