const jwt = require('jsonwebtoken');
const { verificarToken } = require('../../src/middlewares/authMiddleware');

const SEGREDO = 'segredo-de-teste';

function executar(headers = {}) {
  const req = { headers };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  verificarToken(req, res, next);
  return { req, res, next };
}

beforeAll(() => {
  process.env.JWT_SECRET = SEGREDO;
});

describe('verificarToken', () => {
  it('retorna 401 sem o header Authorization', () => {
    const { res, next } = executar();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it.each(['abc', 'Token abc', 'Bearer', 'Bearer a b'])('retorna 401 para formato inválido "%s"', (auth) => {
    const { res, next } = executar({ authorization: auth });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 para token assinado com outro segredo', () => {
    const token = jwt.sign({ id: 1 }, 'outro-segredo');
    const { res, next } = executar({ authorization: `Bearer ${token}` });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 para token expirado', () => {
    const token = jwt.sign({ id: 1 }, SEGREDO, { expiresIn: -10 });
    const { res, next } = executar({ authorization: `Bearer ${token}` });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 para token com algoritmo diferente de HS256', () => {
    const token = jwt.sign({ id: 1 }, SEGREDO, { algorithm: 'HS512' });
    const { res, next } = executar({ authorization: `Bearer ${token}` });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next e preenche req.usuarioId com token válido', () => {
    const token = jwt.sign({ id: 42, nome: 'Ana', email: 'a@a.com' }, SEGREDO);
    const { req, res, next } = executar({ authorization: `Bearer ${token}` });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.usuarioId).toBe(42);
    expect(req.usuario).toEqual({ id: 42, nome: 'Ana', email: 'a@a.com' });
  });
});
