import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, ClipboardList, AlertTriangle, AlertCircle, Printer, Pencil, Trash2, Plus } from 'lucide-react';
import { StatCard, Thumb, StatusBadge, Pagination, usePaginacao, Confirm, Erro, Loading } from '../components/ui';
import { listarProdutos, listarCategorias, excluirProduto, statusDoProduto } from '../api';
import { dinheiro, numero, useAsync, mensagemErro } from '../utils';
import './Inventario.css';

async function carregar() {
  const [produtos, categorias] = await Promise.all([listarProdutos(), listarCategorias().catch(() => [])]);
  return { produtos, categorias };
}

export default function Inventario() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const busca = params.get('busca') || '';
  const status = params.get('status') || '';
  const { data, loading, error, reload } = useAsync(carregar, []);
  const [apagar, setApagar] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);

  const produtos = data?.produtos || [];
  const filtrados = useMemo(() => {
    let l = produtos;
    if (busca) {
      const q = busca.toLowerCase();
      l = l.filter((p) => p.nome.toLowerCase().includes(q) || p.codigo.includes(q) || p.categoria.toLowerCase().includes(q));
    }
    if (status) l = l.filter((p) => statusDoProduto(p) === status);
    return l;
  }, [produtos, busca, status]);
  const pag = usePaginacao(filtrados, 8);

  const valorTotal = produtos.reduce((s, p) => s + p.quantidade * p.valorUnitario, 0);
  const itensTotais = produtos.reduce((s, p) => s + p.quantidade, 0);
  const baixos = produtos.filter((p) => statusDoProduto(p) === 'baixo').length;
  const criticos = produtos.filter((p) => statusDoProduto(p) === 'critico').length;
  const categoriasAtivas = new Set(produtos.map((p) => p.categoriaId).filter(Boolean)).size;

  function filtrarStatus(s) {
    const n = new URLSearchParams(params);
    if (!s || s === status) n.delete('status'); else n.set('status', s);
    setParams(n);
  }

  async function confirmarApagar() {
    const p = apagar;
    setApagar(null);
    try {
      await excluirProduto(p.id);
      reload();
    } catch (e) {
      setErroAcao(new Error(mensagemErro(e)));
    }
  }

  return (
    <div className="page">
      <Erro error={error || erroAcao} onRetry={error ? reload : undefined} />
      {loading && !data && <Loading />}

      {data && (
        <>
          <div className="stats cols-4">
            <StatCard icon={Wallet} label="Valor total" value={dinheiro(valorTotal)} sub="Soma de quantidade × valor unitário" />
            <StatCard icon={ClipboardList} iconTone="creme" label="Itens totais" value={numero(itensTotais)} sub={`${categoriasAtivas} categorias ativas`} />
            <button className={`stat-btn ${status === 'baixo' ? 'on' : ''}`} onClick={() => filtrarStatus('baixo')}>
              <StatCard icon={AlertTriangle} iconTone="creme" label="Baixo estoque" value={baixos} sub="Requer atenção imediata" />
            </button>
            <button className={`stat-btn ${status === 'critico' ? 'on' : ''}`} onClick={() => filtrarStatus('critico')}>
              <StatCard icon={AlertCircle} iconTone="red" label="Crítico" value={criticos} sub="Ruptura iminente" critical />
            </button>
          </div>

          <div className="inv-barra">
            <div className="chips">
              <button className="chip active">Todos</button>
              {data.categorias.map((c) => (
                <Link key={c.id} to={`/inventario/${c.id}`} className="chip">{c.nome}</Link>
              ))}
            </div>
            <div className="page-actions no-print">
              <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={17} /> Imprimir Relatório</button>
              <button className="btn btn-primary" onClick={() => navigate('/produtos/novo')}><Plus size={16} /> Novo Produto</button>
            </div>
          </div>

          {(busca || status) && (
            <div className="inv-filtro">
              Mostrando {busca && <>resultados para <b>“{busca}”</b></>}{busca && status && ' · '}{status && <>status <b>{status === 'critico' ? 'Crítico' : status === 'baixo' ? 'Baixo' : 'OK'}</b></>}
              <button className="btn btn-ghost" onClick={() => setParams({})}>Limpar filtro</button>
            </div>
          )}

          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table className="table dark-head">
                <thead>
                  <tr><th>Produto</th><th>Categoria</th><th>Qtd. estoque</th><th className="num">Valor total</th><th className="center">Status</th><th className="center no-print">Ações</th></tr>
                </thead>
                <tbody>
                  {pag.itens.length === 0 && <tr><td colSpan={6} className="empty">Nenhum produto encontrado.</td></tr>}
                  {pag.itens.map((p) => {
                    const s = statusDoProduto(p);
                    return (
                      <tr key={p.id}>
                        <td><div className="prod-cell strong"><Thumb src={p.imagem} alt={p.nome} />{p.nome}</div></td>
                        <td>{p.categoria}</td>
                        <td style={{ color: s === 'ok' ? 'var(--texto)' : 'var(--critico)', fontWeight: 600 }}>{numero(p.quantidade)} {p.unidade}</td>
                        <td className="num strong">{dinheiro(p.quantidade * p.valorUnitario)}</td>
                        <td className="center"><StatusBadge status={s} /></td>
                        <td className="center no-print">
                          <Link className="icon-btn" to={`/produtos/${p.id}`} aria-label={`Editar ${p.nome}`}><Pencil size={16} /></Link>
                          <button className="icon-btn danger" onClick={() => setApagar(p)} aria-label={`Apagar ${p.nome}`}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer" style={{ borderRadius: 0 }}>
              <span>Mostrando {pag.itens.length} de {filtrados.length} itens</span>
              <Pagination page={pag.page} total={pag.total} onChange={pag.setPage} />
            </div>
          </section>
        </>
      )}

      <Confirm open={!!apagar} texto={`Apagar "${apagar?.nome}"? Essa ação não pode ser desfeita.`} onConfirm={confirmarApagar} onCancel={() => setApagar(null)} />
    </div>
  );
}
