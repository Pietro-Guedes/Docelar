const MovimentacaoEstoqueRepository = require('../repositories/MovimentacaoEstoqueRepository');
const EstoqueRepository = require('../repositories/EstoqueRepository');
const EstoqueService = require('./EstoqueService');
const ProdutoRepository = require('../repositories/ProdutoRepository');
const { diasParaVencer } = require('../utils/validade');
const { randomUUID } = require('crypto');
const pool = require('../config/database');

class MovimentacaoEstoqueService {
    async exigirProdutoAtivo(id_produto) {
        const produto = await ProdutoRepository.findById(id_produto);
        if (!produto) throw { status: 404, mensagem: "Produto não encontrado" };
        if (Number(produto.ativo) === 0) throw { status: 409, mensagem: "Produto desativado. Reative-o antes de movimentar o estoque." };
        return produto;
    }

    async listarMovimentacoesPorProduto(id_produto) {
        if (!id_produto || isNaN(id_produto)) throw { status: 400, mensagem: "ID de produto inválido" };
        const movimentacoes = await MovimentacaoEstoqueRepository.findByProduto(id_produto);
        return { sucesso: true, dados: movimentacoes, total: movimentacoes.length };
    }

    async registrarEntrada(dados, id_funcionario) {
        const { id_produto, id_fornecedor, quantidade, valor_unitario, validade, observacao } = dados;

        if (!id_produto || isNaN(id_produto)) throw { status: 400, mensagem: "Produto é obrigatório" };
        await this.exigirProdutoAtivo(id_produto);
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
        await this.exigirProdutoAtivo(id_produto);
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

        async registrarTroca(dados, id_funcionario) {
            const { id_estoque_retorno, id_produto_saida, quantidade_retorno, quantidade_saida, observacao } = dados;
            if (!id_estoque_retorno || isNaN(id_estoque_retorno)) throw { status: 400, mensagem: "Lote devolvido é obrigatório" };
            if (!id_produto_saida || isNaN(id_produto_saida)) throw { status: 400, mensagem: "Produto de reposição é obrigatório" };
            if (typeof quantidade_retorno !== "number" || quantidade_retorno <= 0 ||
                typeof quantidade_saida !== "number" || quantidade_saida <= 0) {
                throw { status: 400, mensagem: "As quantidades da troca devem ser números positivos" };
            }
            if (!id_funcionario || isNaN(id_funcionario)) throw { status: 400, mensagem: "Funcionário é obrigatório" };
            await this.exigirProdutoAtivo(id_produto_saida);

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                const observacaoTroca = [`GRUPO_TROCA:${randomUUID()}`, observacao].filter(Boolean).join(' · ');

                const loteRetorno = await EstoqueRepository.findByIdParaAtualizar(id_estoque_retorno, conn);
                if (!loteRetorno) throw { status: 404, mensagem: "Lote devolvido não encontrado" };

                const lotesSaida = await EstoqueRepository.findByProdutoOrdenadoPorValidade(id_produto_saida, conn, true);
                const saldoTotal = lotesSaida.reduce((soma, lote) => soma + Number(lote.quantidade), 0);
                if (saldoTotal < quantidade_saida) {
                    throw { status: 400, mensagem: `Saldo insuficiente para o produto de reposição. Disponível: ${saldoTotal}` };
                }

                let restante = quantidade_saida;
                const movimentacoes = [];
                for (const lote of lotesSaida) {
                    if (restante <= 0) break;
                    const consumida = Math.min(Number(lote.quantidade), restante);
                    if (consumida <= 0) continue;

                    await EstoqueRepository.update(lote.id_estoque, { quantidade: Number(lote.quantidade) - consumida }, conn);
                    const id_movimentacao = await MovimentacaoEstoqueRepository.create({
                        tipo: 'SAIDA',
                        quantidade: consumida,
                        valor_unitario: null,
                        motivo_devolucao: null,
                        observacao: observacaoTroca,
                        id_estoque: lote.id_estoque,
                        id_funcionario
                    }, conn);
                    movimentacoes.push(id_movimentacao);
                    restante -= consumida;
                }

                await EstoqueRepository.update(id_estoque_retorno, { quantidade: Number(loteRetorno.quantidade) + quantidade_retorno }, conn);
                const id_devolucao = await MovimentacaoEstoqueRepository.create({
                    tipo: 'DEVOLUCAO',
                    quantidade: quantidade_retorno,
                    valor_unitario: null,
                    motivo_devolucao: 'Troca de produto',
                    observacao: observacaoTroca,
                    id_estoque: id_estoque_retorno,
                    id_funcionario
                }, conn);
                movimentacoes.push(id_devolucao);

                await conn.commit();
                return { sucesso: true, mensagem: "Troca registrada com sucesso", movimentacoes };
            } catch (erro) {
                await conn.rollback();
                throw erro;
            } finally {
                conn.release();
            }
        }

        async registrarSaidaLoteVencido(dados, id_funcionario) {
            const { id_estoque, quantidade, tipo, id_fornecedor, observacao } = dados;
            if (!id_estoque || isNaN(id_estoque)) throw { status: 400, mensagem: "Lote é obrigatório" };
            if (typeof quantidade !== "number" || quantidade <= 0) throw { status: 400, mensagem: "Quantidade deve ser um número positivo" };
            if (!['DEVOLUCAO_FORNECEDOR', 'BAIXA_VENCIMENTO'].includes(tipo)) {
                throw { status: 400, mensagem: "Escolha devolução ao fornecedor ou baixa por vencimento" };
            }
            if (!id_funcionario || isNaN(id_funcionario)) throw { status: 400, mensagem: "Funcionário é obrigatório" };

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                const lote = await EstoqueRepository.findByIdParaAtualizar(id_estoque, conn);
                if (!lote) throw { status: 404, mensagem: "Lote não encontrado" };
                if (diasParaVencer(lote.validade) === null || diasParaVencer(lote.validade) >= 0) {
                    throw { status: 400, mensagem: "Apenas lotes vencidos podem ser devolvidos ou baixados por esta ação" };
                }
                if (Number(lote.quantidade) < quantidade) {
                    throw { status: 400, mensagem: `Quantidade maior que o saldo do lote. Disponível: ${Number(lote.quantidade)}` };
                }
                if (tipo === 'DEVOLUCAO_FORNECEDOR' &&
                    (!lote.id_fornecedor || Number(id_fornecedor) !== Number(lote.id_fornecedor))) {
                    throw { status: 400, mensagem: "A devolução deve ser vinculada ao fornecedor de origem do lote" };
                }

                await EstoqueRepository.update(id_estoque, { quantidade: Number(lote.quantidade) - quantidade }, conn);
                const id_movimentacao = await MovimentacaoEstoqueRepository.create({
                    tipo: 'SAIDA',
                    quantidade,
                    valor_unitario: null,
                    motivo_devolucao: tipo,
                    observacao: observacao || null,
                    id_estoque,
                    id_funcionario
                }, conn);

                await conn.commit();
                return { sucesso: true, mensagem: "Movimentação de lote vencido registrada", id_movimentacao };
            } catch (erro) {
                await conn.rollback();
                throw erro;
            } finally {
                conn.release();
            }
        }

        async estornarMovimentacao(id, id_funcionario) {
            if (!id || isNaN(id)) throw { status: 400, mensagem: "ID de movimentação inválido" };
            if (!id_funcionario || isNaN(id_funcionario)) throw { status: 400, mensagem: "Funcionário é obrigatório" };

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                const inicial = await MovimentacaoEstoqueRepository.findById(id, conn);
                if (!inicial) throw { status: 404, mensagem: "Movimentação não encontrada" };

                const grupoTroca = inicial.observacao?.match(/GRUPO_TROCA:([0-9a-f-]+)/i)?.[1];
                const originais = grupoTroca
                    ? await MovimentacaoEstoqueRepository.findByGrupoTroca(grupoTroca, conn)
                    : [await MovimentacaoEstoqueRepository.findByIdParaAtualizar(id, conn)];
                if (originais.some((m) => !m || String(m.observacao || '').startsWith('ESTORNO_MOVIMENTACAO:'))) {
                    throw { status: 400, mensagem: "Esta movimentação não pode ser estornada" };
                }
                if (grupoTroca && !originais.some((m) => Number(m.id_movimentacao) === Number(id))) {
                    throw { status: 409, mensagem: "Não foi possível localizar todas as movimentações da troca" };
                }

                for (const original of originais) {
                    if (!['ENTRADA', 'SAIDA', 'DEVOLUCAO'].includes(original.tipo)) {
                        throw { status: 400, mensagem: "Tipo de movimentação não pode ser estornado" };
                    }
                    if (await MovimentacaoEstoqueRepository.findEstorno(original.id_movimentacao, conn)) {
                        throw { status: 409, mensagem: "Esta movimentação já foi estornada" };
                    }
                }

                const estornos = [];
                for (const original of originais) {
                    const lote = await EstoqueRepository.findByIdParaAtualizar(original.id_estoque, conn);
                    if (!lote) throw { status: 404, mensagem: "Lote vinculado à movimentação não encontrado" };
                    const quantidade = Number(original.quantidade);
                    const saiDoEstoque = original.tipo === 'ENTRADA' || original.tipo === 'DEVOLUCAO';
                    if (saiDoEstoque && Number(lote.quantidade) < quantidade) {
                        throw { status: 409, mensagem: `Saldo insuficiente no lote para estornar a movimentação #${original.id_movimentacao}` };
                    }
                    await EstoqueRepository.update(original.id_estoque, {
                        quantidade: Number(lote.quantidade) + (saiDoEstoque ? -quantidade : quantidade)
                    }, conn);
                    estornos.push(await MovimentacaoEstoqueRepository.create({
                        tipo: saiDoEstoque ? 'SAIDA' : 'ENTRADA',
                        quantidade,
                        valor_unitario: original.valor_unitario,
                        motivo_devolucao: null,
                        observacao: `ESTORNO_MOVIMENTACAO:${original.id_movimentacao} · Estorno da movimentação #${original.id_movimentacao}`,
                        id_estoque: original.id_estoque,
                        id_funcionario
                    }, conn));
                }

                await conn.commit();
                return { sucesso: true, mensagem: "Movimentação estornada com sucesso", estornos };
            } catch (erro) {
                await conn.rollback();
                throw erro;
            } finally {
                conn.release();
            }
        }
    }

module.exports = new MovimentacaoEstoqueService();
