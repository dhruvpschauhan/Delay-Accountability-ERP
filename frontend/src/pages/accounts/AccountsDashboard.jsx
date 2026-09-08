import { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { useInvoices } from '../../hooks/useInvoices';
import InvoiceTable from '../../components/invoice/InvoiceTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function AccountsDashboard() {
  const { data: invoices, isLoading, isError, refetch } = useInvoices();

  const stats = useMemo(() => {
    if (!invoices) return { awaiting: 0, observations: 0, verified: 0, active: 0 };
    return {
      awaiting: invoices.filter((i) => ['accounts_verification', 'forwarded_to_accounts'].includes(i.current_stage)).length,
      observations: invoices.filter((i) => i.current_stage === 'observation_correspondence').length,
      verified: invoices.filter((i) => ['invoice_passed', 'payment_recorded'].includes(i.current_stage)).length,
      active: invoices.filter((i) => i.status === 'active').length,
    };
  }, [invoices]);

  if (isError) return <ErrorAlert message="Failed to load invoices." onRetry={refetch} />;

  const statCards = [
    { label: 'Awaiting My Verification', value: stats.awaiting, color: 'warning.main' },
    { label: 'Observations Pending', value: stats.observations, color: 'secondary.main' },
    { label: 'Verified', value: stats.verified, color: 'success.main' },
    { label: 'Total Active', value: stats.active, color: 'primary.main' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Accounts Dashboard</Typography>
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
      <InvoiceTable invoices={invoices} loading={isLoading} basePath="/accounts" />
    </Box>
  );
}
