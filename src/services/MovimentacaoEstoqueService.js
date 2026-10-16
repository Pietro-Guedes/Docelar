const MovimentacaoEstoqueRepository = require('../repositories/MovimentacaoEstoqueRepository');
const EstoqueRepository = require('../repositories/EstoqueRepository');
const EstoqueService = require('./EstoqueService');
const pool = require('../config/database');

class MovimentacaoEstoqueService {
    async listarMovimentacoesPorProduto(id_produto) {
        if (!id_produto || isNaN(id_produto)) throw { status: 400, mensagem: "ID de produto inválido" };
        const movimentacoes = await MovimentacaoEstoqueRepository.findByProduto(id_produto);
        return { sucesso: true, dados: movimentacoes, total: movimentacoes.length };
    }

    async registrarEntrada(dados, id_funcionario) {
        const { id_produto, id_fornecedor, quantidade, valor_unitario, validade, observacao } = dados;

        if (!id_funcionario || isNaN(id_funcionario)) {
            throw { status: 400, mensagem: "Funcionário é obrigatório" };
        }
        if (typeof quantidade !== "number" || quantidade <= 0) {
            throw { status: 400, mensagem: "Quantidade deve ser um número positivo" };
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id: id_estoque } = await EstoqueService.criarLote(
                { id_produto, id_fornecedor, quantidade, validade },
                conn
            );

            const id_movimentacao = await MovimentacaoEstoqueRepository.create({
                tipo: 'ENTRADA',
                quantidade,
                valor_unitario: valor_unitario || null,
                motivo_devolucao: null,
                observacao: observacao || null,
                id_estoque,
                id_funcionario
            }, conn);

            await conn.commit();
            return { sucesso: true, mensagem: "Entrada registrada com sucesso", id_movimentacao, id_estoque };
        } catch (erro) {
            await conn.rollback();
            throw erro;
        } finally {
            conn.release();
        }
    }

    async registrarSaida(dados, id_funcionario) {
        const { id_produto, quantidade, observacao, id_entregador } = dados;

        if (!id_produto || isNaN(id_produto)) throw { status: 400, mensagem: "Produto é obrigatório" };
        if (typeof quantidade !== "number" || quantidade <= 0) {
            throw { status: 400, mensagem: "Quantidade deve ser um número positivo" };
        }
        if (!id_funcionario || isNaN(id_funcionario)) {
            throw { status: 400, mensagem: "Funcionário é obrigatório" };
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const lotes = await EstoqueRepository.findByProdutoOrdenadoPorValidade(id_produto, conn, true);
            const saldoTotal = lotes.reduce((soma, lote) => soma + Number(lote.quantidade), 0);

            if (saldoTotal < quantidade) {
                throw { status: 400, mensagem: `Saldo insuficiente. Disponível: ${saldoTotal}` };
            }

            let restante = quantidade;
            const movimentacoesGeradas = [];

            for (const lote of lotes) {
                if (restante <= 0) break;
                const saldoLote = Number(lote.quantidade);
                if (saldoLote <= 0) continue;

                const consumida = Math.min(saldoLote, restante);

                await EstoqueRepository.update(lote.id_estoque, { quantidade: saldoLote - consumida }, conn);

                const id_movimentacao = await MovimentacaoEstoqueRepository.create({
                    tipo: 'SAIDA',
                    quantidade: consumida,
                    valor_unitario: null,
                    motivo_devolucao: null,
                    observacao: observacao || null,
                    id_estoque: lote.id_estoque,
                    id_funcionario,
                    id_entregador: id_entregador || null
                }, conn);

                movimentacoesGeradas.push({ id_movimentacao, id_estoque: lote.id_estoque, quantidade: consumida });
                restante -= consumida;
            }

            await conn.commit();
            return { sucesso: true, mensagem: "Saída registrada com sucesso", movimentacoes: movimentacoesGeradas };
        } catch (erro) {
            await conn.rollback();
            throw erro;
        } finally {
            conn.release();
        }
    }

    async registrarDevolucao(dados, id_funcionario) {
        const { id_estoque, quantidade, motivo_devolucao, observacao } = dados;

        if (!id_estoque || isNaN(id_estoque)) throw { status: 400, mensagem: "Lote é obrigatório" };
        if (typeof quantidade !== "number" || quantidade <= 0) {
            throw { status: 400, mensagem: "Quantidade deve ser um número positivo" };
        }
        if (!motivo_devolucao) throw { status: 400, mensagem: "Motivo da devolução é obrigatório" };
        if (!id_funcionario || isNaN(id_funcionario)) {
            throw { status: 400, mensagem: "Funcionário é obrigatório" };
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const lote = await EstoqueRepository.findByIdParaAtualizar(id_estoque, conn);
            if (!lote) throw { status: 404, mensagem: "Lote não encontrado" };

            await EstoqueRepository.update(id_estoque, { quantidade: Number(lote.quantidade) + quantidade }, conn);

            const id_movimentacao = await MovimentacaoEstoqueRepository.create({
                tipo: 'DEVOLUCAO',
                quantidade,
                valor_unitario: null,
                motivo_devolucao,
                observacao: observacao || null,
                id_estoque,
                id_funcionario
            }, conn);

            await conn.commit();
            return { sucesso: true, mensagem: "Devolução registrada com sucesso", id_movimentacao };
        } catch (erro) {
            await conn.rollback();
            throw erro;
        } finally {
            conn.release();
        }
    }
}

module.exports = new MovimentacaoEstoqueService();
