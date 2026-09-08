import { AppBar, Toolbar, Typography, IconButton, Chip, Stack, Box } from '@mui/material';
import { Menu, Logout } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const roleLabels = {
  store_officer: 'Store Officer',
  accounts_officer: 'Accounts Officer',
  admin: 'HQ Admin',
};

export default function TopBar({ onMenuClick, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar>
        {isMobile && (
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
            <Menu />
          </IconButton>
        )}
        <Typography variant="h6" color="primary" fontWeight={700} sx={{ flexGrow: 1 }}>
          {user?.plant_id ? `Plant ${user.plant_id}` : 'HQ Oversight'}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" color="text.primary" fontWeight={500}>
            {user?.name}
          </Typography>
          <Chip
            label={roleLabels[user?.role] || user?.role}
            size="small"
            color="primary"
            variant="outlined"
          />
          <IconButton onClick={handleLogout} size="small" title="Logout">
            <Logout fontSize="small" />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
