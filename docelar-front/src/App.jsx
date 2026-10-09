import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { auth } from './api/client';

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
import Funcionarios from './pages/Funcionarios';
import Perfil from './pages/Perfil';

function Protegido({ children }) {
  const location = useLocation();
  if (!auth.getToken()) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="funcionarios" element={<Funcionarios />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
