import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import Logo from '../components/Logo';
import { salvarFuncionario } from '../api';
import { mensagemErro } from '../utils';
import './Login.css';

const VAZIO = { nome: '', email: '', senha: '', confirmar: '', admin: false, codigoAdmin: '' };

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState(VAZIO);
  const [verSenha, setVerSenha] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  // mesmas regras da tela de Funcionários e do back end
  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Informe um e-mail válido';
    if (form.senha.length < 6) e.senha = 'A senha precisa de pelo menos 6 caracteres';
    else if (form.confirmar !== form.senha) e.confirmar = 'As senhas não são iguais';
    if (form.admin && !form.codigoAdmin) e.codigoAdmin = 'Informe o código de administrador';
    setErros(e);
    return !Object.keys(e).length;
  }

  async function cadastrar(e) {
    e.preventDefault();
    setErroGeral('');
    if (!validar()) return;
    setSalvando(true);
    try {
      await salvarFuncionario({
        nome: form.nome.trim(), email: form.email.trim(), senha: form.senha,
        admin: form.admin, codigoAdmin: form.codigoAdmin,
      });
      navigate('/login', { replace: true, state: { cadastrado: true } });
    } catch (err) {
      setErroGeral(mensagemErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <section className="login-hero">
          <div className="login-hero-texto">
            <Logo size={44} legenda={false} />
            <h1>Docelar Panificação</h1>
            <p>Resgatando o sabor real da panificação artesanal.</p>
            <div className="login-selo">
              <ShieldCheck size={22} />
              <div>
                <strong>Certificação digital</strong>
                <span>Ambiente de acesso seguro SSL</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-form-lado">
          <form className="login-form" onSubmit={cadastrar} noValidate>
            <div className="login-logo"><Logo size={76} legenda={false} /></div>
            <h2>Criar conta</h2>
            <p className="login-sub">Preencha seus dados para ter acesso ao sistema.</p>

            <label className="label" htmlFor="cad-nome">Nome completo</label>
            <div className="input-icon">
              <User size={17} />
              <input id="cad-nome" className="input" placeholder="Marina Souza"
                value={form.nome} onChange={set('nome')} autoComplete="name" />
            </div>
            {erros.nome && <small className="login-campo-erro">{erros.nome}</small>}

            <label className="label" htmlFor="cad-email" style={{ marginTop: 18 }}>E-mail corporativo</label>
            <div className="input-icon">
              <Mail size={17} />
              <input id="cad-email" type="email" className="input" placeholder="exemplo@docelar.com.br"
                value={form.email} onChange={set('email')} autoComplete="username" />
            </div>
            {erros.email && <small className="login-campo-erro">{erros.email}</small>}

            <label className="label" htmlFor="cad-senha" style={{ marginTop: 18 }}>Senha de acesso</label>
            <div className="input-icon login-senha">
              <Lock size={17} />
              <input id="cad-senha" type={verSenha ? 'text' : 'password'} className="input" placeholder="mínimo 6 caracteres"
                value={form.senha} onChange={set('senha')} autoComplete="new-password" />
              <button type="button" className="login-olho" onClick={() => setVerSenha((v) => !v)}
                aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}>
                {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {erros.senha && <small className="login-campo-erro">{erros.senha}</small>}

            <label className="label" htmlFor="cad-confirmar" style={{ marginTop: 18 }}>Confirmar senha</label>
            <div className="input-icon">
              <Lock size={17} />
              <input id="cad-confirmar" type={verSenha ? 'text' : 'password'} className="input" placeholder="repita a senha"
                value={form.confirmar} onChange={set('confirmar')} autoComplete="new-password" />
            </div>
            {erros.confirmar && <small className="login-campo-erro">{erros.confirmar}</small>}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, fontSize: 13 }}>
              <input type="checkbox" checked={form.admin}
                onChange={(e) => setForm((f) => ({ ...f, admin: e.target.checked, codigoAdmin: '' }))} />
              Cadastrar como administrador
            </label>
            {form.admin && (
              <>
                <div className="input-icon" style={{ marginTop: 10 }}>
                  <Lock size={17} />
                  <input type="password" className="input" placeholder="Código de administrador"
                    aria-label="Código de administrador" value={form.codigoAdmin}
                    onChange={set('codigoAdmin')} autoComplete="off" />
                </div>
                {erros.codigoAdmin && <small className="login-campo-erro">{erros.codigoAdmin}</small>}
              </>
            )}

            {erroGeral && <div className="login-erro" style={{ marginTop: 18 }}>{erroGeral}</div>}

            <button className="btn btn-vinho btn-lg btn-block login-btn" style={{ marginTop: 24 }} disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Criar conta'}
            </button>

            <p className="login-alternar">Já tem conta? <Link to="/login">Entrar</Link></p>
            <p className="login-copy">© 2026 Docelar Gestão de Padaria. Todos os direitos reservados.</p>
          </form>
        </section>
      </div>
    </div>
  );
}
