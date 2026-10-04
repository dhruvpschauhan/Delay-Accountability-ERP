import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useReplyObservation } from '../../hooks/useInvoices';

export default function ObservationReplyForm({ open, onClose, invoice, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const mutation = useReplyObservation();

  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync({
        invoiceId: invoice.id,
        data: {
          reply_received_date: data.reply_received_date,
          reply_notes: data.reply_notes,
          resubmit_to_accounts: true,
        },
      });
      reset();
      onSuccess?.('Firm reply recorded. Invoice is back in verification queue.');
      onClose();
    } catch (err) {
      // Handled by mutation state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Record Firm's Reply</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Use this form to log the reply or corrected invoice received from the firm regarding the raised observations.
          </Typography>
          <TextField
            type="date"
            label="Reply Received Date" size="small" InputLabelProps={{ shrink: true }}
            {...register('reply_received_date', { required: 'Date is required' })}
            error={!!errors.reply_received_date} helperText={errors.reply_received_date?.message}
          />
          <TextField
            label="Reply Notes / Clarifications" size="small" multiline rows={3}
            {...register('reply_notes', { required: 'Notes are required' })}
            error={!!errors.reply_notes} helperText={errors.reply_notes?.message}
          />
          {mutation.isError && (
            <Typography color="error" variant="body2">
              {(() => {
                const detail = mutation.error?.response?.data?.detail;
                if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
                return detail || 'Failed to record reply.';
              })()}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Recording...' : 'Record & Resubmit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
