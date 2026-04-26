import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Benutzer verwalten', adminOnly: true },
  { to: '/invite', label: 'Benutzer einladen', adminOnly: true },
  { to: '/organizations', label: 'Organisation', adminOnly: true },
  { to: '/settings/auth', label: 'Benutzer Authentifizierung', adminOnly: true },
  { to: '/settings/mfa', label: 'Multifaktor Authentifizierung', adminOnly: true },
];

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="sidebar">
      <h2>KeyCloak</h2>
      <nav>
        {links
          .filter((link) => !link.adminOnly || isAdmin)
          .map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
