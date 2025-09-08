import React from 'react';
import { Box, Paper, Button, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const StyledPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  sx = {} 
}) => {
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, ...sx }}>
      <Paper sx={{
        p: 2,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(45deg, #f5f5f5 30%, #e0e0e0 90%)'
              },
              '&:disabled': {
                opacity: 0.5
              }
            }}
          >
            Anterior
          </Button>
          
          <Typography variant="body1" sx={{ mx: 2, fontWeight: 'medium', minWidth: '120px', textAlign: 'center' }}>
            Página {currentPage} de {totalPages}
          </Typography>
          
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(45deg, #f5f5f5 30%, #e0e0e0 90%)'
              },
              '&:disabled': {
                opacity: 0.5
              }
            }}
          >
            Próxima
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default StyledPagination;