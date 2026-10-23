import { Croissant } from 'lucide-react';
import './Logo.css';

// Logo provisório. Para usar o logo real do Figma, salve o arquivo em
// public/img/logo.png e troque este componente por: <img src="/img/logo.png" alt="Docelar" />
export default function Logo({ size = 64, legenda = true, claro = false }) {
  return (
    <div className={`logo ${claro ? 'logo-claro' : ''}`}>
      <div className="logo-selo" style={{ width: size, height: size }}>
        <Croissant size={size * 0.38} strokeWidth={1.8} />
        <span style={{ fontSize: size * 0.2 }}>Docelar</span>
      </div>
      {legenda && (
        <div className="logo-legenda">
          <strong>Docelar</strong>
          <small>Panificação</small>
        </div>
      )}
    </div>
  );
}
