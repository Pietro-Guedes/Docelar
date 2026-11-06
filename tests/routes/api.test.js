jest.mock('../../src/config/database', () => ({ query: jest.fn(), getConnection: jest.fn() }));
jest.mock('../../src/repositories/CategoriaRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNome: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  contarVinculos: jest.fn(),
}));
jest.mock('../../src/repositories/FuncionarioRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const categoriaRepo = require('../../src/repositories/CategoriaRepository');
const funcionarioRepo = require('../../src/repositories/FuncionarioRepository');

let app;
let token;

beforeAll(() => {
  process.env.JWT_SECRET = 'segredo-de-teste';
  app = require('../../src/app');
  token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
});

beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => console.error.mockRestore());

describe('API (rotas + controllers + services, banco simulado)', () => {
  it('GET /api responde com informações da API', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe('API Docelar');
  });

  it('as rotas também funcionam sem o prefixo /api', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  describe('categorias', () => {
    it('GET /api/categoria é público e lista categorias', async () => {
      categoriaRepo.findAll.mockResolvedValue([{ id_categoria: 1, nome_categoria: 'Pães' }]);
      const res = await request(app).get('/api/categoria');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ sucesso: true, total: 1 });
    });

    it('GET /api/categoria/abc responde 400', async () => {
      const res = await request(app).get('/api/categoria/abc');
      expect(res.status).toBe(400);
    });

    it('GET /api/categoria/99 responde 404 quando não existe', async () => {
      categoriaRepo.findById.mockResolvedValue(undefined);
      const res = await request(app).get('/api/categoria/99');
      expect(res.status).toBe(404);
    });

    it('POST /api/categoria sem token responde 401', async () => {
      const res = await request(app).post('/api/categoria').send({ nome: 'Bolos' });
      expect(res.status).toBe(401);
      expect(categoriaRepo.create).not.toHaveBeenCalled();
    });

    it('POST /api/categoria com token cadastra e responde 201', async () => {
      categoriaRepo.findByNome.mockResolvedValue(undefined);
      categoriaRepo.create.mockResolvedValue(5);
      const res = await request(app).post('/api/categoria').set('Authorization', `Bearer ${token}`).send({ nome: 'Bolos' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(5);
    });

    it('POST /api/categoria com nome repetido responde 409', async () => {
      categoriaRepo.findByNome.mockResolvedValue({ id_categoria: 1 });
      const res = await request(app).post('/api/categoria').set('Authorization', `Bearer ${token}`).send({ nome: 'Bolos' });
      expect(res.status).toBe(409);
    });

    it('DELETE /api/categoria/1 sem token responde 401', async () => {
      const res = await request(app).delete('/api/categoria/1');
      expect(res.status).toBe(401);
    });
  });

  describe('funcionários', () => {
    it('POST /api/funcionario/login devolve token com credenciais corretas', async () => {
      funcionarioRepo.findByEmail.mockResolvedValue({ id_funcionario: 1, nome: 'Ana', senha_hash: await bcrypt.hash('123456', 4) });
      const res = await request(app).post('/api/funcionario/login').send({ email: 'ana@mail.com', senha: '123456' });
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
    });

    it('POST /api/funcionario/login com senha errada responde 401', async () => {
      funcionarioRepo.findByEmail.mockResolvedValue({ id_funcionario: 1, senha_hash: await bcrypt.hash('123456', 4) });
      const res = await request(app).post('/api/funcionario/login').send({ email: 'ana@mail.com', senha: 'errada' });
      expect(res.status).toBe(401);
    });

    it('GET /api/funcionario exige token', async () => {
      const res = await request(app).get('/api/funcionario');
      expect(res.status).toBe(401);
    });

    it('GET /api/funcionario com token não expõe senha_hash', async () => {
      funcionarioRepo.findAll.mockResolvedValue([{ id_funcionario: 1, nome: 'Ana', senha_hash: 'segredo' }]);
      const res = await request(app).get('/api/funcionario').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain('senha_hash');
    });
  });
});
