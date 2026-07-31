const CadastroFornecedoresRepository = require('../repositories/CadastroFornecedoresRepository');

class CadastroFornecedoresService {
    async listarCadastrarFornecedores() {
        const fornecedores = await CadastroFornecedoresRepository.findAll();
        return { sucesso: true, dados: fornecedores, total: fornecedores.length };
    }

    async buscarCadastroFornecedoresPorId(id) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
        const fornecedor = await FornecedorRepository.findById(id);
        if (!fornecedor) throw { status: 404, mensagem: "Fornecedor não encontrado" };
        return { sucesso: true, dados: fornecedor };
    }

    async cadastrarCadastroFornecedores(dados) {
        const { nome, cnpj, telefone, email } = dados;
        if (!nome || !cnpj) {
            throw { status: 400, mensagem: "Nome e CNPJ são obrigatórios" };
        }

        const cnpjExiste = await CadastroFornecedoresRepository.findByCnpj(cnpj);
        if (cnpjExiste) throw { status: 409, mensagem: "CNPJ já cadastrado" };

        const novoFornecedor = {
            nome: nome.trim(),
            cnpj: cnpj.trim(),
            telefone: telefone || null,
            email: email || null
        };

        const id = await CadastroFornecedoresRepository.create(novoFornecedor);
        return { sucesso: true, mensagem: "Fornecedor cadastrado com sucesso", id };
    }

    async atualizarCadastroFornecedores(id, dados) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };

        const existe = await CadastroFornecedoresRepository.findById(id);
        if (!existe) throw { status: 404, mensagem: "Fornecedor não encontrado" };

        const atualizado = {};
        const { nome, cnpj, telefone, email } = dados;

        if (nome !== undefined) atualizado.nome = nome.trim();
        if (cnpj !== undefined) atualizado.cnpj = cnpj.trim();
        if (telefone !== undefined) atualizado.telefone = telefone;
        if (email !== undefined) atualizado.email = email;

        if (Object.keys(atualizado).length === 0) throw { status: 400, mensagem: "Nenhum dado válido" };

        await CadastroFornecedoresRepository.update(id, atualizado);
        return { sucesso: true, mensagem: "Fornecedor atualizado com sucesso" };
    }

    async deletarCadastroFornecedores(id) {
        if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
        const existe = await FornecedorRepository.findById(id);
        if (!existe) throw { status: 404, mensagem: "Fornecedor não encontrado" };

        await CadastroFornecedoresRepository.delete(id);
        return { sucesso: true, mensagem: "Fornecedor apagado com sucesso" };
    }
}

module.exports = new CadastroFornecedoresService();