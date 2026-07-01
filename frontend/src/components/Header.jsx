import { CalendarDays, Home, LockKeyhole, Megaphone, MessageCircle, Search } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <>
      <header className="site-header app-header">
        <Link to="/" className="brand app-brand" aria-label="IECLB Comunidade EvangÃ©lica da Paz">
          <img src="/logo.jpg" alt="Logo IECLB" />
          <div>
            <strong>IECLB</strong>
            <span>Igreja EvangÃ©lica de ConfissÃ£o Luterana no Brasil</span>
            <em>Comunidade EvangÃ©lica da Paz</em>
          </div>
        </Link>
        <Link className="secretary-button" to="/secretaria">
          <LockKeyhole size={24} aria-hidden="true" />
          Login
        </Link>
      </header>

      <nav className="mobile-bottom-nav" aria-label="NavegaÃ§Ã£o do aplicativo">
        <NavLink to="/" end>
          <Home size={26} aria-hidden="true" />
          <span>InÃ­cio</span>
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
        <a href="https://wa.me/555599699939" target="_blank" rel="noreferrer">
          <MessageCircle size={26} aria-hidden="true" />
          <span>Contato</span>
        </a>
      </nav>
    </>
  );
}

