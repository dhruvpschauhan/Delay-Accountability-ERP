import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, CircularProgress, Box,
  RadioGroup, FormControlLabel, Radio, Alert,
  useMediaQuery, useTheme,
} from '@mui/material';
import { useConfirmInspection } from '../../hooks/useInvoices';

export default function InspectionForm({ open, onClose, invoice, onSuccess }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: { acceptance_type: 'full' },
  });
  const mutation = useConfirmInspection();
  const acceptanceType = watch('acceptance_type');

  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync({
        invoiceId: invoice.id,
        data: {
          inspection_date: data.inspection_date,
          pbg_acceptance_date: data.pbg_acceptance_date || null,
          contract_agreement_date: data.contract_agreement_date || null,
          acknowledgement_date: data.acknowledgement_date || null,
          acceptance_type: data.acceptance_type,
          acceptance_notes: data.acceptance_notes || null,
        },
      });
      reset();
      onSuccess?.('Inspection confirmed successfully.');
      onClose();
    } catch (err) {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Confirm Inspection</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
            <Typography variant="caption">
              Invoice: <strong>{invoice?.invoice_number}</strong> | Qty Ordered: <strong>{invoice?.item_quantity_ordered}</strong>
            </Typography>
          </Box>
          <TextField
            label="Inspection Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('inspection_date', { required: 'Inspection Date is required' })}
            error={!!errors.inspection_date} helperText={errors.inspection_date?.message}
          />
          <TextField
            label="PBG Acceptance Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('pbg_acceptance_date')}
          />
          <TextField
            label="Contract Agreement Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('contract_agreement_date')}
          />
          <TextField
            label="Acknowledgement Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('acknowledgement_date')}
          />

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Acceptance Type</Typography>
          <RadioGroup row>
            <FormControlLabel
              value="full"
              control={<Radio {...register('acceptance_type', { required: 'Select acceptance type' })} value="full" />}
              label="Full Acceptance"
            />
            <FormControlLabel
              value="partial"
              control={<Radio {...register('acceptance_type', { required: 'Select acceptance type' })} value="partial" />}
              label="Partial Acceptance"
            />
          </RadioGroup>
          {errors.acceptance_type && (
            <Typography color="error" variant="caption">{errors.acceptance_type.message}</Typography>
          )}

          {acceptanceType === 'partial' && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              <strong>Partial Acceptance Selected</strong><br />
              The supplier will be notified for material replacement.
              This invoice will enter the Firm Intimation stage.
            </Alert>
          )}

          <TextField
            label="Acceptance Notes" size="small" multiline rows={3}
            placeholder="Describe quality findings"
            {...register('acceptance_notes', {
              ...(acceptanceType === 'partial' && { required: 'Notes required for partial acceptance' }),
            })}
            error={!!errors.acceptance_notes} helperText={errors.acceptance_notes?.message}
          />
          {mutation.isError && (
            <Typography color="error" variant="body2">
              {mutation.error?.response?.data?.detail || 'Failed to confirm inspection.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Confirm Inspection'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
