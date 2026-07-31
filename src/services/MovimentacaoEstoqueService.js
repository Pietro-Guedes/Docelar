const MovimentacaoEstoqueRepository = require('../repositories/MovimentacaoEstoqueRepository');
const EstoqueRepository = require('../repositories/EstoqueRepository');
const EstoqueService = require('./EstoqueService');

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

        const { id_estoque } = await EstoqueService.criarLote({ id_produto, id_fornecedor, quantidade, validade });

        const id_movimentacao = await MovimentacaoRepository.create({
            tipo: 'ENTRADA',
            quantidade,
            valor_unitario: valor_unitario || null,
            motivo_devolucao: null,
            observacao: observacao || null,
            id_estoque,
            id_funcionario
        });

        return { sucesso: true, mensagem: "Entrada registrada com sucesso", id_movimentacao, id_estoque };
    }

    // SAIDA: distribui a quantidade entre lotes existentes, do que vence primeiro pro que vence por último (FEFO)
    async registrarSaida(dados, id_funcionario) {
        const { id_produto, quantidade, observacao } = dados;

        if (!id_produto || isNaN(id_produto)) throw { status: 400, mensagem: "Produto é obrigatório" };
        if (typeof quantidade !== "number" || quantidade <= 0) {
            throw { status: 400, mensagem: "Quantidade deve ser um número positivo" };
        }
        if (!id_funcionario || isNaN(id_funcionario)) {
            throw { status: 400, mensagem: "Funcionário é obrigatório" };
        }

        const lotes = await EstoqueRepository.findByProdutoOrdenadoPorValidade(id_produto);
        const saldoTotal = lotes.reduce((soma, lote) => soma + lote.quantidade, 0);

        if (saldoTotal < quantidade) {
            throw { status: 400, mensagem: `Saldo insuficiente. Disponível: ${saldoTotal}` };
        }

        let restante = quantidade;
        const movimentacoesGeradas = [];

        for (const lote of lotes) {
            if (restante <= 0) break;
            if (lote.quantidade <= 0) continue;

            const consumida = Math.min(lote.quantidade, restante);

            const id_movimentacao = await MovimentacaoEstoqueRepository.create({
                tipo: 'SAIDA',
                quantidade: consumida,
                valor_unitario: null,
                motivo_devolucao: null,
                observacao: observacao || null,
                id_estoque: lote.id_estoque,
                id_funcionario
            });

            movimentacoesGeradas.push({ id_movimentacao, id_estoque: lote.id_estoque, quantidade: consumida });
            restante -= consumida;
        }

        return { sucesso: true, mensagem: "Saída registrada com sucesso", movimentacoes: movimentacoesGeradas };
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