import { useState } from 'react';
import { ChevronRight, ChevronDown, TriangleAlert } from 'lucide-react';
import { dataBR, lotesAtivos, numero, piorSituacao, situacaoValidade, nivelEmAlerta } from '../utils';

const CLASSE = { vencido: 'badge-critico', urgente: 'badge-critico', atencao: 'badge-baixo', ok: 'badge-ok', sem: 'badge-creme' };

/* Selo com a situação de uma validade ("Vence em 5 dias", "Vencido há 2 dias"...) */
export function ValidadeBadge({ validade }) {
  const s = situacaoValidade(validade);
  return <span className={`badge ${CLASSE[s.nivel]}`}>{nivelEmAlerta(s.nivel) && <TriangleAlert size={12} />} {s.texto}</span>;
}

/* Resumo na linha do produto: a validade que vence primeiro + alerta */
export function ValidadeResumo({ produto }) {
  const pior = piorSituacao(produto.lotes);
  if (!pior) return <span className="muted">—</span>;
  return (
    <div className="validade-resumo">
      <span>{pior.validade ? dataBR(pior.validade) : 'Sem validade'}</span>
      {pior.nivel !== 'sem' && <span className={`badge ${CLASSE[pior.nivel]}`}>{nivelEmAlerta(pior.nivel) && <TriangleAlert size={12} />} {pior.texto}</span>}
    </div>
  );
}

/* Controla quais produtos estão com os lotes abertos */
export function useAbertos() {
  const [abertos, setAbertos] = useState(() => new Set());
  const alternar = (id) => setAbertos((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  return { aberto: (id) => abertos.has(id), alternar };
}

/* Seta + nome do produto: clicar abre/fecha os lotes */
export function BotaoLotes({ aberto, onClick, children, nome }) {
  const Seta = aberto ? ChevronDown : ChevronRight;
  return (
    <button type="button" className="lotes-toggle" onClick={onClick} aria-expanded={aberto} aria-label={`${aberto ? 'Esconder' : 'Ver'} lotes de ${nome}`}>
      <Seta size={16} />
      {children}
    </button>
  );
}

/* Linha extra da tabela com os lotes do produto, cada um com a sua validade */
export function LinhaLotes({ produto, colSpan }) {
  const lotes = lotesAtivos(produto.lotes);
  return (
    <tr className="lotes-linha">
      <td colSpan={colSpan}>
        <div className="lotes-box">
          <strong className="lotes-titulo">Lotes de {produto.nome}</strong>
          {lotes.length === 0 ? (
            <p className="muted lotes-vazio">Nenhum lote com saldo em estoque.</p>
          ) : (
            <table className="lotes-tabela">
              <thead>
                <tr><th>Lote</th><th>Entrada</th><th>Validade</th><th className="num">Quantidade</th><th>Situação</th></tr>
              </thead>
              <tbody>
                {lotes.map((l) => {
                  const s = situacaoValidade(l.validade);
                  return (
                    <tr key={l.id} className={nivelEmAlerta(s.nivel) ? `lote-${s.nivel}` : ''}>
                      <td>#{l.id}</td>
                      <td>{dataBR(l.dataEntrada) || '—'}</td>
                      <td>{l.validade ? dataBR(l.validade) : <span className="muted">Sem validade</span>}</td>
                      <td className="num">{numero(l.quantidade)} {produto.unidade}</td>
                      <td><ValidadeBadge validade={l.validade} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </td>
    </tr>
  );
}
