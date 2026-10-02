import { useState } from 'react';
import { Building2, Pencil, Trash2, Truck, Save, X, Lightbulb, Search } from 'lucide-react';
import { Feedback, useFeedback, Confirm, Erro, Loading, Pagination, usePaginacao } from '../components/ui';
import { listarFornecedores, salvarFornecedor, excluirFornecedor } from '../api';
import { mascaraCnpj, mascaraTelefone, cnpjValido, useAsync, mensagemErro } from '../utils';
import './Cadastros.css';

const VAZIO = { id: null, nome: '', cnpj: '', telefone: '', email: '' };

export default function Fornecedores() {
  const feedback = useFeedback();
  const { data, loading, error, reload } = useAsync(listarFornecedores, []);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [apagar, setApagar] = useState(null);
  const [busca, setBusca] = useState('');

  const lista = (data || []).filter((f) => !busca || `${f.nome} ${f.cnpj} ${f.email}`.toLowerCase().includes(busca.toLowerCase()));
  const pag = usePaginacao(lista, 6);
  const set = (c, mask) => (e) => setForm((f) => ({ ...f, [c]: mask ? mask(e.target.value) : e.target.value }));

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe a razão social';
    if (!cnpjValido(form.cnpj)) e.cnpj = 'CNPJ precisa ter 14 números';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'E-mail inválido';
    setErros(e);
    return !Object.keys(e).length;
  }

  async function salvar(e) {
    e.preventDefault();
    setErroGeral('');
    if (!validar()) return;
    setSalvando(true);
    try {
      await salvarFornecedor(form);
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
    const f = apagar;
    setApagar(null);
    try {
      await excluirFornecedor(f.id);
      if (form.id === f.id) setForm(VAZIO);
      reload();
    } catch (err) {
      setErroGeral(`Não foi possível apagar: ${mensagemErro(err)} (ele pode estar ligado a produtos ou lotes).`);
    }
  }

  return (
    <div className="page">
      <div>
        <div className="breadcrumb">Cadastros <span style={{ color: 'var(--vinho)' }}>›</span> <b>Fornecedores</b></div>
        <h1 className="page-title">Cadastro de Fornecedor</h1>
        <p className="page-subtitle">Mantenha os parceiros que abastecem a padaria sempre atualizados.</p>
      </div>

      {erroGeral && <div className="erro-box">{erroGeral}</div>}

      <div className="two-col">
        <form className="card" onSubmit={salvar} noValidate>
          <h3 className="section-title" style={{ marginBottom: 20 }}>
            <Building2 size={18} /> {form.id ? 'Editando fornecedor' : 'Dados da empresa'}
          </h3>
          <div className="form-grid">
            <div className="field span-all">
              <label className="label" htmlFor="f-nome">Razão social</label>
              <input id="f-nome" className="input" placeholder="Moinho Tradição Alimentos Ltda." value={form.nome} onChange={set('nome')} />
              {erros.nome && <small className="campo-erro">{erros.nome}</small>}
            </div>
            <div className="field">
              <label className="label" htmlFor="f-cnpj">CNPJ</label>
              <input id="f-cnpj" className="input" inputMode="numeric" placeholder="12.345.678/0001-99" value={form.cnpj} onChange={set('cnpj', mascaraCnpj)} />
              {erros.cnpj && <small className="campo-erro">{erros.cnpj}</small>}
            </div>
            <div className="field">
              <label className="label" htmlFor="f-tel">Telefone</label>
              <input id="f-tel" className="input" inputMode="tel" placeholder="(11) 3333-4444" value={form.telefone} onChange={set('telefone', mascaraTelefone)} />
            </div>
            <div className="field span-all">
              <label className="label" htmlFor="f-email">E-mail comercial</label>
              <input id="f-email" className="input" type="email" placeholder="contato@fornecedor.com.br" value={form.email} onChange={set('email')} />
              {erros.email && <small className="campo-erro">{erros.email}</small>}
            </div>
          </div>
          <div className="cad-botoes">
            {form.id && <button type="button" className="btn btn-ghost" onClick={() => { setForm(VAZIO); setErros({}); }}><X size={16} /> Cancelar edição</button>}
            <button className="btn btn-vinho btn-lg" disabled={salvando}><Save size={17} /> {salvando ? 'Salvando...' : form.id ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</button>
          </div>
        </form>

        <div className="side-stack">
          <div className="panel-dark">
            <span className="eyebrow">Fornecedores ativos</span>
            <div className="big">{data ? data.length : '—'}</div>
            <hr />
            <div className="row"><span>Com e-mail</span><b>{data ? data.filter((f) => f.email).length : '—'}</b></div>
            <div className="row"><span>Com telefone</span><b>{data ? data.filter((f) => f.telefone).length : '—'}</b></div>
          </div>
          <div className="tip tip-amarela">
            <strong><Lightbulb size={15} /> Dica</strong>
            O CNPJ não pode se repetir. Fornecedores ligados a produtos ou lotes podem não ser apagados pelo banco.
          </div>
        </div>
      </div>

      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="mov-tabela-head" style={{ borderBottom: '1px solid var(--borda-suave)' }}>
          <h3 className="section-title"><Truck size={18} /> Fornecedores cadastrados</h3>
          <div className="input-icon" style={{ width: 280 }}>
            <Search size={16} />
            <input className="input" placeholder="Buscar fornecedor..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
        <Erro error={error} onRetry={reload} />
        {loading && !data && <Loading />}
        {data && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Razão social</th><th>CNPJ</th><th>Telefone</th><th>E-mail</th><th className="num">Ações</th></tr></thead>
              <tbody>
                {pag.itens.length === 0 && <tr><td colSpan={5} className="empty">Nenhum fornecedor encontrado.</td></tr>}
                {pag.itens.map((f) => (
                  <tr key={f.id} className={form.id === f.id ? 'linha-editando' : ''}>
                    <td className="strong">{f.nome}</td>
                    <td>{f.cnpj}</td>
                    <td>{f.telefone || '—'}</td>
                    <td>{f.email || '—'}</td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>
                      <button className="icon-btn" onClick={() => { setForm({ ...f }); setErros({}); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label={`Editar ${f.nome}`}><Pencil size={16} /></button>
                      <button className="icon-btn danger" onClick={() => setApagar(f)} aria-label={`Apagar ${f.nome}`}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pag.total > 1 && (
          <div className="table-footer" style={{ borderRadius: 0 }}>
            <span>{lista.length} fornecedores</span>
            <Pagination page={pag.page} total={pag.total} onChange={pag.setPage} />
          </div>
        )}
      </section>

      <Feedback {...feedback.props} />
      <Confirm open={!!apagar} texto={`Apagar o fornecedor "${apagar?.nome}"?`} onConfirm={confirmarApagar} onCancel={() => setApagar(null)} />
    </div>
  );
}
