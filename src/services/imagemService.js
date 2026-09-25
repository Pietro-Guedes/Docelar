const fs = require("fs");
const path = require("path");
const ImagemRepository = require('../repositories/ImagemRepository');
const ProdutoRepository = require('../repositories/ProdutoRepository');

class ImagemService {
    async listarImagensPorProduto(id_produto) {
        if (!id_produto || isNaN(id_produto)) throw { status: 400, mensagem: "ID de produto inválido" };
        const imagens = await ImagemRepository.findByProduto(id_produto);
        return { sucesso: true, dados: imagens, total: imagens.length };
    }

    async cadastrarImagem(dados) {
        const { link, id_produto } = dados;

        if (!link) throw { status: 400, mensagem: "Link é obrigatório" };
        if (!id_produto || isNaN(id_produto)) throw { status: 400, mensagem: "Produto é obrigatório" };

        const produto = await ProdutoRepository.findById(id_produto);
        if (!produto) throw { status: 404, mensagem: "Produto não encontrado" };

        const id = await ImagemRepository.create({ link: link.trim(), id_produto });
        return { sucesso: true, mensagem: "Imagem cadastrada com sucesso", id };
    }

    async deletarImagem(id) {

    if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };

    const existe = await ImagemRepository.findById(id);

    if (!existe) throw { status: 404, mensagem: "Imagem não encontrada" };

    await ImagemRepository.delete(id);

    const caminhoArquivo = path.join(
        __dirname,
        "..",
        existe.link.replace(/^\/+/, "")
    );

    fs.unlink(caminhoArquivo, (erro) => {
        if (erro) {
            console.error("Erro ao apagar arquivo:", erro);
        }
    });

    return { sucesso: true, mensagem: "Imagem apagada com sucesso" };
}
}

module.exports = new ImagemService();