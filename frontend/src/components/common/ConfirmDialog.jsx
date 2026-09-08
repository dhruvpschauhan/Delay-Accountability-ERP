import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from '@mui/material';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || 'Confirm Action'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}
