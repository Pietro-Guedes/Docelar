const ProdutoRepository = require('../repositories/ProdutoRepository');

class ProdutoService {
    async listarProdutos() {
        const produtos = await ProdutoRepository.findAll();
        return { sucesso: true, dados: produtos, total: produtos.length };
    }

    async buscarProdutoPorId(id) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
        const produto = await ProdutoRepository.findById(id);
        if (!produto) throw { status: 404, mensagem: "Produto não encontrado" };
        return { sucesso: true, dados: produto };
    }

    async cadastrarProduto(dados) {
        const { nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario } = dados;

        if (!nome || !descricao || valor_unitario === undefined) {
            throw { status: 400, mensagem: "Nome, descrição e valor unitário são obrigatórios" };
        }
        if (typeof valor_unitario !== "number" || valor_unitario < 0) {
            throw { status: 400, mensagem: "Valor unitário deve ser um número positivo" };
        }
        if (id_categoria !== undefined && id_categoria !== null && isNaN(id_categoria)) {
            throw { status: 400, mensagem: "Categoria inválida" };
        }
        if (id_fornecedor !== undefined && id_fornecedor !== null && isNaN(id_fornecedor)) {
            throw { status: 400, mensagem: "Fornecedor inválido" };
        }
        if (!id_funcionario || isNaN(id_funcionario)) {
            throw { status: 400, mensagem: "Funcionário responsável pelo cadastro é obrigatório" };
        }

        const novoProduto = {
            nome: nome.trim(),
            descricao: descricao.trim(),
            valor_unitario,
            id_categoria: id_categoria || null,
            id_fornecedor: id_fornecedor || null,
            id_funcionario
        };

        const id = await ProdutoRepository.create(novoProduto);
        return { sucesso: true, mensagem: "Produto cadastrado com sucesso", id };
    }

    async atualizarProduto(id, dados) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };

        const existe = await ProdutoRepository.findById(id);
        if (!existe) throw { status: 404, mensagem: "Produto não encontrado" };

        const atualizado = {};
        const { nome, descricao, valor_unitario, id_categoria, id_fornecedor } = dados;

        if (nome !== undefined) atualizado.nome = nome.trim();
        if (descricao !== undefined) atualizado.descricao = descricao.trim();
        if (valor_unitario !== undefined) {
            if (typeof valor_unitario !== "number" || valor_unitario < 0) {
                throw { status: 400, mensagem: "Valor unitário inválido" };
            }
            atualizado.valor_unitario = valor_unitario;
        }
        if (id_categoria !== undefined) {
            if (id_categoria !== null && isNaN(id_categoria)) throw { status: 400, mensagem: "Categoria inválida" };
            atualizado.id_categoria = id_categoria;
        }
        if (id_fornecedor !== undefined) {
            if (id_fornecedor !== null && isNaN(id_fornecedor)) throw { status: 400, mensagem: "Fornecedor inválido" };
            atualizado.id_fornecedor = id_fornecedor;
        }

        if (Object.keys(atualizado).length === 0) throw { status: 400, mensagem: "Nenhum dado válido" };

        await ProdutoRepository.update(id, atualizado);
        return { sucesso: true, mensagem: "Produto atualizado com sucesso" };
    }

    async deletarProduto(id) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
        const existe = await ProdutoRepository.findById(id);
        if (!existe) throw { status: 404, mensagem: "Produto não encontrado" };

        await ProdutoRepository.delete(id);
        return { sucesso: true, mensagem: "Produto apagado com sucesso" };
    }
}

module.exports = new ProdutoService();