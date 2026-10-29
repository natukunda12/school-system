import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';

const STAFFR = ['super_admin', 'registrar', 'staff', 'dean_of_discipline', 'secretary'];
const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠', roles: [...STAFFR, 'student'] },
  { to: '/students', label: 'Students', icon: '👥', roles: STAFFR },
  { to: '/registrations', label: 'Registration', icon: '📝', roles: STAFFR },
  { to: '/arrivals', label: 'Arrivals', icon: '🧳', roles: STAFFR },
  { to: '/dormitories', label: 'Dormitories', icon: '🛏️', roles: STAFFR },
  { to: '/refectory', label: 'Refectory', icon: '🍽️', roles: STAFFR },
  { to: '/requirements', label: 'Requirements', icon: '✅', roles: STAFFR },
  { to: '/permissions', label: 'Permissions', icon: '🚪', roles: STAFFR },
  { to: '/excel', label: 'Excel', icon: '📊', roles: ['super_admin', 'registrar'] },
  { to: '/setup', label: 'School setup', icon: '🏫', roles: ['super_admin', 'registrar'] },
  { to: '/users', label: 'Users', icon: '🔑', roles: ['super_admin'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <div className="shell">
      <aside className={`side ${open ? 'open' : ''}`}>
        <div className="brand">🎓 <span>CMS/UNILAK</span></div>
        <nav onClick={() => setOpen(false)}>
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className="navlink">
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="top">
          <button className="btn ghost menu" onClick={() => setOpen(!open)}>☰</button>
          <div className="spacer" />
          <span className="who">{user.name} <small>({user.role.replaceAll('_', ' ')})</small></span>
          <button className="btn ghost" onClick={() => { logout(); nav('/login'); }}>Log out</button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
