import { Box, Typography } from '@mui/material';
import { useInvoices } from '../../hooks/useInvoices';
import InvoiceTable from '../../components/invoice/InvoiceTable';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function AdminInvoiceList() {
  const { data: invoices, isLoading, isError, refetch } = useInvoices();

  if (isError) return <ErrorAlert message="Failed to load invoices." onRetry={refetch} />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>All Invoices (All Plants)</Typography>
      <InvoiceTable invoices={invoices} loading={isLoading} basePath="/admin" />
    </Box>
  );
}
