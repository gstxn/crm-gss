import React from 'react';
import {
  Collapse,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Button
} from '@mui/material';
import { Clear as ClearIcon, Check as CheckIcon } from '@mui/icons-material';
import GradientButton from './GradientButton';

const FilterPanel = ({ 
  open, 
  filters = [], 
  onClear, 
  onApply,
  title = "Filtros"
}) => {
  return (
    <Collapse in={open}>
      <Paper sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
          {title}
        </Typography>
        
        <Grid container spacing={3}>
          {filters.map((filter, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              {filter.type === 'select' ? (
                <FormControl fullWidth>
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={filter.value}
                    onChange={filter.onChange}
                    label={filter.label}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    {filter.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label={filter.label}
                  value={filter.value}
                  onChange={filter.onChange}
                  placeholder={filter.placeholder}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />
              )}
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            onClick={onClear}
            startIcon={<ClearIcon />}
            sx={{
              borderRadius: 2,
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Limpar Filtros
          </Button>
          
          <GradientButton
            onClick={onApply}
            startIcon={<CheckIcon />}
            gradient="linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)"
            hoverGradient="linear-gradient(45deg, #4CAF50 60%, #8BC34A 100%)"
          >
            Aplicar Filtros
          </GradientButton>
        </Box>
      </Paper>
    </Collapse>
  );
};

export default FilterPanel;