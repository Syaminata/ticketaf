import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export default function Historique() {
  const [tab, setTab] = useState(0); // 0: Voyages, 1: Réservations, 2: Colis
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [voyages, setVoyages] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [colis, setColis] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtres avancés - Par défaut afficher uniquement les expirés
  const [statusFilter, setStatusFilter] = useState('expired');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [vRes, rRes, cRes, uRes] = await Promise.all([
        fetch('https://ticket-taf.itea.africa/api/voyages/all/including-expired', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://ticket-taf.itea.africa/api/reservations', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://ticket-taf.itea.africa/api/colis', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://ticket-taf.itea.africa/api/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!vRes.ok) throw new Error('Erreur chargement voyages');
      if (!rRes.ok) throw new Error('Erreur chargement réservations');
      if (!cRes.ok) throw new Error('Erreur chargement colis');
      if (!uRes.ok) throw new Error('Erreur chargement utilisateurs');

      const [vData, rData, cData, uData] = await Promise.all([vRes.json(), rRes.json(), cRes.json(), uRes.json()]);

      console.log('📦 Données chargées:');
      console.log('  - Voyages:', vData?.length || 0);
      console.log('  - Réservations:', rData?.length || 0);
      console.log('  - Colis:', cData?.length || 0);
      console.log('  - Utilisateurs:', uData?.length || 0);

      setVoyages(Array.isArray(vData) ? vData : []);
      setReservations(Array.isArray(rData) ? rData : []);
      setColis(Array.isArray(cData) ? cData : []);
      setUsers(Array.isArray(uData) ? uData : []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDateTime = (d) => new Date(d).toLocaleString('fr-FR');
  
  const formatDateShort = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} à ${timeStr}`;
  };

  const getTemporalStatus = (date) => {
    if (!date) return { label: '—', color: 'default', status: 'unknown' };
    const dt = new Date(date);
    const now = new Date();
    const d1 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { label: 'Expiré', color: 'error', status: 'expired' };
    if (diff === 0) return { label: "Aujourd'hui", color: 'warning', status: 'today' };
    return { label: 'À venir', color: 'success', status: 'upcoming' };
  };

  const matchesStatusFilter = (date) => {
    if (statusFilter === 'all') return true;
    const status = getTemporalStatus(date).status;
    return status === statusFilter;
  };

  const matchesDateFilter = (date) => {
    if (!dateFilter) return true;
    if (!date) return false;
    const itemDate = new Date(date).toISOString().split('T')[0];
    return itemDate === dateFilter;
  };

  const filterByQuery = (text) =>
    !query || (text || '').toLowerCase().includes(query.toLowerCase());

  const filteredVoyages = (voyages || [])
    .filter(v => {
      if (!filterByQuery(`${v.from} ${v.to}`)) return false;
      if (!matchesStatusFilter(v.date)) return false;
      if (!matchesDateFilter(v.date)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredReservations = useMemo(() => {
    const filtered = (reservations || [])
      .filter(r => {
        const searchText = `${r.user?.name || ''} ${r.voyage ? (r.voyage.from + ' ' + r.voyage.to) : ''} ${r.bus ? (r.bus.from + ' ' + r.bus.to) : ''}`;
        if (!filterByQuery(searchText)) return false;
        if (userFilter !== 'all' && r.user?._id !== userFilter) return false;
        const reservationDate = r.voyage?.date || r.bus?.departureDate;
        if (!matchesStatusFilter(reservationDate)) return false;
        if (!matchesDateFilter(reservationDate)) return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.voyage?.date || a.bus?.departureDate || a.createdAt);
        const dateB = new Date(b.voyage?.date || b.bus?.departureDate || b.createdAt);
        return dateB - dateA;
      });
    
    return filtered;
  }, [reservations, query, userFilter, statusFilter, dateFilter]);

  const filteredColis = useMemo(() => {
    const filtered = (colis || [])
      .filter(c => {
        const searchText = `${c.destinataire?.nom || ''} ${c.destinataire?.telephone || ''} ${c.description || ''} ${c.voyage?.from || ''} ${c.voyage?.to || ''}`;
        if (!filterByQuery(searchText)) return false;
        if (userFilter !== 'all' && c.expediteur?._id !== userFilter) return false;
        const colisDate = c.voyage?.date;
        if (!matchesStatusFilter(colisDate)) return false;
        if (!matchesDateFilter(colisDate)) return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.voyage?.date || a.createdAt);
        const dateB = new Date(b.voyage?.date || b.createdAt);
        return dateB - dateA;
      });
    
    return filtered;
  }, [colis, query, userFilter, statusFilter, dateFilter]);

  const SectionHeader = ({ icon, title, count }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#fff4d6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px', color: '#1a1a1a' }}>{title}</Typography>
        <Chip label={count} size="small" sx={{ ml: 1, backgroundColor: '#f0f0f0', color: '#555', fontWeight: 600 }} />
      </Box>
    </Box>
  );

  const VoyageRow = ({ v }) => {
    const temporalStatus = getTemporalStatus(v.date);
    const isExpired = temporalStatus.status === 'expired';
    
    return (
      <>
        <ListItem
          secondaryAction={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip size="small" label={`${v.price} FCFA`} />
              <Chip size="small" label={temporalStatus.label} color={temporalStatus.color} />
            </Box>
          }
          sx={{ 
            '&:hover': { backgroundColor: '#fafafa' }, 
            borderRadius: '10px', 
            px: 1.5,
            opacity: isExpired ? 0.7 : 1,
            backgroundColor: isExpired ? '#fef2f2' : 'transparent'
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: isExpired ? '#fee2e2' : '#ffecb3', color: isExpired ? '#991b1b' : '#995700' }}>
              <DirectionsBusIcon fontSize="small" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography sx={{ fontWeight: 700, color: isExpired ? '#991b1b' : '#1a1a1a' }}>
                {v.from} → {v.to}
                {isExpired && <Chip label="EXPIRÉ" size="small" color="error" sx={{ ml: 1, height: 20, fontSize: '10px' }} />}
              </Typography>
            }
            secondary={
              <Box sx={{ display: 'flex', gap: 2, color: '#6b7280' }}>
                {v.date && <Typography variant="body2">{formatDateShort(v.date)}</Typography>}
                <Typography variant="body2">{v.availableSeats ?? 0} places</Typography>
              </Box>
            }
          />
        </ListItem>
        <Divider component="li" />
      </>
    );
  };

  const ReservationRow = ({ r }) => {
    const reservationDate = r.voyage?.date || r.bus?.departureDate;
    const temporalStatus = getTemporalStatus(reservationDate);
    const isExpired = temporalStatus.status === 'expired';
    
    return (
      <>
        <ListItem
          secondaryAction={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip size="small" label={r.ticket === 'colis' ? 'Colis' : `Place x${r.quantity || 1}`} />
              <Chip size="small" label={temporalStatus.label} color={temporalStatus.color} />
            </Box>
          }
          sx={{ 
            '&:hover': { backgroundColor: '#fafafa' }, 
            borderRadius: '10px', 
            px: 1.5,
            opacity: isExpired ? 0.7 : 1,
            backgroundColor: isExpired ? '#fef2f2' : 'transparent'
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: isExpired ? '#fee2e2' : '#ffecb3', color: isExpired ? '#991b1b' : '#995700' }}>
              <EventSeatIcon fontSize="small" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography sx={{ fontWeight: 700, color: isExpired ? '#991b1b' : '#1a1a1a' }}>
                {r.user?.name || 'Client'}
                {isExpired && <Chip label="EXPIRÉ" size="small" color="error" sx={{ ml: 1, height: 20, fontSize: '10px' }} />}
              </Typography>
            }
            secondary={
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', color: '#6b7280' }}>
                <Typography variant="body2">
                  {r.voyage ? `${r.voyage.from} → ${r.voyage.to}` : r.bus ? `${r.bus.from} → ${r.bus.to}` : '—'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                  {r.voyage ? `${r.voyage.price} FCFA` : r.bus ? `${r.bus.price} FCFA` : '—'}
                </Typography>
                {reservationDate ? (
                  <Typography variant="body2" sx={{ color: isExpired ? '#991b1b' : '#6b7280', fontWeight: isExpired ? 600 : 400 }}>
                    Départ: {formatDateShort(reservationDate)}
                  </Typography>
                ) : (
                  <Chip size="small" label="Date inconnue" color="warning" sx={{ fontSize: '11px' }} />
                )}
                {!r.voyage && !r.bus && (
                  <Chip size="small" label="Voyage supprimé" color="error" sx={{ fontSize: '11px' }} />
                )}
                {r.createdAt && (
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Créée le {formatDateShort(r.createdAt)}</Typography>
                )}
              </Box>
            }
          />
        </ListItem>
        <Divider component="li" />
      </>
    );
  };

  const ColisRow = ({ c }) => {
    const colisDate = c.voyage?.date;
    const temporalStatus = getTemporalStatus(colisDate);
    const isExpired = temporalStatus.status === 'expired';
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'envoyé': return 'info';
        case 'reçu': return 'success';
        case 'annulé': return 'error';
        default: return 'warning';
      }
    };

    const getStatusText = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1);
    };
    
    return (
      <>
        <ListItem
          secondaryAction={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip size="small" label={getStatusText(c.status)} color={getStatusColor(c.status)} />
              <Chip size="small" label={temporalStatus.label} color={temporalStatus.color} />
            </Box>
          }
          sx={{ 
            '&:hover': { backgroundColor: '#fafafa' }, 
            borderRadius: '10px', 
            px: 1.5,
            opacity: isExpired ? 0.7 : 1,
            backgroundColor: isExpired ? '#fef2f2' : 'transparent'
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: isExpired ? '#fee2e2' : '#e3f2fd', color: isExpired ? '#991b1b' : '#1976d2' }}>
              <LocalShippingIcon fontSize="small" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography sx={{ fontWeight: 700, color: isExpired ? '#991b1b' : '#1a1a1a' }}>
                {c.destinataire?.nom || 'Destinataire inconnu'}
                {isExpired && <Chip label="EXPIRÉ" size="small" color="error" sx={{ ml: 1, height: 20, fontSize: '10px' }} />}
              </Typography>
            }
            secondary={
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', color: '#6b7280' }}>
                <Typography variant="body2">
                  {c.voyage ? `${c.voyage.from} → ${c.voyage.to}` : '—'}
                </Typography>
                {c.prix && (
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {c.prix} FCFA
                  </Typography>
                )}
                <Typography variant="body2">
                  📞 {c.destinataire?.telephone}
                </Typography>
                {colisDate ? (
                  <Typography variant="body2" sx={{ color: isExpired ? '#991b1b' : '#6b7280', fontWeight: isExpired ? 600 : 400 }}>
                    Départ: {formatDateShort(colisDate)}
                  </Typography>
                ) : (
                  <Chip size="small" label="Date inconnue" color="warning" sx={{ fontSize: '11px' }} />
                )}
                {c.description && (
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                    {c.description}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
        <Divider component="li" />
      </>
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPaginatedItems = (items) => {
    return items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  };

  const renderSection = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#ffcc33' }} />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
    }

    switch (tab) {
      case 0:
        return (
          <Box>
            <SectionHeader icon={<DirectionsBusIcon />} title="Voyages" count={filteredVoyages.length} />
            <List dense sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #eee', mb: 2 }}>
              {getPaginatedItems(filteredVoyages).map(v => (
                <VoyageRow key={v._id} v={v} />
              ))}
              {filteredVoyages.length === 0 && (
                <ListItem><ListItemText primary="Aucun voyage" /></ListItem>
              )}
            </List>
            <TablePagination
              component="div"
              count={filteredVoyages.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Lignes par page"
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <SectionHeader icon={<EventSeatIcon />} title="Réservations" count={filteredReservations.length} />
            <List dense sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #eee', mb: 2 }}>
              {getPaginatedItems(filteredReservations).map(r => (
                <ReservationRow key={r._id} r={r} />
              ))}
              {filteredReservations.length === 0 && (
                <ListItem><ListItemText primary="Aucune réservation" /></ListItem>
              )}
            </List>
            <TablePagination
              component="div"
              count={filteredReservations.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Lignes par page"
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <SectionHeader icon={<LocalShippingIcon />} title="Colis" count={filteredColis.length} />
            <List dense sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #eee', mb: 2 }}>
              {getPaginatedItems(filteredColis).map(c => (
                <ColisRow key={c._id} c={c} />
              ))}
              {filteredColis.length === 0 && (
                <ListItem><ListItemText primary="Aucun colis" /></ListItem>
              )}
            </List>
            <TablePagination
              component="div"
              count={filteredColis.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Lignes par page"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const stats = useMemo(() => {
    const allItems = [...voyages, ...reservations, ...colis.map(c => ({ ...c, date: c.voyage?.date }))];
    let expired = 0, today = 0, upcoming = 0;
    
    allItems.forEach(item => {
      const date = item.date || item.voyage?.date || item.bus?.departureDate;
      const status = getTemporalStatus(date).status;
      if (status === 'expired') expired++;
      else if (status === 'today') today++;
      else if (status === 'upcoming') upcoming++;
    });
    
    return { expired, today, upcoming, total: allItems.length };
  }, [voyages, reservations, colis]);

  return (
    <Box sx={{ p: 2, backgroundColor: '#ffff', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '22px', color: '#1a1a1a', mb: 0.5 }}>
            Historique
          </Typography>
          <Typography variant="body1" sx={{ color: '#70757a', fontSize: '14px' }}>
            Vue d'ensemble des voyages, réservations et colis
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', backgroundColor: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: '#ffb300' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '16px' }}>Filtres</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tous ({stats.total})</MenuItem>
                <MenuItem value="expired">Expirés ({stats.expired})</MenuItem>
                <MenuItem value="today">Aujourd'hui ({stats.today})</MenuItem>
                <MenuItem value="upcoming">À venir ({stats.upcoming})</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Utilisateur</InputLabel>
              <Select
                value={userFilter}
                label="Utilisateur"
                onChange={(e) => setUserFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <PersonIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">Tous les utilisateurs</MenuItem>
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name} ({user.email || user.numero})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Date de départ"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
        {(statusFilter !== 'all' || userFilter !== 'all' || dateFilter || query) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: '#6b7280', mr: 1 }}>Filtres actifs:</Typography>
            {statusFilter !== 'all' && (
              <Chip 
                label={`Statut: ${statusFilter === 'expired' ? 'Expirés' : statusFilter === 'today' ? "Aujourd'hui" : 'À venir'}`} 
                size="small" 
                onDelete={() => setStatusFilter('all')} 
              />
            )}
            {userFilter !== 'all' && (
              <Chip 
                label={`Utilisateur: ${users.find(u => u._id === userFilter)?.name || 'Inconnu'}`} 
                size="small" 
                onDelete={() => setUserFilter('all')} 
              />
            )}
            {dateFilter && (
              <Chip 
                label={`Date: ${new Date(dateFilter).toLocaleDateString('fr-FR')}`} 
                size="small" 
                onDelete={() => setDateFilter('')} 
              />
            )}
            {query && (
              <Chip 
                label={`Recherche: "${query}"`} 
                size="small" 
                onDelete={() => setQuery('')} 
              />
            )}
          </Box>
        )}
      </Paper>

      <Tabs
        value={tab}
        onChange={(e, v) => {
          setTab(v);
          setPage(0);
        }}
        sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 42 }, '& .MuiTabs-indicator': { backgroundColor: '#ffb300', height: 3 } }}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab label={`Voyages (${filteredVoyages.length})`} />
        <Tab label={`Réservations (${filteredReservations.length})`} />
        <Tab label={`Colis (${filteredColis.length})`} />
      </Tabs>

      {renderSection()}
    </Box>
  );
}