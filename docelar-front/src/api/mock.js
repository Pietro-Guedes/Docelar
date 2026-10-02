// "Back-end de mentira" que responde EXATAMENTE como o back-end Docelar (Express + MySQL):
// mesmas rotas, mesmos nomes de campos e o mesmo formato { sucesso, dados, total } / { sucesso, mensagem, id }.
// Usado quando VITE_USE_MOCK=true — serve para apresentar o front sem o servidor/banco rodando.

const hoje = new Date();
const diasAtras = (n, h = 9) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};
const dataISO = (n) => diasAtras(n).slice(0, 10);

const db = {
  categoria: [
    { id_categoria: 1, nome_categoria: 'Derivados do Leite' },
    { id_categoria: 2, nome_categoria: 'Frios' },
    { id_categoria: 3, nome_categoria: 'Salgados' },
    { id_categoria: 4, nome_categoria: 'Doces' },
    { id_categoria: 5, nome_categoria: 'Bebidas' },
    { id_categoria: 6, nome_categoria: 'Recheios' },
    { id_categoria: 7, nome_categoria: 'Embalagens' },
  ],
  fornecedor: [
    { id_fornecedor: 1, nome: 'Moinho Tradição Alimentos Ltda.', cnpj: '12.345.678/0001-99', telefone: '(11) 3333-4444', email: 'contato@moinhotradicao.com.br' },
    { id_fornecedor: 2, nome: 'Laticínios Serra Azul S/A', cnpj: '98.765.432/0001-10', telefone: '(35) 3222-1100', email: 'vendas@serraazul.com.br' },
    { id_fornecedor: 3, nome: 'Embalagens Paulista Ltda.', cnpj: '45.111.222/0001-33', telefone: '(11) 4002-8922', email: 'comercial@embpaulista.com.br' },
  ],
  funcionario: [
    { id_funcionario: 1, nome: 'Matheus Chef', email: 'matheus@docelar.com.br', senha_hash: 'x' },
    { id_funcionario: 2, nome: 'Marina Souza', email: 'marina@docelar.com.br', senha_hash: 'x' },
    { id_funcionario: 3, nome: 'Luan Silva', email: 'luan@docelar.com.br', senha_hash: 'x' },
  ],
  produto: [
    { id_produto: 1, nome: 'Pão de Forma', descricao: 'Pão de forma tradicional fatiado', valor_unitario: 18.5, id_categoria: 3, id_fornecedor: 1, id_funcionario: 1, estoque_minimo: 15 },
    { id_produto: 2, nome: 'Empada de Frango', descricao: 'Empada de massa amanteigada', valor_unitario: 12, id_categoria: 3, id_fornecedor: null, id_funcionario: 1, estoque_minimo: 20 },
    { id_produto: 3, nome: 'Baguete Tradicional', descricao: 'Baguete de fermentação natural', valor_unitario: 12, id_categoria: 3, id_fornecedor: 1, id_funcionario: 1, estoque_minimo: 20 },
    { id_produto: 4, nome: 'Pão Francês', descricao: 'Pão francês (unidade)', valor_unitario: 1.5, id_categoria: 3, id_fornecedor: 1, id_funcionario: 1, estoque_minimo: 80 },
    { id_produto: 5, nome: 'Bolo de Cenoura', descricao: 'Bolo com cobertura de chocolate', valor_unitario: 18.5, id_categoria: 4, id_fornecedor: null, id_funcionario: 2, estoque_minimo: 15 },
    { id_produto: 6, nome: 'Torta de Limão', descricao: 'Torta com merengue', valor_unitario: 15, id_categoria: 4, id_fornecedor: null, id_funcionario: 2, estoque_minimo: 20 },
    { id_produto: 7, nome: 'Brigadeiro', descricao: 'Brigadeiro gourmet', valor_unitario: 3.5, id_categoria: 4, id_fornecedor: null, id_funcionario: 2, estoque_minimo: 20 },
    { id_produto: 8, nome: 'Leite Integral (L)', descricao: 'Leite integral 1 litro', valor_unitario: 6, id_categoria: 1, id_fornecedor: 2, id_funcionario: 1, estoque_minimo: 20 },
    { id_produto: 9, nome: 'Manteiga Extra s/ Sal', descricao: 'Manteiga (kg)', valor_unitario: 42.5, id_categoria: 1, id_fornecedor: 2, id_funcionario: 1, estoque_minimo: 10 },
    { id_produto: 10, nome: 'Presunto Cozido', descricao: 'Presunto (kg)', valor_unitario: 39.9, id_categoria: 2, id_fornecedor: null, id_funcionario: 1, estoque_minimo: 5 },
    { id_produto: 11, nome: 'Suco de Laranja 300ml', descricao: 'Suco natural', valor_unitario: 8, id_categoria: 5, id_fornecedor: null, id_funcionario: 1, estoque_minimo: 20 },
    { id_produto: 12, nome: 'Doce de Leite', descricao: 'Doce de leite (kg)', valor_unitario: 22, id_categoria: 6, id_fornecedor: 2, id_funcionario: 2, estoque_minimo: 8 },
    { id_produto: 13, nome: 'Caixa de Bolo 20cm', descricao: 'Caixa de papelão', valor_unitario: 2.1, id_categoria: 7, id_fornecedor: 3, id_funcionario: 1, estoque_minimo: 50 },
    { id_produto: 14, nome: 'Saco Kraft P', descricao: 'Saco de papel kraft', valor_unitario: 0.35, id_categoria: 7, id_fornecedor: 3, id_funcionario: 1, estoque_minimo: 300 },
  ],
  estoque: [],
  movimentacao_estoque: [],
  imagem: [],
};

// gera lotes e movimentações dos últimos meses para os gráficos ficarem com cara de verdade
(function semear() {
  const saldos = { 1: 24, 2: 4, 3: 4, 4: 150, 5: 24, 6: 4, 7: 9, 8: 8, 9: 12, 10: 6, 11: 9, 12: 14, 13: 40, 14: 1200 };
  let idL = 0, idM = 0;
  Object.entries(saldos).forEach(([idp, saldo]) => {
    const p = db.produto.find((x) => x.id_produto === Number(idp));
    const id_estoque = ++idL;
    db.estoque.push({ id_estoque, id_produto: p.id_produto, id_fornecedor: p.id_fornecedor, quantidade: saldo, validade: dataISO(-20 - idL), data_entrada: diasAtras(150) });
    // saídas espalhadas nos últimos 5 meses (pão francês e saco kraft saem bem mais)
    const giro = { 4: 9, 14: 6, 7: 4, 1: 3, 5: 3 }[p.id_produto] || 1;
    const dias = [140, 112, 85, 58, 31, 12, 4, 1, 0];
    const totalSaida = 60 * giro;
    // entradas: uma inicial e reposições mensais
    [[150, 0.4], [118, 0.15], [88, 0.15], [55, 0.15], [24, 0.15]].forEach(([d, f], i) => {
      const q = Math.round(totalSaida * f) + (i === 0 ? saldo : 0);
      db.movimentacao_estoque.push({ id_movimentacao: ++idM, tipo: 'ENTRADA', quantidade: q, valor_unitario: p.valor_unitario, motivo_devolucao: null, observacao: i === 0 ? 'Estoque inicial' : 'Reposição mensal', id_estoque, id_funcionario: 1, data_movimentacao: diasAtras(d, 7) });
    });
    let restante = totalSaida;
    dias.forEach((d, i) => {
      const base = Math.round((2 + ((p.id_produto * 7 + i * 3) % 3)) * giro * (1 + i / 8));
      const q = i === dias.length - 1 ? restante : Math.min(restante, base);
      if (q <= 0) return;
      restante -= q;
      const quando = d === 0 ? new Date(Date.now() - (p.id_produto + 1) * 25 * 60000).toISOString() : diasAtras(d, 8 + (i % 8));
      db.movimentacao_estoque.push({ id_movimentacao: ++idM, tipo: 'SAIDA', quantidade: q, valor_unitario: null, motivo_devolucao: null, observacao: null, id_estoque, id_funcionario: 3, data_movimentacao: quando });
    });
  });
  db.movimentacao_estoque.push({ id_movimentacao: ++idM, tipo: 'DEVOLUCAO', quantidade: 4, valor_unitario: null, motivo_devolucao: 'Produto com avaria ou defeito de fabricação', observacao: 'Protocolo #2024-0891 · Cliente: João Oliveira Mendes', id_estoque: 3, id_funcionario: 1, data_movimentacao: diasAtras(2) });
  db.movimentacao_estoque.push({ id_movimentacao: ++idM, tipo: 'DEVOLUCAO', quantidade: 10, valor_unitario: null, motivo_devolucao: 'Produto fora da validade', observacao: 'Protocolo #2024-0890 · Cliente: Padaria Esquina Gourmet', id_estoque: 1, id_funcionario: 1, data_movimentacao: diasAtras(3) });
  db._seq = { estoque: idL, movimentacao_estoque: idM };
})();

const seq = { categoria: 7, fornecedor: 3, funcionario: 3, produto: 14, imagem: 0, ...db._seq };
const novoId = (t) => ++seq[t];

class MockError extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; this.data = { sucesso: false, mensagem }; }
}
const falha = (status, mensagem) => { throw new MockError(status, mensagem); };
const lista = (dados) => ({ sucesso: true, dados, total: dados.length });
const semSenha = ({ senha_hash, ...r }) => r;

// CRUD genérico igual aos controllers do back
function crud(tabela, pk, { validar, campos, publico = (x) => x } = {}) {
  return {
    listar: () => lista([...db[tabela]].sort((a, b) => b[pk] - a[pk]).map(publico)),
    buscar: (id) => {
      const item = db[tabela].find((x) => x[pk] === Number(id));
      if (!item) falha(404, 'Registro não encontrado');
      return { sucesso: true, dados: publico(item) };
    },
    criar: (body) => {
      validar?.(body);
      const novo = { [pk]: novoId(tabela), ...pick(body, campos) };
      db[tabela].push(novo);
      return { sucesso: true, mensagem: 'Cadastrado com sucesso', id: novo[pk] };
    },
    atualizar: (id, body) => {
      const item = db[tabela].find((x) => x[pk] === Number(id));
      if (!item) falha(404, 'Registro não encontrado');
      Object.assign(item, pick(body, campos));
      return { sucesso: true, mensagem: 'Atualizado com sucesso' };
    },
    apagar: (id) => {
      const i = db[tabela].findIndex((x) => x[pk] === Number(id));
      if (i < 0) falha(404, 'Registro não encontrado');
      db[tabela].splice(i, 1);
      return { sucesso: true, mensagem: 'Apagado com sucesso' };
    },
  };
}
const pick = (o, ks) => Object.fromEntries(ks.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

const produtos = crud('produto', 'id_produto', {
  campos: ['nome', 'descricao', 'valor_unitario', 'id_categoria', 'id_fornecedor', 'id_funcionario', 'estoque_minimo'],
  validar: (b) => {
    if (!b.nome || !b.descricao || b.valor_unitario === undefined) falha(400, 'Nome, descrição e valor unitário são obrigatórios');
    if (!b.id_funcionario) falha(400, 'Funcionário responsável pelo cadastro é obrigatório');
  },
});
const categorias = crud('categoria', 'id_categoria', { campos: ['nome_categoria'] });
const fornecedores = crud('fornecedor', 'id_fornecedor', {
  campos: ['nome', 'cnpj', 'telefone', 'email'],
  validar: (b) => {
    if (!b.nome || !b.cnpj) falha(400, 'Nome e CNPJ são obrigatórios');
    if (db.fornecedor.some((f) => f.cnpj === b.cnpj.trim())) falha(409, 'CNPJ já cadastrado');
  },
});
const funcionarios = crud('funcionario', 'id_funcionario', {
  campos: ['nome', 'email', 'senha_hash'],
  publico: semSenha,
  validar: (b) => {
    if (!b.nome || !b.email || !b.senha) falha(400, 'Nome, email e senha são obrigatórios');
    if (b.senha.length < 6) falha(400, 'Senha deve ter no mínimo 6 caracteres');
    if (db.funcionario.some((f) => f.email === b.email.trim().toLowerCase())) falha(409, 'Email já cadastrado');
  },
});
const estoque = crud('estoque', 'id_estoque', { campos: ['id_produto', 'id_fornecedor', 'quantidade', 'validade', 'data_entrada'] });

function exigeToken(headers) {
  if (!headers.Authorization) falha(401, 'Token não informado');
  return Number(headers.Authorization.split('.').pop()) || 1;
}

function movimentar(tipo, dados, id_funcionario, id_estoque, quantidade) {
  const m = {
    id_movimentacao: novoId('movimentacao_estoque'),
    tipo, quantidade, valor_unitario: dados.valor_unitario ?? null,
    motivo_devolucao: dados.motivo_devolucao ?? null, observacao: dados.observacao ?? null,
    id_estoque, id_funcionario, data_movimentacao: new Date().toISOString(),
  };
  db.movimentacao_estoque.push(m);
  return m.id_movimentacao;
}

// ---------------------------------------------------------------- roteador
export async function mockRequest(path, { method = 'GET', body, headers = {} }) {
  await new Promise((r) => setTimeout(r, 120));
  const [, recurso, a, b] = path.split('?')[0].split('/');
  const id = a;

  switch (recurso) {
    case '':
    case undefined:
      return { mensagem: 'API Docelar (modo demonstração)', versao: '1.0.0' };

    case 'funcionario': {
      if (a === 'login' && method === 'POST') {
        const email = (body?.email || '').trim().toLowerCase();
        if (!email || !body?.senha) falha(400, 'Email e senha são obrigatórios');
        let f = db.funcionario.find((x) => x.email === email);
        if (!f) f = db.funcionario[0]; // no modo demonstração qualquer e-mail entra
        return { sucesso: true, mensagem: 'Login realizado com sucesso', token: `demo.token.${f.id_funcionario}`, funcionario: { id: f.id_funcionario, nome: f.nome } };
      }
      if (method === 'POST') {
        const r = funcionarios.criar({ ...body, email: body.email?.trim().toLowerCase() });
        db.funcionario.find((x) => x.id_funcionario === r.id).senha_hash = 'x';
        return r;
      }
      exigeToken(headers);
      if (method === 'GET') return id ? funcionarios.buscar(id) : funcionarios.listar();
      if (method === 'PUT') { const { senha, ...resto } = body; return funcionarios.atualizar(id, resto); }
      if (method === 'DELETE') return funcionarios.apagar(id);
      break;
    }

    case 'categoria':
      if (method === 'GET') return id ? categorias.buscar(id) : categorias.listar();
      if (method === 'POST') return categorias.criar({ nome_categoria: body.nome });
      if (method === 'PUT') return categorias.atualizar(id, { nome_categoria: body.nome });
      if (method === 'DELETE') return categorias.apagar(id);
      break;

    case 'cadastrofornecedores':
      if (method === 'GET') return id ? fornecedores.buscar(id) : fornecedores.listar();
      if (method === 'POST') return fornecedores.criar(body);
      if (method === 'PUT') return fornecedores.atualizar(id, body);
      if (method === 'DELETE') return fornecedores.apagar(id);
      break;

    case 'produtos':
      if (method === 'GET') return id ? produtos.buscar(id) : produtos.listar();
      if (method === 'POST') return produtos.criar(body);
      if (method === 'PUT') return produtos.atualizar(id, body);
      if (method === 'DELETE') return produtos.apagar(id);
      break;

    case 'estoque':
      if (method === 'GET') return id ? estoque.buscar(id) : estoque.listar();
      if (method === 'POST') {
        if (!(body.quantidade > 0)) falha(400, 'Quantidade deve ser um número positivo');
        return estoque.criar({ ...body, data_entrada: new Date().toISOString() });
      }
      if (method === 'PUT') return estoque.atualizar(id, body);
      if (method === 'DELETE') return estoque.apagar(id);
      break;

    case 'movimentacaoestoque': {
      const idFunc = exigeToken(headers);
      if (a === 'produto' && method === 'GET') {
        const lotes = db.estoque.filter((l) => l.id_produto === Number(b)).map((l) => l.id_estoque);
        const movs = db.movimentacao_estoque.filter((m) => lotes.includes(m.id_estoque))
          .sort((x, y) => y.data_movimentacao.localeCompare(x.data_movimentacao));
        return lista(movs);
      }
      if (a === 'entrada') {
        if (!(body.quantidade > 0)) falha(400, 'Quantidade deve ser um número positivo');
        const id_estoque = novoId('estoque');
        db.estoque.push({ id_estoque, id_produto: body.id_produto, id_fornecedor: body.id_fornecedor || null, quantidade: body.quantidade, validade: body.validade || null, data_entrada: new Date().toISOString() });
        const id_movimentacao = movimentar('ENTRADA', body, idFunc, id_estoque, body.quantidade);
        return { sucesso: true, mensagem: 'Entrada registrada com sucesso', id_movimentacao, id_estoque };
      }
      if (a === 'saida') {
        if (!(body.quantidade > 0)) falha(400, 'Quantidade deve ser um número positivo');
        const lotes = db.estoque.filter((l) => l.id_produto === body.id_produto && l.quantidade > 0)
          .sort((x, y) => String(x.validade).localeCompare(String(y.validade)));
        const saldo = lotes.reduce((s, l) => s + l.quantidade, 0);
        if (saldo < body.quantidade) falha(400, `Saldo insuficiente. Disponível: ${saldo}`);
        let restante = body.quantidade;
        const movimentacoes = [];
        for (const l of lotes) {
          if (restante <= 0) break;
          const c = Math.min(l.quantidade, restante);
          l.quantidade -= c;
          movimentacoes.push({ id_movimentacao: movimentar('SAIDA', body, idFunc, l.id_estoque, c), id_estoque: l.id_estoque, quantidade: c });
          restante -= c;
        }
        return { sucesso: true, mensagem: 'Saída registrada com sucesso', movimentacoes };
      }
      if (a === 'devolucao') {
        if (!body.id_estoque) falha(400, 'Lote é obrigatório');
        if (!(body.quantidade > 0)) falha(400, 'Quantidade deve ser um número positivo');
        if (!body.motivo_devolucao) falha(400, 'Motivo da devolução é obrigatório');
        if (!db.estoque.some((l) => l.id_estoque === Number(body.id_estoque))) falha(404, 'Lote não encontrado');
        const id_movimentacao = movimentar('DEVOLUCAO', body, idFunc, Number(body.id_estoque), body.quantidade);
        return { sucesso: true, mensagem: 'Devolução registrada com sucesso', id_movimentacao };
      }
      break;
    }

    case 'imagens':
      if (a === 'produto' && method === 'GET') return lista(db.imagem.filter((i) => i.id_produto === Number(b)));
      if (a === 'produto' && method === 'POST') {
        const arquivo = body?.get?.('imagem');
        if (!arquivo) falha(400, 'Nenhuma imagem enviada');
        const novo = { id: novoId('imagem'), link: URL.createObjectURL(arquivo), id_produto: Number(b) };
        db.imagem.push(novo);
        return { sucesso: true, mensagem: 'Imagem cadastrada com sucesso', id: novo.id };
      }
      if (method === 'DELETE') {
        db.imagem = db.imagem.filter((i) => i.id !== Number(a));
        return { sucesso: true, mensagem: 'Imagem apagada com sucesso' };
      }
      break;
  }
  falha(404, `Rota não encontrada: ${method} ${path}`);
}
