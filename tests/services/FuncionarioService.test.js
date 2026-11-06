jest.mock('../../src/repositories/FuncionarioRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  contarVinculos: jest.fn(),
}));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repo = require('../../src/repositories/FuncionarioRepository');
const service = require('../../src/services/FuncionarioService');

beforeAll(() => {
  process.env.JWT_SECRET = 'segredo-de-teste';
});

describe('FuncionarioService', () => {
  describe('listar / buscar', () => {
    it('nunca devolve o hash da senha na listagem', async () => {
      repo.findAll.mockResolvedValue([{ id_funcionario: 1, nome: 'Ana', senha_hash: 'x' }]);
      const r = await service.listarFuncionarios();
      expect(r.dados[0]).toEqual({ id_funcionario: 1, nome: 'Ana' });
      expect(r.total).toBe(1);
    });

    it('nunca devolve o hash da senha na busca por id', async () => {
      repo.findById.mockResolvedValue({ id_funcionario: 1, nome: 'Ana', senha_hash: 'x' });
      expect((await service.buscarFuncionarioPorId(1)).dados).not.toHaveProperty('senha_hash');
    });

    it('rejeita id inválido e inexistente', async () => {
      await expect(service.buscarFuncionarioPorId('x')).rejects.toMatchObject({ status: 400 });
      repo.findById.mockResolvedValue(undefined);
      await expect(service.buscarFuncionarioPorId(1)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('cadastrarFuncionario', () => {
    it('exige nome, email e senha', async () => {
      await expect(service.cadastrarFuncionario({ nome: 'A', email: 'a@a.com' })).rejects.toMatchObject({ status: 400 });
    });

    it('exige senha com pelo menos 6 caracteres', async () => {
      await expect(service.cadastrarFuncionario({ nome: 'A', email: 'a@a.com', senha: '12345' })).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita email já cadastrado', async () => {
      repo.findByEmail.mockResolvedValue({ id_funcionario: 1 });
      await expect(service.cadastrarFuncionario({ nome: 'A', email: 'a@a.com', senha: '123456' })).rejects.toMatchObject({ status: 409 });
    });

    it('salva email em minúsculas e senha criptografada', async () => {
      repo.findByEmail.mockResolvedValue(undefined);
      repo.create.mockResolvedValue(5);
      const r = await service.cadastrarFuncionario({ nome: ' Ana ', email: ' ANA@Mail.COM ', senha: 'abc123' });
      const salvo = repo.create.mock.calls[0][0];
      expect(salvo.nome).toBe('Ana');
      expect(salvo.email).toBe('ana@mail.com');
      expect(salvo.senha_hash).not.toBe('abc123');
      expect(await bcrypt.compare('abc123', salvo.senha_hash)).toBe(true);
      expect(r.id).toBe(5);
    });
  });

  describe('login', () => {
    it('exige email e senha', async () => {
      await expect(service.login('', '')).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita email inexistente com mensagem genérica', async () => {
      repo.findByEmail.mockResolvedValue(undefined);
      await expect(service.login('a@a.com', '123456')).rejects.toMatchObject({ status: 401, mensagem: 'Email ou senha inválidos' });
    });

    it('rejeita senha errada com a mesma mensagem', async () => {
      repo.findByEmail.mockResolvedValue({ id_funcionario: 1, senha_hash: await bcrypt.hash('certa123', 4) });
      await expect(service.login('a@a.com', 'errada')).rejects.toMatchObject({ status: 401, mensagem: 'Email ou senha inválidos' });
    });

    it('devolve token JWT válido com o id do funcionário', async () => {
      repo.findByEmail.mockResolvedValue({ id_funcionario: 7, nome: 'Ana', senha_hash: await bcrypt.hash('certa123', 4) });
      const r = await service.login(' A@A.com ', 'certa123');
      expect(repo.findByEmail).toHaveBeenCalledWith('a@a.com');
      expect(jwt.verify(r.token, process.env.JWT_SECRET).id).toBe(7);
      expect(r.funcionario).toEqual({ id: 7, nome: 'Ana' });
    });
  });

  describe('atualizarFuncionario', () => {
    it('só permite alterar o próprio cadastro', async () => {
      await expect(service.atualizarFuncionario(1, { nome: 'X' }, 2)).rejects.toMatchObject({ status: 403 });
    });

    it('rejeita funcionário inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.atualizarFuncionario(1, { nome: 'X' }, 1)).rejects.toMatchObject({ status: 404 });
    });

    it('rejeita email de outro funcionário', async () => {
      repo.findById.mockResolvedValue({ id_funcionario: 1 });
      repo.findByEmail.mockResolvedValue({ id_funcionario: 2 });
      await expect(service.atualizarFuncionario(1, { email: 'x@x.com' }, 1)).rejects.toMatchObject({ status: 409 });
    });

    it('aceita o próprio email', async () => {
      repo.findById.mockResolvedValue({ id_funcionario: 1 });
      repo.findByEmail.mockResolvedValue({ id_funcionario: 1 });
      await service.atualizarFuncionario(1, { email: 'X@x.com' }, 1);
      expect(repo.update).toHaveBeenCalledWith(1, { email: 'x@x.com' });
    });

    it('rejeita senha curta e criptografa senha nova', async () => {
      repo.findById.mockResolvedValue({ id_funcionario: 1 });
      await expect(service.atualizarFuncionario(1, { senha: '123' }, 1)).rejects.toMatchObject({ status: 400 });
      await service.atualizarFuncionario(1, { senha: 'novasenha' }, 1);
      expect(repo.update.mock.calls[0][1].senha_hash).not.toBe('novasenha');
    });

    it('rejeita quando não há dado válido', async () => {
      repo.findById.mockResolvedValue({ id_funcionario: 1 });
      await expect(service.atualizarFuncionario(1, {}, 1)).rejects.toMatchObject({ mensagem: 'Nenhum dado válido' });
    });
  });

  describe('deletarFuncionario', () => {
    it('só permite apagar o próprio cadastro', async () => {
      await expect(service.deletarFuncionario(1, 2)).rejects.toMatchObject({ status: 403 });
    });

    it('bloqueia quando há vínculos', async () => {
      repo.findById.mockResolvedValue({ id_funcionario: 1 });
      repo.contarVinculos.mockResolvedValue(4);
      await expect(service.deletarFuncionario(1, 1)).rejects.toMatchObject({ status: 409 });
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('apaga quando não há vínculos', async () => {
      repo.findById.mockResolvedValue({ id_funcionario: 1 });
      repo.contarVinculos.mockResolvedValue(0);
      await service.deletarFuncionario(1, 1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
