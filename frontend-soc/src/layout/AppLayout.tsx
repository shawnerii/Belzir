import { NavLink, Outlet } from 'react-router-dom';

const navLinks = [
  { to: '/triage', label: 'Triage', end: false },
  { to: '/incidents', label: 'Incidents', end: false },
];

export default function AppLayout() {
  return (
    <div className="soc-shell">
      <aside className="soc-sidebar">
        <h1>Wazuh SOC</h1>
        <p className="soc-sidebar-subtitle">Analyst queue and response workspace</p>
        <nav>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'soc-nav-link active' : 'soc-nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="soc-main">
        <header className="soc-header">
          <div className="soc-header-title">Security Operations Center</div>
          <div className="soc-header-user">Analyst: analyst1 (demo)</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
