import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Collapse,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import ImportacaoBotoes from '../components/ImportacaoBotoes';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [busca, setBusca] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Lista de estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
  ];
  
  // Tipos de cliente
  const tiposCliente = ['Hospital', 'Clínica', 'Outro'];
  
  // Função para carregar os clientes
  const carregarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir parâmetros de consulta
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (busca) params.nome = busca;
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroCidade) params.cidade = filtroCidade;
      
      const response = await axios.get('/api/clientes', { params });
      
      setClientes(response.data.clientes);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Não foi possível carregar os clientes. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar clientes na montagem do componente e quando os filtros mudarem
  useEffect(() => {
    carregarClientes();
  }, [pagination.page, filtroTipo, filtroEstado, filtroCidade]);
  
  // Função para lidar com a pesquisa
  const handlePesquisar = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // Voltar para a primeira página
    carregarClientes();
  };
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroTipo('');
    setFiltroEstado('');
    setFiltroCidade('');
    setBusca('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // Função para mudar de página
  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: novaPagina }));
    }
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 3,
        p: 3,
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon sx={{ fontSize: 40 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Clientes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ImportacaoBotoes />
          <Button
            component={Link}
            to="/clientes/novo"
            variant="contained"
            startIcon={<PersonAddIcon />}
            sx={{
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(255, 105, 135, .4)'
              }
            }}
          >
            Novo Cliente
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
            variant="outlined"
          />
          <Button
            onClick={handlePesquisar}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #2196F3 60%, #21CBF3 100%)',
              }
            }}
          >
            Buscar
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outlined"
            startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ borderColor: '#667eea', color: '#667eea' }}
          >
            Filtros
          </Button>
        </Box>
      </Paper>
      
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#333', fontWeight: 'bold' }}>
            Filtros Avançados
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {tiposCliente.map(tipo => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {estados.map(estado => (
                    <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cidade"
                placeholder="Filtrar por cidade"
                value={filtroCidade}
                onChange={(e) => setFiltroCidade(e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              onClick={limparFiltros}
              variant="outlined"
              sx={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}
            >
              Limpar Filtros
            </Button>
          </Box>
        </Paper>
      </Collapse>
      
      {loading ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
        }}>
          <Typography variant="h6" color="primary">
            Carregando clientes...
          </Typography>
        </Paper>
      ) : error ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
        }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button 
            onClick={carregarClientes}
            variant="contained"
            color="error"
            sx={{
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, .4)'
              }
            }}
          >
            Tentar Novamente
          </Button>
        </Paper>
      ) : clientes.length === 0 ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
        }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum cliente encontrado.
            {(filtroTipo || filtroEstado || filtroCidade || busca) && (
              <span> Tente remover alguns filtros.</span>
            )}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {clientes.map(cliente => (
            <Grid item xs={12} md={6} lg={4} key={cliente._id}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: 'primary.main', 
                      mr: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                    }}>
                      <BusinessIcon />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {cliente.nome}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={cliente.tipo}
                        size="small"
                        sx={{
                          background: 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {cliente.endereco?.cidade}, {cliente.endereco?.estado}
                      </Typography>
                    </Box>
                    
                    {cliente.contatos && cliente.contatos.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Contato:</strong> {cliente.contatos.find(c => c.principal)?.nome || cliente.contatos[0].nome}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Oportunidades:</strong> {cliente.oportunidades?.length || 0}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button
                      component={Link}
                      to={`/clientes/${cliente._id}`}
                      variant="contained"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #2196F3 60%, #21CBF3 100%)',
                        }
                      }}
                    >
                      Ver Detalhes
                    </Button>
                    
                    <IconButton
                      size="small"
                      sx={{ color: '#666' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Paginação */}
      {!loading && !error && pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Paper sx={{
            p: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                onClick={() => mudarPagina(pagination.page - 1)}
                disabled={pagination.page === 1}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #f5f5f5 30%, #e0e0e0 90%)'
                  }
                }}
              >
                Anterior
              </Button>
              
              <Typography variant="body1" sx={{ mx: 2, fontWeight: 'medium' }}>
                Página {pagination.page} de {pagination.pages}
              </Typography>
              
              <Button
                onClick={() => mudarPagina(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #f5f5f5 30%, #e0e0e0 90%)'
                  }
                }}
              >
                Próxima
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default Clientes;