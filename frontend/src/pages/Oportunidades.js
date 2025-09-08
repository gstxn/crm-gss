import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
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
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import Filters from '../components/Filters';

// Componente separado para o card da oportunidade
const OportunidadeCard = ({ oportunidade }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Aberta': return { bg: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)', color: 'white' };
      case 'Em andamento': return { bg: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)', color: 'white' };
      case 'Preenchida': return { bg: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)', color: 'white' };
      case 'Cancelada': return { bg: 'linear-gradient(45deg, #f44336 30%, #e57373 90%)', color: 'white' };
      default: return { bg: '#e0e0e0', color: 'black' };
    }
  };
  
  return (
    <Grid item xs={12} sm={6} lg={4}>
      <Card sx={{
        borderRadius: 3,
        boxShadow: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 6
        },
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', flexGrow: 1, mr: 1 }}>
              {oportunidade.titulo}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={oportunidade.status}
                sx={{
                  background: getStatusColor(oportunidade.status).bg,
                  color: getStatusColor(oportunidade.status).color,
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem component={Link} to={`/oportunidades/${oportunidade._id}`}>
                  Ver Detalhes
                </MenuItem>
                <MenuItem component={Link} to={`/oportunidades/${oportunidade._id}/editar`}>
                  Editar
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Cliente:</strong> {oportunidade.cliente?.nome || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Especialidade:</strong> {oportunidade.especialidade}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Local:</strong> {oportunidade.endereco?.cidade}, {oportunidade.endereco?.estado}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Valor:</strong> R$ {oportunidade.valor?.toLocaleString('pt-BR') || '0'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Criada em: {new Date(oportunidade.createdAt).toLocaleDateString('pt-BR')}
            </Typography>
            <Button
              component={Link}
              to={`/oportunidades/${oportunidade._id}`}
              variant="contained"
              size="small"
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                }
              }}
            >
              Ver Detalhes
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

const Oportunidades = () => {
  const handleApplyFilters = (f) => {
    setFiltros({
      status: f.status,
      especialidade: f.especialidade,
      cidade: f.cidade,
      estado: f.uf
    });
    setBusca(f.q);
    setPaginacao(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleResetFilters = () => {
    setFiltros({ status: 'todos', especialidade: 'todas', cidade: 'todas', estado: 'todas' });
    setBusca('');
    setPaginacao(prev => ({ ...prev, currentPage: 1 }));
  };
  const [oportunidades, setOportunidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    status: '',
    especialidade: '',
    cidade: '',
    estado: ''
  });
  const [busca, setBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [paginacao, setPaginacao] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [especialidades, setEspecialidades] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);

  // Buscar oportunidades
  const buscarOportunidades = async () => {
    setLoading(true);
    try {
      let queryParams = `page=${paginacao.currentPage}&limit=10`;
      
      // Adicionar filtros à query
      if (filtros.status && filtros.status !== 'todos') queryParams += `&status=${filtros.status}`;
      if (filtros.especialidade && filtros.especialidade !== 'todas') queryParams += `&especialidade=${filtros.especialidade}`;
      if (filtros.cidade && filtros.cidade !== 'todas') queryParams += `&cidade=${filtros.cidade}`;
      if (filtros.estado && filtros.estado !== 'todas') queryParams += `&estado=${filtros.estado}`;
      
      // Adicionar busca à query se existir
      if (busca) queryParams += `&busca=${busca}`;
      
      const response = await axios.get(`/api/oportunidades?${queryParams}`);
      
      setOportunidades(response.data.oportunidades);
      setPaginacao({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
      
      // Extrair listas únicas para os filtros
      if (response.data.oportunidades.length > 0) {
        const especialidadesUnicas = [...new Set(response.data.oportunidades.map(o => o.especialidade))];
        const cidadesUnicas = [...new Set(response.data.oportunidades.map(o => o.local.cidade))];
        const estadosUnicos = [...new Set(response.data.oportunidades.map(o => o.local.estado))];
        
        setEspecialidades(especialidadesUnicas);
        setCidades(cidadesUnicas);
        setEstados(estadosUnicos);
      }
      
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar oportunidades:', err);
      setError('Falha ao carregar oportunidades. Por favor, tente novamente.');
      toast.error('Erro ao carregar oportunidades');
    } finally {
      setLoading(false);
    }
  };

  // Carregar oportunidades ao montar o componente ou quando os filtros/paginação mudarem
  useEffect(() => {
    buscarOportunidades();
  }, [paginacao.currentPage, filtros]);

  // Lidar com a mudança de página
  const mudarPagina = (pagina) => {
    if (pagina < 1 || pagina > paginacao.totalPages) return;
    setPaginacao(prev => ({ ...prev, currentPage: pagina }));
  };

  // Lidar com a aplicação de filtros
  const aplicarFiltros = (e) => {
    e.preventDefault();
    setPaginacao(prev => ({ ...prev, currentPage: 1 })); // Voltar para a primeira página
    setMostrarFiltros(false); // Fechar o painel de filtros
  };

  // Lidar com a busca
  const aplicarBusca = (e) => {
    e.preventDefault();
    buscarOportunidades();
  };

  // Formatar data
  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Obter classe CSS baseada no status
  const getStatusClass = (status) => {
    switch (status) {
      case 'Aberta': return 'status-aberta';
      case 'Em andamento': return 'status-andamento';
      case 'Preenchida': return 'status-preenchida';
      case 'Cancelada': return 'status-cancelada';
      default: return '';
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
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Oportunidades
        </Typography>
        <Button
          component={Link}
          to="/oportunidades/nova"
          variant="contained"
          startIcon={<AddIcon />}
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
          Nova Oportunidade
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar oportunidades..."
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
            onClick={aplicarBusca}
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
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            variant="outlined"
            startIcon={mostrarFiltros ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ borderColor: '#667eea', color: '#667eea' }}
          >
            Filtros
          </Button>
        </Box>
      </Paper>

      {/* Filtros avançados */}
      <Filters onApply={handleApplyFilters} onReset={handleResetFilters} />

      <Collapse in={mostrarFiltros}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#667eea', fontWeight: 'bold' }}>
            Filtros Avançados
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtros.status}
                  label="Status"
                  onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Aberta">Aberta</MenuItem>
                  <MenuItem value="Em andamento">Em andamento</MenuItem>
                  <MenuItem value="Preenchida">Preenchida</MenuItem>
                  <MenuItem value="Cancelada">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Especialidade</InputLabel>
                <Select
                  value={filtros.especialidade}
                  label="Especialidade"
                  onChange={(e) => setFiltros({...filtros, especialidade: e.target.value})}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {especialidades.map((esp, index) => (
                    <MenuItem key={index} value={esp}>{esp}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.estado}
                  label="Estado"
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {estados.map((estado, index) => (
                    <MenuItem key={index} value={estado}>{estado}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Cidade</InputLabel>
                <Select
                  value={filtros.cidade}
                  label="Cidade"
                  onChange={(e) => setFiltros({...filtros, cidade: e.target.value})}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {cidades.map((cidade, index) => (
                    <MenuItem key={index} value={cidade}>{cidade}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setFiltros({
                  status: '',
                  especialidade: '',
                  cidade: '',
                  estado: ''
                });
                setPaginacao(prev => ({ ...prev, currentPage: 1 }));
              }}
              sx={{ borderColor: '#667eea', color: '#667eea' }}
            >
              Limpar
            </Button>
            <Button
              variant="contained"
              onClick={aplicarFiltros}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                }
              }}
            >
              Aplicar
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {loading ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary">
            Carregando oportunidades...
          </Typography>
        </Paper>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={buscarOportunidades}
            sx={{
              background: 'linear-gradient(45deg, #f44336 30%, #e57373 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #f44336 60%, #e57373 100%)',
              }
            }}
          >
            Tentar novamente
          </Button>
        </Paper>
      ) : oportunidades.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Nenhuma oportunidade encontrada.
          </Typography>
          {Object.values(filtros).some(f => f !== '') && (
            <Typography variant="body2" color="text.secondary">
              Tente ajustar os filtros para ver mais resultados.
            </Typography>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {oportunidades.map((oportunidade) => (
              <OportunidadeCard key={oportunidade._id} oportunidade={oportunidade} />
            ))}
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4 }}>
            <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Pagination
                  count={paginacao.totalPages}
                  page={paginacao.currentPage}
                  onChange={(event, page) => mudarPagina(page)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      '&.Mui-selected': {
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                        }
                      }
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {paginacao.total} resultados
                </Typography>
              </Box>
            </Paper>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Oportunidades;