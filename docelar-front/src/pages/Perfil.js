import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, BadgeCheck, LogOut, Save, UserRound, Lock, Bell } from 'lucide-react';
import { Feedback, useFeedback } from '../components/ui';
import { Avatar, useUsuario } from '../components/Layout';
import { salvarFuncionario, logout } from '../api';
import { mensagemErro } from '../utils';
import './Cadastros.css';

const PREF_KEY = 'docelar_preferencias';
const PREFS = [
  { id: 'estoqueBaixo', titulo: 'Percepções de estoque', texto: 'Mostrar os produtos que precisam de reposição na tela principal' },
  { id: 'resumoSemanal', titulo: 'Resumo semanal', texto: 'Mostrar o relatório de 7 dias por padrão' },
];

export function lerPrefs() {
  try { return { estoqueBaixo: true, resumoSemanal: false, ...JSON.parse(localStorage.getItem(PREF_KEY)) }; }
  catch { return { estoqueBaixo: true, resumoSemanal: false }; }
}

export default function Perfil() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const { usuario, setUsuario } = useUsuario() || {};
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [prefs, setPrefs] = useState(lerPrefs);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (usuario) setForm((f) => ({ ...f, nome: usuario.nome || '', email: usuario.email || '' }));
  }, [usuario]);

  const set = (c) => (e) => setForm((f) => ({ ...f, [c]: e.target.value }));

  function trocarPref(id) {
    setPrefs((p) => {
      const n = { ...p, [id]: !p[id] };
      localStorage.setItem(PREF_KEY, JSON.stringify(n));
      return n;
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (!form.nome.trim()) return setErro('Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setErro('Informe um e-mail válido.');
    if (form.senha && form.senha.length < 6) return setErro('A nova senha precisa de pelo menos 6 caracteres.');
    if (form.senha !== form.confirmar) return setErro('As senhas não conferem.');
    setSalvando(true);
    try {
      await salvarFuncionario({ id: usuario.id, nome: form.nome.trim(), email: form.email.trim(), senha: form.senha || undefined });
      setUsuario?.({ ...usuario, nome: form.nome.trim(), email: form.email.trim().toLowerCase() });
      setForm((f) => ({ ...f, senha: '', confirmar: '' }));
      feedback.mostrar('Salvo');
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setSalvando(false);
    }
  }

  function sair() {
    logout();
    navigate('/login');
  }

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Meu Perfil</h1>
        <p className="page-subtitle">Seus dados de acesso ao sistema Docelar.</p>
      </div>

      {erro && <div className="erro-box">{erro}</div>}

      <div className="perfil-grid">
        <section className="card perfil-card">
          <Avatar usuario={usuario} size={112} />
          <h2>{usuario?.nome || '...'}</h2>
          <span className="badge badge-creme">Funcionário</span>
          <div className="perfil-info">
            <span><Mail size={15} /> {usuario?.email || '—'}</span>
            <span><BadgeCheck size={15} /> Matrícula #{String(usuario?.id ?? '').padStart(4, '0')}</span>
          </div>
          <button className="btn btn-outline btn-block" style={{ marginTop: 8 }} onClick={sair}><LogOut size={16} /> Sair da conta</button>
        </section>

        <div>
          <form className="card" onSubmit={salvar} noValidate>
            <h3 className="section-title" style={{ marginBottom: 20 }}><UserRound size={18} /> Informações pessoais</h3>
            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="p-nome">Nome completo</label>
                <input id="p-nome" className="input" value={form.nome} onChange={set('nome')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="p-email">E-mail</label>
                <input id="p-email" className="input" type="email" value={form.email} onChange={set('email')} />
              </div>
            </div>

            <h3 className="section-title" style={{ margin: '28px 0 20px' }}><Lock size={18} /> Privacidade e segurança</h3>
            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="p-senha">Nova senha</label>
                <input id="p-senha" className="input" type="password" placeholder="Deixe em branco para manter" value={form.senha} onChange={set('senha')} autoComplete="new-password" />
              </div>
              <div className="field">
                <label className="label" htmlFor="p-conf">Confirmar nova senha</label>
                <input id="p-conf" className="input" type="password" value={form.confirmar} onChange={set('confirmar')} autoComplete="new-password" />
              </div>
            </div>

            <div className="cad-botoes">
              <button type="button" className="btn btn-ghost" onClick={() => setForm({ nome: usuario?.nome || '', email: usuario?.email || '', senha: '', confirmar: '' })}>Desfazer</button>
              <button className="btn btn-vinho btn-lg" disabled={salvando || !usuario}><Save size={17} /> {salvando ? 'Salvando...' : 'Salvar Alterações'}</button>
            </div>
          </form>

          <section className="card">
            <h3 className="section-title" style={{ marginBottom: 6 }}><Bell size={18} /> Preferências</h3>
            <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>Ficam salvas neste navegador.</p>
            {PREFS.map((p) => (
              <label key={p.id} className="toggle-linha">
                <div><strong>{p.titulo}</strong><small>{p.texto}</small></div>
                <span className="switch">
                  <input type="checkbox" checked={!!prefs[p.id]} onChange={() => trocarPref(p.id)} />
                  <span />
                </span>
              </label>
            ))}
          </section>
        </div>
      </div>

      <Feedback {...feedback.props} />
    </div>
  );
}
