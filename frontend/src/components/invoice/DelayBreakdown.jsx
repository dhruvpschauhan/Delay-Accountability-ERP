import { Box, Typography, LinearProgress, Stack } from '@mui/material';
import { STORE_STAGES, ACCOUNTS_STAGES, EXTERNAL_STAGES } from '../../utils/stageConfig';
import { formatDuration, liveDurationDays } from '../../utils/formatters';

function computeDelays(stageEvents) {
  let storeHours = 0;
  let accountsHours = 0;
  let externalHours = 0;

  if (!stageEvents) return { storeHours, accountsHours, externalHours, totalHours: 0 };

  stageEvents.forEach((event) => {
    let hours = event.duration_hours || 0;
    // If this is the current open stage, compute live duration
    if (event.exited_at === null && event.entered_at) {
      hours = (Date.now() - new Date(event.entered_at).getTime()) / (1000 * 60 * 60);
    }

    if (STORE_STAGES.includes(event.stage_name)) {
      storeHours += hours;
    } else if (ACCOUNTS_STAGES.includes(event.stage_name)) {
      accountsHours += hours;
    } else if (EXTERNAL_STAGES.includes(event.stage_name)) {
      externalHours += hours;
    }
  });

  return {
    storeHours,
    accountsHours,
    externalHours,
    totalHours: storeHours + accountsHours + externalHours,
  };
}

function DelayBar({ label, color, hours, totalHours }) {
  const pct = totalHours > 0 ? (hours / totalHours) * 100 : 0;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="caption" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="caption">
          {formatDuration(hours)} ({Math.round(pct)}%)
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: '#e0e0e0',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
        }}
      />
    </Box>
  );
}

export default function DelayBreakdown({ stageEvents }) {
  const { storeHours, accountsHours, externalHours, totalHours } = computeDelays(stageEvents);

  if (totalHours === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Just started — no delay data yet.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
        Total Time: {formatDuration(totalHours)}
      </Typography>
      <DelayBar label="🔵 Store Officer" color="#5c6bc0" hours={storeHours} totalHours={totalHours} />
      <DelayBar label="🟢 Accounts Officer" color="#1e7e34" hours={accountsHours} totalHours={totalHours} />
      <DelayBar label="🟠 External (Firm)" color="#e65100" hours={externalHours} totalHours={totalHours} />
    </Box>
  );
}
