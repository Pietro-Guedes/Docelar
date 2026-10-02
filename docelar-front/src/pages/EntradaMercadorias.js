import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Truck, Trash2, ReceiptText } from 'lucide-react';
import AdicionarItem from '../components/AdicionarItem';
import { Feedback, useFeedback, Thumb } from '../components/ui';
import { listarFornecedores, registrarEntrada } from '../api';
import { dinheiro, dataBR, mensagemErro } from '../utils';
import './Movimentacao.css';

const hoje = () => new Date().toISOString().slice(0, 10);
const chave = (i) => `${i.produtoId}|${i.validade || ''}|${i.valorUnitario}`;

export default function EntradaMercadorias() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [fornecedores, setFornecedores] = useState([]);
  const [nota, setNota] = useState({ numero: '', dataEmissao: hoje(), fornecedorId: '', observacoes: '' });
  const [itens, setItens] = useState([]);
  const [impostos, setImpostos] = useState(0);
  const [descontos, setDescontos] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);

  useEffect(() => { listarFornecedores().then(setFornecedores).catch(() => {}); }, []);

  const fornecedor = fornecedores.find((f) => String(f.id) === String(nota.fornecedorId));
  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const total = subtotal + Number(impostos || 0) - Number(descontos || 0);
  const set = (c) => (e) => setNota((n) => ({ ...n, [c]: e.target.value }));

  function adicionar(item) {
    setItens((lista) => {
      const existe = lista.find((i) => chave(i) === chave(item));
      if (existe) return lista.map((i) => (i === existe ? { ...i, quantidade: i.quantidade + item.quantidade } : i));
      return [...lista, item];
    });
  }

  function limpar() {
    setNota({ numero: '', dataEmissao: hoje(), fornecedorId: '', observacoes: '' });
    setItens([]);
    setImpostos(0);
    setDescontos(0);
    setErro('');
  }

  async function finalizar() {
    if (!nota.numero.trim()) return setErro('Informe o número da nota fiscal.');
    if (itens.length === 0) return setErro('Adicione pelo menos um item.');
    setErro('');
    setSalvando(true);
    try {
      await registrarEntrada({
        notaFiscal: nota.numero,
        dataEmissao: dataBR(nota.dataEmissao),
        fornecedorId: nota.fornecedorId,
        observacoes: nota.observacoes,
        itens,
      });
      feedback.mostrar('Concluído');
      limpar();
      setVersao((v) => v + 1);
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
          <h1 className="page-title">Entrada de Mercadorias</h1>
          <p className="page-subtitle">Registre o recebimento de insumos e matérias-primas no estoque.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline-marrom btn-lg mov-btn-claro" onClick={() => { limpar(); navigate(-1); }}>Cancelar Operação</button>
          <button className="btn btn-vinho btn-lg" onClick={finalizar} disabled={salvando}>{salvando ? 'Salvando...' : 'Finalizar Entrada'}</button>
        </div>
      </div>

      {erro && <div className="erro-box">{erro}</div>}

      <div className="two-col">
        <div className="side-stack" style={{ gap: 24 }}>
          <section className="card mov-nota">
            <div>
              <h3 className="mov-sub"><FileText size={16} /> Dados da Nota Fiscal</h3>
              <div className="field">
                <label className="label">Número da NF</label>
                <input className="input" placeholder="000.182.943" value={nota.numero} onChange={set('numero')} />
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label className="label">Data de emissão</label>
                <input className="input" type="date" value={nota.dataEmissao} onChange={set('dataEmissao')} />
              </div>
            </div>
            <div>
              <h3 className="mov-sub"><Truck size={16} /> Informações do Fornecedor</h3>
              <div className="form-grid">
                <div className="field">
                  <label className="label">Fornecedor</label>
                  <select className="select" value={nota.fornecedorId} onChange={set('fornecedorId')}>
                    <option value="">Selecione...</option>
                    {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">CNPJ</label>
                  <input className="input" readOnly placeholder="12.345.678/0001-99" value={fornecedor?.cnpj || ''} />
                </div>
                <div className="field span-all">
                  <label className="label">Observações do recebimento</label>
                  <input className="input" placeholder="Ex: Conferido por João - Lote com 6 meses de validade" value={nota.observacoes} onChange={set('observacoes')} />
                </div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 0 }}>
            <div className="mov-tabela-head">
              <h3 className="mov-h3">Itens Adicionados</h3>
              <span className="muted" style={{ fontSize: 12 }}>{itens.length} {itens.length === 1 ? 'item' : 'itens'} na lista</span>
            </div>
            <div style={{ padding: '0 24px 20px' }}>
              <AdicionarItem modo="entrada" onAdd={adicionar} atualizar={versao} />
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Cód.</th><th>Produto</th><th>Quantidade</th><th>Validade</th><th className="num">Unitário</th><th className="num">Total</th><th className="center">Ações</th></tr>
                </thead>
                <tbody>
                  {itens.length === 0 && <tr><td colSpan={7} className="empty">Nenhum item adicionado ainda.</td></tr>}
                  {itens.map((i) => (
                    <tr key={chave(i)}>
                      <td className="muted">{i.codigo}</td>
                      <td><div className="prod-cell"><Thumb src={i.imagem} alt={i.nome} />{i.nome}</div></td>
                      <td>{i.quantidade} {i.unidade}</td>
                      <td>{i.validade ? dataBR(i.validade) : <span className="muted">—</span>}</td>
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

        <div className="side-stack">
          <div className="panel-dark">
            <span className="eyebrow">Total da nota</span>
            <div className="big">{dinheiro(total)}</div>
            <hr />
            <div className="row"><span>Subtotal</span><b>{dinheiro(subtotal)}</b></div>
            <div className="row mov-row-input">
              <span>Impostos (estimado)</span>
              <input type="number" min="0" step="0.01" value={impostos} onChange={(e) => setImpostos(e.target.value)} aria-label="Impostos" />
            </div>
            <div className="row mov-row-input">
              <span>Descontos</span>
              <input type="number" min="0" step="0.01" value={descontos} onChange={(e) => setDescontos(e.target.value)} aria-label="Descontos" />
            </div>
          </div>
          <div className="tip">
            <strong><ReceiptText size={15} /> Resumo fiscal</strong>
            Cada item vira um novo lote no estoque, com a validade informada. O número da NF fica salvo na observação da movimentação.
          </div>
        </div>
      </div>

      <Feedback {...feedback.props} />
    </div>
  );
}
