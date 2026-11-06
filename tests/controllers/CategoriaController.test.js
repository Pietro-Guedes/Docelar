jest.mock('../../src/services/CategoriaService', () => ({
  listarCategoria: jest.fn(),
  buscarCategoriaPorId: jest.fn(),
  cadastrarCategoria: jest.fn(),
  atualizarCategoria: jest.fn(),
  deletarCategoria: jest.fn(),
}));

const service = require('../../src/services/CategoriaService');
const controller = require('../../src/controllers/CategoriaController');

const criarRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => console.error.mockRestore());

describe('CategoriaController', () => {
  it('listar responde com o resultado do service', async () => {
    service.listarCategoria.mockResolvedValue({ sucesso: true, dados: [], total: 0 });
    const res = criarRes();
    await controller.listar({}, res);
    expect(res.json).toHaveBeenCalledWith({ sucesso: true, dados: [], total: 0 });
  });

  it('cadastrar responde 201', async () => {
    service.cadastrarCategoria.mockResolvedValue({ sucesso: true, id: 1 });
    const res = criarRes();
    await controller.cadastrar({ body: { nome: 'Pães' } }, res);
    expect(service.cadastrarCategoria).toHaveBeenCalledWith({ nome: 'Pães' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('repassa o status do erro lançado pelo service', async () => {
    service.buscarCategoriaPorId.mockRejectedValue({ status: 404, mensagem: 'Categoria não encontrada' });
    const res = criarRes();
    await controller.buscarPorId({ params: { id: '9' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ sucesso: false, mensagem: 'Categoria não encontrada' });
  });

  it('responde 500 com mensagem genérica em erro inesperado', async () => {
    service.deletarCategoria.mockRejectedValue(new Error('banco caiu'));
    const res = criarRes();
    await controller.deletar({ params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ sucesso: false, mensagem: 'Erro interno' });
  });
});
