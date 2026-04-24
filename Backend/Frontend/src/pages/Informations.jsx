import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import {
  Box, Typography, TextField, Button, CircularProgress, Alert, Paper, Tabs, Tab, Divider,
  List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, Tooltip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const KEYS = {
  privacy_policy: { label: 'Politique de confidentialité', icon: <LockIcon />, placeholder: 'Saisissez ici la politique de confidentialité de l\'application…' },
  about_app:      { label: 'À propos de l\'application',   icon: <InfoIcon />, placeholder: 'Saisissez ici les informations « À propos » de l\'application…' },
};

// ─── Content Section (privacy / about) ───────────────────────────────────────
function ContentSection({ contentKey, meta, token }) {
  const [content, setContent] = useState('');
  const [title, setTitle]     = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [alert, setAlert]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setAlert(null);
    axios.get(`/app-content/${contentKey}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setTitle(res.data.title ?? '');
      setContent(res.data.content ?? '');
    })
    .catch(() => setAlert({ type: 'error', msg: 'Erreur lors du chargement du contenu.' }))
    .finally(() => setLoading(false));
  }, [contentKey, token]);

  const handleSave = () => {
    setSaving(true);
    setAlert(null);
    axios.put(
      `/app-content/${contentKey}`,
      { title, content },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(() => setAlert({ type: 'success', msg: 'Contenu enregistré avec succès.' }))
    .catch(() => setAlert({ type: 'error', msg: 'Erreur lors de la sauvegarde. Vérifiez votre connexion.' }))
    .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#b6660abd' }} />
      </Box>
    );
  }

  return (
    <Box>
      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 3, borderRadius: '8px' }}>
          {alert.msg}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.75, fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>
          Titre affiché dans l'application
        </Typography>
        <TextField
          value={title}
          onChange={e => setTitle(e.target.value)}
          fullWidth size="small"
          placeholder="Ex : Politique de confidentialité"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 15, '&.Mui-focused fieldset': { borderColor: '#b6660abd' } } }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.75, fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>
          Contenu
        </Typography>
        <TextField
          value={content}
          onChange={e => setContent(e.target.value)}
          fullWidth multiline minRows={18} maxRows={40}
          placeholder={meta.placeholder}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 14, lineHeight: 1.7, alignItems: 'flex-start', '&.Mui-focused fieldset': { borderColor: '#b6660abd' } },
            '& .MuiInputBase-inputMultiline': { resize: 'vertical', overflow: 'auto', wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
          }}
        />
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
          {content.length} caractère{content.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveIcon />}
          disabled={saving}
          onClick={handleSave}
          sx={{
            backgroundColor: '#b6660abd', color: '#fff', borderRadius: '8px',
            textTransform: 'none', fontWeight: 600, px: 4, py: 1.2,
            '&:hover': { backgroundColor: '#9e5500cc' },
            '&.Mui-disabled': { backgroundColor: '#ccc', color: '#fff' },
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {saving && <Typography variant="caption" color="text.secondary">Sauvegarde en cours…</Typography>}
      </Box>
    </Box>
  );
}

// ─── FAQ Dialog ───────────────────────────────────────────────────────────────
function FaqDialog({ open, onClose, onSave, initial }) {
  const [question, setQuestion]           = useState('');
  const [answer, setAnswer]               = useState('');
  const [isActive, setIsActive]           = useState(true);
  const [targetAudience, setTargetAudience] = useState('all');

  useEffect(() => {
    if (open) {
      setQuestion(initial?.question ?? '');
      setAnswer(initial?.answer ?? '');
      setIsActive(initial?.isActive ?? true);
      setTargetAudience(initial?.targetAudience ?? 'all');
    }
  }, [open, initial]);

  const valid = question.trim() && answer.trim();

  const audienceLabels = { all: 'Tous', client: 'App Client', conducteur: 'App Chauffeur' };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {initial ? 'Modifier la FAQ' : 'Ajouter une FAQ'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Question" value={question} onChange={e => setQuestion(e.target.value)}
            fullWidth size="small" multiline minRows={1} maxRows={4} required
            sx={{
              '& .MuiInputLabel-root': { color: '#555' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#9e5500' },
              '& .MuiOutlinedInput-root': { borderRadius: '8px', '&.Mui-focused fieldset': { borderColor: '#b6660abd' } },
              '& .MuiInputBase-inputMultiline': { overflow: 'auto', wordBreak: 'break-word' },
            }}
          />
          <TextField
            label="Réponse" value={answer} onChange={e => setAnswer(e.target.value)}
            fullWidth multiline minRows={4} maxRows={10} required
            sx={{
              '& .MuiInputLabel-root': { color: '#555' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#9e5500' },
              '& .MuiOutlinedInput-root': { borderRadius: '8px', alignItems: 'flex-start', '&.Mui-focused fieldset': { borderColor: '#b6660abd' } },
              '& .MuiInputBase-inputMultiline': { overflow: 'auto', wordBreak: 'break-word' },
            }}
          />
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1, fontSize: 13, color: '#555' }}>
              Afficher dans
            </Typography>
            <ToggleButtonGroup
              value={targetAudience}
              exclusive
              onChange={(_, val) => { if (val) setTargetAudience(val); }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': { textTransform: 'none', fontSize: 13, px: 2, borderRadius: '8px !important', mx: 0.5, border: '1px solid #ddd !important' },
                '& .MuiToggleButton-root.Mui-selected': { backgroundColor: '#b6660a22', color: '#9e5500', borderColor: '#b6660abd !important', fontWeight: 700 },
              }}
            >
              {Object.entries(audienceLabels).map(([val, lbl]) => (
                <ToggleButton key={val} value={val}>{lbl}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#b6660abd' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#b6660abd' } }}
              />
            }
            label={<Typography variant="body2">{isActive ? 'Visible dans l\'app' : 'Masquée dans l\'app'}</Typography>}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#666' }}>Annuler</Button>
        <Button
          variant="contained" disabled={!valid}
          onClick={() => onSave({ question: question.trim(), answer: answer.trim(), isActive, targetAudience })}
          sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: '#b6660abd', '&:hover': { backgroundColor: '#9e5500cc' }, '&.Mui-disabled': { backgroundColor: '#ccc' } }}
        >
          {initial ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────
function FaqSection({ token }) {
  const [faqs, setFaqs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);
  const [dialog, setDialog]   = useState({ open: false, faq: null });
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    axios.get('/faqs/admin', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setFaqs(res.data.data ?? []))
      .catch(() => setAlert({ type: 'error', msg: 'Erreur lors du chargement des FAQs.' }))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleSave = async (data) => {
    try {
      if (dialog.faq) {
        await axios.put(`/faqs/${dialog.faq._id}`, data, { headers: { Authorization: `Bearer ${token}` } });
        setAlert({ type: 'success', msg: 'FAQ mise à jour.' });
      } else {
        await axios.post('/faqs', data, { headers: { Authorization: `Bearer ${token}` } });
        setAlert({ type: 'success', msg: 'FAQ ajoutée.' });
      }
      setDialog({ open: false, faq: null });
      load();
    } catch {
      setAlert({ type: 'error', msg: 'Erreur lors de la sauvegarde.' });
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await axios.delete(`/faqs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAlert({ type: 'success', msg: 'FAQ supprimée.' });
      load();
    } catch {
      setAlert({ type: 'error', msg: 'Erreur lors de la suppression.' });
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (faq) => {
    try {
      await axios.put(`/faqs/${faq._id}`, { isActive: !faq.isActive }, { headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch {
      setAlert({ type: 'error', msg: 'Erreur lors de la mise à jour.' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#b6660abd' }} />
      </Box>
    );
  }

  return (
    <Box>
      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 3, borderRadius: '8px' }}>
          {alert.msg}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {faqs.length} question{faqs.length !== 1 ? 's' : ''} — les questions visibles apparaissent dans l'app
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ open: true, faq: null })}
          sx={{
            textTransform: 'none', fontWeight: 600, borderRadius: '8px',
            backgroundColor: '#b6660abd', '&:hover': { backgroundColor: '#9e5500cc' },
          }}
        >
          Ajouter une FAQ
        </Button>
      </Box>

      {faqs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <HelpOutlineIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography variant="body2">Aucune FAQ pour l'instant.</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {faqs.map((faq, idx) => (
            <React.Fragment key={faq._id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  px: 2, py: 1.5,
                  borderRadius: '8px',
                  opacity: faq.isActive ? 1 : 0.5,
                  '&:hover': { backgroundColor: '#f9f9f9' },
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title={faq.isActive ? 'Visible' : 'Masquée'}>
                      <Switch
                        size="small"
                        checked={faq.isActive}
                        onChange={() => toggleActive(faq)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#b6660abd' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#b6660abd' },
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton size="small" onClick={() => setDialog({ open: true, faq })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        disabled={deleting === faq._id}
                        onClick={() => handleDelete(faq._id)}
                        sx={{ color: '#d32f2f' }}
                      >
                        {deleting === faq._id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pr: 14 }}>
                  <DragIndicatorIcon sx={{ color: '#bbb', mt: 0.3, fontSize: 18 }} />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1" fontWeight={600} sx={{ fontSize: 14 }}>
                          {faq.question}
                        </Typography>
                        <Box component="span" sx={{
                          fontSize: 11, fontWeight: 700, px: 1, py: 0.2, borderRadius: '6px',
                          backgroundColor: faq.targetAudience === 'conducteur' ? '#e3f2fd' : faq.targetAudience === 'client' ? '#fce4ec' : '#f3e5f5',
                          color: faq.targetAudience === 'conducteur' ? '#1565c0' : faq.targetAudience === 'client' ? '#c62828' : '#6a1b9a',
                        }}>
                          {faq.targetAudience === 'conducteur' ? 'Chauffeur' : faq.targetAudience === 'client' ? 'Client' : 'Tous'}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
                        {faq.answer.length > 120 ? faq.answer.substring(0, 120) + '…' : faq.answer}
                      </Typography>
                    }
                  />
                </Box>
              </ListItem>
              {idx < faqs.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      <FaqDialog
        open={dialog.open}
        initial={dialog.faq}
        onClose={() => setDialog({ open: false, faq: null })}
        onSave={handleSave}
      />
    </Box>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Informations() {
  const token = sessionStorage.getItem('token');
  const [tab, setTab] = useState(0);
  const keys = Object.keys(KEYS);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1a1a1a">
          Informations de l'application
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Gérez les contenus affichés dans l'application mobile (confidentialité, à propos, FAQ).
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: '12px' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid #e0e0e0',
            px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 54, fontSize: 14 },
            '& .Mui-selected': { color: '#b6660abd' },
            '& .MuiTabs-indicator': { backgroundColor: '#b6660abd' },
          }}
        >
          {keys.map(k => (
            <Tab key={k} icon={KEYS[k].icon} iconPosition="start" label={KEYS[k].label} />
          ))}
          <Tab icon={<HelpOutlineIcon />} iconPosition="start" label="FAQ Centre d'aide" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {keys.map((k, i) =>
            tab === i ? (
              <ContentSection key={k} contentKey={k} meta={KEYS[k]} token={token} />
            ) : null
          )}
          {tab === keys.length && <FaqSection token={token} />}
        </Box>
      </Paper>
    </Box>
  );
}
