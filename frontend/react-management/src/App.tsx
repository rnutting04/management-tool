import { type ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import TeamForm from './pages/TeamForm';
import Dashboard from './pages/Dashboard';
import NavBar from './components/NavBar';

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <NavBar />
      {children}
    </>
  );
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/teams" replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  return <Navigate to={user ? '/teams' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route
        path="/teams"
        element={
          <RequireAuth>
            <Teams />
          </RequireAuth>
        }
      />
      <Route
        path="/teams/new"
        element={
          <RequireAuth>
            <RequireAdmin>
              <TeamForm />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/teams/:id"
        element={
          <RequireAuth>
            <TeamDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/teams/:id/edit"
        element={
          <RequireAuth>
            <RequireAdmin>
              <TeamForm />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
