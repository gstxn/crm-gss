import React from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import GradientButton from './GradientButton';

const ErrorState = ({ 
  message = "Erro ao carregar dados",
  onRetry,
  retryText = "Tentar Novamente",
  sx = {} 
}) => {
  return (
    <Paper sx={{
      p: 4,
      textAlign: 'center',
      background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: '1px solid rgba(244, 67, 54, 0.1)',
      ...sx
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <ErrorIcon sx={{ fontSize: 48, color: '#f44336', mb: 1 }} />
        
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f', mb: 1 }}>
          Oops! Algo deu errado
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>
        
        {onRetry && (
          <GradientButton
            onClick={onRetry}
            startIcon={<RefreshIcon />}
            gradient="linear-gradient(45deg, #f44336 30%, #d32f2f 90%)"
            hoverGradient="linear-gradient(45deg, #f44336 60%, #d32f2f 100%)"
          >
            {retryText}
          </GradientButton>
        )}
      </Box>
    </Paper>
  );
};

export default ErrorState;