import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { auth, expiracaoDoToken, EVENTO_SESSAO_EXPIRADA } from './api/client';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadastroProduto from './pages/CadastroProduto';
import EntradaMercadorias from './pages/EntradaMercadorias';
import SaidaProdutos from './pages/SaidaProdutos';
import TrocaDevolucao from './pages/TrocaDevolucao';
import Inventario from './pages/Inventario';
import InventarioCategoria from './pages/InventarioCategoria';
import Relatorios from './pages/Relatorios';
import Fornecedores from './pages/Fornecedores';
import Categorias from './pages/Categorias';
import Funcionarios from './pages/Funcionarios';
import Perfil from './pages/Perfil';

function Protegido({ children }) {
  const location = useLocation();
  if (!auth.getToken()) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  return children;
}

function ControleSessao() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const irParaLogin = () => {
      auth.clear();
      if (!location.pathname.startsWith('/login')) {
        navigate('/login', { replace: true, state: { de: location.pathname, expirou: true } });
      }
    };
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, irParaLogin);

    const token = auth.getToken();
    const exp = token && expiracaoDoToken(token);
    const timer = exp ? setTimeout(irParaLogin, Math.max(0, exp - Date.now())) : null;

    return () => {
      window.removeEventListener(EVENTO_SESSAO_EXPIRADA, irParaLogin);
      clearTimeout(timer);
    };
  }, [navigate, location.pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ControleSessao />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protegido><Layout /></Protegido>}>
          <Route index element={<Dashboard />} />
          <Route path="produtos/novo" element={<CadastroProduto />} />
          <Route path="produtos/:id" element={<CadastroProduto />} />
          <Route path="entrada" element={<EntradaMercadorias />} />
          <Route path="saida" element={<SaidaProdutos />} />
          <Route path="trocas" element={<TrocaDevolucao />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="inventario/:categoria" element={<InventarioCategoria />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="funcionarios" element={<Funcionarios />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
