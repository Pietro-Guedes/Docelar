const CadastroFornecedoresService = require("../services/CadastroFornecedoresService");

class CadastroFornecedoresController {
  async listar(req, res) {
    try {
      const resultado =
        await CadastroFornecedoresService.listarCadastroFornecedores();
      res.json(resultado);
    } catch (erro) {
      console.error(erro);
      res
        .status(erro.status || 500)
        .json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
    }
  }

  async buscarPorId(req, res) {
    try {
      const resultado =
        await CadastroFornecedoresService.buscarCadastroFornecedoresPorId(
          req.params.id,
        );
      res.json(resultado);
    } catch (erro) {
      console.error(erro);
      res
        .status(erro.status || 500)
        .json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
    }
  }

  async cadastrar(req, res) {
    try {
      const resultado =
        await CadastroFornecedoresService.cadastrarCadastroFornecedores(
          req.body,
        );
      res.status(201).json(resultado);
    } catch (erro) {
      console.error(erro);
      res
        .status(erro.status || 500)
        .json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
    }
  }

  async atualizar(req, res) {
    try {
      const resultado =
        await CadastroFornecedoresService.atualizarCadastroFornecedores(
          req.params.id,
          req.body,
        );
      res.json(resultado);
    } catch (erro) {
      console.error(erro);
      res
        .status(erro.status || 500)
        .json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
    }
  }

  async deletar(req, res) {
    try {
      const resultado =
        await CadastroFornecedoresService.deletarCadastroFornecedores(
          req.params.id,
        );
      res.json(resultado);
    } catch (erro) {
      console.error(erro);
      res
        .status(erro.status || 500)
        .json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
    }
  }
}

module.exports = new CadastroFornecedoresController();
