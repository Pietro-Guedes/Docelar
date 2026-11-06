const mockConn = {
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

jest.mock('../../src/config/database', () => ({ getConnection: jest.fn() }));
jest.mock('../../src/repositories/MovimentacaoEstoqueRepository', () => ({ findByProduto: jest.fn(), create: jest.fn() }));
jest.mock('../../src/repositories/EstoqueRepository', () => ({
  findByProdutoOrdenadoPorValidade: jest.fn(),
  findByIdParaAtualizar: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../../src/services/EstoqueService', () => ({ criarLote: jest.fn() }));

const pool = require('../../src/config/database');
const movRepo = require('../../src/repositories/MovimentacaoEstoqueRepository');
const estoqueRepo = require('../../src/repositories/EstoqueRepository');
const estoqueService = require('../../src/services/EstoqueService');
const service = require('../../src/services/MovimentacaoEstoqueService');

beforeEach(() => {
  pool.getConnection.mockResolvedValue(mockConn);
});

describe('MovimentacaoEstoqueService', () => {
  describe('listarMovimentacoesPorProduto', () => {
    it('rejeita id inválido', async () => {
      await expect(service.listarMovimentacoesPorProduto('x')).rejects.toMatchObject({ status: 400 });
    });

    it('lista movimentações', async () => {
      movRepo.findByProduto.mockResolvedValue([{ id: 1 }]);
      expect(await service.listarMovimentacoesPorProduto(1)).toMatchObject({ total: 1 });
    });
  });

  describe('registrarEntrada', () => {
    it('exige funcionário e quantidade positiva, sem abrir conexão', async () => {
      await expect(service.registrarEntrada({ quantidade: 5 }, undefined)).rejects.toMatchObject({ status: 400 });
      await expect(service.registrarEntrada({ quantidade: 0 }, 1)).rejects.toMatchObject({ status: 400 });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    it('cria lote e movimentação na mesma transação e faz commit', async () => {
      estoqueService.criarLote.mockResolvedValue({ id: 11 });
      movRepo.create.mockResolvedValue(22);
      const r = await service.registrarEntrada({ id_produto: 1, quantidade: 10, observacao: 'nota' }, 3);

      expect(estoqueService.criarLote).toHaveBeenCalledWith(expect.objectContaining({ id_produto: 1, quantidade: 10 }), mockConn);
      expect(movRepo.create).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'ENTRADA', id_estoque: 11, id_funcionario: 3 }), mockConn);
      expect(mockConn.commit).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
      expect(r).toMatchObject({ id_movimentacao: 22, id_estoque: 11 });
    });

    it('faz rollback e libera a conexão se algo falhar', async () => {
      estoqueService.criarLote.mockRejectedValue({ status: 404, mensagem: 'Produto não encontrado' });
      await expect(service.registrarEntrada({ id_produto: 1, quantidade: 10 }, 3)).rejects.toMatchObject({ status: 404 });
      expect(mockConn.rollback).toHaveBeenCalled();
      expect(mockConn.commit).not.toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
    });
  });

  describe('registrarSaida', () => {
    it('valida os dados de entrada', async () => {
      await expect(service.registrarSaida({ quantidade: 1 }, 1)).rejects.toMatchObject({ mensagem: 'Produto é obrigatório' });
      await expect(service.registrarSaida({ id_produto: 1, quantidade: -1 }, 1)).rejects.toMatchObject({ status: 400 });
      await expect(service.registrarSaida({ id_produto: 1, quantidade: 1 }, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('recusa saída maior que o saldo e faz rollback', async () => {
      estoqueRepo.findByProdutoOrdenadoPorValidade.mockResolvedValue([{ id_estoque: 1, quantidade: 3 }]);
      await expect(service.registrarSaida({ id_produto: 1, quantidade: 5 }, 1)).rejects.toMatchObject({ status: 400, mensagem: 'Saldo insuficiente. Disponível: 3' });
      expect(mockConn.rollback).toHaveBeenCalled();
      expect(estoqueRepo.update).not.toHaveBeenCalled();
    });

    it('consome primeiro o lote que vence antes e passa para o próximo', async () => {
      estoqueRepo.findByProdutoOrdenadoPorValidade.mockResolvedValue([
        { id_estoque: 1, quantidade: 4 },
        { id_estoque: 2, quantidade: 10 },
      ]);
      movRepo.create.mockResolvedValueOnce(100).mockResolvedValueOnce(101);

      const r = await service.registrarSaida({ id_produto: 1, quantidade: 6 }, 9);

      expect(estoqueRepo.update).toHaveBeenNthCalledWith(1, 1, { quantidade: 0 }, mockConn);
      expect(estoqueRepo.update).toHaveBeenNthCalledWith(2, 2, { quantidade: 8 }, mockConn);
      expect(r.movimentacoes).toEqual([
        { id_movimentacao: 100, id_estoque: 1, quantidade: 4 },
        { id_movimentacao: 101, id_estoque: 2, quantidade: 2 },
      ]);
      expect(mockConn.commit).toHaveBeenCalled();
    });

    it('ignora lotes zerados', async () => {
      estoqueRepo.findByProdutoOrdenadoPorValidade.mockResolvedValue([
        { id_estoque: 1, quantidade: 0 },
        { id_estoque: 2, quantidade: 5 },
      ]);
      movRepo.create.mockResolvedValue(1);
      const r = await service.registrarSaida({ id_produto: 1, quantidade: 2 }, 1);
      expect(r.movimentacoes).toHaveLength(1);
      expect(r.movimentacoes[0].id_estoque).toBe(2);
    });
  });

  describe('registrarDevolucao', () => {
    const dados = { id_estoque: 1, quantidade: 2, motivo_devolucao: 'Produto estragado' };

    it('valida os dados de entrada', async () => {
      await expect(service.registrarDevolucao({ ...dados, id_estoque: undefined }, 1)).rejects.toMatchObject({ status: 400 });
      await expect(service.registrarDevolucao({ ...dados, quantidade: 0 }, 1)).rejects.toMatchObject({ status: 400 });
      await expect(service.registrarDevolucao({ ...dados, motivo_devolucao: '' }, 1)).rejects.toMatchObject({ status: 400 });
      await expect(service.registrarDevolucao(dados, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita lote inexistente com rollback', async () => {
      estoqueRepo.findByIdParaAtualizar.mockResolvedValue(undefined);
      await expect(service.registrarDevolucao(dados, 1)).rejects.toMatchObject({ status: 404 });
      expect(mockConn.rollback).toHaveBeenCalled();
    });

    it('soma a quantidade devolvida ao lote', async () => {
      estoqueRepo.findByIdParaAtualizar.mockResolvedValue({ id_estoque: 1, quantidade: 5 });
      movRepo.create.mockResolvedValue(33);
      const r = await service.registrarDevolucao(dados, 1);
      expect(estoqueRepo.update).toHaveBeenCalledWith(1, { quantidade: 7 }, mockConn);
      expect(movRepo.create).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'DEVOLUCAO', motivo_devolucao: 'Produto estragado' }), mockConn);
      expect(r.id_movimentacao).toBe(33);
    });
  });
});
