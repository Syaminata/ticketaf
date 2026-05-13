import React from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemIcon, Divider, Button, Box, useTheme, useMediaQuery } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CommuteIcon from '@mui/icons-material/Commute';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import CampaignIcon from '@mui/icons-material/Campaign';
import logo from '../images/logo.png';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';

const SIDEBAR_WIDTH = 250;

const Sidebar = ({ onLogout, mobileOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const user = JSON.parse(sessionStorage.getItem('user')) || null;
  const userRole = user?.role;

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
    ...(userRole === 'superadmin' || userRole === 'admin' || userRole === 'gestionnaireColis'
      ? [{ text: 'Utilisateurs', icon: <PeopleIcon />, path: '/users' }]
      : []),
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Chauffeurs', icon: <CommuteIcon />, path: '/drivers' }]
      : []),
    ...(userRole !== 'gestionnaireColis'
      ? [{ text: 'Covoiturages', icon: <DirectionsBusIcon />, path: '/voyage' }]
      : []),
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Réservations', icon: <ConfirmationNumberIcon />, path: '/reservations' }]
      : []),
    ...(userRole !== 'admin'
      ? [{ text: 'Colis', icon: <LocalShippingIcon />, path: '/colis' }]
      : []),
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Bus', icon: <DirectionsBusIcon />, path: '/buses' }]
      : []),
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Annonces', icon: <CampaignIcon />, path: '/annonces' }]
      : []),
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' }]
      : []),
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Informations', icon: <InfoIcon />, path: '/informations' }]
      : []),
    { text: 'Historique', icon: <HistoryIcon />, path: '/historique' },
    { text: 'Mon Profil', icon: <PersonIcon />, path: '/profile' },
  ];

  const drawerContent = (
    <>
      <Box
        sx={{
          width: '100%',
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img src={logo} alt="Logo" style={{ maxWidth: '160px', maxHeight: '80px', objectFit: 'contain' }} />
      </Box>

      <Divider sx={{ borderColor: 'rgba(85, 82, 74, 0.33)', mx: 2, mb: 2 }} />

      <List sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              component={Link}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              sx={{
                cursor: 'pointer',
                backgroundColor: isActive ? '#ebff3325' : 'transparent',
                color: isActive ? '#b6660abd' : '#000000ff',
                borderRadius: '10px',
                mb: 1,
                mx: 1,
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: isActive ? '#ebff3325' : 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateX(4px)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: isActive ? '5px' : '0px',
                  height: '80%',
                  backgroundColor: '#b6660abd',
                  borderRadius: '0 4px 4px 0',
                  transition: 'width 0.3s ease',
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive ? '#b6660abd' : '#000000ff' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(85, 82, 74, 0.33)', mx: 2, mb: 2 }} />

      <Button
        onClick={handleLogout}
        startIcon={<LogoutIcon />}
        sx={{
          color: '#000000ff',
          backgroundColor: 'transparent',
          border: '1px solid #b6660abd',
          borderRadius: '8px',
          mx: 2,
          mb: 2,
          py: 1.5,
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 204, 51, 0.1)',
            borderColor: '#ffcc33',
            transform: 'translateY(-2px)',
          },
        }}
      >
        Déconnexion
      </Button>
    </>
  );

  const paperSx = {
    width: SIDEBAR_WIDTH,
    boxSizing: 'border-box',
    height: '100vh',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    border: 'none',
    boxShadow: isMobile ? '2px 0 16px rgba(0,0,0,0.12)' : 'none',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
  };

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': paperSx,
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH + 15,
        flexShrink: 0,
        '& .MuiDrawer-paper': paperSx,
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;