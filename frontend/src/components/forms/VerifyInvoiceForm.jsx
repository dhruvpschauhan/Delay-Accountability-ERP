import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, CircularProgress, Box,
  RadioGroup, FormControlLabel, Radio, Alert,
  useMediaQuery, useTheme,
} from '@mui/material';
import { useVerifyInvoice } from '../../hooks/useInvoices';
import { formatCurrency } from '../../utils/formatters';

export default function VerifyInvoiceForm({ open, onClose, invoice, onSuccess }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: { observations_found: 'false' },
  });
  const mutation = useVerifyInvoice();
  const observationsFound = watch('observations_found');

  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync({
        invoiceId: invoice.id,
        data: {
          observations_found: data.observations_found === 'true',
          verification_notes: data.verification_notes || null,
        },
      });
      reset();
      onSuccess?.('Verification submitted successfully.');
      onClose();
    } catch (err) {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Invoice Verification</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
            <Typography variant="caption">
              Invoice: <strong>{invoice?.invoice_number}</strong> | Amount: <strong>{formatCurrency(invoice?.invoice_amount)}</strong>
            </Typography>
          </Box>

          <Typography variant="subtitle2">Observations Found?</Typography>
          <RadioGroup>
            <FormControlLabel
              value="false"
              control={<Radio {...register('observations_found', { required: true })} value="false" />}
              label="No — Invoice is clear"
            />
            <FormControlLabel
              value="true"
              control={<Radio {...register('observations_found', { required: true })} value="true" />}
              label="Yes — Raise Observations"
            />
          </RadioGroup>

          {observationsFound === 'true' && (
            <Alert severity="warning">
              <strong>Observations Will Be Raised</strong><br />
              Describe the issue in the notes below. The invoice will enter the Observation Correspondence stage.
            </Alert>
          )}

          <TextField
            label="Verification Notes" size="small" multiline rows={3}
            placeholder="Describe your findings or confirm all checks passed"
            {...register('verification_notes', {
              required: 'Verification notes are required',
              minLength: { value: 20, message: 'At least 20 characters required' },
            })}
            error={!!errors.verification_notes} helperText={errors.verification_notes?.message}
          />
          {mutation.isError && (
            <Typography color="error" variant="body2">
              {mutation.error?.response?.data?.detail || 'Failed to submit verification.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Submit Verification'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
