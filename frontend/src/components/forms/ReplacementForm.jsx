import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, CircularProgress, Box,
  useMediaQuery, useTheme,
} from '@mui/material';
import { useRecordReplacement } from '../../hooks/useInvoices';

export default function ReplacementForm({ open, onClose, invoice, onSuccess }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const mutation = useRecordReplacement();

  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync({
        invoiceId: invoice.id,
        data: {
          replacement_received_date: data.replacement_received_date,
          replacement_quantity: parseInt(data.replacement_quantity, 10),
          replacement_notes: data.replacement_notes || null,
        },
      });
      reset();
      onSuccess?.('Replacement recorded successfully.');
      onClose();
    } catch (err) {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Record Replacement Material</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
            <Typography variant="caption">
              Invoice: <strong>{invoice?.invoice_number}</strong> | PO: <strong>{invoice?.po_number}</strong> | Ordered: <strong>{invoice?.item_quantity_ordered} items</strong>
            </Typography>
          </Box>
          <TextField
            label="Replacement Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('replacement_received_date', { required: 'Date is required' })}
            error={!!errors.replacement_received_date} helperText={errors.replacement_received_date?.message}
          />
          <TextField
            label="Replacement Quantity" size="small" type="number"
            {...register('replacement_quantity', {
              required: 'Quantity is required',
              min: { value: 1, message: 'Must be > 0' },
              max: { value: invoice?.item_quantity_ordered || 99999, message: `Cannot exceed ${invoice?.item_quantity_ordered}` },
            })}
            error={!!errors.replacement_quantity} helperText={errors.replacement_quantity?.message}
          />
          <TextField
            label="Notes" size="small" multiline rows={3} placeholder="Optional notes..."
            {...register('replacement_notes', { maxLength: { value: 500, message: 'Max 500 characters' } })}
            error={!!errors.replacement_notes} helperText={errors.replacement_notes?.message}
          />
          {mutation.isError && (
            <Typography color="error" variant="body2">
              {mutation.error?.response?.data?.detail || 'Failed to record replacement.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Record Replacement'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
