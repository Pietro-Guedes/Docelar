const ImagemService = require('../services/imagemService');

class ImagemController {
    async listarPorProduto(req, res) {
        try {
            const resultado = await ImagemService.listarImagensPorProduto(req.params.id_produto);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async cadastrar(req, res) {
        try {
            if (!req.file) {
                throw { status: 400, mensagem: "Nenhuma imagem enviada" };
            }

            const link = `/uploads/${req.file.filename}`;
            const resultado = await ImagemService.cadastrarImagem({
                link,
                id_produto: req.params.id_produto
            });

            res.status(201).json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }

    async deletar(req, res) {
        try {
            const resultado = await ImagemService.deletarImagem(req.params.id);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.mensagem || "Erro interno" });
        }
    }
}

module.exports = new ImagemController();