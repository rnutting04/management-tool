import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import api from '../api/axios';
import type { Member, Team } from '../types';

interface TeamWithRatio extends Team {
  nonDirectRatio: number;
  nonDirectCount: number;
  totalMembers: number;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Team[]>('/teams/'),
      api.get<Member[]>('/members/'),
    ])
      .then(([teamsRes, membersRes]) => {
        setTeams(teamsRes.data);
        setMembers(membersRes.data);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Group members by team name (member.team_id stores the team name, not the ObjectId)
  const membersByTeamName = members.reduce<Record<string, Member[]>>((acc, m) => {
    if (m.team_id) {
      acc[m.team_id] = [...(acc[m.team_id] ?? []), m];
    }
    return acc;
  }, {});

  // 1. Teams where the leader's member record shows co_located === false.
  // Leaders are stored as members so we match by name.
  const notColocated = teams.filter((t) => {
    if (!t.leader?.name) return false;
    const teamMembers = membersByTeamName[t.name] ?? [];
    const leaderMember = teamMembers.find(
      (m) => m.name.toLowerCase() === t.leader!.name.toLowerCase()
    );
    return leaderMember?.co_located === false;
  });

  // 2. Teams where leader is non-direct staff
  const nonDirectLeader = teams.filter((t) => t.leader?.is_direct_staff === false);

  // 3. Teams with non-direct staff ratio above 20%

  const teamsWithRatio: TeamWithRatio[] = teams.map((t) => {
    const teamMembers = membersByTeamName[t.name] ?? [];
    const nonDirect = teamMembers.filter((m) => m.is_direct_staff === false);
    return {
      ...t,
      totalMembers: teamMembers.length,
      nonDirectCount: nonDirect.length,
      nonDirectRatio: teamMembers.length > 0 ? nonDirect.length / teamMembers.length : 0,
    };
  });

  const highNonDirectRatio = teamsWithRatio.filter((t) => t.nonDirectRatio > 0.2);

  // 4. Teams reporting to an org leader
  const reportingToOrgLeader = teams.filter((t) => Boolean(t.org_leader));

  const summaryCards = [
    {
      icon: <LocationOffIcon fontSize="large" color="warning" />,
      label: 'Leader not co-located',
      count: notColocated.length,
      total: teams.length,
    },
    {
      icon: <PersonOffIcon fontSize="large" color="error" />,
      label: 'Non-direct staff leader',
      count: nonDirectLeader.length,
      total: teams.length,
    },
    {
      icon: <GroupRemoveIcon fontSize="large" color="warning" />,
      label: '>20% non-direct staff',
      count: highNonDirectRatio.length,
      total: teams.length,
    },
    {
      icon: <AccountTreeIcon fontSize="large" color="primary" />,
      label: 'Reporting to org leader',
      count: reportingToOrgLeader.length,
      total: teams.length,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary cards */}
      <Grid container spacing={2} mb={4}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  {card.icon}
                  <Typography variant="h3" fontWeight={700} lineHeight={1}>
                    {card.count}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {card.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  out of {card.total} teams
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* Section 1 */}
      <SectionHeader
        icon={<LocationOffIcon color="warning" />}
        title="Teams where leader is not co-located with members"
        count={notColocated.length}
      />
      <TeamTable
        teams={notColocated}
        onRowClick={(id) => navigate(`/teams/${id}`)}
        extraColumns={[
          { header: 'Location', render: (t) => t.location ?? '—' },
          { header: 'Leader', render: (t) => t.leader?.name ?? '—' },
        ]}
      />

      <Divider sx={{ my: 4 }} />

      {/* Section 2 */}
      <SectionHeader
        icon={<PersonOffIcon color="error" />}
        title="Teams where leader is non-direct staff"
        count={nonDirectLeader.length}
      />
      <TeamTable
        teams={nonDirectLeader}
        onRowClick={(id) => navigate(`/teams/${id}`)}
        extraColumns={[
          { header: 'Leader', render: (t) => t.leader?.name ?? '—' },
          { header: 'Location', render: (t) => t.location ?? '—' },
        ]}
      />

      <Divider sx={{ my: 4 }} />

      {/* Section 3 */}
      <SectionHeader
        icon={<GroupRemoveIcon color="warning" />}
        title="Teams with non-direct staff ratio above 20%"
        count={highNonDirectRatio.length}
      />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Team</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="right">Non-direct</TableCell>
              <TableCell align="right">Total Members</TableCell>
              <TableCell align="right">Ratio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {highNonDirectRatio.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No teams match this criteria.</TableCell>
              </TableRow>
            ) : (
              highNonDirectRatio.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/teams/${t.id}`)}
                >
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.location ?? '—'}</TableCell>
                  <TableCell align="right">{t.nonDirectCount}</TableCell>
                  <TableCell align="right">{t.totalMembers}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${Math.round(t.nonDirectRatio * 100)}%`}
                      size="small"
                      color={t.nonDirectRatio > 0.5 ? 'error' : 'warning'}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 4 }} />

      {/* Section 4 */}
      <SectionHeader
        icon={<AccountTreeIcon color="primary" />}
        title="Teams reporting to an org leader"
        count={reportingToOrgLeader.length}
      />
      <TeamTable
        teams={reportingToOrgLeader}
        onRowClick={(id) => navigate(`/teams/${id}`)}
        extraColumns={[
          { header: 'Org Leader', render: (t) => t.org_leader ?? '—' },
          { header: 'Location', render: (t) => t.location ?? '—' },
        ]}
      />
    </Container>
  );
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      {icon}
      <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
        {title}
      </Typography>
      <Chip label={count} size="small" />
    </Box>
  );
}

function TeamTable({
  teams,
  onRowClick,
  extraColumns,
}: {
  teams: Team[];
  onRowClick: (id: string) => void;
  extraColumns: { header: string; render: (t: Team) => React.ReactNode }[];
}) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Team</TableCell>
            {extraColumns.map((col) => (
              <TableCell key={col.header}>{col.header}</TableCell>
            ))}
            <TableCell align="right">Employees</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2 + extraColumns.length} align="center">
                No teams match this criteria.
              </TableCell>
            </TableRow>
          ) : (
            teams.map((t) => (
              <TableRow
                key={t.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onRowClick(t.id)}
              >
                <TableCell>{t.name}</TableCell>
                {extraColumns.map((col) => (
                  <TableCell key={col.header}>{col.render(t)}</TableCell>
                ))}
                <TableCell align="right">{t.employee_count ?? '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
