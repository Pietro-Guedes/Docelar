import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCcw, AlertTriangle, Undo2, CalendarDays, FileDown, Printer } from 'lucide-react';
import { Thumb, Pagination, usePaginacao, Erro, Loading } from '../components/ui';
import { getRelatorio } from '../api';
import { dinheiro, dataBR, numero, useAsync } from '../utils';
import { lerPrefs } from './Perfil';
import './Relatorios.css';

const PERIODOS = [
  { dias: 7, label: '7 dias' },
  { dias: 30, label: '30 dias' },
  { dias: 90, label: '90 dias' },
];
const CORES = ['#a53146', '#c1a965', '#875136', '#e7b8bf'];
const TIPOS = { ENTRADA: { label: 'Entrada', cls: 'badge-ok' }, SAIDA: { label: 'Saída', cls: 'badge-creme' }, DEVOLUCAO: { label: 'Devolução', cls: 'badge-critico' } };

export default function Relatorios() {
  const [dias, setDias] = useState(() => (lerPrefs().resumoSemanal ? 7 : 30));
  const [tipo, setTipo] = useState('');
  const { data, loading, error, reload } = useAsync(() => getRelatorio(dias), [dias]);

  const movs = useMemo(() => (data?.movimentacoes || []).filter((m) => !tipo || m.tipo === tipo), [data, tipo]);
  const pag = usePaginacao(movs, 8);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Relatórios Analíticos</h1>
          <p className="page-subtitle">Acompanhe o desempenho da padaria a partir das movimentações de estoque.</p>
        </div>
        <div className="rel-controles no-print">
          {PERIODOS.map((p) => (
            <button key={p.dias} className={`rel-seg ${dias === p.dias ? 'on' : ''}`} onClick={() => setDias(p.dias)}>
              <CalendarDays size={14} /> {p.label}
            </button>
          ))}
          <button className="btn btn-vinho" style={{ height: 34 }} onClick={() => window.print()} title="Na janela de impressão escolha “Salvar como PDF”">
            <FileDown size={14} /> Exportar
          </button>
        </div>
      </div>

      <Erro error={error} onRetry={reload} />
      {loading && !data && <Loading texto="Juntando as movimentações..." />}

      {data && (
        <>
          <div className="stats cols-4">
            <Card icone={TrendingUp} titulo="Vendas totais" valor={dinheiro(data.vendasTotais)} variacao={data.variacaoVendas} sub={`Saídas dos últimos ${dias} dias`} />
            <Card icone={RefreshCcw} titulo="Giro de estoque" valor={`${data.giroPorMes.toFixed(1).replace('.', ',')}x / mês`} sub="Saídas ÷ estoque atual" tom="creme" />
            <Card icone={AlertTriangle} titulo="Rupturas de estoque" valor={`${data.rupturas} ${data.rupturas === 1 ? 'item' : 'itens'}`} sub="Produtos em nível crítico" tom="red" />
            <Card icone={Undo2} titulo="Devoluções" valor={numero(data.devolucoes30)} sub={`Nos últimos ${dias} dias`} />
          </div>

          <div className="rel-graficos">
            <section className="card">
              <div className="card-head">
                <h3 className="rel-h3">Movimentação Mensal (R$)</h3>
                <div className="rel-legenda">
                  <span><i style={{ background: CORES[0] }} /> Saídas</span>
                  <span><i style={{ background: CORES[1] }} /> Entradas</span>
                </div>
              </div>
              <Barras dados={data.mensal} />
            </section>

            <section className="card">
              <h3 className="rel-h3" style={{ marginBottom: 20 }}>Produtos +Vendidos</h3>
              <Rosca itens={data.maisVendidos} />
            </section>
          </div>

          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="mov-tabela-head" style={{ borderBottom: '1px solid var(--borda-suave)' }}>
              <h3 className="rel-h3">Histórico de Movimentações</h3>
              <div className="chips no-print">
                {[['', 'Todas'], ['ENTRADA', 'Entradas'], ['SAIDA', 'Saídas'], ['DEVOLUCAO', 'Devoluções']].map(([v, l]) => (
                  <button key={v} className={`chip ${tipo === v ? 'active' : ''}`} onClick={() => setTipo(v)}>{l}</button>
                ))}
                <button className="chip" onClick={() => window.print()}><Printer size={12} style={{ verticalAlign: -2 }} /> Imprimir</button>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Responsável</th><th className="center">Quantidade</th><th className="num">Valor total</th></tr>
                </thead>
                <tbody>
                  {pag.itens.length === 0 && <tr><td colSpan={6} className="empty">Nenhuma movimentação encontrada.</td></tr>}
                  {pag.itens.map((m) => (
                    <tr key={`${m.id}-${m.produtoId}`}>
                      <td style={{ whiteSpace: 'nowrap' }}>{dataBR(m.data, true)}</td>
                      <td><div className="prod-cell"><Thumb src={m.imagem} alt={m.produto} />{m.produto}</div></td>
                      <td><span className={`badge ${TIPOS[m.tipo]?.cls}`}>{TIPOS[m.tipo]?.label || m.tipo}</span></td>
                      <td>{m.funcionario}</td>
                      <td className="center strong">{m.quantidade}</td>
                      <td className="num money">{dinheiro(m.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer" style={{ borderRadius: 0 }}>
              <span>Mostrando {pag.itens.length} de {movs.length} movimentações</span>
              <Pagination page={pag.page} total={pag.total} onChange={pag.setPage} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Card({ icone: Icon, titulo, valor, variacao, sub, tom }) {
  const alta = variacao == null || variacao >= 0;
  return (
    <div className="stat">
      <div className="stat-top">
        <div className={`stat-icon ${tom || ''}`}><Icon size={20} /></div>
        {variacao != null && (
          <span className={`rel-var ${alta ? 'alta' : 'baixa'}`}>
            {alta ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {alta ? '+' : ''}{variacao}%
          </span>
        )}
      </div>
      <div className="rel-card-titulo">{titulo}</div>
      <div className="rel-card-valor">{valor}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function Barras({ dados }) {
  const max = Math.max(1, ...dados.flatMap((d) => [d.saidas, d.entradas]));
  return (
    <div className="barras" role="img" aria-label="Gráfico de barras da movimentação mensal">
      {dados.map((d) => (
        <div key={d.mes} className="barras-col">
          <div className="barras-par">
            <span className="barra-v" style={{ height: `${(d.saidas / max) * 100}%`, background: CORES[0] }} title={`Saídas: ${dinheiro(d.saidas)}`} />
            <span className="barra-v" style={{ height: `${(d.entradas / max) * 100}%`, background: CORES[1] }} title={`Entradas: ${dinheiro(d.entradas)}`} />
          </div>
          <small>{d.mes}</small>
        </div>
      ))}
    </div>
  );
}

function Rosca({ itens }) {
  if (!itens.length) return <p className="empty">Ainda não há saídas registradas.</p>;
  let acumulado = 0;
  const fatias = itens.map((it, i) => {
    const inicio = acumulado;
    acumulado += it.percentual;
    return `${CORES[i % CORES.length]} ${inicio}% ${acumulado}%`;
  });
  return (
    <div className="rosca-wrap">
      <div className="rosca" style={{ background: `conic-gradient(${fatias.join(', ')}, var(--rosa-2) ${acumulado}% 100%)` }}>
        <div className="rosca-centro">
          <strong>{itens[0].percentual}%</strong>
          <small>{itens[0].nome.split(' ')[0]}</small>
        </div>
      </div>
      <ul className="rosca-legenda">
        {itens.map((it, i) => (
          <li key={it.nome}>
            <span><i style={{ background: CORES[i % CORES.length] }} />{it.nome}</span>
            <b>{it.percentual}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
