import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { ValidadeBadge, ValidadeResumo, BotaoLotes, LinhaLotes, useAbertos } from '../src/components/Lotes';

const dia = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const produto = {
  id: 1,
  nome: 'Pão de Forma',
  unidade: 'un',
  lotes: [
    { id: 10, quantidade: 5, validade: dia(3), dataEntrada: '2026-10-01' },
    { id: 11, quantidade: 20, validade: dia(90), dataEntrada: '2026-10-15' },
    { id: 12, quantidade: 0, validade: dia(-5), dataEntrada: '2026-09-01' },
  ],
};

describe('ValidadeBadge', () => {
  it('mostra o texto e a cor conforme a situação', () => {
    const { rerender } = render(<ValidadeBadge validade={dia(3)} />);
    expect(screen.getByText(/Vence em 3 dias/)).toHaveClass('badge-critico');
    rerender(<ValidadeBadge validade={dia(20)} />);
    expect(screen.getByText(/Vence em 20 dias/)).toHaveClass('badge-baixo');
    rerender(<ValidadeBadge validade={dia(-2)} />);
    expect(screen.getByText(/Vencido há 2 dias/)).toHaveClass('badge-critico');
    rerender(<ValidadeBadge validade={dia(90)} />);
    expect(screen.getByText('90 dias')).toHaveClass('badge-ok');
  });
});

describe('ValidadeResumo', () => {
  it('mostra a validade que vence primeiro, com alerta', () => {
    render(<ValidadeResumo produto={produto} />);
    expect(screen.getByText(/Vence em 3 dias/)).toBeInTheDocument();
  });

  it('mostra traço quando o produto não tem lotes com saldo', () => {
    render(<ValidadeResumo produto={{ lotes: [{ id: 1, quantidade: 0, validade: dia(10) }] }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('LinhaLotes', () => {
  const renderizar = (p) => render(<table><tbody><LinhaLotes produto={p} colSpan={7} /></tbody></table>);

  it('lista cada lote com saldo, cada um com a sua validade', () => {
    renderizar(produto);
    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText('#11')).toBeInTheDocument();
    expect(screen.getByText(/Vence em 3 dias/)).toBeInTheDocument();
    expect(screen.getByText('90 dias')).toBeInTheDocument();
  });

  it('não mostra lote sem saldo', () => {
    renderizar(produto);
    expect(screen.queryByText('#12')).not.toBeInTheDocument();
  });

  it('avisa quando não há lotes com saldo', () => {
    renderizar({ ...produto, lotes: [] });
    expect(screen.getByText('Nenhum lote com saldo em estoque.')).toBeInTheDocument();
  });
});

describe('BotaoLotes e useAbertos', () => {
  it('o botão informa se está aberto e chama onClick', () => {
    const onClick = jest.fn();
    render(<BotaoLotes aberto={false} nome="Pão" onClick={onClick}>Pão</BotaoLotes>);
    const botao = screen.getByRole('button', { name: 'Ver lotes de Pão' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(botao);
    expect(onClick).toHaveBeenCalled();
  });

  it('useAbertos abre e fecha cada produto separadamente', () => {
    const { result } = renderHook(() => useAbertos());
    expect(result.current.aberto(1)).toBe(false);
    act(() => result.current.alternar(1));
    expect(result.current.aberto(1)).toBe(true);
    expect(result.current.aberto(2)).toBe(false);
    act(() => result.current.alternar(1));
    expect(result.current.aberto(1)).toBe(false);
  });
});
