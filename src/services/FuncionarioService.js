const FuncionarioRepository = require("../repositories/FuncionarioRepository");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class FuncionarioService {
  async listarFuncionarios() {
    const funcionarios = await FuncionarioRepository.findAll();
    const semSenha = funcionarios.map(({ senha_hash, ...resto }) => resto);
    return { sucesso: true, dados: semSenha, total: semSenha.length };
  }

  async buscarFuncionarioPorId(id) {
    if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
    const funcionario = await FuncionarioRepository.findById(id);
    if (!funcionario)
      throw { status: 404, mensagem: "Funcionário não encontrado" };
    const { senha_hash, ...semSenha } = funcionario;
    return { sucesso: true, dados: semSenha };
  }

  async cadastrarFuncionario(dados) {
    const { nome, email, senha } = dados;
    if (!nome || !email || !senha) {
      throw { status: 400, mensagem: "Nome, email e senha são obrigatórios" };
    }
    if (senha.length < 6) {
      throw { status: 400, mensagem: "Senha deve ter no mínimo 6 caracteres" };
    }

    const emailExiste = await FuncionarioRepository.findByEmail(email);
    if (emailExiste) throw { status: 409, mensagem: "Email já cadastrado" };

    const senha_hash = await bcrypt.hash(senha, 10);

    const novoFuncionario = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha_hash,
    };

    const id = await FuncionarioRepository.create(novoFuncionario);
    return {
      sucesso: true,
      mensagem: "Funcionário cadastrado com sucesso",
      id,
    };
  }

  async login(email, senha) {
    if (!email || !senha)
      throw { status: 400, mensagem: "Email e senha são obrigatórios" };

    const funcionario = await FuncionarioRepository.findByEmail(
      email.trim().toLowerCase(),
    );
    if (!funcionario)
      throw { status: 401, mensagem: "Email ou senha inválidos" };

    const senhaCorreta = await bcrypt.compare(senha, funcionario.senha_hash);
    if (!senhaCorreta)
      throw { status: 401, mensagem: "Email ou senha inválidos" };

    // Só precisa do id no token -- não existe mais distinção de permissão entre funcionários.
    const token = jwt.sign(
      { id: funcionario.id_funcionario },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    return {
      sucesso: true,
      mensagem: "Login realizado com sucesso",
      token,
      funcionario: { id: funcionario.id_funcionario, nome: funcionario.nome },
    };
  }

  async atualizarFuncionario(id, dados) {
    if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };

    const existe = await FuncionarioRepository.findById(id);
    if (!existe) throw { status: 404, mensagem: "Funcionário não encontrado" };

    const atualizado = {};
    const { nome, email, senha } = dados;

    if (nome !== undefined) atualizado.nome = nome.trim();
    if (email !== undefined) atualizado.email = email.trim().toLowerCase();
    if (senha !== undefined) {
      if (senha.length < 6)
        throw {
          status: 400,
          mensagem: "Senha deve ter no mínimo 6 caracteres",
        };
      atualizado.senha_hash = await bcrypt.hash(senha, 10);
    }

    if (Object.keys(atualizado).length === 0)
      throw { status: 400, mensagem: "Nenhum dado válido" };

    await FuncionarioRepository.update(id, atualizado);
    return { sucesso: true, mensagem: "Funcionário atualizado com sucesso" };
  }

  async deletarFuncionario(id) {
    if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
    const existe = await FuncionarioRepository.findById(id);
    if (!existe) throw { status: 404, mensagem: "Funcionário não encontrado" };

    await FuncionarioRepository.delete(id);
    return { sucesso: true, mensagem: "Funcionário apagado com sucesso" };
  }
}

module.exports = new FuncionarioService();
