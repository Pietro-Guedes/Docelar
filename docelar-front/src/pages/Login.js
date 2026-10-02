import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Headset } from 'lucide-react';
import Logo from '../components/Logo';
import { login } from '../api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email.trim(), senha);
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
        {/* lado da imagem */}
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

        {/* lado do formulário */}
        <section className="login-form-lado">
          <form className="login-form" onSubmit={entrar}>
            <div className="login-logo"><Logo size={76} legenda={false} /></div>
            <h2>Bem-vindo</h2>
            <p className="login-sub">Insira suas credenciais corporativas para acessar o sistema.</p>

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
                value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
              <button type="button" className="login-olho" onClick={() => setVerSenha((v) => !v)}
                aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}>
                {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <div className="login-opcoes">
              <label><input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} /> Lembrar acesso</label>
              <a href="mailto:suporte@docelar.com.br?subject=Esqueci minha senha">Esqueceu a senha?</a>
            </div>

            {erro && <div className="login-erro">{erro}</div>}

            <button className="btn btn-vinho btn-lg btn-block login-btn" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Acessar portal'}
            </button>

            <a className="login-suporte" href="mailto:suporte@docelar.com.br"><Headset size={15} /> Suporte TI Docelar</a>
            <p className="login-copy">© 2026 Docelar Gestão de Padaria. Todos os direitos reservados.</p>
          </form>
        </section>
      </div>
    </div>
  );
}
