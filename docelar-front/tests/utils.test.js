import { renderHook, waitFor, act } from '@testing-library/react';
import {
  dinheiro,
  dinheiroPartes,
  numero,
  dataBR,
  tempoAtras,
  pad2,
  statusEstoque,
  STATUS_LABEL,
  gerarProtocolo,
  mensagemErro,
  mascaraCnpj,
  mascaraTelefone,
  cnpjValido,
  useAsync,
} from '../src/utils';

// o Intl usa espaço "não quebrável"; trocamos por espaço normal para comparar
const limpo = (s) => s.replace(/\s/g, ' ');

describe('formatação de números', () => {
  it('dinheiro formata em reais', () => {
    expect(limpo(dinheiro(1234.5))).toBe('R$ 1.234,50');
    expect(limpo(dinheiro(0))).toBe('R$ 0,00');
  });

  it('dinheiro trata valores inválidos como zero', () => {
    expect(limpo(dinheiro(undefined))).toBe('R$ 0,00');
    expect(limpo(dinheiro('abc'))).toBe('R$ 0,00');
    expect(limpo(dinheiro('10'))).toBe('R$ 10,00');
  });

  it('dinheiroPartes separa a parte inteira dos centavos', () => {
    const { inteiro, centavos } = dinheiroPartes(3988);
    expect(limpo(inteiro)).toBe('R$ 3.988');
    expect(centavos).toBe(',00');
  });

  it('numero usa separador de milhar brasileiro', () => {
    expect(numero(1234567)).toBe('1.234.567');
    expect(numero(null)).toBe('0');
  });

  it('pad2 completa com zero à esquerda', () => {
    expect(pad2(5)).toBe('05');
    expect(pad2(12)).toBe('12');
  });
});

describe('dataBR', () => {
  it('retorna vazio quando não há valor', () => {
    expect(dataBR('')).toBe('');
    expect(dataBR(null)).toBe('');
  });

  it('converte data simples sem mexer no fuso', () => {
    expect(dataBR('2026-10-02')).toBe('02/10/2026');
  });

  it('converte data ISO com hora (formato do MySQL)', () => {
    expect(dataBR('2026-10-02T15:00:00.000Z')).toBe('02/10/2026');
  });

  it('devolve o texto original quando a data é inválida', () => {
    expect(dataBR('não é data')).toBe('não é data');
  });

  it('inclui a hora quando pedido', () => {
    expect(dataBR('2026-10-02T15:30:00.000Z', true)).toMatch(/02\/10\/2026.*12:30/);
  });
});

describe('tempoAtras', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-06T12:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());

  const atras = (ms) => new Date(Date.now() - ms).toISOString();

  it('"agora" para menos de 1 minuto', () => {
    expect(tempoAtras(atras(20 * 1000))).toBe('agora');
  });
  it('minutos', () => {
    expect(tempoAtras(atras(5 * 60000))).toBe('há 5 min');
  });
  it('hora no singular e plural', () => {
    expect(tempoAtras(atras(60 * 60000))).toBe('há 1 hora');
    expect(tempoAtras(atras(3 * 3600000))).toBe('há 3 horas');
  });
  it('dia no singular e plural', () => {
    expect(tempoAtras(atras(24 * 3600000))).toBe('há 1 dia');
    expect(tempoAtras(atras(48 * 3600000))).toBe('há 2 dias');
  });
});

describe('statusEstoque', () => {
  it('ok quando a quantidade está igual ou acima do mínimo', () => {
    expect(statusEstoque({ quantidade: 10, minimo: 10 })).toBe('ok');
    expect(statusEstoque({ quantidade: 50, minimo: 10 })).toBe('ok');
  });

  it('baixo quando está abaixo do mínimo mas acima da metade dele', () => {
    expect(statusEstoque({ quantidade: 9, minimo: 10 })).toBe('baixo');
    expect(statusEstoque({ quantidade: 6, minimo: 10 })).toBe('baixo');
  });

  it('crítico quando está na metade do mínimo ou menos', () => {
    expect(statusEstoque({ quantidade: 5, minimo: 10 })).toBe('critico');
    expect(statusEstoque({ quantidade: 1, minimo: 10 })).toBe('critico');
  });

  it('crítico quando a quantidade é zero ou negativa', () => {
    expect(statusEstoque({ quantidade: 0, minimo: 0 })).toBe('critico');
    expect(statusEstoque({ quantidade: -2, minimo: 10 })).toBe('critico');
  });

  it('aceita números em texto e valores ausentes', () => {
    expect(statusEstoque({ quantidade: '20', minimo: '10' })).toBe('ok');
    expect(statusEstoque({ quantidade: 5 })).toBe('ok');
  });

  it('todo status tem um rótulo', () => {
    expect(STATUS_LABEL).toEqual({ ok: 'OK', baixo: 'Baixo', critico: 'Crítico' });
  });
});

describe('máscaras', () => {
  it('mascaraCnpj formata 14 dígitos', () => {
    expect(mascaraCnpj('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('mascaraCnpj formata enquanto digita e ignora letras e excesso', () => {
    expect(mascaraCnpj('12')).toBe('12');
    expect(mascaraCnpj('12345')).toBe('12.345');
    expect(mascaraCnpj('12.345.678/0001-90999')).toBe('12.345.678/0001-90');
    expect(mascaraCnpj('ab12')).toBe('12');
    expect(mascaraCnpj(null)).toBe('');
  });

  it('mascaraTelefone formata fixo (10 dígitos) e celular (11 dígitos)', () => {
    expect(mascaraTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(mascaraTelefone('11999998888')).toBe('(11) 99999-8888');
  });

  it('mascaraTelefone formata enquanto digita', () => {
    expect(mascaraTelefone('1')).toBe('1');
    expect(mascaraTelefone('119')).toBe('(11) 9');
  });

  it('cnpjValido só confere se há 14 dígitos', () => {
    expect(cnpjValido('12.345.678/0001-90')).toBe(true);
    expect(cnpjValido('12.345.678/0001')).toBe(false);
    expect(cnpjValido('')).toBe(false);
  });
});

describe('outros utilitários', () => {
  it('gerarProtocolo segue o formato #ANO-NNNN', () => {
    expect(gerarProtocolo()).toMatch(new RegExp(`^#${new Date().getFullYear()}-\\d{4}$`));
  });

  it('mensagemErro usa a mensagem do erro ou um texto padrão', () => {
    expect(mensagemErro(new Error('Falhou'))).toBe('Falhou');
    expect(mensagemErro(undefined)).toBe('Algo deu errado. Tente novamente.');
    expect(mensagemErro({})).toBe('Algo deu errado. Tente novamente.');
  });
});

describe('useAsync', () => {
  it('começa carregando e depois entrega os dados', async () => {
    const fn = jest.fn().mockResolvedValue(['a', 'b']);
    const { result } = renderHook(() => useAsync(fn, []));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['a', 'b']);
    expect(result.current.error).toBeNull();
  });

  it('entrega o erro quando a função falha', async () => {
    const erro = new Error('falhou');
    const { result } = renderHook(() => useAsync(() => Promise.reject(erro), []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(erro);
    expect(result.current.data).toBeNull();
  });

  it('reload executa a função de novo', async () => {
    const fn = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const { result } = renderHook(() => useAsync(fn, []));
    await waitFor(() => expect(result.current.data).toBe(1));
    await act(async () => { await result.current.reload(); });
    expect(result.current.data).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('setData troca os dados manualmente', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve('x'), []));
    await waitFor(() => expect(result.current.data).toBe('x'));
    act(() => result.current.setData('y'));
    expect(result.current.data).toBe('y');
  });
});
