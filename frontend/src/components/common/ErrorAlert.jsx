import { Alert, Button, Box } from '@mui/material';

export default function ErrorAlert({ message, onRetry }) {
  return (
    <Box sx={{ p: 3 }}>
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Try Again
            </Button>
          ) : null
        }
      >
        {message || 'Something went wrong. Please try again.'}
      </Alert>
    </Box>
  );
}
