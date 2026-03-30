import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { Achievement, Member, Team } from '../types';
import MemberForm from '../components/MemberForm';
import AchievementForm from '../components/AchievementForm';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [achievementFormOpen, setAchievementFormOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Members and achievements use team NAME (not id) as foreign key.
    // Fetch team first, then use team.name for the related queries.
    api
      .get<Team>(`/teams/${id}`)
      .then((teamRes) => {
        const t = teamRes.data;
        setTeam(t);
        console.log('[TeamDetail] team loaded:', t);

        const name = encodeURIComponent(t.name);
        return Promise.all([
          api.get<Member[]>(`/members/?team_id=${name}`),
          api.get<Achievement[]>(`/achievements/?team_id=${name}`),
        ]);
      })
      .then(([membersRes, achievementsRes]) => {
        console.log('[TeamDetail] members:', membersRes.data);
        console.log('[TeamDetail] achievements:', achievementsRes.data);
        setMembers(membersRes.data);
        setAchievements(achievementsRes.data);
      })
      .catch((err) => {
        console.error('[TeamDetail] load error:', err);
        setError('Failed to load team data.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDeleteMember(memberId: string) {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      setError('Failed to delete member.');
    }
  }

  async function handleDeleteAchievement(achievementId: string) {
    if (!confirm('Delete this achievement?')) return;
    try {
      await api.delete(`/achievements/${achievementId}`);
      setAchievements((prev) => prev.filter((a) => a.id !== achievementId));
    } catch {
      setError('Failed to delete achievement.');
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!team) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Team not found.'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <IconButton onClick={() => navigate('/teams')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
          {team.name}
        </Typography>
        {isAdmin && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/teams/${id}/edit`)}
          >
            Edit Team
          </Button>
        )}
      </Stack>

      {team.description && (
        <Typography color="text.secondary" mb={2} ml={6}>
          {team.description}
        </Typography>
      )}

      {/* Team Info Cards */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, ml: 6 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {team.location ?? '—'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Leader
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {team.leader?.name ?? '—'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Leader Direct Staff
              </Typography>
              {team.leader != null ? (
                <Chip
                  label={team.leader.is_direct_staff ? 'Yes' : 'No'}
                  size="small"
                  color={team.leader.is_direct_staff ? 'success' : 'default'}
                />
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PeopleIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Employee Count
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {team.employee_count ?? '—'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {team.org_leader && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Org Leader
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {team.org_leader}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* Members */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Members{' '}
          <Chip label={members.length} size="small" sx={{ ml: 1 }} />
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setMemberFormOpen(true)}
          >
            Add Member
          </Button>
        )}
      </Stack>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Direct Staff</TableCell>
              <TableCell>Co-located</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} align="center">
                  No members yet.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.role || '—'}</TableCell>
                  <TableCell>
                    {m.is_direct_staff == null ? '—' : (
                      <Chip
                        label={m.is_direct_staff ? 'Yes' : 'No'}
                        size="small"
                        color={m.is_direct_staff ? 'success' : 'default'}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {m.co_located == null ? '—' : (
                      <Chip
                        label={m.co_located ? 'Yes' : 'No'}
                        size="small"
                        color={m.co_located ? 'success' : 'warning'}
                      />
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteMember(m.id)}
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

      {/* Achievements */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Achievements{' '}
          <Chip label={achievements.length} size="small" sx={{ ml: 1 }} />
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAchievementFormOpen(true)}
          >
            Add Achievement
          </Button>
        )}
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Month</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {achievements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 3 : 2} align="center">
                  No achievements yet.
                </TableCell>
              </TableRow>
            ) : (
              achievements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.description}</TableCell>
                  <TableCell>{a.month || '—'}</TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAchievement(a.id)}
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

      {/* Dialogs — pass team name (not id) since that's the FK the backend uses */}
      <MemberForm
        open={memberFormOpen}
        teamName={team.name}
        onClose={() => setMemberFormOpen(false)}
        onCreated={(member: Member) => setMembers((prev) => [...prev, member])}
      />
      <AchievementForm
        open={achievementFormOpen}
        teamName={team.name}
        onClose={() => setAchievementFormOpen(false)}
        onCreated={(achievement: Achievement) => setAchievements((prev) => [...prev, achievement])}
      />
    </Container>
  );
}
