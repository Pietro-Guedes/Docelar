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
    const { nome, email, senha, admin, codigoAdmin } = dados;
    if (!nome || !email || !senha) {
      throw { status: 400, mensagem: "Nome, email e senha são obrigatórios" };
    }
    if (senha.length < 6) {
      throw { status: 400, mensagem: "Senha deve ter no mínimo 6 caracteres" };
    }

    // Conta admin só é criada com o código secreto definido em ADMIN_CODE (.env)
    let ehAdmin = 0;
    if (admin === true || admin === 1 || admin === "1") {
      const esperado = process.env.ADMIN_CODE;
      if (!esperado) {
        throw { status: 403, mensagem: "Cadastro de administrador desativado (defina ADMIN_CODE no .env)" };
      }
      if (typeof codigoAdmin !== "string" || codigoAdmin !== esperado) {
        throw { status: 403, mensagem: "Código de administrador inválido" };
      }
      ehAdmin = 1;
    }

    const emailExiste = await FuncionarioRepository.findByEmail(email);
    if (emailExiste) {
      throw {
        status: 409,
        mensagem: Number(emailExiste.ativo) === 0
          ? "Este e-mail pertence a uma conta desativada"
          : "Email já cadastrado",
      };
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const novoFuncionario = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha_hash,
      admin: ehAdmin,
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
    if (Number(funcionario.ativo) === 0)
      throw { status: 403, mensagem: "Conta desativada. Fale com um administrador." };

    const token = jwt.sign(
      { id: funcionario.id_funcionario },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    return {
      sucesso: true,
      mensagem: "Login realizado com sucesso",
      token,
      funcionario: {
        id: funcionario.id_funcionario,
        nome: funcionario.nome,
        admin: !!funcionario.admin,
      },
    };
  }

  async atualizarFuncionario(id, dados, idLogado) {
    if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
    if (Number(idLogado) !== Number(id)) {
      throw { status: 403, mensagem: "Você só pode alterar o seu próprio cadastro" };
    }

    const existe = await FuncionarioRepository.findById(id);
    if (!existe) throw { status: 404, mensagem: "Funcionário não encontrado" };

    const atualizado = {};
    const { nome, email, senha } = dados;

    if (nome !== undefined) atualizado.nome = nome.trim();
    if (email !== undefined) {
      const emailNormalizado = email.trim().toLowerCase();
      const emailExiste =
        await FuncionarioRepository.findByEmail(emailNormalizado);
      if (emailExiste && Number(emailExiste.id_funcionario) !== Number(id)) {
        throw {
          status: 409,
          mensagem: "Email já cadastrado para outro funcionário",
        };
      }
      atualizado.email = emailNormalizado;
    }
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

  async deletarFuncionario(id, idLogado) {
    if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
    // a rota já exige admin; aqui só impede o admin de desativar a própria conta
    if (Number(idLogado) === Number(id)) {
      throw { status: 400, mensagem: "Você não pode desativar a sua própria conta" };
    }
    const existe = await FuncionarioRepository.findById(id);
    if (!existe) throw { status: 404, mensagem: "Funcionário não encontrado" };
    if (Number(existe.ativo) === 0) {
      throw { status: 409, mensagem: "Este funcionário já está desativado" };
    }

    // não apaga: só desativa, para o histórico de produtos e movimentações continuar salvo
    await FuncionarioRepository.desativar(id);
    return { sucesso: true, mensagem: "Funcionário desativado com sucesso" };
  }

  async reativarFuncionario(id) {
    if (!id || isNaN(id)) throw { status: 400, mensagem: "ID inválido" };
    const existe = await FuncionarioRepository.findById(id);
    if (!existe) throw { status: 404, mensagem: "Funcionário não encontrado" };
    if (Number(existe.ativo) !== 0) {
      throw { status: 409, mensagem: "Este funcionário já está ativo" };
    }
    await FuncionarioRepository.reativar(id);
    return { sucesso: true, mensagem: "Funcionário reativado com sucesso" };
  }
}

module.exports = new FuncionarioService();
