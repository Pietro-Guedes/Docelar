import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, MessageSquareWarning, ArrowLeftRight, Undo2, HelpCircle, History, Printer, Trash2, Minus, Plus, ExternalLink, Truck, CalendarX, RotateCcw } from 'lucide-react';
import { Feedback, useFeedback, Thumb, Modal, Loading, Erro, Confirm } from '../components/ui';
import { usePageMeta } from '../components/Layout';
import {
  listarProdutos, listarFornecedores, registrarDevolucao, registrarTroca, registrarSaidaLoteVencido,
  listarDevolucoes, estornarMovimentacao,
} from '../api';
import { dinheiro, dataBR, gerarProtocolo, mensagemErro, diasParaVencer } from '../utils';
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
const QUANTIDADE_VENCIDA = { tipo: 'BAIXA_VENCIMENTO', label: 'Baixa por vencimento' };

function lerObservacao(obs = '') {
  const pega = (rotulo) => obs.match(new RegExp(`${rotulo}:?\\s*([^·]+)`))?.[1]?.trim() || '';
  return {
    protocolo: obs.match(/Protocolo\s+(#[\w-]+)/)?.[1] || '',
    cliente: pega('Cliente'),
    fornecedor: pega('Fornecedor'),
    troca: /TROCA/.test(obs),
  };
}

function rotuloMovimentacao(m) {
  if (m.motivo === 'DEVOLUCAO_FORNECEDOR') return 'Devolução ao fornecedor';
  if (m.motivo === 'BAIXA_VENCIMENTO') return 'Baixa por vencimento';
  return /TROCA/.test(m.observacao) ? 'Troca' : 'Devolução';
}

export default function TrocaDevolucao() {
  usePageMeta({ breadcrumb: ['Movimentação', 'Devolução'], title: 'Troca e Devolução' });
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [protocolo, setProtocolo] = useState(gerarProtocolo);
  const [cliente, setCliente] = useState(CLIENTE_VAZIO);
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [quantidadeRetorno, setQuantidadeRetorno] = useState(1);
  const [produtoSaidaId, setProdutoSaidaId] = useState('');
  const [quantidadeSaida, setQuantidadeSaida] = useState(1);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalhes, setDetalhes] = useState('');
  const [tipo, setTipo] = useState('TROCA');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [loteVencidoId, setLoteVencidoId] = useState('');
  const [tipoVencido, setTipoVencido] = useState(QUANTIDADE_VENCIDA.tipo);
  const [quantidadeVencida, setQuantidadeVencida] = useState(1);
  const [observacaoVencida, setObservacaoVencida] = useState('');

  async function atualizarProdutos() {
    try {
      const [lista, listaFornecedores] = await Promise.all([
        listarProdutos(),
        listarFornecedores().catch((e) => {
          setErro(`Não foi possível carregar os fornecedores: ${mensagemErro(e)}`);
          return [];
        }),
      ]);
      setProdutos(lista);
      setFornecedores(listaFornecedores);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  useEffect(() => { atualizarProdutos(); }, []);

  const produto = produtos.find((p) => String(p.id) === String(produtoId));
  const produtosAtivos = useMemo(() => produtos.filter((p) => p.ativo !== false), [produtos]);
  const lotes = useMemo(
    () => [...(produto?.lotes || [])].sort((a, b) => String(b.dataEntrada).localeCompare(String(a.dataEntrada))),
    [produto],
  );
  const loteRetorno = lotes.find((l) => String(l.id) === String(loteId));
  const produtoSaida = produtosAtivos.find((p) => String(p.id) === String(produtoSaidaId));
  const valorRetorno = (produto?.valorUnitario || 0) * quantidadeRetorno;
  const valorSaida = (produtoSaida?.valorUnitario || 0) * quantidadeSaida;
  const lotesVencidos = useMemo(
    () => produtos.flatMap((p) => p.lotes
      .filter((l) => l.quantidade > 0 && diasParaVencer(l.validade) < 0)
      .map((l) => ({ ...l, produto: p })))
      .sort((a, b) => String(a.validade).localeCompare(String(b.validade))),
    [produtos],
  );
  const loteVencido = lotesVencidos.find((l) => String(l.id) === String(loteVencidoId)) || lotesVencidos[0];
  const fornecedorLote = loteVencido
    ? fornecedores.find((f) => Number(f.id) === Number(loteVencido.fornecedorId))?.nome || loteVencido.produto.fornecedor
    : '';
  const setC = (campo) => (e) => setCliente((x) => ({ ...x, [campo]: e.target.value }));

  function limpar() {
    setCliente(CLIENTE_VAZIO);
    setProdutoId('');
    setQuantidadeRetorno(1);
    setProdutoSaidaId('');
    setQuantidadeSaida(1);
    setMotivo(MOTIVOS[0]);
    setDetalhes('');
    setErro('');
    setTipo('TROCA');
    setProtocolo(gerarProtocolo());
  }

  async function confirmar() {
    if (!cliente.nome.trim()) return setErro('Informe o nome do cliente.');
    if (!produto || !loteRetorno) return setErro('Escolha o produto devolvido e o lote de origem.');
    if (!(quantidadeRetorno > 0)) return setErro('Informe uma quantidade devolvida maior que zero.');
    if (tipo === 'TROCA' && !produtoSaida) return setErro('Escolha o produto de reposição.');
    if (tipo === 'TROCA' && !(quantidadeSaida > 0)) return setErro('Informe a quantidade do produto de reposição.');

    setErro('');
    setSalvando(true);
    const observacao = [
      `Protocolo ${protocolo}`,
      tipo,
      `Cliente: ${cliente.nome.trim()}`,
      cliente.documento && `Doc: ${cliente.documento}`,
      cliente.telefone && `Tel: ${cliente.telefone}`,
      cliente.email && `E-mail: ${cliente.email}`,
      detalhes,
    ].filter(Boolean).join(' · ');

    try {
      if (tipo === 'TROCA') {
        await registrarTroca({
          loteRetornoId: loteRetorno.id,
          produtoSaidaId: produtoSaida.id,
          quantidadeRetorno,
          quantidadeSaida,
          observacao,
        });
      } else {
        await registrarDevolucao({ loteId: loteRetorno.id, quantidade: quantidadeRetorno, motivo, observacao });
      }
      feedback.mostrar('Concluído');
      limpar();
      await atualizarProdutos();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  function selecionarLoteVencido(id) {
    setLoteVencidoId(id);
    setQuantidadeVencida(1);
    const escolhido = lotesVencidos.find((l) => String(l.id) === String(id));
    setTipoVencido(escolhido?.fornecedorId ? 'DEVOLUCAO_FORNECEDOR' : QUANTIDADE_VENCIDA.tipo);
  }

  async function confirmarLoteVencido() {
    if (!loteVencido) return setErro('Selecione um lote vencido.');
    if (!(quantidadeVencida > 0) || quantidadeVencida > loteVencido.quantidade) {
      return setErro(`Informe uma quantidade entre 1 e ${loteVencido.quantidade}.`);
    }
    if (tipoVencido === 'DEVOLUCAO_FORNECEDOR' && !loteVencido.fornecedorId) {
      return setErro('Este lote não possui fornecedor de origem. Escolha baixa por vencimento.');
    }
    setErro('');
    setSalvando(true);
    try {
      const tipoLabel = tipoVencido === 'DEVOLUCAO_FORNECEDOR' ? 'Devolução ao fornecedor' : 'Baixa por vencimento';
      await registrarSaidaLoteVencido({
        loteId: loteVencido.id,
        quantidade: quantidadeVencida,
        tipo: tipoVencido,
        fornecedorId: loteVencido.fornecedorId,
        observacao: [
          `Protocolo ${gerarProtocolo()}`,
          tipoLabel,
          `Produto: ${loteVencido.produto.nome}`,
          `Validade: ${dataBR(loteVencido.validade)}`,
          fornecedorLote && `Fornecedor: ${fornecedorLote}`,
          observacaoVencida,
        ].filter(Boolean).join(' · '),
      });
      setObservacaoVencida('');
      feedback.mostrar('Concluído');
      await atualizarProdutos();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Troca &amp; Devolução</h1>
          <p className="page-subtitle">Registre devoluções e trocas de clientes, ou resolva lotes vencidos.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-soft" onClick={() => { limpar(); navigate(-1); }}>Cancelar Processo</button>
          <button className="btn btn-vinho" onClick={confirmar} disabled={salvando}>
            {tipo === 'TROCA' ? <ArrowLeftRight size={17} /> : <Undo2 size={17} />}
            {salvando ? 'Registrando...' : tipo === 'TROCA' ? 'Confirmar Troca' : 'Confirmar Devolução'}
          </button>
        </div>
      </div>

      {erro && <div className="erro-box" role="alert">{erro}</div>}

      <div className="td-modos" role="group" aria-label="Tipo de atendimento">
        <button type="button" className={`btn ${tipo === 'TROCA' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTipo('TROCA')} aria-pressed={tipo === 'TROCA'}>
          <ArrowLeftRight size={16} /> Troca
        </button>
        <button type="button" className={`btn ${tipo === 'DEVOLUCAO' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTipo('DEVOLUCAO')} aria-pressed={tipo === 'DEVOLUCAO'}>
          <Undo2 size={16} /> Devolução de cliente
        </button>
      </div>

      <div className="two-col">
        <div>
          <section className="card">
            <h3 className="section-title td-titulo"><User size={18} /> Dados do Comprador</h3>
            <div className="form-grid">
              <div className="field">
                <label className="td-label" htmlFor="td-cliente">Nome completo</label>
                <input id="td-cliente" className="input" placeholder="Maria Aparecida de Souza" value={cliente.nome} onChange={setC('nome')} />
              </div>
              <div className="field">
                <label className="td-label" htmlFor="td-documento">CPF / CNPJ</label>
                <input id="td-documento" className="input" placeholder="123.456.789-00" value={cliente.documento} onChange={setC('documento')} />
              </div>
              <div className="field">
                <label className="td-label" htmlFor="td-email">E-mail para contato</label>
                <input id="td-email" className="input" type="email" placeholder="maria.souza@email.com" value={cliente.email} onChange={setC('email')} />
              </div>
              <div className="field">
                <label className="td-label" htmlFor="td-telefone">Telefone</label>
                <input id="td-telefone" className="input" placeholder="(11) 98765-4321" value={cliente.telefone} onChange={setC('telefone')} />
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="section-title td-titulo"><Package size={18} /> Produto devolvido pelo cliente</h3>
            <div className="td-produto">
              <Thumb src={produto?.imagem} size="lg" alt={produto?.nome} />
              <div className="td-produto-campos">
                <div className="field">
                  <label className="td-label" htmlFor="td-produto">Produto</label>
                  <select id="td-produto" className="select" value={produtoId} onChange={(e) => {
                    const id = e.target.value;
                    const escolhido = produtos.find((p) => String(p.id) === id);
                    const lote = [...(escolhido?.lotes || [])].sort((a, b) => String(b.dataEntrada).localeCompare(String(a.dataEntrada)))[0];
                    setProdutoId(id);
                    setLoteId(lote?.id ? String(lote.id) : '');
                  }}>
                    <option value="">Selecione o produto...</option>
                    {produtos.map((p) => <option key={p.id} value={p.id}>{p.codigo} - {p.nome}{p.ativo === false ? ' (desativado)' : ''}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="td-label" htmlFor="td-lote">Lote de origem</label>
                  <select id="td-lote" className="select" value={loteId} onChange={(e) => setLoteId(e.target.value)} disabled={!produto}>
                    {!produto && <option value="">Selecione um produto primeiro</option>}
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
                <label className="td-label">Quantidade devolvida</label>
                <div className="stepper">
                  <button type="button" onClick={() => setQuantidadeRetorno((q) => Math.max(1, q - 1))} aria-label="Diminuir quantidade devolvida"><Minus size={14} /></button>
                  <span>{String(quantidadeRetorno).padStart(2, '0')}</span>
                  <button type="button" onClick={() => setQuantidadeRetorno((q) => q + 1)} aria-label="Aumentar quantidade devolvida"><Plus size={14} /></button>
                </div>
              </div>
            </div>
            {produto && <p className="td-info">Código: #{produto.codigo} · Valor unitário: {dinheiro(produto.valorUnitario)}{produto.fornecedor ? ` · Fornecedor: ${produto.fornecedor}` : ''}</p>}
          </section>

          {tipo === 'TROCA' && (
            <section className="card">
              <h3 className="section-title td-titulo"><ArrowLeftRight size={18} /> Produto de reposição</h3>
              <div className="td-produto">
                <div className="td-produto-campos">
                  <div className="field">
                    <label className="td-label" htmlFor="td-produto-saida">Novo produto</label>
                    <select id="td-produto-saida" className="select" value={produtoSaidaId} onChange={(e) => setProdutoSaidaId(e.target.value)}>
                      <option value="">Selecione o que será entregue...</option>
                      {produtosAtivos.map((p) => <option key={p.id} value={p.id}>{p.codigo} - {p.nome} · {p.quantidade} em estoque</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="td-label" htmlFor="td-qtd-saida">Quantidade de reposição</label>
                    <input id="td-qtd-saida" className="input" type="number" min="1" step="1" value={quantidadeSaida} onChange={(e) => setQuantidadeSaida(Number(e.target.value))} />
                  </div>
                </div>
              </div>
              {produtoSaida && <p className="td-info">Disponível: {produtoSaida.quantidade} · Valor unitário: {dinheiro(produtoSaida.valorUnitario)}</p>}
            </section>
          )}

          <section className="card">
            <h3 className="section-title td-titulo"><MessageSquareWarning size={18} /> Motivo e observações</h3>
            <div className="field">
              <label className="td-label" htmlFor="td-motivo">Justificativa</label>
              <select id="td-motivo" className="select" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="td-label" htmlFor="td-detalhes">Observações detalhadas</label>
              <textarea id="td-detalhes" className="textarea" placeholder="Descreva aqui o problema encontrado no produto..." value={detalhes} onChange={(e) => setDetalhes(e.target.value)} />
            </div>
          </section>
        </div>

        <div className="side-stack" style={{ gap: 20 }}>
          <div className="panel-dark td-protocolo">
            <span className="eyebrow">Protocolo</span>
            <div className="big">{protocolo}</div>
            <div style={{ height: 18 }} />
            <div className="row"><span>Tipo de ação</span><span className="badge badge-vinho">{tipo === 'TROCA' ? 'Troca' : 'Devolução'}</span></div>
            <div className="row"><span>Status</span><span className="badge td-status">{salvando ? 'Registrando...' : 'Aguardando confirmação'}</span></div>
            <div className="row"><span>Valor devolvido</span><b>{dinheiro(valorRetorno)}</b></div>
            {tipo === 'TROCA' && <div className="row"><span>Valor da reposição</span><b>{dinheiro(valorSaida)}</b></div>}
            <button className="btn btn-vinho btn-lg btn-block" style={{ marginTop: 18 }} onClick={confirmar} disabled={salvando}>
              {tipo === 'TROCA' ? <ArrowLeftRight size={17} /> : <Undo2 size={17} />}
              {tipo === 'TROCA' ? 'Confirmar Troca' : 'Confirmar Devolução'}
            </button>
          </div>

          <div className="tip td-ajuda">
            <HelpCircle size={30} />
            <div>
              <strong style={{ display: 'block' }}>Como funciona</strong>
              Na troca, escolha separadamente o item devolvido e o produto que sairá do estoque. A operação é registrada por inteiro ou não é registrada.
            </div>
          </div>

          <button className="btn btn-vinho btn-lg btn-block" onClick={() => setHistoricoAberto(true)}><History size={17} /> Ver histórico e desfazer</button>
          <div className="td-mini">
            <button className="btn btn-vinho" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
            <button className="btn btn-vinho" onClick={limpar}><Trash2 size={16} /> Limpar</button>
          </div>
        </div>
      </div>

      <section className="card td-vencidos">
        <div className="card-head">
          <div>
            <h3 className="section-title td-titulo"><CalendarX size={18} /> Lotes vencidos</h3>
            <p className="muted" style={{ fontSize: 13 }}>Devolva ao fornecedor de origem ou registre a baixa do que não puder ser devolvido.</p>
          </div>
          <span className="badge badge-alerta">{lotesVencidos.length} lote(s)</span>
        </div>
        {lotesVencidos.length === 0 ? <p className="empty">Não há lotes vencidos com saldo.</p> : (
          <div className="td-vencidos-grid">
            <div className="field">
              <label className="td-label" htmlFor="td-lote-vencido">Produto e lote vencido</label>
              <select id="td-lote-vencido" className="select" value={loteVencido?.id ? String(loteVencido.id) : ''} onChange={(e) => selecionarLoteVencido(e.target.value)}>
                {lotesVencidos.map((l) => (
                  <option key={l.id} value={l.id}>{l.produto.nome} · lote #{l.id} · vencido em {dataBR(l.validade)} · {l.quantidade} un.</option>
                ))}
              </select>
              {loteVencido && <small className="td-info">Fornecedor de origem: {fornecedorLote || 'não informado'} · Saldo: {loteVencido.quantidade}</small>}
            </div>
            <div className="field">
              <label className="td-label" htmlFor="td-qtd-vencida">Quantidade</label>
              <input id="td-qtd-vencida" className="input" type="number" min="1" max={loteVencido?.quantidade || 1} step="1" value={quantidadeVencida} onChange={(e) => setQuantidadeVencida(Number(e.target.value))} />
            </div>
            <div className="field">
              <label className="td-label">Destino do produto vencido</label>
              <div className="td-modos">
                <button type="button" className={`btn ${tipoVencido === 'DEVOLUCAO_FORNECEDOR' ? 'btn-primary' : 'btn-outline'}`} disabled={!loteVencido?.fornecedorId} onClick={() => setTipoVencido('DEVOLUCAO_FORNECEDOR')}>
                  <Truck size={16} /> Fornecedor
                </button>
                <button type="button" className={`btn ${tipoVencido === 'BAIXA_VENCIMENTO' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTipoVencido('BAIXA_VENCIMENTO')}>
                  <Trash2 size={16} /> Baixa
                </button>
              </div>
            </div>
            <div className="field">
              <label className="td-label" htmlFor="td-observacao-vencida">Observações (opcional)</label>
              <input id="td-observacao-vencida" className="input" value={observacaoVencida} onChange={(e) => setObservacaoVencida(e.target.value)} placeholder="Ex.: protocolo de devolução do fornecedor" />
            </div>
          </div>
        )}
        {lotesVencidos.length > 0 && (
          <button className="btn btn-vinho" style={{ marginTop: 16 }} onClick={confirmarLoteVencido} disabled={salvando || !loteVencido}>
            {tipoVencido === 'DEVOLUCAO_FORNECEDOR' ? <Truck size={17} /> : <CalendarX size={17} />}
            {tipoVencido === 'DEVOLUCAO_FORNECEDOR' ? 'Registrar devolução ao fornecedor' : 'Registrar baixa por vencimento'}
          </button>
        )}
      </section>

      <Historico
        aberto={historicoAberto}
        onClose={() => setHistoricoAberto(false)}
        onEstornar={async (id) => {
          await estornarMovimentacao(id);
          await atualizarProdutos();
          feedback.mostrar('Movimentação estornada');
        }}
      />
      <Feedback {...feedback.props} />
    </div>
  );
}

function Historico({ aberto, onClose, onEstornar }) {
  const [estado, setEstado] = useState({ loading: true, data: [], error: null });
  const [versao, setVersao] = useState(0);
  const [estornar, setEstornar] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroEstorno, setErroEstorno] = useState('');

  useEffect(() => {
    if (!aberto) return;
    setEstado({ loading: true, data: [], error: null });
    listarDevolucoes()
      .then((data) => setEstado({ loading: false, data, error: null }))
      .catch((error) => setEstado({ loading: false, data: [], error }));
  }, [aberto, versao]);

  async function confirmarEstorno() {
    if (salvando || !estornar) return;
    setSalvando(true);
    setErroEstorno('');
    try {
      await onEstornar(estornar.id);
      setEstornar(null);
      setVersao((v) => v + 1);
    } catch (e) {
      setErroEstorno(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Modal open={aberto} onClose={onClose} width={1100} title="Histórico de trocas, devoluções e vencidos">
        {estado.loading && <Loading />}
        <Erro error={estado.error} />
        {erroEstorno && <div className="erro-box" role="alert">{erroEstorno}</div>}
        {!estado.loading && !estado.error && (
          <div className="table-wrap">
            <table className="table td-historico">
              <thead>
                <tr><th>Protocolo</th><th>Cliente / origem</th><th>Produto</th><th>Data</th><th>Tipo</th><th>Motivo</th><th className="num">Valor</th><th>Ação</th></tr>
              </thead>
              <tbody>
                {estado.data.length === 0 && <tr><td colSpan={8} className="empty">Nenhuma movimentação registrada.</td></tr>}
                {estado.data.map((m) => {
                  const info = lerObservacao(m.observacao);
                  return (
                    <tr key={m.id}>
                      <td className="strong">{info.protocolo || `#${m.id}`}</td>
                      <td>{info.cliente || info.fornecedor || (m.motivo === 'DEVOLUCAO_FORNECEDOR' ? 'Fornecedor' : '—')}</td>
                      <td>{m.produto} (x{m.quantidade})</td>
                      <td>{dataBR(m.data)}</td>
                      <td><span className={`badge ${info.troca ? 'badge-ok' : 'badge-baixo'}`}>{rotuloMovimentacao(m)}</span></td>
                      <td className="muted" style={{ maxWidth: 220 }}>
                        {m.motivo === 'DEVOLUCAO_FORNECEDOR' ? 'Lote vencido' : m.motivo === 'BAIXA_VENCIMENTO' ? 'Lote vencido' : m.motivo || '—'}
                      </td>
                      <td className="num money">{dinheiro(m.valorTotal)}</td>
                      <td>
                        {m.estornada
                          ? <span className="badge badge-alerta">Estornada</span>
                          : <button className="btn btn-outline" onClick={() => setEstornar(m)} disabled={salvando}><RotateCcw size={14} /> Desfazer</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ color: 'var(--vinho)' }}>Fechar <ExternalLink size={14} /></button>
        </div>
      </Modal>
      <Confirm
        open={!!estornar}
        titulo="Desfazer movimentação?"
        rotulo={salvando ? 'Desfazendo...' : 'Desfazer'}
        texto="O sistema registrará um estorno e ajustará o saldo. Se o estoque já tiver sido consumido, a operação será recusada para não criar saldo incorreto."
        onConfirm={confirmarEstorno}
        onCancel={() => setEstornar(null)}
      />
    </>
  );
}
