import { Box, Typography, Chip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { getStageConfig } from '../../utils/stageConfig';
import { formatDateTime, formatDuration, liveDurationDays } from '../../utils/formatters';

export default function StageTimeline({ stageEvents }) {
  if (!stageEvents || stageEvents.length === 0) {
    return <Typography color="text.secondary">No stage history yet.</Typography>;
  }

  return (
    <Box sx={{ position: 'relative', pl: 4 }}>
      {/* Vertical connector line */}
      <Box
        sx={{
          position: 'absolute',
          left: 15,
          top: 12,
          bottom: 12,
          width: 2,
          bgcolor: '#e0e0e0',
        }}
      />
      {stageEvents.map((event, index) => {
        const config = getStageConfig(event.stage_name);
        const Icon = config.icon;
        const isCurrent = event.exited_at === null;
        const delayLabels = {
          internal: 'Internal',
          external_wait: 'External Wait',
          handoff: 'Handoff',
        };

        return (
          <Box
            key={event.id}
            sx={{
              position: 'relative',
              pb: index < stageEvents.length - 1 ? 3 : 0,
              display: 'flex',
              gap: 2,
            }}
          >
            {/* Icon circle */}
            <Box
              sx={{
                position: 'absolute',
                left: -25,
                top: 2,
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isCurrent ? config.color : config.bgColor,
                color: isCurrent ? '#fff' : config.color,
                border: `2px solid ${config.color}`,
                zIndex: 1,
                ...(isCurrent && {
                  boxShadow: `0 0 0 4px ${config.bgColor}`,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { boxShadow: `0 0 0 0 ${config.color}40` },
                    '70%': { boxShadow: `0 0 0 8px ${config.color}00` },
                    '100%': { boxShadow: `0 0 0 0 ${config.color}00` },
                  },
                }),
              }}
            >
              {isCurrent ? <Icon sx={{ fontSize: 16 }} /> : <CheckCircle sx={{ fontSize: 16 }} />}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {config.label}
              </Typography>
              <Typography variant="caption" display="block">
                Entered: {formatDateTime(event.entered_at)}
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: isCurrent ? 'secondary.main' : 'text.secondary' }}>
                {isCurrent
                  ? `Ongoing — ${liveDurationDays(event.entered_at)} days`
                  : `Duration: ${formatDuration(event.duration_hours)}`}
              </Typography>
              {event.delay_type && (
                <Chip
                  label={delayLabels[event.delay_type] || event.delay_type}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
