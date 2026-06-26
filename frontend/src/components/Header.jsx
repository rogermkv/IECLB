import { CalendarDays, Home, Info, LockKeyhole, Megaphone, Search } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <>
      <header className="site-header app-header">
        <Link to="/" className="brand app-brand" aria-label="IECLB Comunidade Evangélica da Paz">
          <img src="/logo.jpg" alt="Logo IECLB" />
          <div>
            <strong>IECLB</strong>
            <span>Igreja Evangélica de Confissão Luterana no Brasil</span>
            <em>Comunidade Evangélica da Paz</em>
          </div>
        </Link>
        <Link className="secretary-button" to="/secretaria">
          <LockKeyhole size={24} aria-hidden="true" />
          Login
        </Link>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Navegação do aplicativo">
        <NavLink to="/" end>
          <Home size={26} aria-hidden="true" />
          <span>Início</span>
        </NavLink>
        <NavLink to="/agenda">
          <CalendarDays size={26} aria-hidden="true" />
          <span>Agenda</span>
        </NavLink>
        <Link to="/agenda">
          <Search size={26} aria-hidden="true" />
          <span>Buscar</span>
        </Link>
        <NavLink to="/avisos">
          <Megaphone size={26} aria-hidden="true" />
          <span>Avisos</span>
        </NavLink>
        <a href="/#sobre-comunidade">
          <Info size={26} aria-hidden="true" />
          <span>Sobre</span>
        </a>
      </nav>
    </>
  );
}
