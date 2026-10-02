const EstoqueService = require("../services/EstoqueService");

class EstoqueController {
  async listar(req, res) {
    try {
      const resultado = await EstoqueService.listarEstoque();
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
      const resultado = await EstoqueService.buscarEstoquePorId(req.params.id);
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
      const resultado = await EstoqueService.cadastrarEstoque(req.body);
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
      const resultado = await EstoqueService.atualizarEstoque(
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
      const resultado = await EstoqueService.deletarEstoque(req.params.id);
      res.json(resultado);
    } catch (erro) {
      console.error(erro);
      res
        .status(erro.status || 500)
        .json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
    }
  }

  async listarVencidos(req, res) {
    try {
      const resultado = await EstoqueService.listarVencidos();
      res.json(resultado);
    } catch (erro) {
      console.error(erro);
      res
        .status(erro.status || 500)
        .json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
    }
  }

  // GET /estoque/proximos-vencimento?dias=7
  async listarProximosVencimento(req, res) {
    try {
      const dias = req.query.dias !== undefined ? Number(req.query.dias) : 7;
      const resultado = await EstoqueService.listarProximosVencimento(dias);
      res.json(resultado);
    } catch (erro) {
      console.error(erro);
      res
        .status(erro.status || 500)
        .json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
    }
  }
}

module.exports = new EstoqueController();
