import React from 'react';
import { Button } from '@mui/material';

const GradientButton = ({ 
  children, 
  variant = 'contained',
  gradient = 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  hoverGradient = 'linear-gradient(45deg, #2196F3 60%, #21CBF3 100%)',
  sx = {},
  ...props 
}) => {
  const defaultSx = {
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 'medium',
    ...(variant === 'contained' && {
      background: gradient,
      '&:hover': {
        background: hoverGradient,
      }
    }),
    ...sx
  };

  return (
    <Button variant={variant} sx={defaultSx} {...props}>
      {children}
    </Button>
  );
};

// Variações pré-definidas
export const PrimaryGradientButton = (props) => (
  <GradientButton 
    gradient="linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)"
    hoverGradient="linear-gradient(45deg, #2196F3 60%, #21CBF3 100%)"
    {...props} 
  />
);

export const SuccessGradientButton = (props) => (
  <GradientButton 
    gradient="linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)"
    hoverGradient="linear-gradient(45deg, #4CAF50 60%, #8BC34A 100%)"
    {...props} 
  />
);

export const WarningGradientButton = (props) => (
  <GradientButton 
    gradient="linear-gradient(45deg, #FF9800 30%, #F57C00 90%)"
    hoverGradient="linear-gradient(45deg, #FF9800 60%, #F57C00 100%)"
    {...props} 
  />
);

export const DangerGradientButton = (props) => (
  <GradientButton 
    gradient="linear-gradient(45deg, #f44336 30%, #d32f2f 90%)"
    hoverGradient="linear-gradient(45deg, #f44336 60%, #d32f2f 100%)"
    {...props} 
  />
);

export default GradientButton;