import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layout/AppLayout';
import IncidentDetail from '@/pages/IncidentDetail';
import IncidentsList from '@/pages/IncidentsList';
import TriageDetail from '@/pages/TriageDetail';
import TriageList from '@/pages/TriageList';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/triage" replace />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/triage', element: <TriageList /> },
      { path: '/triage/:id', element: <TriageDetail /> },
      { path: '/incidents', element: <IncidentsList /> },
      { path: '/incidents/:id', element: <IncidentDetail /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/triage" replace />,
  },
]);
