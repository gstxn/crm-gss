import React from 'react';
import { Paper, Typography, CircularProgress, Box } from '@mui/material';

const LoadingState = ({ 
  message = "Carregando...",
  size = 40,
  sx = {} 
}) => {
  return (
    <Paper sx={{
      p: 4,
      textAlign: 'center',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      ...sx
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <CircularProgress 
          size={size} 
          sx={{
            color: '#667eea'
          }}
        />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Paper>
  );
};

export default LoadingState;