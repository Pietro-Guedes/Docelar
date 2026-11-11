const mockConn = {
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

jest.mock('../../src/config/database', () => ({ getConnection: jest.fn() }));
jest.mock('../../src/repositories/MovimentacaoEstoqueRepository', () => ({
  findByProduto: jest.fn(),
  findById: jest.fn(),
  findByIdParaAtualizar: jest.fn(),
  findByGrupoTroca: jest.fn(),
  findEstorno: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/repositories/EstoqueRepository', () => ({
  findByProdutoOrdenadoPorValidade: jest.fn(),
  findByIdParaAtualizar: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../../src/services/EstoqueService', () => ({ criarLote: jest.fn() }));
jest.mock('../../src/repositories/ProdutoRepository', () => ({ findById: jest.fn() }));

const pool = require('../../src/config/database');
const movRepo = require('../../src/repositories/MovimentacaoEstoqueRepository');
const estoqueRepo = require('../../src/repositories/EstoqueRepository');
const estoqueService = require('../../src/services/EstoqueService');
const produtoRepo = require('../../src/repositories/ProdutoRepository');
const service = require('../../src/services/MovimentacaoEstoqueService');

beforeEach(() => {
  pool.getConnection.mockResolvedValue(mockConn);
  produtoRepo.findById.mockResolvedValue({ id_produto: 1, ativo: 1 });
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

    it('bloqueia saída de produto desativado', async () => {
      produtoRepo.findById.mockResolvedValue({ id_produto: 1, ativo: 0 });
      await expect(service.registrarSaida({ id_produto: 1, quantidade: 1 }, 3)).rejects.toMatchObject({ status: 409 });
      expect(pool.getConnection).not.toHaveBeenCalled();
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

    describe('registrarTroca', () => {
      it('registra a troca em uma transação e recusa estoque insuficiente', async () => {
        estoqueRepo.findByIdParaAtualizar.mockResolvedValue({ id_estoque: 5, quantidade: 2 });
        estoqueRepo.findByProdutoOrdenadoPorValidade.mockResolvedValue([{ id_estoque: 8, quantidade: 4 }]);
        movRepo.create.mockResolvedValueOnce(51).mockResolvedValueOnce(52);

        const resultado = await service.registrarTroca({
          id_estoque_retorno: 5,
          id_produto_saida: 1,
          quantidade_retorno: 1,
          quantidade_saida: 2,
          observacao: 'Protocolo #2026-1000 · TROCA',
        }, 3);

        expect(estoqueRepo.update).toHaveBeenCalledWith(8, { quantidade: 2 }, mockConn);
        expect(estoqueRepo.update).toHaveBeenCalledWith(5, { quantidade: 3 }, mockConn);
        expect(mockConn.commit).toHaveBeenCalled();
        expect(resultado.movimentacoes).toEqual([51, 52]);
      });

      it('faz rollback quando falta estoque de reposição', async () => {
        estoqueRepo.findByIdParaAtualizar.mockResolvedValue({ id_estoque: 5, quantidade: 2 });
        estoqueRepo.findByProdutoOrdenadoPorValidade.mockResolvedValue([{ id_estoque: 8, quantidade: 1 }]);
        await expect(service.registrarTroca({
          id_estoque_retorno: 5, id_produto_saida: 1, quantidade_retorno: 1, quantidade_saida: 2,
        }, 3)).rejects.toMatchObject({ status: 400 });
        expect(estoqueRepo.update).not.toHaveBeenCalled();
        expect(mockConn.rollback).toHaveBeenCalled();
      });
    });

    describe('registrarSaidaLoteVencido', () => {
      it('registra baixa somente para lote vencido e dentro do saldo', async () => {
        estoqueRepo.findByIdParaAtualizar.mockResolvedValue({
          id_estoque: 5, quantidade: 4, validade: '2020-01-01', id_fornecedor: 7,
        });
        movRepo.create.mockResolvedValue(71);
        const resultado = await service.registrarSaidaLoteVencido({
          id_estoque: 5, quantidade: 2, tipo: 'DEVOLUCAO_FORNECEDOR', id_fornecedor: 7,
        }, 3);
        expect(estoqueRepo.update).toHaveBeenCalledWith(5, { quantidade: 2 }, mockConn);
        expect(movRepo.create).toHaveBeenCalledWith(expect.objectContaining({
          tipo: 'SAIDA', motivo_devolucao: 'DEVOLUCAO_FORNECEDOR',
        }), mockConn);
        expect(resultado.id_movimentacao).toBe(71);
      });
    });

    describe('estornarMovimentacao', () => {
      it('recusa saldo insuficiente e não confirma o estorno', async () => {
        movRepo.findById.mockResolvedValue({ id_movimentacao: 1, tipo: 'DEVOLUCAO', id_estoque: 5, quantidade: 3, observacao: '' });
        movRepo.findByIdParaAtualizar.mockResolvedValue({ id_movimentacao: 1, tipo: 'DEVOLUCAO', id_estoque: 5, quantidade: 3, observacao: '' });
        movRepo.findEstorno.mockResolvedValue(undefined);
        estoqueRepo.findByIdParaAtualizar.mockResolvedValue({ id_estoque: 5, quantidade: 2 });
        await expect(service.estornarMovimentacao(1, 3)).rejects.toMatchObject({ status: 409 });
        expect(mockConn.rollback).toHaveBeenCalled();
        expect(mockConn.commit).not.toHaveBeenCalled();
      });

      it('estorna juntos os dois lados de uma troca', async () => {
        const grupo = 'GRUPO_TROCA:bb5bda2a-90b0-4bdb-9890-8aa61c000001';
        const movimentos = [
          { id_movimentacao: 1, tipo: 'SAIDA', id_estoque: 8, quantidade: 2, observacao: grupo },
          { id_movimentacao: 2, tipo: 'DEVOLUCAO', id_estoque: 5, quantidade: 1, observacao: grupo },
        ];
        movRepo.findById.mockResolvedValue(movimentos[1]);
        movRepo.findByGrupoTroca.mockResolvedValue(movimentos);
        movRepo.findEstorno.mockResolvedValue(undefined);
        estoqueRepo.findByIdParaAtualizar
          .mockResolvedValueOnce({ id_estoque: 8, quantidade: 0 })
          .mockResolvedValueOnce({ id_estoque: 5, quantidade: 3 });
        movRepo.create.mockResolvedValueOnce(81).mockResolvedValueOnce(82);

        const resultado = await service.estornarMovimentacao(2, 3);

        expect(estoqueRepo.update).toHaveBeenNthCalledWith(1, 8, { quantidade: 2 }, mockConn);
        expect(estoqueRepo.update).toHaveBeenNthCalledWith(2, 5, { quantidade: 2 }, mockConn);
        expect(resultado.estornos).toEqual([81, 82]);
        expect(mockConn.commit).toHaveBeenCalled();
      });
    });
  });
});
