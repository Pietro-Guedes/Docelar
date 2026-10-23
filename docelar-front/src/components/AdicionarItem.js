import { useEffect, useState } from 'react';
import { ScanBarcode, PlusCircle } from 'lucide-react';
import { listarProdutos } from '../api';

// Linha "Buscar por nome ou código + Quantidade + Adicionar"
// usada na Entrada (com valor e validade) e na Saída (mostra o saldo disponível).
export default function AdicionarItem({ onAdd, modo = 'saida', atualizar = 0 }) {
  const entrada = modo === 'entrada';
  const [produtos, setProdutos] = useState([]);
  const [texto, setTexto] = useState('');
  const [qtd, setQtd] = useState(1);
  const [valor, setValor] = useState('');
  const [validade, setValidade] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => { listarProdutos().then(setProdutos).catch((e) => setErro(e.message)); }, [atualizar]);

  const rotulo = (p) => `${p.codigo} - ${p.nome}`;
  const achar = (t) => {
    const q = t.trim().toLowerCase();
    if (!q) return null;
    return produtos.find((p) => rotulo(p).toLowerCase() === q)
      || produtos.find((p) => p.nome.toLowerCase() === q || p.codigo === q || String(p.id) === q);
  };
  const selecionado = achar(texto);

  function mudarTexto(v) {
    setTexto(v);
    setErro('');
    const p = achar(v);
    if (p && entrada) setValor(p.valorUnitario || '');
  }

  function adicionar(e) {
    e.preventDefault();
    const p = achar(texto);
    if (!p) { setErro('Produto não encontrado. Escolha um item da lista.'); return; }
    if (!(Number(qtd) > 0)) { setErro('Informe uma quantidade maior que zero.'); return; }
    if (!entrada && Number(qtd) > p.quantidade) { setErro(`Só há ${p.quantidade} em estoque de ${p.nome}.`); return; }
    const ok = onAdd({
      produtoId: p.id,
      codigo: p.codigo,
      nome: p.nome,
      imagem: p.imagem,
      unidade: p.unidade,
      disponivel: p.quantidade,
      quantidade: Number(qtd),
      valorUnitario: entrada && valor !== '' ? Number(valor) : p.valorUnitario,
      validade: entrada ? validade || null : undefined,
    });
    if (ok === false) return;
    setTexto('');
    setQtd(1);
    setValor('');
    setValidade('');
  }

  return (
    <form className="add-item" onSubmit={adicionar}>
      <div className="field add-item-busca">
        <label className="label">Buscar por nome ou código</label>
        <div className="input-icon">
          <ScanBarcode size={17} />
          <input className="input" list={`add-item-lista-${modo}`} placeholder="Ex: Pão Integral" value={texto} onChange={(e) => mudarTexto(e.target.value)} />
          <datalist id={`add-item-lista-${modo}`}>
            {produtos.map((p) => <option key={p.id} value={rotulo(p)}>{entrada ? '' : `${p.quantidade} em estoque`}</option>)}
          </datalist>
        </div>
      </div>
      <div className="field add-item-qtd">
        <label className="label">Quantidade</label>
        <input className="input" type="number" min="1" step="1" value={qtd} onChange={(e) => setQtd(e.target.value)} />
      </div>
      {entrada && (
        <>
          <div className="field add-item-qtd">
            <label className="label">Valor unit.</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="field add-item-data">
            <label className="label">Validade</label>
            <input className="input" type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
          </div>
        </>
      )}
      <button className="btn btn-primary add-item-btn"><PlusCircle size={17} /> Adicionar</button>
      {!entrada && selecionado && !erro && <small className="muted add-item-erro">Disponível em estoque: {selecionado.quantidade}</small>}
      {erro && <small className="campo-erro add-item-erro">{erro}</small>}
    </form>
  );
}
