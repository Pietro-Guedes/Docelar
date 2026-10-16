import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tags, Pencil, Trash2, Save, X, Lightbulb, Search, FolderPlus } from 'lucide-react';
import { Feedback, useFeedback, Confirm, Erro, Loading, Pagination, usePaginacao } from '../components/ui';
import { usePageMeta } from '../components/Layout';
import { listarCategorias, listarProdutos, salvarCategoria, excluirCategoria } from '../api';
import { useAsync, mensagemErro } from '../utils';
import './Cadastros.css';

const VAZIO = { id: null, nome: '' };

async function carregar() {
  const [categorias, produtos] = await Promise.all([listarCategorias(), listarProdutos().catch(() => [])]);
  return [...categorias]
    .sort((a, b) => b.id - a.id)
    .map((c) => ({ ...c, produtos: produtos.filter((p) => p.categoriaId === c.id).length }));
}

export default function Categorias() {
  usePageMeta({ breadcrumb: ['Cadastros', 'Categorias'], title: 'Categorias' });
  const feedback = useFeedback();
  const { data, loading, error, reload } = useAsync(carregar, []);
  const [form, setForm] = useState(VAZIO);
  const [erroCampo, setErroCampo] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [apagar, setApagar] = useState(null);
  const [busca, setBusca] = useState('');

  const lista = (data || []).filter((c) => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()));
  const pag = usePaginacao(lista, 8);
  const semProduto = (data || []).filter((c) => c.produtos === 0).length;

  function editar(c) {
    setForm({ id: c.id, nome: c.nome });
    setErroCampo('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelar() {
    setForm(VAZIO);
    setErroCampo('');
  }

  async function salvar(e) {
    e.preventDefault();
    setErroGeral('');
    const nome = form.nome.trim();
    if (!nome) return setErroCampo('Informe o nome da categoria');
    if (nome.length > 60) return setErroCampo('Use no máximo 60 caracteres');
    const repetida = (data || []).find((c) => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== form.id);
    if (repetida) return setErroCampo('Já existe uma categoria com esse nome');
    setErroCampo('');
    setSalvando(true);
    try {
      await salvarCategoria({ id: form.id, nome });
      feedback.mostrar(form.id ? 'Salvo' : 'Concluído');
      setForm(VAZIO);
      reload();
    } catch (err) {
      setErroGeral(mensagemErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarApagar() {
    const c = apagar;
    setApagar(null);
    try {
      await excluirCategoria(c.id);
      if (form.id === c.id) setForm(VAZIO);
      reload();
    } catch (err) {
      setErroGeral(`Não foi possível apagar: ${mensagemErro(err)}`);
    }
  }

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Categorias</h1>
        <p className="page-subtitle">Organize os produtos da padaria em grupos para achar tudo mais rápido no inventário.</p>
      </div>

      {erroGeral && <div className="erro-box">{erroGeral}</div>}

      <div className="two-col">
        <form className="card" onSubmit={salvar} noValidate>
          <h3 className="section-title" style={{ marginBottom: 20 }}>
            <FolderPlus size={18} /> {form.id ? 'Editando categoria' : 'Nova categoria'}
          </h3>
          <div className="field">
            <label className="label" htmlFor="c-nome">Nome da categoria</label>
            <input
              id="c-nome"
              className="input"
              placeholder="Ex: Pães de Fermentação Natural"
              maxLength={60}
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />
            {erroCampo && <small className="campo-erro">{erroCampo}</small>}
          </div>
          <div className="cad-botoes">
            {form.id && <button type="button" className="btn btn-ghost" onClick={cancelar}><X size={16} /> Cancelar edição</button>}
            <button className="btn btn-vinho btn-lg" disabled={salvando}>
              <Save size={17} /> {salvando ? 'Salvando...' : form.id ? 'Salvar Alterações' : 'Cadastrar Categoria'}
            </button>
          </div>
        </form>

        <div className="side-stack">
          <div className="panel-dark">
            <span className="eyebrow">Categorias ativas</span>
            <div className="big">{data ? data.length : '—'}</div>
            <hr />
            <div className="row"><span>Com produtos</span><b>{data ? data.length - semProduto : '—'}</b></div>
            <div className="row"><span>Vazias</span><b>{data ? semProduto : '—'}</b></div>
          </div>
          <div className="tip tip-amarela">
            <strong><Lightbulb size={15} /> Dica</strong>
            Só dá para apagar uma categoria sem produtos. Mude a categoria dos produtos dela antes (na tela de cada produto).
          </div>
        </div>
      </div>

      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="mov-tabela-head" style={{ borderBottom: '1px solid var(--borda-suave)' }}>
          <h3 className="section-title"><Tags size={18} /> Categorias cadastradas</h3>
          <div className="input-icon" style={{ width: 280, maxWidth: '100%' }}>
            <Search size={16} />
            <input className="input" placeholder="Buscar categoria..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
        <Erro error={error} onRetry={reload} />
        {loading && !data && <Loading />}
        {data && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nome</th><th className="center">Produtos</th><th className="num">Ações</th></tr></thead>
              <tbody>
                {pag.itens.length === 0 && <tr><td colSpan={3} className="empty">Nenhuma categoria encontrada.</td></tr>}
                {pag.itens.map((c) => (
                  <tr key={c.id} className={form.id === c.id ? 'linha-editando' : ''}>
                    <td className="strong">{c.nome}</td>
                    <td className="center">
                      {c.produtos > 0
                        ? <Link to={`/inventario/${c.id}`} title="Ver os produtos desta categoria">{c.produtos}</Link>
                        : <span className="muted">0</span>}
                    </td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>
                      <button className="icon-btn" onClick={() => editar(c)} aria-label={`Editar ${c.nome}`}><Pencil size={16} /></button>
                      <button
                        className="icon-btn danger"
                        onClick={() => setApagar(c)}
                        disabled={c.produtos > 0}
                        title={c.produtos > 0 ? 'Tem produtos nesta categoria' : undefined}
                        aria-label={`Apagar ${c.nome}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pag.total > 1 && (
          <div className="table-footer" style={{ borderRadius: 0 }}>
            <span>{lista.length} categorias</span>
            <Pagination page={pag.page} total={pag.total} onChange={pag.setPage} />
          </div>
        )}
      </section>

      <Feedback {...feedback.props} />
      <Confirm open={!!apagar} texto={`Apagar a categoria "${apagar?.nome}"?`} onConfirm={confirmarApagar} onCancel={() => setApagar(null)} />
    </div>
  );
}
