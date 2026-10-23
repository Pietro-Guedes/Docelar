import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClipboardCheck, Banknote, AlertTriangle, Printer, FileDown, Pencil, Trash2 } from 'lucide-react';
import { StatCard, Thumb, QtdPill, Pagination, usePaginacao, Confirm, Erro, Loading } from '../components/ui';
import { usePageMeta } from '../components/Layout';
import { listarProdutos, listarCategorias, excluirProduto, statusDoProduto } from '../api';
import { dinheiro, dinheiroPartes, numero, pad2, useAsync, mensagemErro } from '../utils';
import './Inventario.css';

const FILTROS = [
  { id: '', label: 'Todos' },
  { id: 'ok', label: 'Em Estoque' },
  { id: 'baixo', label: 'Baixo Estoque' },
  { id: 'critico', label: 'Crítico', danger: true },
];

export default function InventarioCategoria() {
  const { categoria } = useParams();
  const [filtro, setFiltro] = useState('');
  const [apagar, setApagar] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const [produtos, categorias] = await Promise.all([listarProdutos(), listarCategorias()]);
    const cat = categorias.find((c) => String(c.id) === String(categoria));
    return { cat, produtos: produtos.filter((p) => String(p.categoriaId) === String(categoria)) };
  }, [categoria]);

  const nome = data?.cat?.nome || (loading ? '...' : 'Categoria');

  usePageMeta({
    breadcrumb: ['Inventário', nome],
    title: nome,
    footerActions: (
      <>
        <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={18} /> Imprimir Relatório</button>
        <button className="btn btn-primary" onClick={() => window.print()} title="Na janela de impressão escolha “Salvar como PDF”"><FileDown size={18} /> Exportar PDF</button>
      </>
    ),
  }, [nome]);

  const produtos = data?.produtos || [];
  const lista = useMemo(() => (filtro ? produtos.filter((p) => statusDoProduto(p) === filtro) : produtos), [produtos, filtro]);
  const pag = usePaginacao(lista, 6);

  const totalItens = produtos.reduce((s, p) => s + p.quantidade, 0);
  const valor = dinheiroPartes(produtos.reduce((s, p) => s + p.quantidade * p.valorUnitario, 0));
  const criticos = produtos.filter((p) => statusDoProduto(p) === 'critico').length;

  async function confirmarApagar() {
    const p = apagar;
    setApagar(null);
    try { await excluirProduto(p.id); reload(); } catch (e) { setErroAcao(new Error(mensagemErro(e))); }
  }

  return (
    <div className="page">
      <Erro error={error || erroAcao} onRetry={error ? reload : undefined} />
      {loading && !data && <Loading />}
      {data && !data.cat && <div className="erro-box">Categoria não encontrada. <Link to="/inventario">Voltar ao inventário</Link></div>}

      {data?.cat && (
        <>
          <div className="stats">
            <StatCard icon={ClipboardCheck} label="Total de itens" value={numero(totalItens)} note={`${produtos.length} produtos`} />
            <StatCard icon={Banknote} iconTone="creme" label="Valor em estoque" value={valor.inteiro} cents={valor.centavos} note="Avaliação atual" />
            <StatCard icon={AlertTriangle} iconTone="red" label="Estoque crítico" value={pad2(criticos)} pill={criticos ? 'Ação Requerida' : undefined} critical />
          </div>

          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="mov-tabela-head" style={{ display: 'flex', padding: 24, borderBottom: '1px solid var(--borda-suave)' }}>
              <div className="chips">
                {FILTROS.map((f) => (
                  <button key={f.id} className={`chip ${f.danger ? 'danger' : ''} ${filtro === f.id ? 'active' : ''}`} onClick={() => setFiltro(f.id)}>{f.label}</button>
                ))}
              </div>
              <Link to="/produtos/novo" className="btn btn-outline no-print">Novo produto</Link>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cod</th><th>Nome do produto</th><th className="center">Qtd atual</th><th className="center">Mínimo</th>
                    <th>Valor unit.</th><th>Total</th><th className="num no-print">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pag.itens.length === 0 && <tr><td colSpan={7} className="empty">Nenhum produto {filtro ? 'neste filtro' : 'nesta categoria'}.</td></tr>}
                  {pag.itens.map((p) => (
                    <tr key={p.id} className="linha-acoes">
                      <td className="muted">{p.codigo}</td>
                      <td><div className="prod-cell" style={{ fontSize: 16 }}><Thumb src={p.imagem} alt={p.nome} />{p.nome}</div></td>
                      <td className="center"><QtdPill produto={p} /></td>
                      <td className="center" style={{ fontSize: 16 }}>{p.minimo}</td>
                      <td style={{ fontSize: 16 }}>{dinheiro(p.valorUnitario)}</td>
                      <td style={{ fontSize: 16, color: 'var(--marrom-texto)' }}>{dinheiro(p.quantidade * p.valorUnitario)}</td>
                      <td className="num no-print acoes-hover">
                        <Link className="icon-btn" to={`/produtos/${p.id}`} aria-label={`Editar ${p.nome}`}><Pencil size={17} /></Link>
                        <button className="icon-btn danger" onClick={() => setApagar(p)} aria-label={`Apagar ${p.nome}`}><Trash2 size={17} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pag.total > 1 && (
              <div className="table-footer" style={{ borderRadius: 0 }}>
                <span>Mostrando {pag.itens.length} de {lista.length} itens</span>
                <Pagination page={pag.page} total={pag.total} onChange={pag.setPage} />
              </div>
            )}
          </section>
        </>
      )}

      <Confirm open={!!apagar} texto={`Apagar "${apagar?.nome}"? Essa ação não pode ser desfeita.`} onConfirm={confirmarApagar} onCancel={() => setApagar(null)} />
    </div>
  );
}
