/* =========================================================
   DOCELAR — camada de API
   Base ligada ao backend Express (app.js / server.js), que
   escuta na porta 3000 e monta as rotas em index.js:
     /funcionario
     /categoria
     /estoque
     /cadastrofornecedroes   (nome da rota, com esse typo mesmo)
     /produtos
     /movimentacaoestoque
     /imagens
   ========================================================= */
 
const API_BASE = "http://localhost:3000";
 
/**
 * Chamada genérica de API.
 * - Se `body` for FormData (upload de imagem), não define Content-Type
 *   manualmente: o browser define o boundary do multipart sozinho.
 * - O backend sempre responde { sucesso, dados|mensagem, ... } ou lança
 *   erro com { status, mensagem } (ver *Service.js) — aqui isso vira
 *   uma Error com `.status` e `.mensagem` anexados.
 */
async function apiRequest(endpoint, { method = "GET", body, headers = {} } = {}) {
  const isFormData = body instanceof FormData;
 
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: isFormData ? headers : { "Content-Type": "application/json", ...headers },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });
 
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* resposta sem corpo JSON (ex.: 204) */
  }
 
  if (!response.ok) {
    const mensagem = payload?.mensagem || `Erro HTTP ${response.status}`;
    const erro = new Error(mensagem);
    erro.status = response.status;
    erro.mensagem = mensagem;
    throw erro;
  }
 
  return payload;
}
 
const Api = {
  produtos: {
    listar: () => apiRequest("/produtos"),
    buscarPorId: (id) => apiRequest(`/produtos/${id}`),
    cadastrar: (dados) => apiRequest("/produtos", { method: "POST", body: dados }),
    atualizar: (id, dados) => apiRequest(`/produtos/${id}`, { method: "PUT", body: dados }),
    deletar: (id) => apiRequest(`/produtos/${id}`, { method: "DELETE" }),
  },
  categorias: {
    listar: () => apiRequest("/categoria"),
  },
  fornecedores: {
    listar: () => apiRequest("/cadastrofornecedroes"),
  },
  funcionarios: {
    listar: () => apiRequest("/funcionario"),
  },
  imagens: {
    cadastrar: (idProduto, arquivo) => {
      const formData = new FormData();
      formData.append("imagem", arquivo);
      return apiRequest(`/imagens/produto/${idProduto}`, { method: "POST", body: formData });
    },
  },
};