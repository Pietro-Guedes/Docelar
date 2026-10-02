import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, MessageSquareWarning, ArrowLeftRight, Undo2, HelpCircle, History, Printer, Trash2, Minus, Plus, ExternalLink } from 'lucide-react';
import { Feedback, useFeedback, Thumb, Modal, Loading, Erro } from '../components/ui';
import { listarProdutos, registrarDevolucao, registrarSaida, listarDevolucoes } from '../api';
import { dinheiro, dataBR, gerarProtocolo, mensagemErro } from '../utils';
import './TrocaDevolucao.css';

const MOTIVOS = [
  'Produto com avaria ou defeito de fabricação',
  'Produto fora da validade',
  'Produto diferente do pedido',
  'Quantidade incorreta',
  'Cliente desistiu da compra',
  'Outro motivo',
];

const CLIENTE_VAZIO = { nome: '', documento: '', email: '', telefone: '' };

// extrai os dados que gravamos na observação da devolução
function lerObservacao(obs = '') {
  const pega = (rotulo) => obs.match(new RegExp(`${rotulo}:?\\s*([^·]+)`))?.[1]?.trim() || '';
  return {
    protocolo: obs.match(/Protocolo\s+(#[\w-]+)/)?.[1] || '',
    cliente: pega('Cliente'),
    troca: /TROCA/.test(obs),
  };
}

export default function TrocaDevolucao() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [protocolo, setProtocolo] = useState(gerarProtocolo);
  const [cliente, setCliente] = useState(CLIENTE_VAZIO);
  const [produtos, setProdutos] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalhes, setDetalhes] = useState('');
  const [tipo, setTipo] = useState('TROCA');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [historicoAberto, setHistoricoAberto] = useState(false);

  useEffect(() => { listarProdutos().then(setProdutos).catch((e) => setErro(e.message)); }, []);

  const produto = produtos.find((p) => String(p.id) === String(produtoId));
  const lotes = useMemo(() => [...(produto?.lotes || [])].sort((a, b) => String(b.dataEntrada).localeCompare(String(a.dataEntrada))), [produto]);
  const valor = (produto?.valorUnitario || 0) * quantidade;
  const setC = (c) => (e) => setCliente((x) => ({ ...x, [c]: e.target.value }));

  useEffect(() => { setLoteId(lotes[0]?.id ? String(lotes[0].id) : ''); }, [lotes]);

  function limpar() {
    setCliente(CLIENTE_VAZIO);
    setProdutoId('');
    setQuantidade(1);
    setMotivo(MOTIVOS[0]);
    setDetalhes('');
    setErro('');
    setProtocolo(gerarProtocolo());
  }

  async function confirmar(acao) {
    setTipo(acao);
    if (!cliente.nome.trim()) return setErro('Informe o nome do cliente.');
    if (!produto) return setErro('Escolha o produto.');
    if (!loteId) return setErro('Este produto não tem lote no estoque para vincular a devolução.');
    if (!(quantidade > 0)) return setErro('Informe a quantidade.');
    setErro('');
    setSalvando(true);

    const observacao = [
      `Protocolo ${protocolo}`,
      acao === 'TROCA' ? 'TROCA' : 'DEVOLUÇÃO',
      `Cliente: ${cliente.nome.trim()}`,
      cliente.documento && `Doc: ${cliente.documento}`,
      cliente.telefone && `Tel: ${cliente.telefone}`,
      cliente.email && `E-mail: ${cliente.email}`,
      detalhes,
    ].filter(Boolean).join(' · ');

    try {
      await registrarDevolucao({ loteId, quantidade, motivo, observacao });
      if (acao === 'TROCA') {
        // na troca o cliente leva um produto novo: registra a saída da reposição
        try {
          await registrarSaida({ pedido: `Troca ${protocolo}`, observacoes: `Reposição da troca · Cliente: ${cliente.nome.trim()}`, itens: [{ produtoId: produto.id, nome: produto.nome, quantidade }] });
        } catch (e) {
          setErro(`A devolução foi registrada, mas a saída do produto novo falhou: ${mensagemErro(e)}`);
          return;
        }
      }
      feedback.mostrar('Concluído');
      limpar();
      listarProdutos().then(setProdutos).catch(() => {});
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Troca &amp; Devolução</h1>
        <div className="page-actions">
          <button className="btn btn-soft" onClick={() => { limpar(); navigate(-1); }}>Cancelar Processo</button>
          <button className="btn btn-vinho" onClick={() => confirmar('TROCA')} disabled={salvando}>Confirmar Troca</button>
        </div>
      </div>

      {erro && <div className="erro-box">{erro}</div>}

      <div className="two-col">
        <div>
          <section className="card">
            <h3 className="section-title td-titulo"><User size={18} /> Dados do Comprador e Protocolo</h3>
            <div className="form-grid">
              <div className="field">
                <label className="td-label">Nome completo</label>
                <input className="input" placeholder="Maria Aparecida de Souza" value={cliente.nome} onChange={setC('nome')} />
              </div>
              <div className="field">
                <label className="td-label">CPF / CNPJ</label>
                <input className="input" placeholder="123.456.789-00" value={cliente.documento} onChange={setC('documento')} />
              </div>
              <div className="field">
                <label className="td-label">E-mail para contato</label>
                <input className="input" type="email" placeholder="maria.souza@email.com" value={cliente.email} onChange={setC('email')} />
              </div>
              <div className="field">
                <label className="td-label">Telefone</label>
                <input className="input" placeholder="(11) 98765-4321" value={cliente.telefone} onChange={setC('telefone')} />
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="section-title td-titulo"><Package size={18} /> Identificação do Produto</h3>
            <div className="td-produto">
              <Thumb src={produto?.imagem} size="lg" alt={produto?.nome} />
              <div className="td-produto-campos">
                <div className="field">
                  <label className="td-label">Produto</label>
                  <select className="select" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
                    <option value="">Selecione o produto...</option>
                    {produtos.map((p) => <option key={p.id} value={p.id}>{p.codigo} - {p.nome}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="td-label">Lote de origem</label>
                  <select className="select" value={loteId} onChange={(e) => setLoteId(e.target.value)} disabled={!produto}>
                    {!produto && <option value="">—</option>}
                    {produto && lotes.length === 0 && <option value="">Nenhum lote</option>}
                    {lotes.map((l) => (
                      <option key={l.id} value={l.id}>
                        Lote #{l.id} · entrada {dataBR(l.dataEntrada) || '—'}{l.validade ? ` · val. ${dataBR(l.validade)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="td-qtd">
                <label className="td-label">Quantidade</label>
                <div className="stepper">
                  <button type="button" onClick={() => setQuantidade((q) => Math.max(1, q - 1))} aria-label="Diminuir"><Minus size={14} /></button>
                  <span>{String(quantidade).padStart(2, '0')}</span>
                  <button type="button" onClick={() => setQuantidade((q) => q + 1)} aria-label="Aumentar"><Plus size={14} /></button>
                </div>
              </div>
            </div>
            {produto && <p className="td-info">Código: #{produto.codigo} · Valor unitário: {dinheiro(produto.valorUnitario)}{produto.fornecedor ? ` · Fornecedor: ${produto.fornecedor}` : ''}</p>}
          </section>

          <section className="card">
            <h3 className="section-title td-titulo"><MessageSquareWarning size={18} /> Motivo da Solicitação</h3>
            <div className="field">
              <label className="td-label">Justificativa</label>
              <select className="select" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="td-label">Observações detalhadas</label>
              <textarea className="textarea" placeholder="Descreva aqui o problema encontrado no produto..." value={detalhes} onChange={(e) => setDetalhes(e.target.value)} />
            </div>
          </section>
        </div>

        <div className="side-stack" style={{ gap: 20 }}>
          <div className="panel-dark td-protocolo">
            <span className="eyebrow">Protocolo ativo</span>
            <div className="big">{protocolo}</div>
            <div style={{ height: 18 }} />
            <div className="row"><span>Tipo de ação</span><span className="badge badge-vinho">{tipo === 'TROCA' ? 'Troca' : 'Devolução'}</span></div>
            <div className="row"><span>Status atual</span><span className="badge td-status">{salvando ? 'Registrando...' : 'Aguardando confirmação'}</span></div>
            <div className="row"><span>Valor estimado</span><b style={{ fontSize: 20 }}>{dinheiro(valor)}</b></div>
            <button className="btn btn-vinho btn-lg btn-block" style={{ marginTop: 18 }} onClick={() => confirmar('TROCA')} disabled={salvando}>
              <ArrowLeftRight size={17} /> Confirmar Troca
            </button>
            <button className="btn btn-lg btn-block td-btn-dev" onClick={() => confirmar('DEVOLUCAO')} disabled={salvando}>
              <Undo2 size={17} /> Confirmar Devolução
            </button>
          </div>

          <div className="tip td-ajuda">
            <HelpCircle size={30} />
            <div>
              <strong style={{ display: 'block' }}>Precisa de ajuda?</strong>
              Na <b>troca</b> o produto devolvido é registrado e um novo sai do estoque. Na <b>devolução</b> só o retorno é registrado.
            </div>
          </div>

          <button className="btn btn-vinho btn-lg btn-block" onClick={() => setHistoricoAberto(true)}><History size={17} /> Ver o histórico de trocas</button>
          <div className="td-mini">
            <button className="btn btn-vinho" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
            <button className="btn btn-vinho" onClick={limpar}><Trash2 size={16} /> Excluir</button>
          </div>
        </div>
      </div>

      <Historico aberto={historicoAberto} onClose={() => setHistoricoAberto(false)} />
      <Feedback {...feedback.props} />
    </div>
  );
}

function Historico({ aberto, onClose }) {
  const [estado, setEstado] = useState({ loading: true, data: [], error: null });

  useEffect(() => {
    if (!aberto) return;
    setEstado({ loading: true, data: [], error: null });
    listarDevolucoes()
      .then((data) => setEstado({ loading: false, data, error: null }))
      .catch((error) => setEstado({ loading: false, data: [], error }));
  }, [aberto]);

  return (
    <Modal open={aberto} onClose={onClose} width={1100} title="Histórico Recente de Trocas">
      {estado.loading && <Loading />}
      <Erro error={estado.error} />
      {!estado.loading && !estado.error && (
        <div className="table-wrap">
          <table className="table td-historico">
            <thead>
              <tr><th>Protocolo</th><th>Cliente</th><th>Produto</th><th>Data</th><th>Tipo</th><th>Motivo</th><th className="num">Valor</th></tr>
            </thead>
            <tbody>
              {estado.data.length === 0 && <tr><td colSpan={7} className="empty">Nenhuma troca ou devolução registrada.</td></tr>}
              {estado.data.map((m) => {
                const info = lerObservacao(m.observacao);
                return (
                  <tr key={m.id}>
                    <td className="strong">{info.protocolo || `#${m.id}`}</td>
                    <td>{info.cliente || '—'}</td>
                    <td>{m.produto} (x{m.quantidade})</td>
                    <td>{dataBR(m.data)}</td>
                    <td><span className={`badge ${info.troca ? 'badge-ok' : 'badge-baixo'}`}>{info.troca ? 'Troca' : 'Devolução'}</span></td>
                    <td className="muted" style={{ maxWidth: 220 }}>{m.motivo}</td>
                    <td className="num money">{dinheiro(m.valorTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ color: 'var(--vinho)' }}>Sair <ExternalLink size={14} /></button>
      </div>
    </Modal>
  );
}
