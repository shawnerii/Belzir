import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { logoutRequest } from '@/features/auth/auth-api';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    // Best-effort server notification; client-side logout is authoritative.
    void logoutRequest().catch(() => {});
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <div className="header-user">{user?.email ?? 'Unbekannter Benutzer'}</div>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}
