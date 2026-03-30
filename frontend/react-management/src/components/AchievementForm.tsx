import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import api from '../api/axios';
import type { Achievement } from '../types';

interface Props {
  open: boolean;
  teamName: string;
  onClose: () => void;
  onCreated: (achievement: Achievement) => void;
}

export default function AchievementForm({ open, teamName, onClose, onCreated }: Props) {
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setDescription('');
    setMonth('');
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post<Achievement>('/achievements/', {
        description,
        month,
        team_id: teamName,
      });
      onCreated(data);
      handleClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(detail ?? 'Failed to add achievement.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Achievement</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            autoFocus
            multiline
            rows={3}
          />
          <TextField
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="e.g. 2024-01"
            helperText="Format: YYYY-MM"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => { void handleSubmit(); }}
          disabled={submitting || !description}
        >
          {submitting ? 'Adding…' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
