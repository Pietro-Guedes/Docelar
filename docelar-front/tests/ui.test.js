import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import {
  StatCard,
  Thumb,
  StatusBadge,
  QtdPill,
  Pagination,
  usePaginacao,
  Modal,
  Feedback,
  Confirm,
  Erro,
  Loading,
} from '../src/components/ui';

describe('StatCard', () => {
  it('mostra rótulo, valor e centavos', () => {
    render(<StatCard label="VALOR EM ESTOQUE" value="R$ 3.988" cents=",00" />);
    expect(screen.getByText('VALOR EM ESTOQUE')).toBeInTheDocument();
    expect(screen.getByText(/R\$ 3\.988/)).toBeInTheDocument();
    expect(screen.getByText(',00')).toBeInTheDocument();
  });

  it('mostra o selo de alerta no lugar da nota e aplica a classe crítica', () => {
    const { container } = render(<StatCard label="X" value="1" pill="3 itens" note="nota" critical />);
    expect(screen.getByText('3 itens')).toHaveClass('badge-alerta');
    expect(screen.queryByText('nota')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('critical');
  });
});

describe('Thumb', () => {
  it('mostra a imagem quando há src', () => {
    render(<Thumb src="/foto.png" alt="Pão" />);
    expect(screen.getByAltText('Pão')).toHaveAttribute('src', '/foto.png');
  });

  it('volta para o ícone quando a imagem falha', () => {
    const { container } = render(<Thumb src="/quebrada.png" alt="Pão" />);
    fireEvent.error(screen.getByAltText('Pão'));
    expect(screen.queryByAltText('Pão')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('mostra o ícone quando não há src', () => {
    const { container } = render(<Thumb />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('StatusBadge e QtdPill', () => {
  it('StatusBadge calcula o status a partir do produto', () => {
    render(<StatusBadge produto={{ quantidade: 2, minimo: 10 }} />);
    expect(screen.getByText('Crítico')).toHaveClass('badge-critico');
  });

  it('StatusBadge respeita o status informado', () => {
    render(<StatusBadge status="baixo" />);
    expect(screen.getByText('Baixo')).toHaveClass('badge-baixo');
  });

  it('QtdPill completa a quantidade com zero e usa "unid." por padrão', () => {
    render(<QtdPill produto={{ quantidade: 4, minimo: 1 }} />);
    expect(screen.getByText('04 unid.')).not.toHaveClass('alerta');
  });

  it('QtdPill destaca quando o estoque está baixo', () => {
    render(<QtdPill produto={{ quantidade: 3, minimo: 10, unidade: 'kg' }} />);
    expect(screen.getByText('03 kg')).toHaveClass('alerta');
  });
});

describe('Pagination', () => {
  it('não aparece com uma página só', () => {
    const { container } = render(<Pagination page={1} total={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('desabilita "anterior" na primeira e "próxima" na última página', () => {
    const { rerender } = render(<Pagination page={1} total={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Página anterior')).toBeDisabled();
    expect(screen.getByLabelText('Próxima página')).toBeEnabled();
    rerender(<Pagination page={3} total={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Próxima página')).toBeDisabled();
  });

  it('chama onChange ao clicar em número, anterior e próxima', () => {
    const onChange = jest.fn();
    render(<Pagination page={2} total={5} onChange={onChange} />);
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByLabelText('Página anterior'));
    fireEvent.click(screen.getByLabelText('Próxima página'));
    expect(onChange.mock.calls).toEqual([[4], [1], [3]]);
  });

  it('mostra no máximo 5 números em volta da página atual', () => {
    render(<Pagination page={10} total={20} onChange={() => {}} />);
    ['8', '9', '10', '11', '12'].forEach((n) => expect(screen.getByText(n)).toBeInTheDocument());
    expect(screen.queryByText('7')).not.toBeInTheDocument();
    expect(screen.getByText('10')).toHaveClass('active');
  });
});

describe('usePaginacao', () => {
  const lista = Array.from({ length: 20 }, (_, i) => i + 1);

  it('devolve só os itens da página atual', () => {
    const { result } = renderHook(() => usePaginacao(lista, 8));
    expect(result.current.total).toBe(3);
    expect(result.current.itens).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    act(() => result.current.setPage(3));
    expect(result.current.itens).toEqual([17, 18, 19, 20]);
  });

  it('lida com lista vazia ou indefinida', () => {
    const { result } = renderHook(() => usePaginacao(undefined));
    expect(result.current.total).toBe(1);
    expect(result.current.itens).toEqual([]);
  });

  it('volta para a página 1 quando a lista encolhe', () => {
    const { result, rerender } = renderHook(({ l }) => usePaginacao(l, 8), { initialProps: { l: lista } });
    act(() => result.current.setPage(3));
    rerender({ l: [1, 2, 3] });
    expect(result.current.page).toBe(1);
  });
});

describe('Modal', () => {
  it('não renderiza nada quando fechado', () => {
    const { container } = render(<Modal open={false} title="T">x</Modal>);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra título, conteúdo e rodapé quando aberto', () => {
    render(<Modal open title="Novo" footer={<button>Salvar</button>}>Conteúdo</Modal>);
    expect(screen.getByRole('dialog', { name: 'Novo' })).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });

  it('fecha com o botão, com Esc e ao clicar no fundo', () => {
    const onClose = jest.fn();
    const { container } = render(<Modal open title="T" onClose={onClose}>x</Modal>);
    fireEvent.click(screen.getByLabelText('Fechar'));
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.mouseDown(container.querySelector('.modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('não fecha ao clicar dentro da janela', () => {
    const onClose = jest.fn();
    render(<Modal open title="T" onClose={onClose}>x</Modal>);
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Feedback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fecha sozinho depois da duração', () => {
    const onClose = jest.fn();
    render(<Feedback open titulo="Salvo" onClose={onClose} duracao={1000} />);
    expect(screen.getByText('Salvo')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(999));
    expect(onClose).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não renderiza quando fechado', () => {
    const { container } = render(<Feedback open={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Confirm', () => {
  it('chama onConfirm e onCancel', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<Confirm open texto="Apagar o pão?" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText('Apagar o pão?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Excluir'));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('Erro e Loading', () => {
  it('Erro não mostra nada sem erro', () => {
    const { container } = render(<Erro error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('Erro mostra a mensagem e o botão de tentar de novo', () => {
    const onRetry = jest.fn();
    render(<Erro error={new Error('Servidor fora do ar')} onRetry={onRetry} />);
    expect(screen.getByText(/Servidor fora do ar/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Tentar de novo'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('Loading mostra o texto padrão ou o informado', () => {
    const { rerender } = render(<Loading />);
    expect(screen.getByText(/Carregando/)).toBeInTheDocument();
    rerender(<Loading texto="Buscando produtos..." />);
    expect(screen.getByText(/Buscando produtos/)).toBeInTheDocument();
  });
});
