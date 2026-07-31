const CategoriaRepository = require('../repositories/CategoriaRepository');

class CategoriaService {
    async listarCategorias() {
        const categorias = await CategoriaRepository.findAll();
        return { sucesso: true, dados: categorias, total: categorias.length };
    }

    async buscarCategoriaPorId(id) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
        const categoria = await CategoriaRepository.findById(id);
        if (!categoria) throw { status: 404, mensagem: "Categoria não encontrada" };
        return { sucesso: true, dados: categoria };
    }

    async cadastrarCategoria(dados) {
        const { nome } = dados;
        if (!nome) throw { status: 400, mensagem: "Nome é obrigatório" };

        const existe = await CategoriaRepository.findByNome(nome.trim());
        if (existe) throw { status: 409, mensagem: "Categoria já existe" };

        const id = await CategoriaRepository.create({ nome: nome.trim() });
        return { sucesso: true, mensagem: "Categoria cadastrada com sucesso", id };
    }

    async atualizarCategoria(id, dados) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };

        const existe = await CategoriaRepository.findById(id);
        if (!existe) throw { status: 404, mensagem: "Categoria não encontrada" };

        const { nome } = dados;
        if (!nome) throw { status: 400, mensagem: "Nenhum dado válido" };

        await CategoriaRepository.update(id, { nome: nome.trim() });
        return { sucesso: true, mensagem: "Categoria atualizada com sucesso" };
    }

    async deletarCategoria(id) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
        const existe = await CategoriaRepository.findById(id);
        if (!existe) throw { status: 404, mensagem: "Categoria não encontrada" };

        await CategoriaRepository.delete(id);
        return { sucesso: true, mensagem: "Categoria apagada com sucesso" };
    }
}

module.exports = new CategoriaService();