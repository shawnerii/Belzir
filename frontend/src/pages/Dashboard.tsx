import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';

const cards = [
  {
    to: '/invite',
    title: 'Benutzer einladen',
    subtitle: 'Neue Benutzer per Email einladen',
    adminOnly: true,
  },
  {
    to: '/organizations',
    title: 'Organisation ändern',
    subtitle: 'Organisationen verwalten',
    adminOnly: true,
  },
  {
    to: '/users',
    title: 'Benutzer verwalten',
    subtitle: 'Benutzer suchen und bearbeiten',
    adminOnly: true,
  },
  {
    to: '/settings/auth',
    title: 'Globale Einstellungen',
    subtitle: 'Authentifizierung und MFA',
    adminOnly: true,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (query.length === 0) {
      navigate('/users');
      return;
    }
    navigate(`/users?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="page dashboard-page">
      <h1>Dashboard</h1>
      <form className="dashboard-search" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          placeholder="Benutzer suchen"
          aria-label="Benutzer suchen"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <button type="submit">Suchen</button>
      </form>
      <div className="dashboard-grid">
        {cards
          .filter((card) => !card.adminOnly || isAdmin)
          .map((card) => (
          <Link key={card.to} to={card.to} className="dashboard-card">
            <span className="dashboard-card-title">{card.title}</span>
            <span className="dashboard-card-subtitle">{card.subtitle}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
