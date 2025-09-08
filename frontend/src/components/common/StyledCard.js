import React from 'react';
import { Card, CardContent, Box } from '@mui/material';

const StyledCard = ({ 
  children, 
  hover = true, 
  gradient = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  sx = {},
  ...props 
}) => {
  const defaultSx = {
    borderRadius: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    background: gradient,
    transition: 'all 0.3s ease',
    ...(hover && {
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
      }
    }),
    ...sx
  };

  return (
    <Card sx={defaultSx} {...props}>
      {children}
    </Card>
  );
};

export default StyledCard;