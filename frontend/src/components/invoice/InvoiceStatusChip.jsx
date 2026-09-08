import { Chip } from '@mui/material';
import { getStageConfig } from '../../utils/stageConfig';

export default function InvoiceStatusChip({ stage, size = 'small' }) {
  const config = getStageConfig(stage);
  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        borderRadius: '6px',
      }}
    />
  );
}
