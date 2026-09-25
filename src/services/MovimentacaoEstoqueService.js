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

    // ENTRADA: cria lote novo + registra a movimentação
    async registrarEntrada(dados, id_funcionario) {
        const { id_produto, id_fornecedor, quantidade, valor_unitario, validade, observacao } = dados;

        if (!id_funcionario || isNaN(id_funcionario)) {
            throw { status: 400, mensagem: "Funcionário é obrigatório" };
        }
        if (typeof quantidade !== "number" || quantidade <= 0) {
            throw { status: 400, mensagem: "Quantidade deve ser um número positivo" };
        }

<<<<<<< HEAD
        const { id: id_estoque } = await EstoqueService.criarLote({ id_produto, id_fornecedor, quantidade, validade });
=======
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
>>>>>>> 2db61e85edae4a35697288d96896dda5c407764a

            // Observação: cadastrarEstoque devolve o id do lote no campo "id" (não "id_estoque").
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

    // SAIDA: distribui a quantidade entre lotes existentes, do que vence primeiro pro que vence por último (FEFO)
<<<<<<< HEAD
=======
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

            // Observação: cadastrarEstoque devolve o id do lote no campo "id" (não "id_estoque").
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

    // SAIDA: distribui a quantidade entre lotes existentes (FEFO) e atualiza o saldo de cada lote
>>>>>>> 886fe01206c63985fdc0cf66ebf230f4a0176173
    async registrarSaida(dados, id_funcionario) {
        const { id_produto, quantidade, observacao } = dados;

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

            // lock=true -> SELECT ... FOR UPDATE: trava os lotes lidos até o commit/rollback,
            // impedindo que duas saídas concorrentes consumam o mesmo saldo (overselling).
            const lotes = await EstoqueRepository.findByProdutoOrdenadoPorValidade(id_produto, conn, true);
            const saldoTotal = lotes.reduce((soma, lote) => soma + lote.quantidade, 0);

            if (saldoTotal < quantidade) {
                throw { status: 400, mensagem: `Saldo insuficiente. Disponível: ${saldoTotal}` };
            }

            let restante = quantidade;
            const movimentacoesGeradas = [];

<<<<<<< HEAD
            const consumida = Math.min(lote.quantidade, restante);

=======
            for (const lote of lotes) {
                if (restante <= 0) break;
                if (lote.quantidade <= 0) continue;

                const consumida = Math.min(lote.quantidade, restante);

                // Baixa a quantidade do lote. Sem isso o saldo nunca diminuía de fato.
                await EstoqueRepository.update(lote.id_estoque, { quantidade: lote.quantidade - consumida }, conn);

                // 2. Registra a movimentação de saída
>>>>>>> 886fe01206c63985fdc0cf66ebf230f4a0176173
            const id_movimentacao = await MovimentacaoEstoqueRepository.create({
                    tipo: 'SAIDA',
                    quantidade: consumida,
                    valor_unitario: null,
                    motivo_devolucao: null,
                    observacao: observacao || null,
                    id_estoque: lote.id_estoque,
                    id_funcionario
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

    // DEVOLUCAO: sempre referente a um lote específico (o cliente devolveu algo que saiu de um lote conhecido)
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

        const lote = await EstoqueRepository.findById(id_estoque);
        if (!lote) throw { status: 404, mensagem: "Lote não encontrado" };

        const id_movimentacao = await MovimentacaoEstoqueRepository.create({
            tipo: 'DEVOLUCAO',
            quantidade,
            valor_unitario: null,
            motivo_devolucao,
            observacao: observacao || null,
            id_estoque,
            id_funcionario
        });

        return { sucesso: true, mensagem: "Devolução registrada com sucesso", id_movimentacao };
    }
}

module.exports = new MovimentacaoEstoqueService();