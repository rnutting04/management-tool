import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import api from '../api/axios';
import type { Member } from '../types';

interface Props {
  open: boolean;
  teamName: string;
  onClose: () => void;
  onCreated: (member: Member) => void;
}

export default function MemberForm({ open, teamName, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [coLocated, setCoLocated] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName('');
    setEmail('');
    setRole('');
    setCoLocated(false);
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
      const { data } = await api.post<Member>('/members/', {
        name,
        email,
        role,
        team_id: teamName,
        co_located: coLocated,
      });
      onCreated(data);
      handleClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(detail ?? 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Member</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Role (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Engineer, Designer"
          />
          <FormControlLabel
            control={
              <Switch
                checked={coLocated}
                onChange={(e) => setCoLocated(e.target.checked)}
              />
            }
            label="Co-located with team"
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
          disabled={submitting || !name || !email}
        >
          {submitting ? 'Adding…' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
