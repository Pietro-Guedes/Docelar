jest.mock('../../src/repositories/ProdutoRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  contarVinculos: jest.fn(),
  atualizarAtivo: jest.fn(),
}));

const repo = require('../../src/repositories/ProdutoRepository');
const service = require('../../src/services/ProdutoService');

const produtoValido = () => ({
  nome: ' Pão Francês ',
  descricao: ' Pão fresquinho ',
  valor_unitario: 0.8,
  id_categoria: 1,
  id_fornecedor: 2,
  id_funcionario: 3,
});

describe('ProdutoService', () => {
  describe('listarProdutos / buscarProdutoPorId', () => {
    it('lista produtos com total', async () => {
      repo.findAll.mockResolvedValue([{ id_produto: 1 }]);
      expect(await service.listarProdutos()).toEqual({ sucesso: true, dados: [{ id_produto: 1 }], total: 1 });
    });

    it('rejeita id inválido', async () => {
      await expect(service.buscarProdutoPorId('abc')).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita produto inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.buscarProdutoPorId(9)).rejects.toMatchObject({ status: 404 });
    });

    it('retorna o produto', async () => {
      repo.findById.mockResolvedValue({ id_produto: 9 });
      expect((await service.buscarProdutoPorId(9)).dados).toEqual({ id_produto: 9 });
    });
  });

  describe('cadastrarProduto', () => {
    it.each([
      ['sem nome', { nome: undefined }],
      ['sem descrição', { descricao: undefined }],
      ['sem valor', { valor_unitario: undefined }],
    ])('exige campos obrigatórios (%s)', async (_, mudanca) => {
      await expect(service.cadastrarProduto({ ...produtoValido(), ...mudanca })).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita valor negativo ou não numérico', async () => {
      await expect(service.cadastrarProduto({ ...produtoValido(), valor_unitario: -1 })).rejects.toMatchObject({ status: 400 });
      await expect(service.cadastrarProduto({ ...produtoValido(), valor_unitario: '5' })).rejects.toMatchObject({ status: 400 });
    });

    it('aceita valor zero', async () => {
      repo.create.mockResolvedValue(1);
      await expect(service.cadastrarProduto({ ...produtoValido(), valor_unitario: 0 })).resolves.toMatchObject({ sucesso: true });
    });

    it('rejeita categoria e fornecedor inválidos', async () => {
      await expect(service.cadastrarProduto({ ...produtoValido(), id_categoria: 'x' })).rejects.toMatchObject({ mensagem: 'Categoria inválida' });
      await expect(service.cadastrarProduto({ ...produtoValido(), id_fornecedor: 'x' })).rejects.toMatchObject({ mensagem: 'Fornecedor inválido' });
    });

    it('rejeita estoque mínimo negativo ou decimal', async () => {
      await expect(service.cadastrarProduto({ ...produtoValido(), estoque_minimo: -1 })).rejects.toMatchObject({ status: 400 });
      await expect(service.cadastrarProduto({ ...produtoValido(), estoque_minimo: 1.5 })).rejects.toMatchObject({ status: 400 });
    });

    it('exige o funcionário responsável', async () => {
      await expect(service.cadastrarProduto({ ...produtoValido(), id_funcionario: undefined })).rejects.toMatchObject({ status: 400 });
    });

    it('cadastra aparando espaços e sem estoque_minimo quando não informado', async () => {
      repo.create.mockResolvedValue(7);
      const r = await service.cadastrarProduto(produtoValido());
      expect(repo.create).toHaveBeenCalledWith({
        nome: 'Pão Francês',
        descricao: 'Pão fresquinho',
        valor_unitario: 0.8,
        id_categoria: 1,
        id_fornecedor: 2,
        id_funcionario: 3,
      });
      expect(r).toMatchObject({ sucesso: true, id: 7 });
    });

    it('inclui estoque_minimo quando informado e usa null em categoria/fornecedor ausentes', async () => {
      repo.create.mockResolvedValue(8);
      await service.cadastrarProduto({ ...produtoValido(), id_categoria: undefined, id_fornecedor: null, estoque_minimo: 5 });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ id_categoria: null, id_fornecedor: null, estoque_minimo: 5 }));
    });
  });

  describe('atualizarProduto', () => {
    beforeEach(() => repo.findById.mockResolvedValue({ id_produto: 1 }));

    it('rejeita produto inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.atualizarProduto(1, { nome: 'A' })).rejects.toMatchObject({ status: 404 });
    });

    it('rejeita quando não há dado válido', async () => {
      await expect(service.atualizarProduto(1, {})).rejects.toMatchObject({ mensagem: 'Nenhum dado válido' });
    });

    it('rejeita valor inválido', async () => {
      await expect(service.atualizarProduto(1, { valor_unitario: -5 })).rejects.toMatchObject({ status: 400 });
    });

    it('atualiza só os campos enviados', async () => {
      await service.atualizarProduto(1, { nome: ' Novo ', estoque_minimo: 4 });
      expect(repo.update).toHaveBeenCalledWith(1, { nome: 'Novo', estoque_minimo: 4 });
    });

    it('permite limpar a categoria com null', async () => {
      await service.atualizarProduto(1, { id_categoria: null });
      expect(repo.update).toHaveBeenCalledWith(1, { id_categoria: null });
    });
  });

  describe('deletarProduto', () => {
    it('rejeita produto inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.deletarProduto(1)).rejects.toMatchObject({ status: 404 });
    });

    it('não apaga produto com histórico', async () => {
      repo.findById.mockResolvedValue({ id_produto: 1 });
      repo.contarVinculos.mockResolvedValue(2);
      await expect(service.deletarProduto(1)).rejects.toMatchObject({ status: 409 });
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('apaga produto sem vínculos', async () => {
      repo.findById.mockResolvedValue({ id_produto: 1 });
      repo.contarVinculos.mockResolvedValue(0);
      await service.deletarProduto(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    describe('atualizarStatusProduto', () => {
      it('rejeita um status que não seja booleano', async () => {
        await expect(service.atualizarStatusProduto(1, 'false')).rejects.toMatchObject({ status: 400 });
        expect(repo.atualizarAtivo).not.toHaveBeenCalled();
      });

      it('preserva o produto e atualiza seu status reversível', async () => {
        repo.findById.mockResolvedValue({ id_produto: 1 });
        await service.atualizarStatusProduto(1, false);
        expect(repo.atualizarAtivo).toHaveBeenCalledWith(1, false);
        expect(repo.delete).not.toHaveBeenCalled();
      });
    });
  });
});
