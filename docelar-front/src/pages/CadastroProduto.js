import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info, Package, ImagePlus, Image as ImageIcon, CircleCheck, RotateCcw, Eye, Trash2, Lightbulb } from 'lucide-react';
import { Feedback, useFeedback, Confirm, Erro } from '../components/ui';
import { buscarProduto, salvarProduto, excluirProduto, listarCategorias, listarFornecedores, codigoProduto, ESTOQUE_MINIMO_PADRAO } from '../api';
import { dinheiro, mensagemErro } from '../utils';
import './CadastroProduto.css';

const VAZIO = {
  nome: '', descricao: '', categoriaId: '', fornecedorId: '',
  quantidadeInicial: '', validade: '', minimo: String(ESTOQUE_MINIMO_PADRAO), valorUnitario: '',
};

export default function CadastroProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const arquivoRef = useRef();
  const [form, setForm] = useState(VAZIO);
  const [produto, setProduto] = useState(null); // produto carregado (modo edição)
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const feedback = useFeedback();

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => {});
    listarFornecedores().then(setFornecedores).catch(() => {});
  }, []);

  function carregar() {
    setArquivo(null);
    setErros({});
    if (!id) { setForm(VAZIO); setProduto(null); setPreview(null); return; }
    buscarProduto(id)
      .then((p) => {
        if (!p) { setErroGeral(new Error('Produto não encontrado.')); return; }
        setProduto(p);
        setPreview(p.imagem || null);
        setForm({
          ...VAZIO,
          nome: p.nome,
          descricao: p.descricao,
          categoriaId: p.categoriaId ?? '',
          fornecedorId: p.fornecedorId ?? '',
          minimo: String(p.minimo),
          valorUnitario: String(p.valorUnitario),
        });
      })
      .catch(setErroGeral);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, [id]);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const qtd = produto ? produto.quantidade : Number(form.quantidadeInicial) || 0;
  const total = qtd * (Number(form.valorUnitario) || 0);

  function escolherImagem(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErroGeral(new Error('A imagem precisa ter no máximo 5MB.')); return; }
    setArquivo(file);
    setPreview(URL.createObjectURL(file));
  }

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome';
    if (!form.descricao.trim()) e.descricao = 'Informe uma descrição';
    if (form.valorUnitario === '' || Number(form.valorUnitario) < 0) e.valorUnitario = 'Informe um valor válido';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function salvar() {
    setErroGeral(null);
    if (!validar()) return;
    setSalvando(true);
    try {
      const r = await salvarProduto({ ...form, id: produto?.id }, arquivo);
      feedback.mostrar(produto ? 'Salvo' : 'Concluído');
      if (produto) carregar();
      else { setForm(VAZIO); setArquivo(null); setPreview(null); navigate(`/produtos/${r.id}`, { replace: true }); }
    } catch (err) {
      setErroGeral(new Error(mensagemErro(err)));
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    setConfirmar(false);
    try {
      await excluirProduto(produto.id);
      navigate('/inventario');
    } catch (err) {
      setErroGeral(new Error(mensagemErro(err)));
    }
  }

  return (
    <div className="page">
      <div>
        <div className="breadcrumb">Inventário <span style={{ color: 'var(--vinho)' }}>›</span> <b>{produto ? produto.nome : 'Novo Produto'}</b></div>
        <h1 className="page-title">{produto ? 'Editar Produto' : 'Cadastro de Produto'}</h1>
        <p className="page-subtitle">Insira os detalhes técnicos de sua criação artesanal. Mantenha seu catálogo sempre atualizado para uma gestão impecável.</p>
      </div>

      {erroGeral && <Erro error={erroGeral} />}

      <div className="two-col">
        <div>
          <section className="card">
            <h3 className="section-title" style={{ marginBottom: 20 }}><Info size={18} /> Informações Básicas</h3>
            <div className="form-grid">
              <div className="field span-all">
                <label className="label" htmlFor="nome">Nome do produto</label>
                <input id="nome" className="input" placeholder="Ex: Baguete de Fermentação Natural" value={form.nome} onChange={set('nome')} />
                {erros.nome && <small className="campo-erro">{erros.nome}</small>}
              </div>
              <div className="field span-all">
                <label className="label" htmlFor="descricao">Descrição</label>
                <textarea id="descricao" className="textarea" style={{ minHeight: 72 }} placeholder="Ex: Massa de longa fermentação, casca crocante" value={form.descricao} onChange={set('descricao')} />
                {erros.descricao && <small className="campo-erro">{erros.descricao}</small>}
              </div>
              <div className="field">
                <label className="label" htmlFor="codigo">Código</label>
                <input id="codigo" className="input" readOnly value={produto ? codigoProduto(produto.id) : ''} placeholder="Gerado automaticamente" />
              </div>
              <div className="field">
                <label className="label" htmlFor="categoria">Categoria</label>
                <select id="categoria" className="select" value={form.categoriaId} onChange={set('categoriaId')}>
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="section-title" style={{ marginBottom: 20 }}><Package size={18} /> Estoque &amp; Valores</h3>
            <div className="form-grid cols-3">
              <div className="field">
                <label className="label" htmlFor="qtd">Qtd. atual</label>
                {produto
                  ? <input id="qtd" className="input" readOnly value={produto.quantidade} title="Para mudar a quantidade use Entrada ou Saída de produtos" />
                  : <input id="qtd" type="number" min="0" className="input" placeholder="120" value={form.quantidadeInicial} onChange={set('quantidadeInicial')} />}
              </div>
              <div className="field">
                <label className="label" htmlFor="min">Estoque mín.</label>
                <input id="min" type="number" min="0" step="1" className="input" placeholder="20" value={form.minimo} onChange={set('minimo')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="valor">Valor unitário</label>
                <div className="input-icon">
                  <span className="prefixo">R$</span>
                  <input id="valor" type="number" min="0" step="0.01" className="input" placeholder="12,50" value={form.valorUnitario} onChange={set('valorUnitario')} />
                </div>
                {erros.valorUnitario && <small className="campo-erro">{erros.valorUnitario}</small>}
              </div>
              <div className="field span-2">
                <label className="label" htmlFor="forn">Fornecedor</label>
                <select id="forn" className="select" value={form.fornecedorId} onChange={set('fornecedorId')}>
                  <option value="">Produção própria / sem fornecedor</option>
                  {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="valor-total">
                <span>Valor total em estoque</span>
                <strong>{dinheiro(total)}</strong>
              </div>
              {!produto && Number(form.quantidadeInicial) > 0 && (
                <div className="field">
                  <label className="label" htmlFor="validade">Validade do lote</label>
                  <input id="validade" type="date" className="input" value={form.validade} onChange={set('validade')} />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="side-stack">
          <section className="card">
            <div className="card-head" style={{ marginBottom: 14 }}>
              <span className="label" style={{ margin: 0 }}>Visual</span>
              <ImageIcon size={18} className="muted" />
            </div>
            <div className="foto-produto" style={preview ? { backgroundImage: `url(${preview})` } : undefined}>
              <button type="button" className="foto-trocar" onClick={() => arquivoRef.current?.click()}>
                <ImagePlus size={22} />
                {preview ? 'Trocar Imagem' : 'Enviar Imagem'}
              </button>
              <input ref={arquivoRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={escolherImagem} />
            </div>
            <p className="foto-ajuda">Formatos aceitos: JPG, PNG ou WEBP. Até 5MB.</p>
          </section>

          <button className="btn btn-vinho btn-lg btn-block" onClick={salvar} disabled={salvando}>
            <CircleCheck size={18} /> {salvando ? 'Salvando...' : produto ? 'Atualizar Dados' : 'Concluir Cadastro'}
          </button>
          <button className="btn btn-outline btn-lg btn-block" onClick={carregar} disabled={salvando}>
            <RotateCcw size={16} /> {produto ? 'Desfazer alterações' : 'Limpar formulário'}
          </button>
          <div className="acoes-mini">
            <button className="btn btn-outline-marrom" onClick={() => navigate('/inventario')}><Eye size={15} /> Consultar</button>
            <button className="btn btn-outline" disabled={!produto} onClick={() => setConfirmar(true)}><Trash2 size={15} /> Apagar</button>
          </div>

          <div className="tip tip-amarela">
            <strong><Lightbulb size={15} /> Dica de gestão</strong>
            Mantenha o <b style={{ color: 'var(--vinho)' }}>estoque mínimo</b> sempre acima do consumo semanal para evitar interrupções na sua produção artesanal.
          </div>
        </div>
      </div>

      <Feedback {...feedback.props} />
      <Confirm open={confirmar} texto={`Apagar "${produto?.nome}"? Essa ação não pode ser desfeita.`} onConfirm={apagar} onCancel={() => setConfirmar(false)} />
    </div>
  );
}
