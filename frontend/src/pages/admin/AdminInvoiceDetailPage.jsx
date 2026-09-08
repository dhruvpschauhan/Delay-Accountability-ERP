import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, Divider, Alert } from '@mui/material';
import { useInvoice } from '../../hooks/useInvoices';
import InvoiceStatusChip from '../../components/invoice/InvoiceStatusChip';
import StageTimeline from '../../components/invoice/StageTimeline';
import DelayBreakdown from '../../components/invoice/DelayBreakdown';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { getStageConfig } from '../../utils/stageConfig';
import { formatCurrency, formatDate, liveDurationDays } from '../../utils/formatters';

export default function AdminInvoiceDetailPage() {
  const { id } = useParams();
  const { data: invoice, isLoading, isError, refetch } = useInvoice(id);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorAlert message="Failed to load invoice." onRetry={refetch} />;
  if (!invoice) return <ErrorAlert message="Invoice not found." />;

  const stageConfig = getStageConfig(invoice.current_stage);
  const timelineEvents = [...(invoice.stage_events || [])].reverse();

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>Read-only view — Admin users cannot modify invoices.</Alert>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h5">{invoice.invoice_number}</Typography>
                <Chip label={`Plant ${invoice.plant_id}`} size="small" variant="outlined" />
                <Chip label={invoice.status === 'active' ? 'Active' : 'Closed'} size="small" color={invoice.status === 'active' ? 'primary' : 'default'} />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">PO Number</Typography><Typography variant="body2" fontWeight={600}>{invoice.po_number}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">PO Date</Typography><Typography variant="body2">{formatDate(invoice.po_date)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="body2" fontWeight={600}>{formatCurrency(invoice.invoice_amount)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Quantity</Typography><Typography variant="body2">{invoice.item_quantity_ordered}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2">{formatDate(invoice.created_at)}</Typography></Grid>
              </Grid>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Current Stage</Typography>
              <InvoiceStatusChip stage={invoice.current_stage} size="medium" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{stageConfig.description}</Typography>
              <Typography variant="caption" color="secondary.main" fontWeight={600} display="block" sx={{ mt: 1 }}>
                Time in this stage: {liveDurationDays(invoice.current_stage_entered_at)} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Delay Breakdown</Typography>
              <Divider sx={{ mb: 2 }} />
              <DelayBreakdown stageEvents={invoice.stage_events} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Audit Trail</Typography>
              <Divider sx={{ mb: 2 }} />
              <StageTimeline stageEvents={timelineEvents} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
