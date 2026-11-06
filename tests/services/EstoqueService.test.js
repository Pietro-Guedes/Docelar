jest.mock('../../src/repositories/EstoqueRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findVencidos: jest.fn(),
  findProximosVencimento: jest.fn(),
}));
jest.mock('../../src/repositories/ProdutoRepository', () => ({ findById: jest.fn() }));

const repo = require('../../src/repositories/EstoqueRepository');
const produtoRepo = require('../../src/repositories/ProdutoRepository');
const service = require('../../src/services/EstoqueService');

// "hoje" fixo (só a data é simulada) para a regra dos 30 dias não depender do dia em que o teste roda
const TODOS_MENOS_DATE = ['hrtime', 'nextTick', 'performance', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame',
  'requestIdleCallback', 'cancelIdleCallback', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'];

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 10, 6, 12), doNotFake: TODOS_MENOS_DATE }));
afterAll(() => jest.useRealTimers());

describe('EstoqueService', () => {
  describe('cadastrarEstoque', () => {
    it('exige produto válido', async () => {
      await expect(service.cadastrarEstoque({ quantidade: 5 })).rejects.toMatchObject({ status: 400 });
    });

    it.each([0, -3, '5', undefined])('rejeita quantidade %p', async (quantidade) => {
      await expect(service.cadastrarEstoque({ id_produto: 1, quantidade })).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita produto inexistente', async () => {
      produtoRepo.findById.mockResolvedValue(undefined);
      await expect(service.cadastrarEstoque({ id_produto: 1, quantidade: 5 })).rejects.toMatchObject({ status: 404 });
    });

    it('cadastra lote com valores padrão (null)', async () => {
      produtoRepo.findById.mockResolvedValue({ id_produto: 1 });
      repo.create.mockResolvedValue(4);
      const r = await service.cadastrarEstoque({ id_produto: 1, quantidade: 5 });
      expect(repo.create).toHaveBeenCalledWith({ id_produto: 1, id_fornecedor: null, quantidade: 5, validade: null });
      expect(r).toMatchObject({ sucesso: true, id: 4 });
    });

    it('recusa lote já vencido sem consultar o banco', async () => {
      await expect(service.cadastrarEstoque({ id_produto: 1, quantidade: 5, validade: '2026-11-01' })).rejects.toMatchObject({ status: 400 });
      expect(produtoRepo.findById).not.toHaveBeenCalled();
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('recusa lote que vence em menos de 30 dias', async () => {
      await expect(service.cadastrarEstoque({ id_produto: 1, quantidade: 5, validade: '2026-12-05' })).rejects.toMatchObject({ status: 400 });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('aceita lote que vence em exatamente 30 dias', async () => {
      produtoRepo.findById.mockResolvedValue({ id_produto: 1 });
      repo.create.mockResolvedValue(9);
      await expect(service.cadastrarEstoque({ id_produto: 1, quantidade: 5, validade: '2026-12-06' })).resolves.toMatchObject({ id: 9 });
    });

    it('repassa o executor (transação) para o repositório', async () => {
      produtoRepo.findById.mockResolvedValue({ id_produto: 1 });
      repo.create.mockResolvedValue(4);
      const conn = { fake: true };
      await service.cadastrarEstoque({ id_produto: 1, quantidade: 5, validade: '2027-01-31' }, conn);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ validade: '2027-01-31' }), conn);
    });
  });

  describe('atualizarEstoque', () => {
    it('rejeita lote inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.atualizarEstoque(1, { quantidade: 1 })).rejects.toMatchObject({ status: 404 });
    });

    it('rejeita quantidade negativa', async () => {
      repo.findById.mockResolvedValue({ id_estoque: 1 });
      await expect(service.atualizarEstoque(1, { quantidade: -1 })).rejects.toMatchObject({ status: 400 });
    });

    it('aceita quantidade zero', async () => {
      repo.findById.mockResolvedValue({ id_estoque: 1 });
      await service.atualizarEstoque(1, { quantidade: 0 });
      expect(repo.update).toHaveBeenCalledWith(1, { quantidade: 0 });
    });

    it('rejeita quando não há dado válido', async () => {
      repo.findById.mockResolvedValue({ id_estoque: 1 });
      await expect(service.atualizarEstoque(1, {})).rejects.toMatchObject({ mensagem: 'Nenhum dado válido' });
    });
  });

  describe('deletarEstoque', () => {
    it('rejeita lote inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.deletarEstoque(1)).rejects.toMatchObject({ status: 404 });
    });

    it('apaga lote existente', async () => {
      repo.findById.mockResolvedValue({ id_estoque: 1 });
      await service.deletarEstoque(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('vencimentos', () => {
    it('lista vencidos', async () => {
      repo.findVencidos.mockResolvedValue([{ id_estoque: 1 }]);
      expect(await service.listarVencidos()).toMatchObject({ total: 1 });
    });

    it('usa 7 dias como padrão nos próximos a vencer', async () => {
      repo.findProximosVencimento.mockResolvedValue([]);
      await service.listarProximosVencimento();
      expect(repo.findProximosVencimento).toHaveBeenCalledWith(7);
    });

    it('rejeita dias negativos ou inválidos', async () => {
      await expect(service.listarProximosVencimento(-1)).rejects.toMatchObject({ status: 400 });
      await expect(service.listarProximosVencimento('abc')).rejects.toMatchObject({ status: 400 });
    });
  });

  it('criarLote delega para cadastrarEstoque', async () => {
    produtoRepo.findById.mockResolvedValue({ id_produto: 1 });
    repo.create.mockResolvedValue(2);
    expect(await service.criarLote({ id_produto: 1, quantidade: 1 })).toMatchObject({ id: 2 });
  });
});
