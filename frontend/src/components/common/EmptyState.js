import React from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import { Inbox as InboxIcon, Add as AddIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import GradientButton from './GradientButton';

const EmptyState = ({ 
  title = "Nenhum item encontrado",
  message = "Não há dados para exibir no momento.",
  actionButton,
  icon: CustomIcon,
  sx = {} 
}) => {
  const Icon = CustomIcon || InboxIcon;
  
  return (
    <Paper sx={{
      p: 4,
      textAlign: 'center',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: '1px solid rgba(0,0,0,0.05)',
      ...sx
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Icon sx={{ fontSize: 64, color: '#9e9e9e', mb: 1 }} />
        
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
          {title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 400 }}>
          {message}
        </Typography>
        
        {actionButton && (
          <GradientButton
            component={actionButton.to ? Link : Button}
            to={actionButton.to}
            onClick={actionButton.onClick}
            startIcon={actionButton.icon || <AddIcon />}
            gradient="linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)"
            hoverGradient="linear-gradient(45deg, #2196F3 60%, #21CBF3 100%)"
          >
            {actionButton.text}
          </GradientButton>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState;