import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider,
} from '@mui/material';
import { Dashboard, ListAlt, BarChart } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const navByRole = {
  store_officer: [
    { label: 'Dashboard', icon: <Dashboard />, path: '/store' },
    { label: 'All Invoices', icon: <ListAlt />, path: '/store' },
  ],
  accounts_officer: [
    { label: 'Dashboard', icon: <Dashboard />, path: '/accounts' },
    { label: 'All Invoices', icon: <ListAlt />, path: '/accounts' },
  ],
  admin: [
    { label: 'Overview', icon: <Dashboard />, path: '/admin' },
    { label: 'All Invoices', icon: <ListAlt />, path: '/admin/invoices' },
    { label: 'Analytics', icon: <BarChart />, path: '/admin' },
  ],
};

export default function Sidebar({ drawerWidth, mobileOpen, onClose, isMobile }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = navByRole[user?.role] || [];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" color="primary" fontWeight={800} letterSpacing={1}>
          IDAS
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, mt: 1 }}>
        {items.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid #e0e0e0' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
