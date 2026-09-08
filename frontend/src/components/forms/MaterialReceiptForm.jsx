import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, CircularProgress, Box,
  useMediaQuery, useTheme,
} from '@mui/material';
import { useRecordReceipt } from '../../hooks/useInvoices';

export default function MaterialReceiptForm({ open, onClose, invoice, onSuccess }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const mutation = useRecordReceipt();

  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync({
        invoiceId: invoice.id,
        data: {
          receipt_date: data.receipt_date,
          quantity_received: parseInt(data.quantity_received, 10),
          receipt_notes: data.receipt_notes || null,
        },
      });
      reset();
      onSuccess?.('Material receipt recorded successfully.');
      onClose();
    } catch (err) {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Record Material Receipt</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
            <Typography variant="caption">
              Invoice: <strong>{invoice?.invoice_number}</strong> | PO: <strong>{invoice?.po_number}</strong> | Ordered: <strong>{invoice?.item_quantity_ordered} items</strong>
            </Typography>
          </Box>
          <TextField
            label="Receipt Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('receipt_date', { required: 'Receipt Date is required' })}
            error={!!errors.receipt_date} helperText={errors.receipt_date?.message}
          />
          <TextField
            label="Quantity Received" size="small" type="number"
            {...register('quantity_received', {
              required: 'Quantity is required',
              min: { value: 1, message: 'Must be > 0' },
              max: { value: invoice?.item_quantity_ordered || 99999, message: `Cannot exceed ${invoice?.item_quantity_ordered}` },
            })}
            error={!!errors.quantity_received} helperText={errors.quantity_received?.message}
          />
          <TextField
            label="Notes" size="small" multiline rows={3} placeholder="Optional notes..."
            {...register('receipt_notes', { maxLength: { value: 500, message: 'Max 500 characters' } })}
            error={!!errors.receipt_notes} helperText={errors.receipt_notes?.message}
          />
          {mutation.isError && (
            <Typography color="error" variant="body2">
              {mutation.error?.response?.data?.detail || 'Failed to record receipt.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Record Receipt'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
