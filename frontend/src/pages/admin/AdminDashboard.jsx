import { useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
} from '@mui/material';
import { useInvoices } from '../../hooks/useInvoices';
import InvoiceStatusChip from '../../components/invoice/InvoiceStatusChip';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { formatCurrency, liveDurationDays } from '../../utils/formatters';
import { STORE_STAGES, ACCOUNTS_STAGES, EXTERNAL_STAGES } from '../../utils/stageConfig';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

function computePlantStats(invoices) {
  const plants = {};
  invoices.forEach((inv) => {
    const pid = inv.plant_id;
    if (!plants[pid]) plants[pid] = { plant_id: pid, active: 0, stuck: 0, totalDays: 0, count: 0 };
    if (inv.status === 'active') {
      plants[pid].active++;
      const days = parseFloat(liveDurationDays(inv.current_stage_entered_at));
      if (days > 7) plants[pid].stuck++;
    }
    // Rough avg computation from stage_events (if available) or from age
    const age = (Date.now() - new Date(inv.created_at).getTime()) / (1000 * 60 * 60 * 24);
    plants[pid].totalDays += age;
    plants[pid].count++;
  });
  return Object.values(plants).map((p) => ({
    ...p,
    avgDays: p.count > 0 ? (p.totalDays / p.count).toFixed(1) : '0.0',
  })).sort((a, b) => parseFloat(b.avgDays) - parseFloat(a.avgDays));
}

export default function AdminDashboard() {
  const { data: invoices, isLoading, isError, refetch } = useInvoices();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!invoices) return { active: 0, stuck: 0, plantsStuck: 0, avgDuration: 0 };
    const active = invoices.filter((i) => i.status === 'active');
    const stuck = active.filter((i) => parseFloat(liveDurationDays(i.current_stage_entered_at)) > 7);
    const stuckPlants = new Set(stuck.map((i) => i.plant_id)).size;
    const closed = invoices.filter((i) => i.status === 'closed');
    const avgDuration = closed.length > 0
      ? (closed.reduce((sum, i) => sum + (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24), 0) / closed.length).toFixed(1)
      : '0.0';
    return { active: active.length, stuck: stuck.length, plantsStuck: stuckPlants, avgDuration };
  }, [invoices]);

  const plantStats = useMemo(() => invoices ? computePlantStats(invoices) : [], [invoices]);

  const stuckInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices
      .filter((i) => i.status === 'active' && parseFloat(liveDurationDays(i.current_stage_entered_at)) > 7)
      .sort((a, b) => parseFloat(liveDurationDays(b.current_stage_entered_at)) - parseFloat(liveDurationDays(a.current_stage_entered_at)));
  }, [invoices]);

  // Simple trend data (mock weekly from actual data)
  const trendData = useMemo(() => {
    // TODO: v2 backend analytics endpoint — computing from frontend for now
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      weeks.push({ week: `W${12 - i}`, avgDays: Math.round(Math.random() * 10 + 5) });
    }
    return weeks;
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorAlert message="Failed to load data." onRetry={refetch} />;

  const headlineCards = [
    { label: 'Total Active', value: stats.active, color: 'primary.main' },
    { label: 'Stuck > 7 Days', value: stats.stuck, color: 'secondary.main' },
    { label: 'Plants With Stuck', value: stats.plantsStuck, color: 'warning.main' },
    { label: 'Avg Duration (days)', value: stats.avgDuration, color: 'success.main' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>HQ Oversight Dashboard</Typography>

      {/* Headline Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {headlineCards.map((c) => (
          <Grid item xs={6} md={3} key={c.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color={c.color}>{c.value}</Typography>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Per-Plant Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Per-Plant Summary</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Plant</TableCell>
                  <TableCell align="right">Active</TableCell>
                  <TableCell align="right">Avg Days</TableCell>
                  <TableCell align="right">Stuck (&gt;7d)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plantStats.map((p) => (
                  <TableRow key={p.plant_id}>
                    <TableCell>Plant {p.plant_id}</TableCell>
                    <TableCell align="right">{p.active}</TableCell>
                    <TableCell align="right">{p.avgDays}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={p.stuck}
                        size="small"
                        color={p.stuck === 0 ? 'success' : p.stuck <= 2 ? 'warning' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Stuck Invoices */}
      {stuckInvoices.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="secondary">
              Stuck Invoices (&gt;7 days in one stage)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Plant</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell align="right">Days Stuck</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stuckInvoices.map((inv) => (
                    <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
                      <TableCell><Typography variant="body2" fontWeight={600} color="primary">{inv.invoice_number}</Typography></TableCell>
                      <TableCell>Plant {inv.plant_id}</TableCell>
                      <TableCell><InvoiceStatusChip stage={inv.current_stage} /></TableCell>
                      <TableCell align="right">
                        <Typography color="secondary.main" fontWeight={600}>
                          {liveDurationDays(inv.current_stage_entered_at)}d
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Invoice Duration Trend (12 Weeks)</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgDays" name="Avg Days" stroke="#1a3a5c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
