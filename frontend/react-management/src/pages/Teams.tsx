import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { Team } from '../types';

export default function Teams() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Team[]>('/teams/')
      .then((res) => setTeams(res.data))
      .catch(() => setError('Failed to load teams.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this team?')) return;
    try {
      await api.delete(`/teams/${id}`);
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Failed to delete team.');
    }
  }

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const colSpan = isAdmin ? 7 : 6;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Toolbar disableGutters sx={{ mb: 2, gap: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
          Teams
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/teams/new')}
          >
            New Team
          </Button>
        )}
      </Toolbar>

      <TextField
        placeholder="Search teams…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Leader</TableCell>
                <TableCell>Direct Staff</TableCell>
                <TableCell align="right">Employees</TableCell>
                <TableCell>Created</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center">
                    No teams found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((team) => (
                  <TableRow
                    key={team.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{team.location ?? '—'}</TableCell>
                    <TableCell>{team.leader?.name ?? '—'}</TableCell>
                    <TableCell>
                      {team.leader == null ? '—' : (
                        <Chip
                          label={team.leader.is_direct_staff ? 'Yes' : 'No'}
                          size="small"
                          color={team.leader.is_direct_staff ? 'success' : 'default'}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">{team.employee_count ?? '—'}</TableCell>
                    <TableCell>
                      {team.created_at
                        ? new Date(team.created_at).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/teams/${team.id}/edit`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(team.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
