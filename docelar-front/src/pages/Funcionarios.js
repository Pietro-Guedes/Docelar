import { useState } from 'react';
import { UserPlus, Pencil, Trash2, Users, Save, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Feedback, useFeedback, Confirm, Erro, Loading } from '../components/ui';
import { Avatar, useUsuario } from '../components/Layout';
import { listarFuncionarios, salvarFuncionario, excluirFuncionario } from '../api';
import { useAsync, mensagemErro } from '../utils';
import './Cadastros.css';

const VAZIO = { id: null, nome: '', email: '', senha: '' };

export default function Funcionarios() {
  const feedback = useFeedback();
  const { usuario } = useUsuario() || {};
  const { data, loading, error, reload } = useAsync(listarFuncionarios, []);
  const [form, setForm] = useState(VAZIO);
  const [verSenha, setVerSenha] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [apagar, setApagar] = useState(null);

  const set = (c) => (e) => setForm((f) => ({ ...f, [c]: e.target.value }));

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Informe um e-mail válido';
    if (!form.id && form.senha.length < 6) e.senha = 'A senha precisa de pelo menos 6 caracteres';
    if (form.id && form.senha && form.senha.length < 6) e.senha = 'A senha precisa de pelo menos 6 caracteres';
    setErros(e);
    return !Object.keys(e).length;
  }

  async function salvar(e) {
    e.preventDefault();
    setErroGeral('');
    if (!validar()) return;
    setSalvando(true);
    try {
      await salvarFuncionario(form);
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
      await excluirFuncionario(f.id);
      reload();
    } catch (err) {
      setErroGeral(`Não foi possível apagar: ${mensagemErro(err)} (ele pode ter produtos ou movimentações no nome dele).`);
    }
  }

  return (
    <div className="page">
      <div>
        <div className="breadcrumb">Cadastros <span style={{ color: 'var(--vinho)' }}>›</span> <b>Funcionários</b></div>
        <h1 className="page-title">Funcionários</h1>
        <p className="page-subtitle">Quem tem acesso ao sistema da padaria.</p>
      </div>

      {erroGeral && <div className="erro-box">{erroGeral}</div>}

      <div className="two-col">
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mov-tabela-head" style={{ borderBottom: '1px solid var(--borda-suave)' }}>
            <h3 className="section-title"><Users size={18} /> Equipe</h3>
            <span className="badge badge-creme">{data ? `${data.length} pessoas` : '...'}</span>
          </div>
          <Erro error={error} onRetry={reload} />
          {loading && !data && <Loading />}
          {data && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Nome</th><th>E-mail</th><th className="num">Ações</th></tr></thead>
                <tbody>
                  {data.length === 0 && <tr><td colSpan={3} className="empty">Nenhum funcionário cadastrado.</td></tr>}
                  {data.map((f) => (
                    <tr key={f.id} className={form.id === f.id ? 'linha-editando' : ''}>
                      <td>
                        <div className="prod-cell strong">
                          <Avatar usuario={f} size={36} />
                          {f.nome}
                          {usuario?.id === f.id && <span className="badge badge-ok">Você</span>}
                        </div>
                      </td>
                      <td>{f.email}</td>
                      <td className="num" style={{ whiteSpace: 'nowrap' }}>
                        <button className="icon-btn" onClick={() => { setForm({ ...VAZIO, ...f, senha: '' }); setErros({}); }} aria-label={`Editar ${f.nome}`}><Pencil size={16} /></button>
                        <button className="icon-btn danger" disabled={usuario?.id === f.id} title={usuario?.id === f.id ? 'Você não pode apagar a si mesmo' : undefined} onClick={() => setApagar(f)} aria-label={`Apagar ${f.nome}`}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form className="card" onSubmit={salvar} noValidate>
          <h3 className="section-title" style={{ marginBottom: 20 }}>
            <UserPlus size={18} /> {form.id ? 'Editar funcionário' : 'Novo funcionário'}
          </h3>
          <div className="field">
            <label className="label" htmlFor="fu-nome">Nome completo</label>
            <input id="fu-nome" className="input" placeholder="Marina Souza" value={form.nome} onChange={set('nome')} />
            {erros.nome && <small className="campo-erro">{erros.nome}</small>}
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label" htmlFor="fu-email">E-mail de acesso</label>
            <input id="fu-email" className="input" type="email" placeholder="nome@docelar.com.br" value={form.email} onChange={set('email')} />
            {erros.email && <small className="campo-erro">{erros.email}</small>}
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label" htmlFor="fu-senha">{form.id ? 'Nova senha (opcional)' : 'Senha'}</label>
            <div className="input-icon" style={{ position: 'relative' }}>
              <ShieldCheck size={16} />
              <input id="fu-senha" className="input" type={verSenha ? 'text' : 'password'} placeholder="mínimo 6 caracteres" value={form.senha} onChange={set('senha')} autoComplete="new-password" style={{ paddingRight: 40 }} />
              <button type="button" className="icon-btn" style={{ position: 'absolute', right: 3, top: 3 }} onClick={() => setVerSenha((v) => !v)} aria-label="Mostrar senha">
                {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {erros.senha && <small className="campo-erro">{erros.senha}</small>}
          </div>
          <div className="cad-botoes">
            {form.id && <button type="button" className="btn btn-ghost" onClick={() => { setForm(VAZIO); setErros({}); }}><X size={16} /> Cancelar</button>}
            <button className="btn btn-vinho btn-lg" disabled={salvando}><Save size={17} /> {salvando ? 'Salvando...' : form.id ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </div>

      <Feedback {...feedback.props} />
      <Confirm open={!!apagar} texto={`Remover o acesso de "${apagar?.nome}"?`} rotulo="Remover" onConfirm={confirmarApagar} onCancel={() => setApagar(null)} />
    </div>
  );
}
