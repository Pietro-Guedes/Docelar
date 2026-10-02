import { useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList, AlertTriangle, Truck, ShoppingCart, Boxes, RotateCcw, Download,
  CalendarClock, Package, PackagePlus, PackageMinus, ArrowRight,
} from 'lucide-react';
import { StatCard, Thumb, Erro, Loading } from '../components/ui';
import { useUsuario } from '../components/Layout';
import { getDashboard } from '../api';
import { numero, pad2, tempoAtras, useAsync } from '../utils';
import { lerPrefs } from './Perfil';
import './Dashboard.css';

const ACOES = [
  { label: 'Novo Pedido', icon: ShoppingCart, to: '/saida' },
  { label: 'Estoque', icon: Boxes, to: '/inventario' },
  { label: 'Devolução', icon: RotateCcw, to: '/trocas' },
  { label: 'Receber', icon: Download, to: '/entrada' },
];

const ICONE_ATIVIDADE = { ENTRADA: PackagePlus, SAIDA: PackageMinus, DEVOLUCAO: RotateCcw };

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useUsuario() || {};
  const { data, loading, error, reload } = useAsync(getDashboard, []);
  const mostrarPercepcoes = lerPrefs().estoqueBaixo;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Chef';

  const resumo = data
    ? data.vencidos > 0
      ? `Há ${data.vencidos} lote(s) vencido(s) e ${data.criticos} produto(s) em estoque crítico. Vamos resolver?`
      : `Sua padaria tem ${data.criticos} produto(s) em estoque crítico hoje. Vamos começar?`
    : 'Carregando o resumo do dia...';

  return (
    <div className="page">
      <section className="dash-hero">
        <div>
          <h1>{saudacao()}, {primeiroNome}.</h1>
          <p>{resumo}</p>
        </div>
        <button className="btn dash-hero-btn" onClick={() => navigate('/inventario?status=critico')}>
          <CalendarClock size={16} /> Ver o que repor
        </button>
      </section>

      <Erro error={error} onRetry={reload} />
      {loading && !data && <Loading />}

      {data && (
        <>
          <div className="stats">
            <StatCard icon={ClipboardList} label="Total de itens" value={numero(data.totalItens)} note={`${data.totalProdutos} produtos`} />
            <StatCard icon={AlertTriangle} iconTone="red" label="Alertas críticos" value={pad2(data.criticos)}
              pill={data.criticos > 0 ? 'Alerta' : undefined} critical={data.criticos > 0}
              sub={data.vencendo > 0 ? `${data.vencendo} lote(s) vencem em 7 dias` : undefined} />
            <StatCard icon={Truck} iconTone="creme" label="Saídas hoje" value={numero(data.saidasHoje)} note="Hoje" />
          </div>

          <div className="dash-grid">
            <div className="dash-col">
              <section className="card dash-acoes">
                <h3 className="dash-h3">Ações Prioritárias</h3>
                <div className="dash-acoes-grid">
                  {ACOES.map(({ label, icon: Icon, to }) => (
                    <button key={label} className="dash-acao" onClick={() => navigate(to)}>
                      <Icon size={24} strokeWidth={1.8} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {mostrarPercepcoes && <section className="card">
                <div className="card-head">
                  <div>
                    <h3 className="dash-h3">Percepções de Estoque</h3>
                    <p className="muted" style={{ fontSize: 13 }}>Insumos que precisam de atenção imediata</p>
                  </div>
                  <Link to="/inventario" className="dash-link">Ver Inventário Completo <ArrowRight size={16} /></Link>
                </div>
                {data.percepcoes.length === 0 && <p className="empty">Nenhum produto cadastrado ainda.</p>}
                <div className="dash-percepcoes">
                  {data.percepcoes.map((p) => {
                    const critico = p.nivel < 50;
                    return (
                      <Link to={`/produtos/${p.id}`} key={p.id} className="dash-percepcao">
                        <Thumb src={p.imagem} size="lg" alt={p.nome} />
                        <div className="dash-percepcao-info">
                          <strong>{p.nome}</strong>
                          <div className="barra"><span style={{ width: `${Math.max(4, p.nivel)}%`, background: critico ? 'var(--critico)' : '#c1a965' }} /></div>
                          <small style={{ color: critico ? 'var(--critico)' : 'var(--creme-badge-texto)' }}>
                            {critico ? 'Estoque crítico' : 'Reposição sugerida'} · {p.quantidade} de {p.minimo} mín.
                          </small>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>}
            </div>

            <aside className="card dash-atividade">
              <h3 className="dash-h3">Atividade Recente</h3>
              {data.atividades.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Nenhuma movimentação ainda.</p>}
              <ul>
                {data.atividades.map((a, i) => {
                  const Icon = ICONE_ATIVIDADE[a.tipo] || Package;
                  return (
                    <li key={i}>
                      <span className="dash-atividade-ico"><Icon size={16} /></span>
                      <div>
                        <p>{a.titulo}</p>
                        <small>{tempoAtras(a.data)}</small>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button className="btn btn-escuro btn-block btn-lg" onClick={() => navigate('/relatorios')}>Ver Histórico Completo</button>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
