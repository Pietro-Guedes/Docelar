const MovimentacaoEstoqueService = require('../services/MovimentacaoEstoqueService');

class MovimentacaoEstoqueController {
    async listarPorProduto(req, res) {
        try {
            const resultado = await MovimentacaoEstoqueService.listarMovimentacoesPorProduto(req.params.id_produto);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async entrada(req, res) {
        try {
            const id_funcionario = req.usuario.id;
            const resultado = await MovimentacaoEstoqueService.registrarEntrada(req.body, id_funcionario);
            res.status(201).json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async saida(req, res) {
        try {
            const id_funcionario = req.usuario.id;
            const resultado = await MovimentacaoEstoqueService.registrarSaida(req.body, id_funcionario);
            res.status(201).json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async devolucao(req, res) {
        try {
            const id_funcionario = req.usuario.id;
            const resultado = await MovimentacaoEstoqueService.registrarDevolucao(req.body, id_funcionario);
            res.status(201).json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }
}

module.exports = new MovimentacaoEstoqueController();