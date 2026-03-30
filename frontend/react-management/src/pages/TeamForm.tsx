import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api/axios';
import type { Team } from '../types';

export default function TeamForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderIsDirectStaff, setLeaderIsDirectStaff] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .get<Team>(`/teams/${id}`)
      .then((res) => {
        const t = res.data;
        setName(t.name);
        setDescription(t.description ?? '');
        setLocation(t.location ?? '');
        setLeaderName(t.leader?.name ?? '');
        setLeaderIsDirectStaff(t.leader?.is_direct_staff ?? false);
      })
      .catch(() => setError('Failed to load team.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        location,
        leader: { name: leaderName, is_direct_staff: leaderIsDirectStaff },
      };
      if (isEdit) {
        await api.put(`/teams/${id}`, payload);
        navigate(`/teams/${id}`);
      } else {
        const { data } = await api.post<Team>('/teams/', payload);
        navigate(`/teams/${data.id}`);
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(detail ?? 'Failed to save team.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <IconButton onClick={() => navigate(isEdit ? `/teams/${id}` : '/teams')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit Team' : 'New Team'}
        </Typography>
      </Stack>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Team Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. New York, Remote"
            fullWidth
          />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: -1 }}>
            Leader
          </Typography>
          <TextField
            label="Leader Name"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={leaderIsDirectStaff}
                onChange={(e) => setLeaderIsDirectStaff(e.target.checked)}
              />
            }
            label="Leader is direct staff"
          />

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => navigate(isEdit ? `/teams/${id}` : '/teams')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => { void handleSubmit(); }}
              disabled={submitting || !name}
            >
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Team'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
