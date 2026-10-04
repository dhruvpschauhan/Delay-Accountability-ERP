import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, CircularProgress, Box,
  MenuItem,
  useMediaQuery, useTheme,
} from '@mui/material';
import { useRecordPayment } from '../../hooks/useInvoices';

export default function PaymentForm({ open, onClose, invoice, onSuccess }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm();
  const mutation = useRecordPayment();

  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync({
        invoiceId: invoice.id,
        data: {
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
        },
      });
      reset();
      onSuccess?.('Payment recorded successfully.');
      onClose();
    } catch (err) {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Record Payment</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
            <Typography variant="caption">
              Invoice: <strong>{invoice?.invoice_number}</strong> | Amount: <strong>₹{invoice?.invoice_amount}</strong>
            </Typography>
          </Box>
          <TextField
            label="Payment Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('payment_date', { required: 'Payment Date is required' })}
            error={!!errors.payment_date} helperText={errors.payment_date?.message}
          />
          <Controller
            name="payment_method"
            control={control}
            defaultValue=""
            rules={{ required: 'Payment Method is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Payment Method" size="small"
                error={!!errors.payment_method} helperText={errors.payment_method?.message}
              >
                <MenuItem value="NEFT">NEFT</MenuItem>
                <MenuItem value="RTGS">RTGS</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            )}
          />
          <TextField
            label="Reference Number (UTR/Txn ID)" size="small"
            {...register('reference_number', { required: 'Reference Number is required' })}
            error={!!errors.reference_number} helperText={errors.reference_number?.message}
          />
          
          {mutation.isError && (
            <Typography color="error" variant="body2">
              {(() => {
                const detail = mutation.error?.response?.data?.detail;
                if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
                return detail || 'Failed to record payment.';
              })()}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
