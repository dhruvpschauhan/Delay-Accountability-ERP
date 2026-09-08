import { useState, useMemo } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Snackbar, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useInvoices } from '../../hooks/useInvoices';
import InvoiceTable from '../../components/invoice/InvoiceTable';
import CreateInvoiceForm from '../../components/forms/CreateInvoiceForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { STORE_STAGES } from '../../utils/stageConfig';

export default function StoreDashboard() {
  const { data: invoices, isLoading, isError, refetch } = useInvoices();
  const [createOpen, setCreateOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const stats = useMemo(() => {
    if (!invoices) return { active: 0, needsAction: 0, awaitingAccounts: 0, completed: 0 };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      active: invoices.filter((i) => i.status === 'active').length,
      needsAction: invoices.filter((i) => i.status === 'active' && STORE_STAGES.includes(i.current_stage)).length,
      awaitingAccounts: invoices.filter((i) => ['forwarded_to_accounts', 'accounts_verification'].includes(i.current_stage)).length,
      completed: invoices.filter((i) => i.status === 'closed' && new Date(i.closed_at) >= monthStart).length,
    };
  }, [invoices]);

  if (isError) return <ErrorAlert message="Failed to load invoices." onRetry={refetch} />;

  const statCards = [
    { label: 'Total Active', value: stats.active, color: 'primary.main' },
    { label: 'Needs Your Action', value: stats.needsAction, color: 'warning.main' },
    { label: 'Awaiting Accounts', value: stats.awaitingAccounts, color: 'info.main' },
    { label: 'Completed This Month', value: stats.completed, color: 'success.main' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Invoices</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          New Invoice
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color={s.color}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <InvoiceTable invoices={invoices} loading={isLoading} basePath="/store" />

      <CreateInvoiceForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(msg) => setSnackbar({ open: true, message: msg })}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
