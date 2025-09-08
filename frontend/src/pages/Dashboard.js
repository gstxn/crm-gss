import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  IconButton,
  Fade,
  Grow
} from '@mui/material';
import {
  TrendingUp,
  People,
  LocalHospital,
  Business,
  Analytics,
  Notifications,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  ArrowForward,
  Assignment
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    oportunidades: 0,
    medicos: 0,
    clientes: 0,
    tarefasConcluidas: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [specialtyData, setSpecialtyData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Usuário não autenticado');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // Buscar estatísticas
        const statsResponse = await axios.get('/api/dashboard/stats', config);
        setStats(statsResponse.data.stats);
        setStatusData(statsResponse.data.oportunidadesPorStatus || []);
        setSpecialtyData(statsResponse.data.medicosPorEspecialidade || []);

        // Buscar atividades recentes
        const activitiesResponse = await axios.get('/api/dashboard/activities', config);
        setRecentActivities(activitiesResponse.data.map(activity => ({
          ...activity,
          time: formatTimeAgo(new Date(activity.time)),
          avatar: getActivityIcon(activity.type),
          description: activity.subtitle
        })));

        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        toast.error('Erro ao carregar dados do dashboard');
        console.error('Erro ao carregar dashboard:', err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Função para obter ícone da atividade
  const getActivityIcon = (type) => {
    switch(type) {
      case 'oportunidade':
        return '💼';
      case 'medico':
        return '👨‍⚕️';
      case 'cliente':
        return '👤';
      case 'task':
        return '✅';
      case 'audit':
        return '📋';
      default:
        return '📌';
    }
  };

  // Função para formatar tempo relativo
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} segundos atrás`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} horas atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} dias atrás`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} meses atrás`;
  };

  // Métricas baseadas nos dados reais
  const metrics = [
    {
      title: 'Oportunidades',
      value: (stats.oportunidades || 0).toString(),
      change: '+0%',
      trend: 'up',
      icon: TrendingUp,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      bgColor: 'rgba(102, 126, 234, 0.1)',
      link: '/oportunidades'
    },
    {
      title: 'Médicos',
      value: (stats.medicos || 0).toString(),
      change: '+0%',
      trend: 'up',
      icon: LocalHospital,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      bgColor: 'rgba(240, 147, 251, 0.1)',
      link: '/medicos'
    },
    {
      title: 'Clientes',
      value: (stats.clientes || 0).toString(),
      change: '+0%',
      trend: 'up',
      icon: People,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      bgColor: 'rgba(79, 172, 254, 0.1)',
      link: '/clientes'
    },
    {
      title: 'Tarefas Concluídas',
      value: (stats.tarefasConcluidas || 0).toString(),
      change: '+0%',
      trend: 'up',
      icon: Assignment,
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      bgColor: 'rgba(67, 233, 123, 0.1)',
      link: '/tarefas'
    }
  ];

  // Dados do gráfico baseados nos status das oportunidades
  const chartData = statusData.map((item, index) => ({
    month: item._id || `Status ${index + 1}`,
    value: Math.min(((item.count || 0) / Math.max(stats.oportunidades || 1, 1)) * 100, 100),
    color: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#ff6b6b', '#feca57'][index % 6]
  }));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header Moderno */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 6 }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
              p: 4,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
            }}>
              <Box sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(5px)'
              }} />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  Dashboard Executivo
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                  Visão completa do seu negócio em tempo real
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    label="Atualizado agora" 
                    sx={{ 
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }} 
                  />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Última sincronização: {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Cards de Métricas Principais */}
        <Grid container spacing={4} sx={{ mb: 6, justifyContent: 'center' }}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={metric.title}>
              <Grow in timeout={1000 + index * 200}>
                <Card 
                  component={metric.link ? 'div' : 'div'}
                  onClick={metric.link ? () => window.location.href = metric.link : undefined}
                  sx={{
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: metric.link ? 'pointer' : 'default',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                    }
                  }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 3,
                        background: metric.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <metric.icon sx={{ fontSize: 28, background: metric.color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
                      </Box>
                      {metric.link && (
                        <IconButton size="small" sx={{ color: '#64748b' }}>
                          <ArrowForward />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                      {metric.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {metric.trend === 'up' ? (
                        <ArrowUpward sx={{ fontSize: 16, color: '#10b981' }} />
                      ) : (
                        <ArrowDownward sx={{ fontSize: 16, color: '#ef4444' }} />
                      )}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: metric.trend === 'up' ? '#10b981' : '#ef4444',
                          fontWeight: 600
                        }}
                      >
                        {metric.change}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        vs mês anterior
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Seção de Analytics */}
        <Grid container spacing={4} sx={{ mb: 6, justifyContent: 'center' }}>
          <Grid item xs={12} lg={8}>
            <Fade in timeout={1200}>
              <Paper sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                p: 4,
                height: 400
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                      Performance Mensal
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Evolução das métricas principais
                    </Typography>
                  </Box>
                  <IconButton>
                    <Analytics sx={{ color: '#667eea' }} />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', height: 250, px: 2 }}>
                  {chartData.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <Box 
                        sx={{
                          width: 40,
                          height: `${item.value}%`,
                          background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}80 100%)`,
                          borderRadius: 2,
                          mb: 2,
                          minHeight: 20,
                          boxShadow: `0 4px 20px ${item.color}40`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {item.month}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Fade>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Fade in timeout={1400}>
              <Paper sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                p: 4,
                height: 400
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                      Atividades Recentes
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Últimas atualizações
                    </Typography>
                  </Box>
                  <IconButton>
                    <Notifications sx={{ color: '#f093fb' }} />
                  </IconButton>
                </Box>

                <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
                  {recentActivities.map((activity, index) => (
                    <Box key={activity.id} sx={{ mb: 3, pb: 3, borderBottom: index < recentActivities.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                        <Avatar sx={{
                          width: 48,
                          height: 48,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}>
                          {activity.avatar}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                            {activity.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {activity.time}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>


      </Container>
    </Box>
  );
};

export default Dashboard;