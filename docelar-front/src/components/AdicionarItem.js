import { useEffect, useMemo, useState } from 'react';
import { ScanBarcode, PlusCircle } from 'lucide-react';
import { listarProdutos } from '../api';
import { dataMinimaValidade, erroDeValidade } from '../utils';

// Linha "Buscar por nome ou código + Quantidade + Adicionar"
// usada na Entrada (com valor e validade) e na Saída (mostra o saldo disponível).
export default function AdicionarItem({ onAdd, modo = 'saida', atualizar = 0 }) {
  const entrada = modo === 'entrada';
  const [produtos, setProdutos] = useState([]);
  const [carregou, setCarregou] = useState(false);
  const [texto, setTexto] = useState('');
  const [qtd, setQtd] = useState(1);
  const [valor, setValor] = useState('');
  const [validade, setValidade] = useState('');
  const [erro, setErro] = useState('');
  const [listaAberta, setListaAberta] = useState(false);
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    listarProdutos().then((items) => setProdutos(items.filter((p) => p.ativo !== false))).catch((e) => setErro(e.message)).finally(() => setCarregou(true));
  }, [atualizar]);

  const rotulo = (p) => `${p.codigo} - ${p.nome}`;
  const achar = (t) => {
    const q = t.trim().toLowerCase();
    if (!q) return null;
    return produtos.find((p) => rotulo(p).toLowerCase() === q)
      || produtos.find((p) => p.nome.toLowerCase() === q || p.codigo === q || String(p.id) === q);
  };
  const selecionado = achar(texto);
  const erroValidade = entrada ? erroDeValidade(validade) : '';

  // sugestões: tudo que contém o que foi digitado (no nome ou no código)
  const opcoes = useMemo(() => {
    const q = texto.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter((p) => rotulo(p).toLowerCase().includes(q));
  }, [produtos, texto]);

  function escolher(p) {
    setTexto(rotulo(p));
    setErro('');
    setListaAberta(false);
    if (entrada) setValor(p.valorUnitario || '');
  }

  function mudarTexto(v) {
    setTexto(v);
    setErro('');
    setAtivo(0);
    setListaAberta(true);
    const p = achar(v);
    if (p && entrada) setValor(p.valorUnitario || '');
  }

  function teclado(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setListaAberta(true);
      setAtivo((i) => Math.min(i + 1, opcoes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && listaAberta && opcoes[ativo]) {
      e.preventDefault(); // escolhe o item em vez de enviar o formulário
      escolher(opcoes[ativo]);
    } else if (e.key === 'Escape') {
      setListaAberta(false);
    }
  }

  function adicionar(e) {
    e.preventDefault();
    const p = achar(texto);
    if (!p) { setErro('Produto não encontrado. Escolha um item da lista.'); return; }
    if (!(Number(qtd) > 0)) { setErro('Informe uma quantidade maior que zero.'); return; }
    if (!entrada && Number(qtd) > p.quantidade) { setErro(`Só há ${p.quantidade} em estoque de ${p.nome}.`); return; }
    if (erroValidade) { setErro(erroValidade); return; }
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
      <div className="field add-item-busca combo">
        <label className="label" htmlFor={`add-item-busca-${modo}`}>Buscar por nome ou código</label>
        <div className="input-icon">
          <ScanBarcode size={17} />
          <input
            id={`add-item-busca-${modo}`}
            className="input"
            placeholder="Ex: Pão Integral"
            value={texto}
            autoComplete="off"
            role="combobox"
            aria-expanded={listaAberta}
            aria-controls={`add-item-lista-${modo}`}
            onChange={(e) => mudarTexto(e.target.value)}
            onFocus={() => setListaAberta(true)}
            onBlur={() => setListaAberta(false)}
            onKeyDown={teclado}
          />
        </div>
        {listaAberta && (
          <ul className="combo-lista" id={`add-item-lista-${modo}`} role="listbox">
            {opcoes.length === 0 && <li className="combo-vazio">{carregou ? 'Nenhum produto encontrado' : 'Carregando produtos...'}</li>}
            {opcoes.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === ativo}
                className={i === ativo ? 'ativo' : ''}
                onMouseDown={(e) => { e.preventDefault(); escolher(p); }} // antes do blur, para o clique valer
                onMouseEnter={() => setAtivo(i)}
              >
                <span><b>{p.codigo}</b> · {p.nome}</span>
                {!entrada && <small>{p.quantidade} em estoque</small>}
              </li>
            ))}
          </ul>
        )}
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
            <input className="input" type="date" min={dataMinimaValidade()} value={validade} onChange={(e) => { setValidade(e.target.value); setErro(''); }} aria-invalid={!!erroValidade} />
          </div>
        </>
      )}
      <button className="btn btn-primary add-item-btn"><PlusCircle size={17} /> Adicionar</button>
      {!entrada && selecionado && !erro && <small className="muted add-item-erro">Disponível em estoque: {selecionado.quantidade}</small>}
      {(erro || erroValidade) && <small className="campo-erro add-item-erro">{erro || erroValidade}</small>}
    </form>
  );
}
