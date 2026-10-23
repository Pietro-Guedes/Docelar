import { mockRequest } from './mock';

export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'false') === 'true';

const TOKEN_KEY = 'docelar_token';
const USER_KEY = 'docelar_funcionario';

export const EVENTO_SESSAO_EXPIRADA = 'docelar:sessao-expirada';

const ler = (chave) => sessionStorage.getItem(chave) ?? localStorage.getItem(chave);

export function expiracaoDoToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const auth = {
  getToken: () => {
    const token = ler(TOKEN_KEY);
    const exp = token && expiracaoDoToken(token);
    if (exp && Date.now() >= exp) { auth.clear(); return null; }
    return token;
  },
  getFuncionario: () => {
    try { return JSON.parse(ler(USER_KEY)); } catch { return null; }
  },
  salvar: (token, funcionario, lembrar = true) => {
    auth.clear();
    const storage = lembrar ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(funcionario));
  },
  clear: () => {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(TOKEN_KEY);
      s.removeItem(USER_KEY);
    }
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
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }
}

export function urlArquivo(link) {
  if (!link) return null;
  if (/^(https?:|blob:|data:)/.test(link)) return link;
  return BASE_URL + (link.startsWith('/') ? link : `/${link}`);
}
