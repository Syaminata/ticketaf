import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirmation de suppression",
  message = "Êtes-vous sûr de vouloir supprimer cet élément ?",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  type = "delete", // "delete", "warning", "info"
  loading = false
}) => {
  
  const getConfirmButtonColor = () => {
    switch (type) {
      case 'delete':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#f8f9fa',
        color: '#f80202ff',
        fontWeight: 700,
        fontSize: '18px',
        textAlign: 'center',
        py: 1
      }}>
        {title}
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: 3,
        backgroundColor: '#ffffff',
        textAlign: 'center'
      }}>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#333',
            fontSize: '15px',
            lineHeight: 1.6
          }}
        >
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 1, 
        backgroundColor: '#f8f9fa',
        gap: 2,
        borderTop: '1px solid #e0e0e0'
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            color: '#666666',
            borderColor: '#ddd',
            fontWeight: 600,
            textTransform: 'none',
            px: 4,
            py: 1,
            borderRadius: '12px',
            '&:hover': {
              borderColor: '#999',
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color={getConfirmButtonColor()}
          disabled={loading}
          sx={{
            fontWeight: 600,
            textTransform: 'none',
            px: 4,
            py: 1.5,
            borderRadius: '12px',
            boxShadow: type === 'delete' 
              ? '0 4px 12px rgba(244, 67, 54, 0.3)'
              : '0 4px 12px rgba(255, 152, 0, 0.3)',
            '&:hover': {
              boxShadow: type === 'delete' 
                ? '0 6px 16px rgba(244, 67, 54, 0.4)'
                : '0 6px 16px rgba(255, 152, 0, 0.4)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? "Suppression..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
