jest.mock('../../src/repositories/CategoriaRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNome: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  contarVinculos: jest.fn(),
}));

const repo = require('../../src/repositories/CategoriaRepository');
const service = require('../../src/services/CategoriaService');

describe('CategoriaService', () => {
  describe('listarCategoria', () => {
    it('retorna a lista e o total', async () => {
      repo.findAll.mockResolvedValue([{ id_categoria: 1 }, { id_categoria: 2 }]);
      const r = await service.listarCategoria();
      expect(r).toEqual({ sucesso: true, dados: [{ id_categoria: 1 }, { id_categoria: 2 }], total: 2 });
    });

    it('retorna total 0 quando não há categorias', async () => {
      repo.findAll.mockResolvedValue([]);
      const r = await service.listarCategoria();
      expect(r.total).toBe(0);
    });
  });

  describe('buscarCategoriaPorId', () => {
    it('rejeita id inválido', async () => {
      await expect(service.buscarCategoriaPorId('abc')).rejects.toMatchObject({ status: 400 });
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('rejeita quando não encontra', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.buscarCategoriaPorId(5)).rejects.toMatchObject({ status: 404 });
    });

    it('retorna a categoria encontrada', async () => {
      repo.findById.mockResolvedValue({ id_categoria: 5, nome_categoria: 'Pães' });
      const r = await service.buscarCategoriaPorId(5);
      expect(r.dados.nome_categoria).toBe('Pães');
    });
  });

  describe('cadastrarCategoria', () => {
    it('exige o nome', async () => {
      await expect(service.cadastrarCategoria({})).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita categoria duplicada com 409', async () => {
      repo.findByNome.mockResolvedValue({ id_categoria: 1 });
      await expect(service.cadastrarCategoria({ nome: 'Pães' })).rejects.toMatchObject({ status: 409 });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('cadastra removendo espaços do nome', async () => {
      repo.findByNome.mockResolvedValue(undefined);
      repo.create.mockResolvedValue(10);
      const r = await service.cadastrarCategoria({ nome: '  Bolos  ' });
      expect(repo.create).toHaveBeenCalledWith({ nome: 'Bolos' });
      expect(r).toMatchObject({ sucesso: true, id: 10 });
    });
  });

  describe('atualizarCategoria', () => {
    it('rejeita id inválido', async () => {
      await expect(service.atualizarCategoria('x', { nome: 'A' })).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita categoria inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.atualizarCategoria(1, { nome: 'A' })).rejects.toMatchObject({ status: 404 });
    });

    it('rejeita atualização sem nome', async () => {
      repo.findById.mockResolvedValue({ id_categoria: 1 });
      await expect(service.atualizarCategoria(1, {})).rejects.toMatchObject({ status: 400 });
    });

    it('atualiza usando o nome da coluna do banco', async () => {
      repo.findById.mockResolvedValue({ id_categoria: 1 });
      const r = await service.atualizarCategoria(1, { nome: ' Doces ' });
      expect(repo.update).toHaveBeenCalledWith(1, { nome_categoria: 'Doces' });
      expect(r.sucesso).toBe(true);
    });
  });

  describe('deletarCategoria', () => {
    it('rejeita categoria inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.deletarCategoria(1)).rejects.toMatchObject({ status: 404 });
    });

    it('não apaga categoria com produtos vinculados', async () => {
      repo.findById.mockResolvedValue({ id_categoria: 1 });
      repo.contarVinculos.mockResolvedValue(3);
      await expect(service.deletarCategoria(1)).rejects.toMatchObject({ status: 409 });
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('apaga categoria sem vínculos', async () => {
      repo.findById.mockResolvedValue({ id_categoria: 1 });
      repo.contarVinculos.mockResolvedValue(0);
      const r = await service.deletarCategoria(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
      expect(r.sucesso).toBe(true);
    });
  });
});
