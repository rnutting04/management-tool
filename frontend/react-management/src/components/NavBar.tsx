import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onTeams = location.pathname.startsWith('/teams');
  const onDashboard = location.pathname === '/dashboard';

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" fontWeight={700} sx={{ mr: 3 }}>
          Team Management
        </Typography>

        <Button
          startIcon={<GroupsIcon />}
          color={onTeams ? 'primary' : 'inherit'}
          variant={onTeams ? 'outlined' : 'text'}
          onClick={() => navigate('/teams')}
          sx={{ mr: 1 }}
        >
          Teams
        </Button>

        <Button
          startIcon={<DashboardIcon />}
          color={onDashboard ? 'primary' : 'inherit'}
          variant={onDashboard ? 'outlined' : 'text'}
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          {user?.name} ({user?.role})
        </Typography>

        <Button variant="outlined" size="small" onClick={logout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
