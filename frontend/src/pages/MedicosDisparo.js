import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Snackbar,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  LinearProgress,
  CardHeader,
  Collapse,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Sync as SyncIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Block as BlockIcon,
  Queue as QueueIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocalHospital as HospitalIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  GetApp as GetAppIcon,
  CloudSync as CloudSyncIcon,
  UploadFile as UploadFileIcon,
  CloudUpload as CloudUploadIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  PauseCircle as PauseCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';

const MedicosDisparo = () => {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState([]);
  const [filtros, setFiltros] = useState({
    search: '',
    especialidades: [],
    status_contato: '',
    tem_email: ''
  });
  const [especialidadesDisponiveis, setEspecialidadesDisponiveis] = useState([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [tipoDialog, setTipoDialog] = useState(''); // 'criar', 'editar', 'importar'
  const [medicoSelecionado, setMedicoSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    especialidades: [],
    canal: '',
    email: '',
    codigo_origem: '',
    observacoes: ''
  });
  const [arquivo, setArquivo] = useState(null);
  const [arquivoImportacao, setArquivoImportacao] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [estatisticas, setEstatisticas] = useState({});

  // Carregar dados iniciais
  useEffect(() => {
    carregarMedicos();
    carregarEspecialidades();
    carregarEstatisticas();
  }, [page, rowsPerPage, filtros]);

  const carregarMedicos = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filtros
      };
      
      // Remover parâmetros vazios
      Object.keys(params).forEach(key => {
        if (params[key] === '' || (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });

      const response = await api.get('/medicos-disparo', { params });
      setMedicos(response.data.medicos);
      setTotalCount(response.data.pagination.total);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      mostrarSnackbar('Erro ao carregar médicos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarEspecialidades = async () => {
    try {
      const response = await api.get('/disparo/especialidades');
      setEspecialidadesDisponiveis(response.data.especialidades.map(e => e.especialidade));
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const response = await api.get('/medicos-disparo/estatisticas');
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const mostrarSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = medicos.map((n) => n._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const abrirDialog = (tipo, medico = null) => {
    setTipoDialog(tipo);
    setMedicoSelecionado(medico);
    
    if (medico) {
      setFormData({
        nome: medico.nome || '',
        telefone: medico.telefone || '',
        especialidades: medico.especialidades || [],
        canal: medico.canal || '',
        email: medico.email || '',
        codigo_origem: medico.codigo_origem || '',
        observacoes: medico.observacoes || ''
      });
    } else {
      setFormData({
        nome: '',
        telefone: '',
        especialidades: [],
        canal: '',
        email: '',
        codigo_origem: '',
        observacoes: ''
      });
    }
    
    setDialogAberto(true);
  };

  const fecharDialog = () => {
    setDialogAberto(false);
    setTipoDialog('');
    setMedicoSelecionado(null);
    setArquivo(null);
  };

  const salvarMedico = async () => {
    try {
      if (tipoDialog === 'criar') {
        await api.post('/medicos-disparo', formData);
        mostrarSnackbar('Médico criado com sucesso', 'success');
      } else if (tipoDialog === 'editar') {
        await api.put(`/medicos-disparo/${medicoSelecionado._id}`, formData);
        mostrarSnackbar('Médico atualizado com sucesso', 'success');
      }
      
      fecharDialog();
      carregarMedicos();
      carregarEstatisticas();
    } catch (error) {
      console.error('Erro ao salvar médico:', error);
      mostrarSnackbar(error.response?.data?.error || 'Erro ao salvar médico', 'error');
    }
  };

  const excluirMedico = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este médico?')) {
      try {
        await api.delete(`/medicos-disparo/${id}`);
        mostrarSnackbar('Médico excluído com sucesso', 'success');
        carregarMedicos();
        carregarEstatisticas();
      } catch (error) {
        console.error('Erro ao excluir médico:', error);
        mostrarSnackbar('Erro ao excluir médico', 'error');
      }
    }
  };

  const acaoEmMassa = async (acao) => {
    if (selected.length === 0) {
      mostrarSnackbar('Selecione pelo menos um médico', 'warning');
      return;
    }

    try {
      await api.post('/medicos-disparo/acao-massa', {
        acao,
        ids: selected
      });
      
      const acoes = {
        adicionar_fila: 'Médicos adicionados à fila',
        marcar_enviado: 'Médicos marcados como enviados',
        marcar_opt_out: 'Médicos marcados como opt-out',
        excluir: 'Médicos excluídos'
      };
      
      mostrarSnackbar(acoes[acao], 'success');
      setSelected([]);
      carregarMedicos();
      carregarEstatisticas();
    } catch (error) {
      console.error('Erro na ação em massa:', error);
      mostrarSnackbar('Erro ao executar ação em massa', 'error');
    }
  };

  const importarArquivo = async () => {
    if (!arquivo) {
      mostrarSnackbar('Selecione um arquivo', 'warning');
      return;
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('arquivo', arquivo);
      
      const response = await api.post('/medicos-disparo/importar', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      mostrarSnackbar(
        `Importação concluída: ${response.data.resumo.inseridos} inseridos, ${response.data.resumo.atualizados} atualizados`,
        'success'
      );
      
      fecharDialog();
      carregarMedicos();
      carregarEstatisticas();
    } catch (error) {
      console.error('Erro na importação:', error);
      mostrarSnackbar(error.response?.data?.error || 'Erro na importação', 'error');
    }
  };

  const exportarParaDisparo = async (formato = 'json') => {
    try {
      const params = {
        formato,
        ...filtros
      };
      
      const response = await api.get('/medicos-disparo/exportar', { 
        params,
        responseType: formato === 'csv' ? 'blob' : 'json'
      });
      
      if (formato === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'contatos-disparo.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'contatos-disparo.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
      
      mostrarSnackbar('Exportação realizada com sucesso', 'success');
    } catch (error) {
      console.error('Erro na exportação:', error);
      mostrarSnackbar('Erro na exportação', 'error');
    }
  };

  const sincronizarPlanilha = async () => {
    try {
      await api.post('/medicos-disparo/sincronizar');
      mostrarSnackbar('Sincronização iniciada', 'info');
      carregarMedicos();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      mostrarSnackbar('Erro na sincronização', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      novo: 'primary',
      fila: 'warning',
      enviado: 'success',
      falha: 'error',
      opt_out: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      novo: 'Novo',
      fila: 'Em Fila',
      enviado: 'Enviado',
      falha: 'Falha',
      opt_out: 'Opt-out'
    };
    return labels[status] || status;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header moderno */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 3,
        p: 4,
        mb: 4,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <HospitalIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                Médicos para Disparo
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Gerencie sua base de médicos e campanhas de comunicação
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 0
        }} />
      </Box>

      {/* Estatísticas redesenhadas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    Total
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {estatisticas.totalContatos || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <PersonIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    Novos
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {estatisticas.porStatus?.find(s => s._id === 'novo')?.count || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CheckCircleIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    Em Fila
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {estatisticas.porStatus?.find(s => s._id === 'fila')?.count || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <QueueIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    Enviados
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {estatisticas.porStatus?.find(s => s._id === 'enviado')?.count || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <SendIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    Opt-out
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {estatisticas.porStatus?.find(s => s._id === 'opt_out')?.count || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <BlockIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros modernos */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <CardHeader 
          title={
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <FilterIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filtros de Busca
              </Typography>
            </Stack>
          }
          action={
            <Tooltip title="Limpar todos os filtros">
              <IconButton 
                onClick={() => {
                  setFiltros({
                    search: '',
                    especialidades: [],
                    status_contato: '',
                    tem_email: ''
                  });
                  carregarMedicos();
                }}
                sx={{ 
                  bgcolor: 'grey.100',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar médicos"
                placeholder="Nome, telefone ou email..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: filtros.search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFiltros({ ...filtros, search: '' })}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Especialidades</InputLabel>
                <Select
                  multiple
                  value={filtros.especialidades}
                  onChange={(e) => setFiltros({ ...filtros, especialidades: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'primary.100',
                            color: 'primary.800',
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  {especialidadesDisponiveis.map((esp) => (
                    <MenuItem key={esp} value={esp}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <HospitalIcon fontSize="small" color="primary" />
                        <span>{esp}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status do Contato</InputLabel>
                <Select
                  value={filtros.status_contato}
                  onChange={(e) => setFiltros({ ...filtros, status_contato: e.target.value })}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <MenuItem value="">Todos os status</MenuItem>
                  <MenuItem value="novo">
                    <Chip label="Novo" color="primary" size="small" />
                  </MenuItem>
                  <MenuItem value="fila">
                    <Chip label="Em Fila" color="warning" size="small" />
                  </MenuItem>
                  <MenuItem value="enviado">
                    <Chip label="Enviado" color="success" size="small" />
                  </MenuItem>
                  <MenuItem value="falha">
                    <Chip label="Falha" color="error" size="small" />
                  </MenuItem>
                  <MenuItem value="opt_out">
                    <Chip label="Opt-out" color="error" size="small" />
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Email</InputLabel>
                <Select
                  value={filtros.tem_email}
                  onChange={(e) => setFiltros({ ...filtros, tem_email: e.target.value })}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EmailIcon fontSize="small" color="success" />
                      <span>Com Email</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="false">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EmailIcon fontSize="small" color="disabled" />
                      <span>Sem Email</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Tooltip title="Aplicar filtros">
                <Button
                  variant="contained"
                  onClick={carregarMedicos}
                  fullWidth
                  sx={{
                    height: 56,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                    }
                  }}
                >
                  <SearchIcon />
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Ações principais */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => abrirDialog('criar')}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Novo Médico
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => abrirDialog('importar')}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Importar Arquivo
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudSyncIcon />}
                onClick={sincronizarPlanilha}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    backgroundColor: 'success.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Sincronizar Planilha
              </Button>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<GetAppIcon />}
                onClick={() => exportarParaDisparo('json')}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0d8478 0%, #2dd865 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(17, 153, 142, 0.4)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Exportar JSON
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={() => exportarParaDisparo('csv')}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  borderColor: 'info.main',
                  color: 'info.main',
                  '&:hover': {
                    borderColor: 'info.dark',
                    backgroundColor: 'info.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Exportar CSV
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Ações em massa */}
      {selected.length > 0 && (
        <Card sx={{ 
          mb: 4, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          border: '2px solid',
          borderColor: 'primary.200',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
        }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main',
                  width: 40,
                  height: 40
                }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {selected.length} médico(s) selecionado(s)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Escolha uma ação para aplicar aos itens selecionados
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<QueueIcon />}
                  onClick={() => acaoEmMassa('adicionar_fila')}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e081e9 0%, #e3455a 100%)'
                    }
                  }}
                >
                  Adicionar à Fila
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => acaoEmMassa('marcar_enviado')}
                  sx={{
                    borderRadius: 2,
                    borderColor: 'success.main',
                    color: 'success.main',
                    '&:hover': {
                      borderColor: 'success.dark',
                      backgroundColor: 'success.50'
                    }
                  }}
                >
                  Marcar Enviado
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BlockIcon />}
                  onClick={() => acaoEmMassa('marcar_opt_out')}
                  sx={{
                    borderRadius: 2,
                    borderColor: 'warning.main',
                    color: 'warning.main',
                    '&:hover': {
                      borderColor: 'warning.dark',
                      backgroundColor: 'warning.50'
                    }
                  }}
                >
                  Marcar Opt-out
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => acaoEmMassa('excluir')}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'error.50'
                    }
                  }}
                >
                  Excluir
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <TableContainer>
        <Table>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '& .MuiTableCell-head': {
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderBottom: 'none',
                  py: 2
                }
              }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < medicos.length}
                    checked={medicos.length > 0 && selected.length === medicos.length}
                    onChange={handleSelectAllClick}
                    sx={{
                      color: 'white',
                      '&.Mui-checked': {
                        color: 'white'
                      },
                      '&.MuiCheckbox-indeterminate': {
                        color: 'white'
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PersonIcon fontSize="small" />
                    <span>Nome</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneIcon fontSize="small" />
                    <span>Telefone</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <HospitalIcon fontSize="small" />
                    <span>Especialidades</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon fontSize="small" />
                    <span>Status</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUpIcon fontSize="small" />
                    <span>Última Interação</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SendIcon fontSize="small" />
                    <span>Total Envios</span>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                    <VisibilityIcon fontSize="small" />
                    <span>Ações</span>
                  </Stack>
                </TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : medicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nenhum médico encontrado
                </TableCell>
              </TableRow>
            ) : (
              medicos.map((medico) => {
                const isItemSelected = isSelected(medico._id);
                return (
                  <TableRow
                    key={medico._id}
                    hover
                    onClick={(event) => handleClick(event, medico._id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isItemSelected} />
                    </TableCell>
                    <TableCell>{medico.nome || '-'}</TableCell>
                    <TableCell>{medico.telefone}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {medico.especialidades?.map((esp, index) => (
                          <Chip key={index} label={esp} size="small" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(medico.status_contato)}
                        color={getStatusColor(medico.status_contato)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {medico.ultima_interacao_em
                        ? format(new Date(medico.ultima_interacao_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{medico.total_envios}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirDialog('editar', medico);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          excluirMedico(medico._id);
                        }}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </Card>

      {/* Paginação moderna */}
      <Card sx={{ mt: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.800', width: 32, height: 32 }}>
                <PersonIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {totalCount} médicos encontrados
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mostrando {page * rowsPerPage + 1} a {Math.min((page + 1) * rowsPerPage, totalCount)} registros
                </Typography>
              </Box>
            </Stack>
            
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{
                '& .MuiTablePagination-toolbar': {
                  minHeight: 'auto',
                  px: 0
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem',
                  color: 'text.secondary'
                },
                '& .MuiTablePagination-select': {
                  bgcolor: 'primary.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'primary.200',
                  '&:focus': {
                    bgcolor: 'primary.100'
                  }
                },
                '& .MuiTablePagination-actions button': {
                  bgcolor: 'primary.50',
                  color: 'primary.700',
                  border: '1px solid',
                  borderColor: 'primary.200',
                  borderRadius: 1,
                  mx: 0.25,
                  '&:hover': {
                    bgcolor: 'primary.100',
                    transform: 'scale(1.05)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'grey.100',
                    color: 'grey.400',
                    borderColor: 'grey.200'
                  },
                  transition: 'all 0.2s'
                }
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Dialog para criar/editar médico */}
      <Dialog 
        open={dialogAberto && (tipoDialog === 'criar' || tipoDialog === 'editar')} 
        onClose={fecharDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 3
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            {tipoDialog === 'criar' ? <AddIcon /> : <EditIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {tipoDialog === 'criar' ? 'Novo Médico' : 'Editar Médico'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {tipoDialog === 'criar' ? 'Adicione um novo médico ao sistema' : 'Atualize as informações do médico'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Card sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.800', fontWeight: 600 }}>
                Informações Básicas
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Nome Completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ color: 'primary.500', mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.400'
                      }
                    }
                  }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ color: 'primary.500', mr: 1 }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.400'
                        }
                      }
                    }}
                  />
                  <TextField
                    label="E-mail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ color: 'primary.500', mr: 1 }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.400'
                        }
                      }
                    }}
                  />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'success.800', fontWeight: 600 }}>
                Especialidades e Configurações
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Especialidades</InputLabel>
                  <Select
                    multiple
                    value={formData.especialidades}
                    onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={value} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'success.100',
                              color: 'success.800',
                              fontWeight: 500
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    sx={{
                      bgcolor: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'success.400'
                      }
                    }}
                  >
                    {especialidadesDisponiveis.map((esp) => (
                      <MenuItem key={esp} value={esp}>
                        <HospitalIcon sx={{ mr: 1, color: 'success.600' }} fontSize="small" />
                        {esp}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Canal"
                    value={formData.canal}
                    onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'success.400'
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Código de Origem"
                    value={formData.codigo_origem}
                    onChange={(e) => setFormData({ ...formData, codigo_origem: e.target.value })}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'success.400'
                        }
                      }
                    }}
                  />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.100' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'info.800', fontWeight: 600 }}>
                Observações Adicionais
              </Typography>
              <TextField
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                fullWidth
                placeholder="Adicione observações relevantes sobre o médico..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'info.400'
                    }
                  }
                }}
              />
            </Card>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50', gap: 2 }}>
          <Button 
            onClick={fecharDialog}
            variant="outlined"
            sx={{
              borderColor: 'grey.300',
              color: 'grey.700',
              '&:hover': {
                borderColor: 'grey.400',
                bgcolor: 'grey.100'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={salvarMedico} 
            variant="contained"
            startIcon={tipoDialog === 'criar' ? <AddIcon /> : <EditIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              },
              transition: 'all 0.2s'
            }}
          >
            {tipoDialog === 'criar' ? 'Criar Médico' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para importar arquivo */}
      <Dialog 
        open={dialogAberto && tipoDialog === 'importar'} 
        onClose={fecharDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 3
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <UploadFileIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Importar Arquivo
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Adicione médicos em lote através de planilha
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Alert 
              severity="info" 
              sx={{ 
                bgcolor: 'info.50',
                border: '1px solid',
                borderColor: 'info.200',
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  color: 'info.600'
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Formatos Aceitos
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                📊 XLSX, XLS, CSV
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Colunas Esperadas
              </Typography>
              <Typography variant="body2">
                👤 Cliente • 📞 Contato • 🏷️ Tags • 📡 Canal • 📧 E-mail • 🔢 Código
              </Typography>
            </Alert>

            <Card 
              sx={{ 
                p: 3,
                border: '2px dashed',
                borderColor: arquivoImportacao ? 'success.300' : 'grey.300',
                bgcolor: arquivoImportacao ? 'success.50' : 'grey.50',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: arquivoImportacao ? 'success.400' : 'primary.400',
                  bgcolor: arquivoImportacao ? 'success.100' : 'primary.50',
                  transform: 'scale(1.02)'
                }
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setArquivoImportacao(e.target.files[0])}
                style={{ display: 'none' }}
              />
              
              <Stack alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  bgcolor: arquivoImportacao ? 'success.100' : 'primary.100',
                  color: arquivoImportacao ? 'success.700' : 'primary.700',
                  width: 64,
                  height: 64
                }}>
                  {arquivoImportacao ? <CheckCircleIcon sx={{ fontSize: 32 }} /> : <CloudUploadIcon sx={{ fontSize: 32 }} />}
                </Avatar>
                
                <Box>
                  <Typography variant="h6" sx={{ 
                    color: arquivoImportacao ? 'success.700' : 'text.primary',
                    fontWeight: 600
                  }}>
                    {arquivoImportacao ? 'Arquivo Selecionado!' : 'Clique para selecionar arquivo'}
                  </Typography>
                  
                  {arquivoImportacao ? (
                    <Stack alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ color: 'success.600', fontWeight: 500 }}>
                        📄 {arquivoImportacao.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(arquivoImportacao.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Ou arraste e solte o arquivo aqui
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Card>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50', gap: 2 }}>
          <Button 
            onClick={fecharDialog}
            variant="outlined"
            sx={{
              borderColor: 'grey.300',
              color: 'grey.700',
              '&:hover': {
                borderColor: 'grey.400',
                bgcolor: 'grey.100'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={importarArquivo} 
            variant="contained" 
            disabled={!arquivoImportacao}
            startIcon={<UploadFileIcon />}
            sx={{
              background: arquivoImportacao 
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'grey.300',
              color: arquivoImportacao ? 'white' : 'grey.500',
              '&:hover': {
                background: arquivoImportacao 
                  ? 'linear-gradient(135deg, #3d8bfe 0%, #00d4fe 100%)'
                  : 'grey.300',
                transform: arquivoImportacao ? 'translateY(-1px)' : 'none',
                boxShadow: arquivoImportacao ? '0 4px 12px rgba(79, 172, 254, 0.4)' : 'none'
              },
              transition: 'all 0.2s',
              '&.Mui-disabled': {
                background: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            Importar Arquivo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 500,
            '& .MuiAlert-icon': {
              fontSize: '1.2rem'
            },
            '& .MuiAlert-action': {
              '& .MuiIconButton-root': {
                color: 'inherit',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }
            },
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MedicosDisparo;