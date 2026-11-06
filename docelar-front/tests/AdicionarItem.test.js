import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdicionarItem from '../src/components/AdicionarItem';
import { listarProdutos } from '../src/api';

// o módulo da API usa import.meta.env (Vite); aqui trocamos por uma versão simples
jest.mock('../src/api', () => ({ listarProdutos: jest.fn() }));

const PRODUTOS = [
  { id: 1, codigo: '001', nome: 'Coca-Cola 2L', quantidade: 12, valorUnitario: 9.5, unidade: 'un' },
  { id: 2, codigo: '002', nome: 'Pão Integral', quantidade: 0, valorUnitario: 8, unidade: 'un' },
];

const dia = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const opcao = (nome) => screen.getByRole('option', { name: new RegExp(nome) });

async function montar(props = {}) {
  listarProdutos.mockResolvedValue(PRODUTOS);
  const onAdd = jest.fn();
  const { container } = render(<AdicionarItem modo="entrada" onAdd={onAdd} {...props} />);
  const busca = screen.getByLabelText('Buscar por nome ou código');
  fireEvent.focus(busca);
  await screen.findAllByRole('option');
  return { onAdd, busca, container, data: () => container.querySelector('input[type="date"]') };
}

describe('AdicionarItem – lista de busca', () => {
  it('mostra os produtos numa lista própria ao focar o campo', async () => {
    await montar();
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(opcao('Coca-Cola 2L')).toBeInTheDocument();
  });

  it('filtra pelo que foi digitado (nome ou código)', async () => {
    const { busca } = await montar();
    fireEvent.change(busca, { target: { value: 'coca' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.change(busca, { target: { value: '002' } });
    expect(opcao('Pão Integral')).toBeInTheDocument();
    fireEvent.change(busca, { target: { value: 'xyz' } });
    expect(screen.getByText('Nenhum produto encontrado')).toBeInTheDocument();
  });

  it('clicar em um item preenche o campo e fecha a lista', async () => {
    const { busca } = await montar();
    fireEvent.mouseDown(opcao('Coca-Cola 2L'));
    expect(busca).toHaveValue('001 - Coca-Cola 2L');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('setas e Enter escolhem um item sem enviar o formulário', async () => {
    const { busca, onAdd } = await montar();
    fireEvent.keyDown(busca, { key: 'ArrowDown' });
    fireEvent.keyDown(busca, { key: 'Enter' });
    expect(busca).toHaveValue('002 - Pão Integral');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('Esc e sair do campo fecham a lista', async () => {
    const { busca } = await montar();
    fireEvent.keyDown(busca, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.focus(busca);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.blur(busca);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('AdicionarItem – validade na entrada', () => {
  async function preencher(validade) {
    const ctx = await montar();
    fireEvent.mouseDown(opcao('Coca-Cola 2L'));
    if (validade) fireEvent.change(ctx.data(), { target: { value: validade } });
    return ctx;
  }

  it('bloqueia produto já vencido', async () => {
    const { onAdd } = await preencher(dia(-3));
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/ }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/já está vencido/)).toBeInTheDocument();
  });

  it('bloqueia validade com menos de 30 dias e avisa já ao escolher a data', async () => {
    const { onAdd } = await preencher(dia(10));
    expect(screen.getByText(/pelo menos 30 dias/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/ }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('aceita validade de 30 dias ou mais', async () => {
    const { onAdd } = await preencher(dia(30));
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ produtoId: 1, validade: dia(30), valorUnitario: 9.5 }));
  });

  it('aceita lote sem validade', async () => {
    const { onAdd } = await preencher('');
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/ }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ validade: null }));
  });

  it('o campo de data não deixa escolher antes do mínimo', async () => {
    const { data } = await montar();
    expect(data()).toHaveAttribute('min', dia(30));
  });

  it('exige um produto da lista', async () => {
    const { busca, onAdd } = await montar();
    fireEvent.change(busca, { target: { value: 'inexistente' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/ }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/Produto não encontrado/)).toBeInTheDocument();
  });
});

describe('AdicionarItem – saída', () => {
  it('não mostra campo de validade e checa o saldo', async () => {
    const { container, busca, onAdd } = await montar({ modo: 'saida' });
    expect(container.querySelector('input[type="date"]')).toBeNull();
    fireEvent.mouseDown(opcao('Coca-Cola 2L'));
    fireEvent.change(container.querySelector('input[type="number"]'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/ }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/Só há 12 em estoque/)).toBeInTheDocument();
    expect(busca).toHaveValue('001 - Coca-Cola 2L');
  });
});
