import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Alert,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Autocomplete,
  InputAdornment,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  DirectionsCar as DriverIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

export default function AdminNotifications() {
  const [target, setTarget] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ totalSent: 0, totalFailed: 0, totalNotifications: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  const handleSend = async () => {
    if (!title || !body) {
      setError('Le titre et le message sont requis');
      return;
    }

    if (target === 'specific' && (!selectedUser || !selectedUser._id)) {
      setError('Veuillez sélectionner un utilisateur valide dans la liste');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post('/notifications/send', {
        target,
        userId: target === 'specific' ? selectedUser._id : undefined,
        title,
        body,
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`✓ Notification envoyée à ${response.data.sent} utilisateurs`);
      setTitle('');
      setBody('');
      setUserSearch('');
      setSelectedUser(null);
      loadHistory();
      loadStats();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Erreur envoi notification:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi de la notification');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('/notifications/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.logs || []);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  const loadStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('/notifications/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats || { totalSent: 0, totalFailed: 0, totalNotifications: 0 });
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
    }
  };

  const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`/users?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserSuggestions(response.data.users || []);
    } catch (err) {
      console.error('Erreur recherche utilisateurs:', err);
      setUserSuggestions([]);
    }
  };

  const handleUserSearchChange = (value) => {
    setUserSearch(value);
    setSelectedUser(null);
    searchUsers(value);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUserSearch(`${user.name} (${user.numero})`);
    setUserSuggestions([]);
  };

  const handleOpenDetails = (notification) => {
    setCurrentNotification(notification);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setCurrentNotification(null);
  };

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, typeFilter]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'info': return 'primary';
      case 'promo': return 'success';
      case 'alert': return 'warning';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'info': return 'Information';
      case 'promo': return 'Promotion';
      case 'alert': return 'Alerte';
      default: return type;
    }
  };

  const getTargetIcon = (target) => {
    if (target?.includes('Tous')) return <PeopleIcon sx={{ fontSize: 20 }} />;
    if (target?.includes('Clients')) return <PersonIcon sx={{ fontSize: 20 }} />;
    if (target?.includes('Chauffeurs')) return <DriverIcon sx={{ fontSize: 20 }} />;
    return <PersonIcon sx={{ fontSize: 20 }} />;
  };

  // Filtrage de l'historique
  const filteredHistory = history.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const paginatedHistory = filteredHistory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ 
      p: 2, 
      backgroundColor: '#ffffff', 
      minHeight: '100vh',
      color: '#1a1a1a'
    }}>
      {/* Messages d'alerte */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: '8px' }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: '8px' }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            fontSize: "20px",
            color: '#1a1a1a',
            mb: 1
          }}>
            Gestion des notifications
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#666666',
            fontSize: '16px'
          }}>
            Envoyez des notifications push aux utilisateurs
          </Typography>
        </Box>
        <IconButton 
          onClick={() => { loadHistory(); loadStats(); }}
          sx={{ 
            backgroundColor: '#f5f5f5',
            '&:hover': { backgroundColor: '#e0e0e0' }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Formulaire d'envoi */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: '12px', 
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(206, 204, 204, 0.43)'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          fontSize: '18px',
          color: '#1a1a1a',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SendIcon sx={{ color: '#ffcc33' }} />
          Envoyer une notification
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="target-label">Destinataires</InputLabel>
              <Select
                labelId="target-label"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                label="Destinataires"
                sx={{
                  borderRadius: '12px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffcc33',
                    borderWidth: 2,
                  },
                }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" />
                    Tous les utilisateurs
                  </Box>
                </MenuItem>
                <MenuItem value="clients">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    Tous les clients
                  </Box>
                </MenuItem>
                <MenuItem value="drivers">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DriverIcon fontSize="small" />
                    Tous les chauffeurs
                  </Box>
                </MenuItem>
                <MenuItem value="specific">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    Utilisateur spécifique
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                value={type}
                onChange={(e) => setType(e.target.value)}
                label="Type"
                sx={{
                  borderRadius: '12px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffcc33',
                    borderWidth: 2,
                  },
                }}
              >
                <MenuItem value="info">
                  <Chip label="Information" color="primary" size="small" sx={{ mr: 1 }} />
                  Information
                </MenuItem>
                <MenuItem value="promo">
                  <Chip label="Promotion" color="success" size="small" sx={{ mr: 1 }} />
                  Promotion
                </MenuItem>
                <MenuItem value="alert">
                  <Chip label="Alerte" color="warning" size="small" sx={{ mr: 1 }} />
                  Alerte
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {target === 'specific' && (
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={userSuggestions}
                getOptionLabel={(option) => option && option.name ? `${option.name} (${option.numero}) - ${option.role}` : ''}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Rechercher un utilisateur"
                    placeholder="Tapez le nom ou le numéro de téléphone"
                    variant="outlined"
                    onChange={(e) => handleUserSearchChange(e.target.value)}
                    helperText={selectedUser && selectedUser._id ? `✅ Sélectionné: ${selectedUser.name} (${selectedUser.numero})` : "Recherchez par nom ou numéro"}
                    error={target === 'specific' && (!selectedUser || !selectedUser._id)}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': {
                          borderColor: '#ffcc33',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ffcc33',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ffcc33',
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {option.numero} - {option.role}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
                onInputChange={(e, value) => handleUserSearchChange(value)}
                onChange={(e, value) => {
                  if (value && value._id) {
                    handleUserSelect(value);
                  }
                }}
                value={selectedUser}
                isOptionEqualToValue={(option, value) => option && value && option._id === value._id}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Promotion -20% sur tous les voyages"
              variant="outlined"
              inputProps={{ maxLength: 50 }}
              helperText={`${title.length}/50 caractères`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex: Profitez de -20% sur tous les voyages ce weekend ! Code: WEEKEND20"
              variant="outlined"
              multiline
              rows={2}
              inputProps={{ maxLength: 200 }}
              helperText={`${body.length}/200 caractères`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
          </Grid>

          {/* Aperçu de la notification */}
          {(title || body) && (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 3, 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                border: '2px solid #ffcc33'
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 600, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <NotificationsIcon sx={{ color: '#ffcc33' }} />
                  Aperçu de la notification
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip 
                      label={getTypeLabel(type)} 
                      color={getTypeColor(type)}
                      size="small"
                    />
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {new Date().toLocaleString('fr-FR')}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {title || 'Titre de la notification'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {body || 'Contenu du message...'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              onClick={handleSend}
              disabled={loading || !title || !body}
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              sx={{ 
                backgroundColor: 'transparent',
                border: '2px solid #ffcc33',
                color: '#b6660abd',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '16px',
                '&:hover': {
                  backgroundColor: '#ffffff',
                  borderColor: '#ffb300',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(255, 204, 51, 0.3)',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#e0e0e0',
                  color: '#999',
                },
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer la notification'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Filtres pour l'historique */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <TextField
          placeholder="Rechercher dans l'historique..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#666', fontSize: 20 }} />
              </InputAdornment>
            )
          }}
          sx={{
            width: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '&:hover fieldset': {
                borderColor: '#ffcc33',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ffcc33',
                borderWidth: 2,
              },
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            label="Type"
            sx={{
              borderRadius: '8px',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ffcc33',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ffcc33',
              },
            }}
          >
            <MenuItem value="all">Tous les types</MenuItem>
            <MenuItem value="info">Information</MenuItem>
            <MenuItem value="promo">Promotion</MenuItem>
            <MenuItem value="alert">Alerte</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Historique */}
      <Paper sx={{ 
        borderRadius: '12px', 
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(206, 204, 204, 0.43)'
      }}>
        <Box sx={{ p: 3, borderBottom: '3px solid #ffcc33' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            fontSize: '18px',
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <NotificationsIcon sx={{ color: '#ffcc33' }} />
            Historique des envois ({filteredHistory.length})
          </Typography>
        </Box>
        
        <Table>
          <TableHead sx={{ 
            borderBottom: '2px solid #f5f5f5',
            backgroundColor: '#f8f9fa'
          }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '16px' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '16px' }}>Titre</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '16px' }}>Destinataires</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '16px' }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '16px' }}>Envoyés</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '16px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    color: '#757575'
                  }}>
                    <NotificationsIcon sx={{ fontSize: 48, mb: 2, color: '#e0e0e0' }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      Aucune notification envoyée
                    </Typography>
                    <Typography variant="body2">
                      L'historique des notifications apparaîtra ici
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedHistory.map((log) => {
                // Debug: afficher la structure de log dans la console
                console.log('Log structure:', log);
                console.log('Log createdAt:', log.createdAt);
                console.log('Log createdAt type:', typeof log.createdAt);
                
                return (
                <TableRow 
                  key={log._id}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 204, 51, 0.1)',
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => handleOpenDetails(log)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }) : 'Date invalide'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Heure invalide'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {log.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTargetIcon(log.target)}
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {log.target}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTypeLabel(log.type)} 
                      color={getTypeColor(log.type)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 700, fontSize: '16px' }}>
                      {log.sentCount}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(log);
                      }}
                      sx={{
                        color: '#21740cff',
                        '&:hover': { 
                          backgroundColor: 'rgba(33, 116, 12, 0.1)' 
                        }
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        {filteredHistory.length > 0 && (
          <TablePagination
            component="div"
            count={filteredHistory.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Lignes par page"
            sx={{
              borderTop: '1px solid #e0e0e0'
            }}
          />
        )}
      </Paper>

      {/* Dialog des détails */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '3px solid #ffcc33',
          color: '#1a1a1a',
          fontWeight: 700,
          fontSize: '20px',
          textAlign: 'center',
          py: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <NotificationsIcon sx={{ fontSize: 28, color: '#ffcc33' }} />
            Détails de la notification
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {currentNotification && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                  Date d'envoi
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {currentNotification.createdAt ? new Date(currentNotification.createdAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Date invalide'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                  Type
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={getTypeLabel(currentNotification.type)} 
                    color={getTypeColor(currentNotification.type)}
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                  Destinataires
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  {getTargetIcon(currentNotification.target)}
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {currentNotification.target}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                  Titre
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {currentNotification.title}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                  Message
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, color: '#666' }}>
                  {currentNotification.body}
                </Typography>
              </Box>

              <Box sx={{ 
                p: 2, 
                backgroundColor: '#e8f5e9', 
                borderRadius: '8px',
                border: '1px solid #4caf50'
              }}>
                <Typography variant="caption" sx={{ color: '#2e7d32', textTransform: 'uppercase', fontWeight: 600 }}>
                  Notifications envoyées
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32', mt: 0.5 }}>
                  {currentNotification.sentCount} utilisateur{currentNotification.sentCount > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleCloseDetails}
            variant="outlined"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderColor: '#ffcc33',
              color: '#1a1a1a',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#e6b800',
                backgroundColor: 'rgba(255, 204, 51, 0.08)',
              }
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}