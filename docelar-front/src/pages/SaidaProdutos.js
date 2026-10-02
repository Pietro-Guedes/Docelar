import { useEffect, useMemo, useState } from 'react';
import { ReceiptText, Truck, Wallet, Printer, Navigation, Save, Trash2, NotebookPen } from 'lucide-react';
import AdicionarItem from '../components/AdicionarItem';
import { Feedback, useFeedback, Thumb } from '../components/ui';
import { listarFuncionarios, registrarSaida } from '../api';
import { dinheiro, mensagemErro } from '../utils';
import './Movimentacao.css';

const PAGAMENTOS = ['Faturado - 15 Dias', 'Faturado - 30 Dias', 'À vista - Pix', 'À vista - Dinheiro', 'Cartão de crédito'];
const TAXA_EMBALAGEM = 0;

function novoCodigoPedido() {
  return `PED-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export default function SaidaProdutos() {
  const feedback = useFeedback();
  const [codigo, setCodigo] = useState(novoCodigoPedido);
  const [itens, setItens] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [entregador, setEntregador] = useState('');
  const [pagamento, setPagamento] = useState(PAGAMENTOS[0]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);

  useEffect(() => { listarFuncionarios().then(setFuncionarios).catch(() => {}); }, []);

  const subtotal = useMemo(() => itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0), [itens]);
  const total = subtotal + TAXA_EMBALAGEM;
  const [inteiro, centavos] = dinheiro(total).replace('R$', '').trim().split(',');

  function adicionar(item) {
    const existe = itens.find((i) => i.produtoId === item.produtoId);
    const novaQtd = (existe?.quantidade || 0) + item.quantidade;
    if (novaQtd > item.disponivel) {
      setErro(`Só há ${item.disponivel} em estoque de ${item.nome}.`);
      return false;
    }
    setErro('');
    setItens((lista) => (existe ? lista.map((i) => (i === existe ? { ...i, quantidade: novaQtd } : i)) : [...lista, item]));
  }

  async function salvar(status = 'separado') {
    if (itens.length === 0) return setErro('Adicione pelo menos um item à saída.');
    setErro('');
    setSalvando(true);
    try {
      await registrarSaida({
        pedido: codigo,
        status,
        entregador: funcionarios.find((f) => String(f.id) === entregador)?.nome || 'Retirada no balcão',
        pagamento,
        observacoes,
        itens,
      });
      feedback.mostrar(status === 'em_rota' ? 'Concluído' : 'Salvo');
      setItens([]);
      setObservacoes('');
      setCodigo(novoCodigoPedido());
    } catch (e) {
      // tira da lista o que já foi registrado antes do erro
      if (e.feitos?.length) setItens((l) => l.filter((i) => !e.feitos.includes(i)));
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
      setVersao((v) => v + 1);
    }
  }

  return (
    <div className="page">
      <div className="two-col">
        <div className="side-stack" style={{ gap: 24 }}>
          <div className="saida-topo">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <h1 className="page-title">Saída de Produtos</h1>
                <span className="saida-codigo"><ReceiptText size={14} /> {codigo}</span>
              </div>
              <p className="page-subtitle">Gerencie a expedição de itens artesanais para pedidos confirmados.</p>
            </div>
            <div className="card saida-obs" style={{ padding: 16 }}>
              <label className="label" style={{ color: 'var(--texto)' }}><NotebookPen size={12} style={{ verticalAlign: -2 }} /> Observações internas</label>
              <textarea className="textarea" placeholder="Adicione notas sobre a expedição..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>

          {erro && <div className="erro-box">{erro}</div>}

          <section className="card">
            <AdicionarItem modo="saida" onAdd={adicionar} atualizar={versao} />
          </section>

          <section className="card" style={{ padding: 0 }}>
            <div className="mov-tabela-head">
              <h3 className="mov-h3">Itens na Saída</h3>
              <span className="badge badge-critico">{itens.length} {itens.length === 1 ? 'item listado' : 'itens listados'}</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Produto</th><th>Código</th><th className="center">Qtd</th><th className="num">Valor unit.</th><th className="num">Total</th><th className="center">Ações</th></tr>
                </thead>
                <tbody>
                  {itens.length === 0 && <tr><td colSpan={6} className="empty">Busque um produto acima para começar a saída.</td></tr>}
                  {itens.map((i) => (
                    <tr key={i.produtoId}>
                      <td><div className="prod-cell strong"><Thumb src={i.imagem} alt={i.nome} />{i.nome}</div></td>
                      <td className="muted">#{i.codigo}</td>
                      <td className="center strong">{i.quantidade}</td>
                      <td className="num">{dinheiro(i.valorUnitario)}</td>
                      <td className="num" style={{ color: 'var(--critico)', fontWeight: 700 }}>{dinheiro(i.quantidade * i.valorUnitario)}</td>
                      <td className="center">
                        <button className="icon-btn danger" onClick={() => setItens((l) => l.filter((x) => x !== i))} aria-label={`Remover ${i.nome}`}><Trash2 size={17} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="side-stack" style={{ gap: 24 }}>
          <section className="card saida-resumo">
            <h3 className="section-title" style={{ fontSize: 15, marginBottom: 16 }}><ReceiptText size={17} /> Resumo e Finalização</h3>
            <label className="resumo-item">
              <Truck size={20} />
              <div style={{ flex: 1 }}>
                <small>Entregador</small>
                <select value={entregador} onChange={(e) => setEntregador(e.target.value)}>
                  <option value="">Retirada no balcão</option>
                  {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
            </label>
            <label className="resumo-item">
              <Wallet size={20} />
              <div style={{ flex: 1 }}>
                <small>Pagamento</small>
                <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                  {PAGAMENTOS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </label>
            <div className="saida-resumo-botoes">
              <button onClick={() => window.print()}><Printer size={18} /> Imprimir</button>
              <button onClick={() => salvar('em_rota')} disabled={salvando} title="Salva e marca como enviado ao entregador"><Navigation size={18} /> Conduzir</button>
            </div>
            <button className="btn btn-vinho btn-lg btn-block" onClick={() => salvar()} disabled={salvando}>
              <Save size={17} /> {salvando ? 'Salvando...' : 'Salvar Saída'}
            </button>
          </section>

          <div className="panel-dark panel-vinho saida-total">
            <span className="eyebrow">Valor total da saída</span>
            <div className="big"><small>R$</small>{inteiro},{centavos}</div>
            <hr />
            <div className="row"><span>Subtotal de itens</span><b>{dinheiro(subtotal)}</b></div>
            <div className="row"><span>Taxa de embalagem</span><b>{dinheiro(TAXA_EMBALAGEM)}</b></div>
          </div>
        </div>
      </div>

      <Feedback {...feedback.props} />
    </div>
  );
}
