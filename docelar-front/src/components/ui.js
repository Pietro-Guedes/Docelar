import { useEffect, useState } from 'react';
import { CircleCheck, ChevronLeft, ChevronRight, Croissant, X } from 'lucide-react';
import { STATUS_LABEL, statusEstoque } from '../utils';
import './ui.css';

/* Cartão de número grande (TOTAL DE ITENS, VALOR EM ESTOQUE...) */
export function StatCard({ icon: Icon, iconTone, label, value, cents, note, pill, sub, critical }) {
  return (
    <div className={`stat ${critical ? 'critical' : ''}`}>
      <div className="stat-top">
        {Icon && <div className={`stat-icon ${iconTone || ''}`}><Icon size={20} /></div>}
        {pill ? <span className="badge badge-alerta">{pill}</span> : note ? <span className="stat-note">{note}</span> : null}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}{cents && <small> {cents}</small>}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* Foto do produto (ou ícone, quando não há imagem) */
export function Thumb({ src, alt = '', size }) {
  const [erro, setErro] = useState(false);
  return (
    <div className={`thumb ${size === 'lg' ? 'lg' : ''}`}>
      {src && !erro ? <img src={src} alt={alt} onError={() => setErro(true)} /> : <Croissant size={size === 'lg' ? 26 : 20} strokeWidth={1.6} />}
    </div>
  );
}

/* Selo OK / Baixo / Crítico */
export function StatusBadge({ produto, status }) {
  const s = status || statusEstoque(produto);
  return <span className={`badge badge-${s}`}>{STATUS_LABEL[s]}</span>;
}

/* Quantidade em "pílula" (24 unid.) */
export function QtdPill({ produto }) {
  const s = statusEstoque(produto);
  const q = String(produto.quantidade).padStart(2, '0');
  return <span className={`qtd-pill ${s === 'ok' ? '' : 'alerta'}`}>{q} {produto.unidade || 'unid.'}</span>;
}

/* Paginação simples */
export function Pagination({ page, total, onChange }) {
  if (total <= 1) return null;
  // mostra no máximo 5 números em volta da página atual
  const inicio = Math.max(1, Math.min(page - 2, total - 4));
  const pages = Array.from({ length: Math.min(5, total) }, (_, i) => inicio + i);
  return (
    <div className="pager">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button>
      {pages.map((p) => (
        <button key={p} className={p === page ? 'active' : ''} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button disabled={page === total} onClick={() => onChange(page + 1)} aria-label="Próxima página"><ChevronRight size={16} /></button>
    </div>
  );
}

export function usePaginacao(lista, porPagina = 8) {
  const [page, setPage] = useState(1);
  const total = Math.max(1, Math.ceil((lista?.length || 0) / porPagina));
  useEffect(() => { if (page > total) setPage(1); }, [total, page]);
  const itens = (lista || []).slice((page - 1) * porPagina, page * porPagina);
  return { page, setPage, total, itens };
}

/* Janela modal genérica */
export function Modal({ open, onClose, title, children, width = 560, footer }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <div className="modal-head">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* Pop-up "Concluído" / "Salvo" do Figma — some sozinho */
export function Feedback({ open, titulo = 'Concluído', onClose, duracao = 1800 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duracao);
    return () => clearTimeout(t);
  }, [open, duracao, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop feedback-backdrop" onClick={onClose}>
      <div className="feedback" role="status">
        <h3>{titulo}</h3>
        <CircleCheck size={112} strokeWidth={1.6} />
      </div>
    </div>
  );
}

/* Hook prático para mostrar o Feedback */
export function useFeedback() {
  const [estado, setEstado] = useState({ open: false, titulo: '' });
  return {
    mostrar: (titulo = 'Concluído') => setEstado({ open: true, titulo }),
    props: { open: estado.open, titulo: estado.titulo, onClose: () => setEstado({ open: false, titulo: '' }) },
  };
}

/* Confirmação antes de excluir */
export function Confirm({ open, titulo = 'Tem certeza?', texto, onConfirm, onCancel, rotulo = 'Excluir' }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={titulo}
      width={420}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-vinho" onClick={onConfirm}>{rotulo}</button>
        </>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.5 }}>{texto}</p>
    </Modal>
  );
}

/* Mensagem de erro amigável */
export function Erro({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="erro-box">
      <span>Não foi possível carregar: {error.message}</span>
      {onRetry && <button className="btn btn-outline" onClick={onRetry}>Tentar de novo</button>}
    </div>
  );
}

export function Loading({ texto = 'Carregando...' }) {
  return <div className="empty"><span className="spinner" /> {texto}</div>;
}
