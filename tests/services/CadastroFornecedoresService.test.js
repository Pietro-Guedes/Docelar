jest.mock('../../src/repositories/CadastroFornecedoresRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCnpj: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  contarVinculos: jest.fn(),
}));

const repo = require('../../src/repositories/CadastroFornecedoresRepository');
const service = require('../../src/services/CadastroFornecedoresService');

describe('CadastroFornecedoresService', () => {
  it('lista fornecedores com total', async () => {
    repo.findAll.mockResolvedValue([{}, {}]);
    expect(await service.listarCadastroFornecedores()).toMatchObject({ sucesso: true, total: 2 });
  });

  describe('buscar por id', () => {
    it('rejeita id inválido', async () => {
      await expect(service.buscarCadastroFornecedoresPorId('x')).rejects.toMatchObject({ status: 400 });
    });
    it('rejeita inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.buscarCadastroFornecedoresPorId(1)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('cadastrar', () => {
    it('exige nome e CNPJ', async () => {
      await expect(service.cadastrarCadastroFornecedores({ nome: 'A' })).rejects.toMatchObject({ status: 400 });
      await expect(service.cadastrarCadastroFornecedores({ cnpj: '1' })).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita CNPJ duplicado', async () => {
      repo.findByCnpj.mockResolvedValue({ id_fornecedor: 1 });
      await expect(service.cadastrarCadastroFornecedores({ nome: 'A', cnpj: '1' })).rejects.toMatchObject({ status: 409 });
    });

    it('cadastra aparando espaços e usando null nos opcionais', async () => {
      repo.findByCnpj.mockResolvedValue(undefined);
      repo.create.mockResolvedValue(3);
      const r = await service.cadastrarCadastroFornecedores({ nome: ' Moinho ', cnpj: ' 12345678000190 ' });
      expect(repo.create).toHaveBeenCalledWith({ nome: 'Moinho', cnpj: '12345678000190', telefone: null, email: null });
      expect(r.id).toBe(3);
    });
  });

  describe('atualizar', () => {
    it('rejeita inexistente', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.atualizarCadastroFornecedores(1, { nome: 'A' })).rejects.toMatchObject({ status: 404 });
    });
    it('rejeita sem dado válido', async () => {
      repo.findById.mockResolvedValue({ id_fornecedor: 1 });
      await expect(service.atualizarCadastroFornecedores(1, {})).rejects.toMatchObject({ status: 400 });
    });
    it('atualiza só o que veio', async () => {
      repo.findById.mockResolvedValue({ id_fornecedor: 1 });
      await service.atualizarCadastroFornecedores(1, { nome: ' Novo ', telefone: '1199999' });
      expect(repo.update).toHaveBeenCalledWith(1, { nome: 'Novo', telefone: '1199999' });
    });
  });

  describe('deletar', () => {
    it('bloqueia fornecedor com vínculos', async () => {
      repo.findById.mockResolvedValue({ id_fornecedor: 1 });
      repo.contarVinculos.mockResolvedValue(1);
      await expect(service.deletarCadastroFornecedores(1)).rejects.toMatchObject({ status: 409 });
      expect(repo.delete).not.toHaveBeenCalled();
    });
    it('apaga fornecedor sem vínculos', async () => {
      repo.findById.mockResolvedValue({ id_fornecedor: 1 });
      repo.contarVinculos.mockResolvedValue(0);
      await service.deletarCadastroFornecedores(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
