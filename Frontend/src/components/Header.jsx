import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Avatar, Box, Typography, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ adminName = 'Admin', adminRole = 'Administrateur', onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  
  // Timer pour l'heure en temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initiales du nom
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  
  const getPageTitle = () => {
  const path = location.pathname;
    return path.startsWith('/dashboard') ? 'Tableau de bord' : '';
  };

  // Gérer l'ouverture/fermeture du menu utilisateur
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Navigation vers le profil
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    // Supprimer les données de session
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Fermer le menu
    if (onLogout) {
      onLogout();
    }
  
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: 'white',
        color: '#1a1a1a',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        borderRadius: '16px',
        m: '8px',   
        width: '99%'
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {getPageTitle()}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Bienvenue !
          </Typography>
        </Box>

        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>

          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ 
              fontSize: "18px", 
              fontWeight: "500", 
              color: "#ffcc33",
              fontFamily: "monospace"
            }}>
              {currentTime.toLocaleTimeString('fr-FR')}
            </Typography>
            <Typography sx={{ 
              fontSize: "14px", 
              color: "#666" 
            }}>
            </Typography>
          </Box>
          
          {/* Menu utilisateur */}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleMenuOpen}>
            <Avatar
              sx={{
                bgcolor: '#ffcc33',
                color: '#1a1a1a',
                fontWeight: 700,
                width: 40,
                height: 40
              }}
            >
              {getInitials(adminName)}
            </Avatar>
            <Box sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{adminName}</Typography>
              <Typography sx={{ fontSize: 12, color: '#777' }}>{adminRole}</Typography>
            </Box>
            <ArrowDropDownIcon />
          </Box>

          {/* Menu déroulant */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', mt: 1 }
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} /> Mon profil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Déconnexion
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
