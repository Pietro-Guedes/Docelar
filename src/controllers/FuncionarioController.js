const FuncionarioService = require('../services/FuncionarioService');

class FuncionarioController {
    async listar(req, res) {
        try {
            const resultado = await FuncionarioService.listarFuncionarios();
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async buscarPorId(req, res) {
        try {
            const resultado = await FuncionarioService.buscarFuncionarioPorId(req.params.id);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async cadastrar(req, res) {
        try {
            const resultado = await FuncionarioService.cadastrarFuncionario(req.body);
            res.status(201).json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async atualizar(req, res) {
        try {
            const resultado = await FuncionarioService.atualizarFuncionario(req.params.id, req.body);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async deletar(req, res) {
        try {
            const resultado = await FuncionarioService.deletarFuncionario(req.params.id);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async login(req, res) {
        try {
            const {email, senha} =req.body

            const resultado = await FuncionarioService.login(email, senha)

            return res.json(resultado)
        } catch (erro) {
            return res.status(erro.status || 500).json({
                sucesso: false,
                mensagem: erro.mensagem || "Erro interno do servidor"
            })
        }
    }
}

module.exports = new FuncionarioController();
