const EstoqueRepository = require('../repositories/EstoqueRepository');
const ProdutoRepository = require('../repositories/ProdutoRepository');

class EstoqueService {
    async listarEstoque() {
        const estoque = await EstoqueRepository.findAll();
        return { sucesso: true, dados: estoque, total: estoque.length };
    }

    async buscarEstoquePorId(id) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
        const estoque = await EstoqueRepository.findById(id);
        if (!estoque) throw { status: 404, mensagem: "Lote não encontrado" };
        return { sucesso: true, dados: estoque };
    }

    async cadastrarEstoque(dados) {
        const { id_produto, id_fornecedor, quantidade, validade } = dados;

        if (!id_produto || isNaN(id_produto)) throw { status: 400, mensagem: "Produto é obrigatório" };
        if (typeof quantidade !== "number" || quantidade <= 0) {
            throw { status: 400, mensagem: "Quantidade deve ser um número positivo" };
        }

        const produto = await ProdutoRepository.findById(id_produto);
        if (!produto) throw { status: 404, mensagem: "Produto não encontrado" };

        const novoLote = {
            id_produto,
            id_fornecedor: id_fornecedor || null,
            quantidade,
            validade: validade || null
        };

        const id = await EstoqueRepository.create(novoLote);
        return { sucesso: true, mensagem: "Lote cadastrado com sucesso", id };
    }

    async atualizarEstoque(id, dados) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };

        const existe = await EstoqueRepository.findById(id);
        if (!existe) throw { status: 404, mensagem: "Lote não encontrado" };

        const atualizado = {};
        const { quantidade, validade } = dados;

        if (quantidade !== undefined) {
            if (typeof quantidade !== "number" || quantidade < 0) throw { status: 400, mensagem: "Quantidade inválida" };
            atualizado.quantidade = quantidade;
        }
        if (validade !== undefined) atualizado.validade = validade;

        if (Object.keys(atualizado).length === 0) throw { status: 400, mensagem: "Nenhum dado válido" };

        await EstoqueRepository.update(id, atualizado);
        return { sucesso: true, mensagem: "Lote atualizado com sucesso" };
    }

    async deletarEstoque(id) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
        const existe = await EstoqueRepository.findById(id);
        if (!existe) throw { status: 404, mensagem: "Lote não encontrado" };

        await EstoqueRepository.delete(id);
        return { sucesso: true, mensagem: "Lote apagado com sucesso" };
    }

    async listarVencidos() {
        const lotes = await EstoqueRepository.findVencidos();
        return { sucesso: true, dados: lotes, total: lotes.length };
    }

    async listarProximosVencimento(dias = 7) {
        if (isNaN(dias) || dias < 0) throw { status: 400, mensagem: "Número de dias inválido" };
        const lotes = await EstoqueRepository.findProximosVencimento(dias);
        return { sucesso: true, dados: lotes, total: lotes.length };
    }

    async criarLote(dados) {
        return this.cadastrarEstoque(dados);
    }
}

module.exports = new EstoqueService();