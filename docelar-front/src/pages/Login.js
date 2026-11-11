import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Headset } from 'lucide-react';
import Logo from '../components/Logo';
import { login, salvarFuncionario } from '../api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [modo, setModo] = useState('entrar'); // 'entrar' | 'cadastrar'
  const cadastro = modo === 'cadastrar';
  const [nome, setNome] = useState('');
  const [souAdmin, setSouAdmin] = useState(false);
  const [codigoAdmin, setCodigoAdmin] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState(location.state?.expirou ? 'Sua sessão expirou. Entre de novo.' : '');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (cadastro) {
        if (!nome.trim()) throw new Error('Informe o seu nome.');
        if (senha.length < 6) throw new Error('A senha precisa de pelo menos 6 caracteres.');
        if (souAdmin && !codigoAdmin) throw new Error('Informe o código de administrador.');
        await salvarFuncionario({ nome: nome.trim(), email: email.trim(), senha, admin: souAdmin, codigoAdmin });
      }
      await login(email.trim(), senha, lembrar);
      navigate(location.state?.de || '/', { replace: true });
    } catch (err) {
      setErro(err.message || 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
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
          <form className="login-form" onSubmit={entrar}>
            <div className="login-logo"><Logo size={76} legenda={false} /></div>
            <h2>{cadastro ? 'Criar conta' : 'Bem-vindo'}</h2>
            <p className="login-sub">{cadastro ? 'Preencha os dados para criar o seu acesso.' : 'Insira suas credenciais corporativas para acessar o sistema.'}</p>

            {cadastro && (
              <>
                <label className="label" htmlFor="nome">Nome completo</label>
                <div className="input-icon" style={{ marginBottom: 18 }}>
                  <ShieldCheck size={17} />
                  <input id="nome" className="input" placeholder="Marina Souza"
                    value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required />
                </div>
              </>
            )}

            <label className="label" htmlFor="email">E-mail corporativo</label>
            <div className="input-icon">
              <Mail size={17} />
              <input id="email" type="email" className="input" placeholder="exemplo@docelar.com.br"
                value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </div>

            <label className="label" htmlFor="senha" style={{ marginTop: 18 }}>Senha de acesso</label>
            <div className="input-icon login-senha">
              <Lock size={17} />
              <input id="senha" type={verSenha ? 'text' : 'password'} className="input" placeholder="••••••••••••"
                value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete={cadastro ? 'new-password' : 'current-password'} required />
              <button type="button" className="login-olho" onClick={() => setVerSenha((v) => !v)}
                aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}>
                {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {cadastro && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={souAdmin} onChange={(e) => setSouAdmin(e.target.checked)} />
                  Cadastrar como administrador
                </label>
                {souAdmin && (
                  <div className="input-icon" style={{ marginTop: 10 }}>
                    <Lock size={17} />
                    <input className="input" type="password" placeholder="Código de administrador" aria-label="Código de administrador"
                      value={codigoAdmin} onChange={(e) => setCodigoAdmin(e.target.value)} autoComplete="off" />
                  </div>
                )}
              </div>
            )}

            <div className="login-opcoes">
              <label><input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} /> Lembrar acesso</label>
              <a href="mailto:suporte@docelar.com.br?subject=Esqueci minha senha">Esqueceu a senha?</a>
            </div>

            {erro && <div className="login-erro">{erro}</div>}

            <button className="btn btn-vinho btn-lg btn-block login-btn" disabled={carregando}>
              {carregando ? (cadastro ? 'Criando...' : 'Entrando...') : (cadastro ? 'Criar conta' : 'Acessar portal')}
            </button>

            <button type="button" className="login-suporte" style={{ background: 'none', border: 0, cursor: 'pointer' }}
              onClick={() => { setModo(cadastro ? 'entrar' : 'cadastrar'); setErro(''); }}>
              {cadastro ? 'Já tenho conta — entrar' : 'Não tem conta? Criar conta'}
            </button>

            <a className="login-suporte" href="mailto:suporte@docelar.com.br"><Headset size={15} /> Suporte TI Docelar</a>
            <p className="login-copy">© 2026 Docelar Gestão de Padaria. Todos os direitos reservados.</p>
          </form>
        </section>
      </div>
    </div>
  );
}
