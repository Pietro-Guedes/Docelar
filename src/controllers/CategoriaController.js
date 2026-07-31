const CategoriaService = require('../services/CategoriaService');

class CategoriaController {
    async listar(req, res) {
        try {
            const resultado = await CategoriaService.listarCategoria();
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async buscarPorId(req, res) {
        try {
            const resultado = await CategoriaService.buscarCategoriaPorId(req.params.id);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async cadastrar(req, res) {
        try {
            const resultado = await CategoriaService.cadastrarCategoria(req.body);
            res.status(201).json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async atualizar(req, res) {
        try {
            const resultado = await CategoriaService.atualizarCategoria(req.params.id, req.body);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async deletar(req, res) {
        try {
            const resultado = await CategoriaService.deletarCategoria(req.params.id);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }
}

module.exports = new CategoriaController();
