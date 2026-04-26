import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/router/ProtectedRoute';
import AppLayout from '@/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import UserManagement from '@/pages/UserManagement';
import UserDetails from '@/pages/UserDetails';
import InviteUsers from '@/pages/InviteUsers';
import Organizations from '@/pages/Organizations';
import GlobalSettingsAuth from '@/pages/GlobalSettingsAuth';
import GlobalSettingsMFA from '@/pages/GlobalSettingsMFA';
import Login from '@/pages/Login';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/users', element: <UserManagement /> },
          { path: '/users/:id', element: <UserDetails /> },
          { path: '/invite', element: <InviteUsers /> },
          { path: '/organizations', element: <Organizations /> },
          { path: '/settings/auth', element: <GlobalSettingsAuth /> },
          { path: '/settings/mfa', element: <GlobalSettingsMFA /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
