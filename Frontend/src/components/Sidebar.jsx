import React from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemIcon, Divider, Button, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SettingsIcon from '@mui/icons-material/Settings';
import CommuteIcon from '@mui/icons-material/Commute';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import CampaignIcon from '@mui/icons-material/Campaign';
import logo from '../images/logo.png'

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer le rôle de l'utilisateur connecté
  const user = JSON.parse(sessionStorage.getItem('user')) || null;
  const userRole = user?.role;

  const handleLogout = () => {
    // Supprimer les données de session
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    if (onLogout) {
      onLogout();
    }
  
    navigate('/login');
  };

  const menuItems = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
    // Superadmin et Admin peuvent voir les utilisateurs
    ...(userRole === 'superadmin' || userRole === 'admin' || userRole === 'gestionnaireColis' 
      ? [{ text: 'Utilisateurs', icon: <PeopleIcon />, path: '/users' }] 
      : []),
    // Chauffeurs - accessible uniquement par admin et superadmin
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Chauffeurs', icon: <CommuteIcon />, path: '/drivers' }]
      : []),
    // Voyages - accessible par tous sauf gestionnaireColis
    ...(userRole !== 'gestionnaireColis'
      ? [{ text: 'Voyages', icon: <DirectionsBusIcon />, path: '/voyage' }]
      : []),
    // Réservations - accessible par admin et superadmin
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Réservations', icon: <ConfirmationNumberIcon />, path: '/reservations' }]
      : []),
    // Colis - accessible par tous les rôles sauf admin
    ...(userRole !== 'admin' 
      ? [{ text: 'Colis', icon: <LocalShippingIcon />, path: '/colis' }]
      : []),
    // Bus - accessible par admin et superadmin
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Bus', icon: <DirectionsBusIcon />, path: '/buses' }]
      : []),
    // Annonces - accessible par admin et superadmin
    ...(userRole === 'superadmin' || userRole === 'admin'
      ? [{ text: 'Annonces', icon: <CampaignIcon />, path: '/annonces' }]
      : []),
    // Historique - accessible par tous
    { text: 'Historique', icon: <HistoryIcon />, path: '/historique' },
    // Profil - accessible par tous
    { text: 'Mon Profil', icon: <PersonIcon />, path: '/profile' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 265,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 250,
          boxSizing: 'border-box',
          height: '100vh', 
          backgroundColor: '#ffffffff',
          display: 'flex',
          flexDirection: 'column',
          border: 'none',
          boxShadow: 'none',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE et Edge
          '&::-webkit-scrollbar': { 
            display: 'none', // Chrome, Safari, Opera
            width: 0,
            height: 0,
          },
        },
      }}
    >
       {/* logo */}
      <Box
        sx={{
          width: '100%',
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            maxWidth: '200px',
            maxHeight: '200px',
            objectFit: 'contain',
          }}
        />
      </Box>

      <Divider sx={{ 
        borderColor: 'rgba(85, 82, 74, 0.33)', 
        mx: 2,
        mb: 2 
      }} />

    <List>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <ListItem
            key={item.text}
            component={Link}
            to={item.path}
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

      
      
      <Divider sx={{ 
        borderColor: 'rgba(85, 82, 74, 0.33)', 
        mx: 2,
        mb: 2 
      }} />
      
      
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
    </Drawer>
  );
};

export default Sidebar;
