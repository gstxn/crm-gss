import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import GradientButton from './GradientButton';

const PageHeader = ({ 
  title, 
  icon: Icon, 
  actionButton, 
  children,
  sx = {} 
}) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
      p: 3,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      color: 'white',
      ...sx
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <Icon sx={{ 
            fontSize: 32, 
            mr: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }} />
        )}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {title}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {children}
        {actionButton && (
          <GradientButton
            component={Link}
            to={actionButton.to}
            startIcon={actionButton.icon}
            gradient="linear-gradient(45deg, #ffffff 30%, #f8f9fa 90%)"
            hoverGradient="linear-gradient(45deg, #f8f9fa 30%, #e9ecef 90%)"
            sx={{
              color: '#333',
              fontWeight: 'bold',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              }
            }}
          >
            {actionButton.text}
          </GradientButton>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;