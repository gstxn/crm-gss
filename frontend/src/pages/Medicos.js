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
  Person as PersonIcon,
  LocalHospital as LocalHospitalIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const Medicos = () => {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState({
    especialidade: '',
    cidade: '',
    estado: ''
  });
  const [especialidades, setEspecialidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [paginacao, setPaginacao] = useState({
    total: 0,
    paginas: 0,
    paginaAtual: 1,
    porPagina: 10
  });

  // Buscar médicos com filtros e paginação
  const fetchMedicos = async () => {
    setLoading(true);
    setError(null);

    try {
      let queryParams = `page=${paginacao.paginaAtual}&limit=${paginacao.porPagina}`;
      
      // Adicionar termo de busca se existir
      if (searchTerm) {
        queryParams += `&nome=${searchTerm}`;
      }
      
      // Adicionar filtros se existirem
      if (filtros.especialidade) {
        queryParams += `&especialidade=${filtros.especialidade}`;
      }
      
      if (filtros.cidade) {
        queryParams += `&cidade=${filtros.cidade}`;
      }
      
      if (filtros.estado) {
        queryParams += `&estado=${filtros.estado}`;
      }
      
      const response = await axios.get(`/api/medicos?${queryParams}`);
      setMedicos(response.data.medicos);
      setPaginacao(response.data.paginacao);
    } catch (err) {
      setError('Erro ao carregar médicos. Por favor, tente novamente.');
      console.error('Erro ao carregar médicos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados iniciais
  useEffect(() => {
    const fetchDadosIniciais = async () => {
      try {
        // Buscar especialidades
        const especialidadesResponse = await axios.get('/api/especialidades');
        setEspecialidades(especialidadesResponse.data || []);

        // Buscar estados
        const estadosResponse = await axios.get('/api/estados');
        setEstados(estadosResponse.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    };

    fetchDadosIniciais();
  }, []);

  // Buscar cidades quando o estado for selecionado
  useEffect(() => {
    const fetchCidades = async () => {
      if (!filtros.estado) {
        setCidades([]);
        return;
      }

      try {
        const response = await axios.get(`/api/cidades/${filtros.estado}`);
        setCidades(response.data || []);
      } catch (err) {
        console.error('Erro ao carregar cidades:', err);
      }
    };

    fetchCidades();
  }, [filtros.estado]);

  // Buscar médicos quando os filtros ou paginação mudarem
  useEffect(() => {
    fetchMedicos();
  }, [paginacao.paginaAtual, filtros]);

  // Lidar com a pesquisa
  const handleSearch = (e) => {
    e.preventDefault();
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    fetchMedicos();
  };

  // Lidar com mudanças nos filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));

    // Resetar cidade se o estado mudar
    if (name === 'estado') {
      setFiltros(prev => ({
        ...prev,
        cidade: ''
      }));
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    fetchMedicos();
    setShowFilters(false);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      especialidade: '',
      cidade: '',
      estado: ''
    });
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    fetchMedicos();
    setShowFilters(false);
  };

  // Mudar página
  const mudarPagina = (pagina) => {
    if (pagina < 1 || pagina > paginacao.paginas) return;
    setPaginacao(prev => ({ ...prev, paginaAtual: pagina }));
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
          <LocalHospitalIcon sx={{ fontSize: 40 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Médicos
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/medicos/novo"
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
          Novo Médico
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar médicos por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            onClick={handleSearch}
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
                <InputLabel>Especialidade</InputLabel>
                <Select
                  name="especialidade"
                  value={filtros.especialidade}
                  onChange={handleFiltroChange}
                  label="Especialidade"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {especialidades.map((esp) => (
                    <MenuItem key={esp._id || esp} value={esp.nome || esp}>
                      {esp.nome || esp}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={filtros.estado}
                  onChange={handleFiltroChange}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {estados.map((estado) => (
                    <MenuItem key={estado.sigla || estado} value={estado.sigla || estado}>
                      {estado.nome || estado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!filtros.estado}>
                <InputLabel>Cidade</InputLabel>
                <Select
                  name="cidade"
                  value={filtros.cidade}
                  onChange={handleFiltroChange}
                  label="Cidade"
                >
                  <MenuItem value="">
                    {!filtros.estado ? 'Selecione um estado primeiro' : 'Todas'}
                  </MenuItem>
                  {cidades.map((cidade) => (
                    <MenuItem key={cidade.nome || cidade} value={cidade.nome || cidade}>
                      {cidade.nome || cidade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Button
              onClick={aplicarFiltros}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #4CAF50 60%, #45a049 100%)',
                }
              }}
            >
              Aplicar Filtros
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
            Carregando médicos...
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
            onClick={fetchMedicos}
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
      ) : medicos.length === 0 ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
        }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum médico encontrado. Tente ajustar os filtros ou adicione um novo médico.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {medicos.map((medico) => (
            <Grid item xs={12} md={6} lg={4} key={medico._id}>
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
                      <PersonIcon />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {medico.nome}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocalHospitalIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>CRM:</strong> {medico.crm}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={medico.especialidade}
                        size="small"
                        sx={{
                          background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {medico.cidade}/{medico.estado}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {medico.telefone}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {medico.email}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button
                      component={Link}
                      to={`/medicos/${medico._id}`}
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

      {!loading && !error && medicos.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 4 
        }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Pagination
                count={paginacao.paginas}
                page={paginacao.paginaAtual}
                onChange={(event, page) => mudarPagina(page)}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    '&:hover': {
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      color: 'white'
                    }
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Página {paginacao.paginaAtual} de {paginacao.paginas}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default Medicos;