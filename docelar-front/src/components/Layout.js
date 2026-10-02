import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Menu, Search, LayoutDashboard, PackagePlus, FilePlus2, Boxes, PackageMinus,
  RotateCcw, BarChart3, UserCircle2, Users, Truck, Plus, ArrowLeft, LogOut, X,
} from 'lucide-react';
import Logo from './Logo';
import { getUsuarioLogado, logout } from '../api';
import { USE_MOCK } from '../api/client';
import './Layout.css';

const MENU = [
  { to: '/', label: 'Tela Principal', icon: LayoutDashboard, end: true },
  { to: '/entrada', label: 'Entrada de Produtos', icon: PackagePlus },
  { to: '/produtos/novo', label: 'Cadastro de Produto', icon: FilePlus2 },
  { to: '/inventario', label: 'Inventário', icon: Boxes },
  { to: '/saida', label: 'Saída de Produtos', icon: PackageMinus },
  { to: '/trocas', label: 'Devolução', icon: RotateCcw },
  { to: '/relatorios', label: 'Relatório', icon: BarChart3 },
  { to: '/perfil', label: 'Tela Perfil', icon: UserCircle2 },
  { to: '/funcionarios', label: 'Funcionários', icon: Users },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
];

// Cada página informa o título do cabeçalho e os botões do rodapé.
const PageMetaContext = createContext(() => {});
export function usePageMeta(meta, deps = []) {
  const set = useContext(PageMetaContext);
  useEffect(() => {
    set(meta);
    return () => set({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const UserContext = createContext(null);
export const useUsuario = () => useContext(UserContext);

export default function Layout() {
  const [meta, setMeta] = useState({});
  const [menuAberto, setMenuAberto] = useState(() => window.innerWidth > 1100);
  const [usuario, setUsuario] = useState(null);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => { getUsuarioLogado().then(setUsuario).catch(() => {}); }, []);

  // no celular o menu fecha ao trocar de página
  useEffect(() => { if (window.innerWidth <= 1100) setMenuAberto(false); }, [pathname]);

  function buscar(e) {
    e.preventDefault();
    navigate(`/inventario?busca=${encodeURIComponent(busca.trim())}`);
  }

  function sair() {
    logout();
    navigate('/login');
  }

  return (
    <UserContext.Provider value={{ usuario, setUsuario }}>
      <PageMetaContext.Provider value={setMeta}>
        <div className={`shell ${menuAberto ? 'menu-aberto' : ''}`}>
          <aside className="sidebar" aria-label="Menu principal">
            <button className="sidebar-fechar" onClick={() => setMenuAberto(false)} aria-label="Fechar menu"><X size={20} /></button>
            <div className="sidebar-logo"><Logo size={60} claro /></div>
            <nav className="sidebar-nav">
              {MENU.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="sidebar-link">
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <button className="btn btn-vinho btn-block" onClick={() => navigate('/saida')}>
                <Plus size={16} /> Novo Pedido
              </button>
              <button className="sidebar-sair" onClick={sair}><LogOut size={15} /> Sair</button>
            </div>
          </aside>
          <div className="sidebar-backdrop" onClick={() => setMenuAberto(false)} />

          <div className="main">
            <header className="topbar">
              <button className="icon-btn hamburger" onClick={() => setMenuAberto((v) => !v)} aria-label="Abrir ou fechar menu">
                <Menu size={26} />
              </button>

              {meta.title && (
                <div className="topbar-title">
                  {meta.breadcrumb && (
                    <div className="topbar-crumb">
                      {meta.breadcrumb.map((b, i) => (
                        <span key={i} className={i === meta.breadcrumb.length - 1 ? 'atual' : ''}>
                          {i > 0 && <i>/</i>}{b}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2>{meta.title}</h2>
                </div>
              )}

              <form className="topbar-search input-icon" onSubmit={buscar} role="search">
                <Search size={18} />
                <input
                  className="input"
                  placeholder="Buscar produtos ou insumos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </form>

              {USE_MOCK && <span className="demo-badge" title="Dados de exemplo — mude VITE_USE_MOCK para false no .env para usar o back-end">Modo demonstração</span>}

              <div className="topbar-user">
                <button className="icon-btn" aria-label="Notificações"><Bell size={19} /></button>
                <NavLink to="/perfil" className="topbar-perfil">
                  <div className="topbar-nome">
                    <strong>{usuario?.nome || '...'}</strong>
                    <small>{usuario?.email || 'Funcionário'}</small>
                  </div>
                  <Avatar usuario={usuario} />
                </NavLink>
              </div>
            </header>

            <main className="content">
              <Outlet />
            </main>

            <footer className="footer">
              <div className="footer-left">
                {meta.voltar !== false && (
                  <button className="footer-voltar" onClick={() => navigate(-1)}>
                    <ArrowLeft size={14} /> Voltar
                  </button>
                )}
                <span className="footer-divider" />
                <span className="footer-copy">© 2026 Docelar Gestão de Padaria</span>
              </div>
              <div className="footer-right">
                {meta.footerActions || <a className="footer-link" href="mailto:suporte@docelar.com.br">Suporte</a>}
              </div>
            </footer>
          </div>
        </div>
      </PageMetaContext.Provider>
    </UserContext.Provider>
  );
}

export function Avatar({ usuario, size = 40 }) {
  const iniciais = (usuario?.nome || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {usuario?.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais}
    </div>
  );
}
