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
  const partialAction = watch('partial_action');

    const onSubmit = async (data) => {
    try {
      const payload = {
        inspection_date: data.inspection_date,
        pbg_acceptance_date: data.pbg_acceptance_date || null,
        contract_agreement_date: data.contract_agreement_date || null,
        acknowledgement_date: data.acknowledgement_date || null,
        acceptance_type: data.acceptance_type,
        acceptance_notes: data.acceptance_notes || null,
      };

      if (data.acceptance_type === 'partial') {
        payload.partial_action = data.partial_action;
        if (data.partial_action === 'revise') {
          payload.revised_amount = parseFloat(data.revised_amount);
        }
      }

      await mutation.mutateAsync({
        invoiceId: invoice.id,
        data: payload,
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
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'warning.light', borderRadius: 1, bgcolor: 'warning.50' }}>
              <Typography variant="subtitle2" color="warning.dark">Action to Take</Typography>
              <RadioGroup row>
                <FormControlLabel
                  value="replace"
                  control={<Radio {...register('partial_action', { required: 'Select an action' })} value="replace" />}
                  label="Ask for Replacement"
                />
                <FormControlLabel
                  value="revise"
                  control={<Radio {...register('partial_action', { required: 'Select an action' })} value="revise" />}
                  label="Revise Invoice Amount"
                />
              </RadioGroup>
              {errors.partial_action && (
                <Typography color="error" variant="caption">{errors.partial_action.message}</Typography>
              )}
              
              {partialAction === 'replace' && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  The supplier will be notified for material replacement. This invoice will enter the Firm Intimation stage.
                </Alert>
              )}
              
              {partialAction === 'revise' && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Revised Invoice Amount (₹)" size="small" type="number" fullWidth
                    {...register('revised_amount', {
                      required: 'Revised amount is required',
                      min: { value: 0.01, message: 'Must be > 0' },
                      max: { value: invoice?.invoice_amount || 99999999, message: `Cannot exceed original amount ${invoice?.invoice_amount}` }
                    })}
                    error={!!errors.revised_amount} helperText={errors.revised_amount?.message}
                  />
                  <Alert severity="info" sx={{ mt: 1 }}>
                    The invoice amount will be permanently revised. It will be forwarded directly to the Accounts Officer.
                  </Alert>
                </Box>
              )}
            </Box>
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
