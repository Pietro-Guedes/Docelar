// Todas as chamadas ao back-end Docelar ficam aqui.
// As funções devolvem objetos já "traduzidos" para o front (ex.: id_produto -> id,
// valor_unitario -> valorUnitario), assim as telas não dependem dos nomes do banco.

import { request, auth, urlArquivo } from './client';

export const ESTOQUE_MINIMO_PADRAO = 10; // usado enquanto a tabela produto não tiver a coluna estoque_minimo

const dados = (r) => (r && Array.isArray(r.dados) ? r.dados : r?.dados ?? r);
const num = (v) => (v === null || v === undefined || v === '' ? 0 : Number(v));

// ------------------------------------------------------------------ cache simples
// (algumas telas juntam várias rotas; o cache evita repetir chamadas na mesma navegação)
const cache = new Map();
async function cacheado(chave, fn, ttl = 15000) {
  const c = cache.get(chave);
  if (c && Date.now() - c.t < ttl) return c.p;
  const p = fn().catch((e) => { cache.delete(chave); throw e; });
  cache.set(chave, { t: Date.now(), p });
  return p;
}
export const limparCache = () => cache.clear();

// ------------------------------------------------------------------ conversores
const toCategoria = (c) => ({ id: c.id_categoria, nome: c.nome_categoria ?? c.nome });
const toFornecedor = (f) => ({ id: f.id_fornecedor, nome: f.nome, cnpj: f.cnpj || '', telefone: f.telefone || '', email: f.email || '' });
const toFuncionario = (f) => ({ id: f.id_funcionario ?? f.id, nome: f.nome, email: f.email || '' });
const toLote = (l) => ({
  id: l.id_estoque,
  produtoId: l.id_produto,
  fornecedorId: l.id_fornecedor,
  quantidade: num(l.quantidade),
  validade: l.validade,
  dataEntrada: l.data_entrada,
});

export const codigoProduto = (id) => String(id).padStart(3, '0');

// ------------------------------------------------------------------ autenticação
export async function login(email, senha) {
  const r = await request('/funcionario/login', { method: 'POST', body: { email, senha } });
  auth.salvar(r.token, r.funcionario);
  limparCache();
  return r.funcionario;
}

export function logout() {
  auth.clear();
  limparCache();
}

export async function getUsuarioLogado() {
  const f = auth.getFuncionario();
  if (!f?.id) return null;
  try {
    return toFuncionario(dados(await request(`/funcionario/${f.id}`)));
  } catch {
    return { id: f.id, nome: f.nome, email: '' };
  }
}

// ------------------------------------------------------------------ categorias
export const listarCategorias = () =>
  cacheado('categorias', async () => dados(await request('/categoria')).map(toCategoria).sort((a, b) => a.id - b.id), 60000);

export async function salvarCategoria({ id, nome }) {
  limparCache();
  return id
    ? request(`/categoria/${id}`, { method: 'PUT', body: { nome } })
    : request('/categoria', { method: 'POST', body: { nome } });
}

export async function excluirCategoria(id) {
  limparCache();
  return request(`/categoria/${id}`, { method: 'DELETE' });
}

// ------------------------------------------------------------------ fornecedores
export const listarFornecedores = () =>
  cacheado('fornecedores', async () => dados(await request('/cadastrofornecedores')).map(toFornecedor));

export async function salvarFornecedor(f) {
  limparCache();
  const body = { nome: f.nome, cnpj: f.cnpj, telefone: f.telefone || null, email: f.email || null };
  return f.id
    ? request(`/cadastrofornecedores/${f.id}`, { method: 'PUT', body })
    : request('/cadastrofornecedores', { method: 'POST', body });
}

export async function excluirFornecedor(id) {
  limparCache();
  return request(`/cadastrofornecedores/${id}`, { method: 'DELETE' });
}

// ------------------------------------------------------------------ funcionários
export const listarFuncionarios = () =>
  cacheado('funcionarios', async () => dados(await request('/funcionario')).map(toFuncionario));

export async function salvarFuncionario(f) {
  limparCache();
  if (f.id) {
    const body = { nome: f.nome, email: f.email };
    if (f.senha) body.senha = f.senha;
    return request(`/funcionario/${f.id}`, { method: 'PUT', body });
  }
  return request('/funcionario', { method: 'POST', body: { nome: f.nome, email: f.email, senha: f.senha } });
}

export async function excluirFuncionario(id) {
  limparCache();
  return request(`/funcionario/${id}`, { method: 'DELETE' });
}

// ------------------------------------------------------------------ estoque (lotes)
export const listarLotes = () => cacheado('lotes', async () => dados(await request('/estoque')).map(toLote));

// ------------------------------------------------------------------ produtos
async function imagemDoProduto(id) {
  try {
    const imgs = dados(await request(`/imagens/produto/${id}`));
    const ultima = imgs?.[imgs.length - 1];
    return ultima ? { imagem: urlArquivo(ultima.link), imagemId: ultima.id } : {};
  } catch {
    return {};
  }
}

// Junta produto + categoria + fornecedor + soma dos lotes (+ foto)
export const listarProdutos = () =>
  cacheado('produtos', async () => {
    const [produtos, categorias, fornecedores, lotes] = await Promise.all([
      request('/produtos').then(dados),
      listarCategorias().catch(() => []),
      listarFornecedores().catch(() => []),
      listarLotes().catch(() => []),
    ]);
    const imagens = await Promise.all(produtos.map((p) => imagemDoProduto(p.id_produto)));

    return produtos.map((p, i) => {
      const meusLotes = lotes.filter((l) => l.produtoId === p.id_produto);
      const cat = categorias.find((c) => c.id === p.id_categoria);
      const forn = fornecedores.find((f) => f.id === p.id_fornecedor);
      return {
        id: p.id_produto,
        codigo: codigoProduto(p.id_produto),
        nome: p.nome,
        descricao: p.descricao || '',
        valorUnitario: num(p.valor_unitario),
        categoriaId: p.id_categoria,
        categoria: cat?.nome || 'Sem categoria',
        fornecedorId: p.id_fornecedor,
        fornecedor: forn?.nome || '',
        funcionarioId: p.id_funcionario,
        minimo: p.estoque_minimo != null ? num(p.estoque_minimo) : ESTOQUE_MINIMO_PADRAO,
        quantidade: meusLotes.reduce((s, l) => s + l.quantidade, 0),
        lotes: meusLotes,
        unidade: 'un',
        ...imagens[i],
      };
    });
  });

export async function buscarProduto(id) {
  const lista = await listarProdutos();
  return lista.find((p) => String(p.id) === String(id)) || null;
}

// produto: { id?, nome, descricao, valorUnitario, categoriaId, fornecedorId, minimo, quantidadeInicial?, validade? }
export async function salvarProduto(produto, arquivoImagem) {
  const body = {
    nome: produto.nome,
    descricao: produto.descricao,
    valor_unitario: Number(produto.valorUnitario),
    id_categoria: produto.categoriaId ? Number(produto.categoriaId) : null,
    id_fornecedor: produto.fornecedorId ? Number(produto.fornecedorId) : null,
    estoque_minimo: produto.minimo === '' ? undefined : Math.round(Number(produto.minimo)),
  };

  let id = produto.id;
  if (id) {
    await request(`/produtos/${id}`, { method: 'PUT', body });
  } else {
    body.id_funcionario = auth.getFuncionario()?.id;
    const r = await request('/produtos', { method: 'POST', body });
    id = r.id;
    // a quantidade inicial vira o primeiro lote, registrada como ENTRADA (aparece no histórico)
    const qtd = Number(produto.quantidadeInicial);
    if (qtd > 0) {
      await request('/movimentacaoestoque/entrada', {
        method: 'POST',
        body: {
          id_produto: id,
          id_fornecedor: body.id_fornecedor,
          quantidade: qtd,
          valor_unitario: body.valor_unitario,
          validade: produto.validade || null,
          observacao: 'Estoque inicial (cadastro do produto)',
        },
      });
    }
  }

  if (arquivoImagem) {
    const fd = new FormData();
    fd.append('imagem', arquivoImagem);
    await request(`/imagens/produto/${id}`, { method: 'POST', body: fd });
  }

  limparCache();
  return { id };
}

export async function excluirProduto(id) {
  limparCache();
  return request(`/produtos/${id}`, { method: 'DELETE' });
}

// ------------------------------------------------------------------ movimentações
// O back só lista movimentações por produto, então juntamos as de todos os produtos.
export const listarMovimentacoes = () =>
  cacheado('movimentacoes', async () => {
    const [produtos, funcionarios] = await Promise.all([listarProdutos(), listarFuncionarios().catch(() => [])]);
    const porProduto = await Promise.all(
      produtos.map((p) =>
        request(`/movimentacaoestoque/produto/${p.id}`)
          .then((r) => dados(r).map((m) => ({ m, p })))
          .catch(() => []),
      ),
    );
    return porProduto
      .flat()
      .map(({ m, p }) => {
        const valorUnit = m.valor_unitario != null ? num(m.valor_unitario) : p.valorUnitario;
        return {
          id: m.id_movimentacao,
          tipo: m.tipo,
          quantidade: num(m.quantidade),
          valorUnitario: valorUnit,
          valorTotal: valorUnit * num(m.quantidade),
          motivo: m.motivo_devolucao || '',
          observacao: m.observacao || '',
          loteId: m.id_estoque,
          funcionarioId: m.id_funcionario,
          funcionario: funcionarios.find((f) => f.id === m.id_funcionario)?.nome || `#${m.id_funcionario}`,
          data: m.data_movimentacao,
          produtoId: p.id,
          produto: p.nome,
          imagem: p.imagem,
        };
      })
      .sort((a, b) => String(b.data).localeCompare(String(a.data)));
  });

// entrada: { fornecedorId, notaFiscal, dataEmissao, observacoes, itens:[{produtoId, quantidade, valorUnitario, validade}] }
export async function registrarEntrada(entrada) {
  const obs = [entrada.notaFiscal && `NF ${entrada.notaFiscal}`, entrada.dataEmissao && `emitida em ${entrada.dataEmissao}`, entrada.observacoes]
    .filter(Boolean).join(' · ');
  const feitos = [];
  try {
    for (const item of entrada.itens) {
      await request('/movimentacaoestoque/entrada', {
        method: 'POST',
        body: {
          id_produto: item.produtoId,
          id_fornecedor: entrada.fornecedorId ? Number(entrada.fornecedorId) : null,
          quantidade: Number(item.quantidade),
          valor_unitario: Number(item.valorUnitario) || null,
          validade: item.validade || null,
          observacao: obs || null,
        },
      });
      feitos.push(item);
    }
  } finally {
    limparCache();
  }
  return feitos;
}

// saida: { pedido, entregador, pagamento, observacoes, itens:[{produtoId, nome, quantidade}] }
export async function registrarSaida(saida) {
  const obs = [
    saida.pedido && `Pedido ${saida.pedido}`,
    saida.status === 'em_rota' ? 'Em rota' : null,
    saida.entregador && `Entregador: ${saida.entregador}`,
    saida.pagamento && `Pagamento: ${saida.pagamento}`,
    saida.observacoes,
  ].filter(Boolean).join(' · ');

  const feitos = [];
  try {
    for (const item of saida.itens) {
      try {
        await request('/movimentacaoestoque/saida', {
          method: 'POST',
          body: { id_produto: item.produtoId, quantidade: Number(item.quantidade), observacao: obs || null },
        });
      } catch (e) {
        e.message = `${item.nome}: ${e.message}`;
        e.feitos = feitos;
        throw e;
      }
      feitos.push(item);
    }
  } finally {
    limparCache();
  }
  return feitos;
}

// devolucao: { loteId, quantidade, motivo, observacao }
export async function registrarDevolucao(d) {
  try {
    return await request('/movimentacaoestoque/devolucao', {
      method: 'POST',
      body: { id_estoque: Number(d.loteId), quantidade: Number(d.quantidade), motivo_devolucao: d.motivo, observacao: d.observacao || null },
    });
  } finally {
    limparCache();
  }
}

export async function listarDevolucoes() {
  return (await listarMovimentacoes()).filter((m) => m.tipo === 'DEVOLUCAO');
}

// ------------------------------------------------------------------ indicadores (calculados no front)
const DIA = 86400000;
const dentroDe = (data, dias) => Date.now() - new Date(data).getTime() <= dias * DIA;
const mesmoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export function statusDoProduto(p) {
  if (p.quantidade <= 0 || p.quantidade <= p.minimo * 0.5) return 'critico';
  if (p.quantidade < p.minimo) return 'baixo';
  return 'ok';
}

function descreverMov(m) {
  if (m.tipo === 'ENTRADA') return `Entrada de estoque: ${m.produto} (${m.quantidade}).`;
  if (m.tipo === 'SAIDA') return `Saída registrada: ${m.produto} (${m.quantidade}).`;
  return `Devolução processada: ${m.produto} (${m.quantidade}).`;
}

export async function getDashboard() {
  const [produtos, movs] = await Promise.all([listarProdutos(), listarMovimentacoes().catch(() => [])]);
  const hoje = new Date();
  const lotes = produtos.flatMap((p) => p.lotes.map((l) => ({ ...l, produto: p.nome })));
  const ativos = lotes.filter((l) => l.quantidade > 0 && l.validade);
  return {
    totalItens: produtos.reduce((s, p) => s + p.quantidade, 0),
    totalProdutos: produtos.length,
    criticos: produtos.filter((p) => statusDoProduto(p) === 'critico').length,
    baixos: produtos.filter((p) => statusDoProduto(p) === 'baixo').length,
    saidasHoje: movs.filter((m) => m.tipo === 'SAIDA' && mesmoDia(m.data, hoje)).reduce((s, m) => s + m.quantidade, 0),
    vencidos: ativos.filter((l) => new Date(l.validade) < hoje).length,
    vencendo: ativos.filter((l) => { const d = new Date(l.validade); return d >= hoje && d - hoje <= 7 * DIA; }).length,
    atividades: movs.slice(0, 5).map((m) => ({ tipo: m.tipo, titulo: descreverMov(m), data: m.data })),
    percepcoes: [...produtos]
      .filter((p) => p.minimo > 0)
      .sort((a, b) => a.quantidade / a.minimo - b.quantidade / b.minimo)
      .slice(0, 2)
      .map((p) => ({ ...p, nivel: Math.min(100, Math.round((p.quantidade / p.minimo) * 100)) })),
  };
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export async function getRelatorio(dias = 30) {
  const [produtos, movs] = await Promise.all([listarProdutos(), listarMovimentacoes()]);
  const saidas = movs.filter((m) => m.tipo === 'SAIDA');
  const soma = (l) => l.reduce((s, m) => s + m.valorTotal, 0);

  const saidas30 = saidas.filter((m) => dentroDe(m.data, dias));
  const saidas60 = saidas.filter((m) => dentroDe(m.data, dias * 2) && !dentroDe(m.data, dias));
  const vendas30 = soma(saidas30);
  const vendasAnterior = soma(saidas60);
  const estoqueTotal = produtos.reduce((s, p) => s + p.quantidade, 0);
  const qtdSaida30 = saidas30.reduce((s, m) => s + m.quantidade, 0);

  // últimos 6 meses
  const agora = new Date();
  const mensal = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - 5 + i, 1);
    const doMes = (m) => { const x = new Date(m.data); return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear(); };
    return {
      mes: MESES[d.getMonth()],
      saidas: soma(saidas.filter(doMes)),
      entradas: soma(movs.filter((m) => m.tipo === 'ENTRADA' && doMes(m))),
    };
  });

  // produtos que mais saíram (top 3 + outros)
  const porProduto = {};
  saidas.forEach((m) => { porProduto[m.produto] = (porProduto[m.produto] || 0) + m.quantidade; });
  const ranking = Object.entries(porProduto).sort((a, b) => b[1] - a[1]);
  const totalSaida = ranking.reduce((s, [, q]) => s + q, 0) || 1;
  const top = ranking.slice(0, 3).map(([nome, q]) => ({ nome, quantidade: q, percentual: Math.round((q / totalSaida) * 100) }));
  const resto = ranking.slice(3).reduce((s, [, q]) => s + q, 0);
  if (resto > 0) top.push({ nome: 'Outros', quantidade: resto, percentual: Math.max(0, 100 - top.reduce((s, t) => s + t.percentual, 0)) });

  return {
    vendasTotais: vendas30,
    variacaoVendas: vendasAnterior ? Math.round(((vendas30 - vendasAnterior) / vendasAnterior) * 100) : null,
    giroEstoque: estoqueTotal ? qtdSaida30 / estoqueTotal : 0,
    rupturas: produtos.filter((p) => statusDoProduto(p) === 'critico').length,
    devolucoes30: movs.filter((m) => m.tipo === 'DEVOLUCAO' && dentroDe(m.data, dias)).length,
    giroPorMes: estoqueTotal ? (qtdSaida30 / estoqueTotal) * (30 / dias) : 0,
    valorEmEstoque: produtos.reduce((s, p) => s + p.quantidade * p.valorUnitario, 0),
    mensal,
    maisVendidos: top,
    movimentacoes: movs,
  };
}
