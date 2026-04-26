import { Outlet } from 'react-router-dom';
import Sidebar from '@/layout/Sidebar';
import Header from '@/layout/Header';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Header />
        <Outlet />
      </main>
    </div>
  );
}
