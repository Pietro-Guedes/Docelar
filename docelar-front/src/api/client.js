// Cliente HTTP único do front, ligado ao back-end Docelar (Express, porta 3000).
// O back responde sempre { sucesso, dados, total } ou { sucesso, mensagem, id };
// em caso de erro: { sucesso: false, mensagem }.

import { mockRequest } from './mock';

export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'false') === 'true';

const TOKEN_KEY = 'docelar_token';
const USER_KEY = 'docelar_funcionario';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getFuncionario: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  salvar: (token, funcionario) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(funcionario));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  if (USE_MOCK) {
    try {
      return await mockRequest(path, { method, body, headers });
    } catch (e) {
      tratar401(e.status);
      throw new ApiError(e.message, e.status, e.data);
    }
  }

  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(`Não foi possível falar com o servidor (${BASE_URL}). Ele está rodando?`, 0);
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    tratar401(res.status);
    const msg = (data && (data.mensagem || data.message)) || `Erro ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

function tratar401(status) {
  if (status === 401 && auth.getToken()) {
    auth.clear();
    if (!location.pathname.startsWith('/login')) location.assign('/login');
  }
}

// links de imagem do back vêm como "/uploads/arquivo.png"
export function urlArquivo(link) {
  if (!link) return null;
  if (/^(https?:|blob:|data:)/.test(link)) return link;
  return BASE_URL + (link.startsWith('/') ? link : `/${link}`);
}
