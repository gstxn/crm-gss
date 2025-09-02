import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaUserMd, FaHospital, FaBell, FaChartBar, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaChartLine, FaRegClock, FaUsers, FaRegCalendarCheck } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    oportunidades: 0,
    medicos: 0,
    clientes: 0,
    tarefasConcluidas: 0,
    taxaConversao: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [specialtyData, setSpecialtyData] = useState([]);

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
        setStatusData(statsResponse.data.oportunidadesPorStatus);
        setSpecialtyData(statsResponse.data.medicosPorEspecialidade);

        // Buscar atividades recentes
        const activitiesResponse = await axios.get('/api/dashboard/activities', config);
        setRecentActivities(activitiesResponse.data.map(activity => ({
          ...activity,
          time: formatTimeAgo(new Date(activity.time))
        })));

        // Buscar tarefas pendentes
        const tasksResponse = await axios.get('/api/dashboard/tasks', config);
        setPendingTasks(tasksResponse.data);
        
        // Simular dados de eventos próximos

        // Resetar eventos próximos para coleção vazia em produção
        setUpcomingEvents([]);
        
        // Simular dados de desempenho
        setPerformanceData([
          { month: 'Jan', value: 65 },
          { month: 'Fev', value: 59 },
          { month: 'Mar', value: 80 },
          { month: 'Abr', value: 81 },
          { month: 'Mai', value: 56 },
          { month: 'Jun', value: 55 },
        ]);
        
        // Simular estatísticas adicionais

        // Resetar estatísticas adicionais para zero em produção
        setStats(prev => ({
          ...prev,
          tarefasConcluidas: 0,
          taxaConversao: 0,
        }));

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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'oportunidade':
        return <FaBriefcase className="activity-icon opportunity" />;
      case 'medico':
        return <FaUserMd className="activity-icon doctor" />;
      case 'cliente':
        return <FaHospital className="activity-icon client" />;
      default:
        return <FaBell className="activity-icon" />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="loading-container">Carregando dados do dashboard...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Dashboard</h2>
      
      <div className="stats-container">
        <Link to="/oportunidades" className="stat-card-link">
          <div className="stat-card">
            <div className="stat-icon opportunity">
              <FaBriefcase />
            </div>
            <div className="stat-info">
              <h3>{stats.oportunidades}</h3>
              <p>Oportunidades</p>
            </div>
          </div>
        </Link>
        
        <Link to="/medicos" className="stat-card-link">
          <div className="stat-card">
            <div className="stat-icon doctor">
              <FaUserMd />
            </div>
            <div className="stat-info">
              <h3>{stats.medicos}</h3>
              <p>Médicos</p>
            </div>
          </div>
        </Link>
        
        <Link to="/clientes" className="stat-card-link">
          <div className="stat-card">
            <div className="stat-icon client">
              <FaHospital />
            </div>
            <div className="stat-info">
              <h3>{stats.clientes}</h3>
              <p>Clientes</p>
            </div>
          </div>
        </Link>

        <div className="stat-card">
          <div className="stat-icon success">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.tarefasConcluidas}</h3>
            <p>Tarefas Concluídas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon conversion">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>{stats.taxaConversao}%</h3>
            <p>Taxa de Conversão</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3 className="card-title"><FaChartBar /> Oportunidades por Status</h3>
          <div className="status-chart">
            {statusData.map((item) => (
              <div key={item._id} className="status-bar">
                <div className="status-label">{item._id}</div>
                <div className="status-value" style={{ width: `${(item.count / stats.oportunidades) * 100}%` }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-card">
          <h3 className="card-title"><FaUserMd /> Médicos por Especialidade</h3>
          <div className="specialty-chart">
            {specialtyData.map((item) => (
              <div key={item._id} className="specialty-item">
                <div className="specialty-name">{item._id}</div>
                <div className="specialty-count">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-card performance-chart">
          <h3 className="card-title"><FaChartLine /> Panorama Mensal</h3>
          <div className="performance-graph">
            <div className="graph-container">
              {performanceData.map((item, index) => (
                <div key={index} className="graph-bar-container">
                  <div 
                    className="graph-bar" 
                    style={{ height: `${item.value}%` }}
                    data-value={`${item.value}%`}
                  ></div>
                  <div className="graph-label">{item.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-column">
          <div className="card">
            <h3 className="card-title"><FaCalendarAlt /> Atividades Recentes</h3>
            {recentActivities.length > 0 ? (
              <div className="activities-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    {getActivityIcon(activity.type)}
                    <div className="activity-details">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-subtitle">{activity.subtitle}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-message">Nenhuma atividade recente encontrada.</p>
            )}
          </div>
        </div>
        
        <div className="dashboard-column">
          <div className="card">
            <h3 className="card-title"><FaExclamationTriangle /> Tarefas Pendentes</h3>
            {pendingTasks.length > 0 ? (
              <div className="tasks-list">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-details">
                      <p className="task-title">{task.title}</p>
                      <div className="task-meta">
                        <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                        <span className="task-due-date"><FaRegClock /> {task.dueDate}</span>
                      </div>
                    </div>
                    <Link to={task.type === 'task' ? '/tarefas-pendentes' : `/oportunidades/${task.relatedId}`} className="btn btn-sm">Ver</Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-message">Nenhuma tarefa pendente encontrada.</p>
            )}
          </div>
        </div>

        <div className="dashboard-column">
          <div className="card">
            <h3 className="card-title"><FaRegCalendarCheck /> Próximos Eventos</h3>
            {upcomingEvents.length > 0 ? (
              <div className="events-list">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-date">
                      <div className="event-day">{event.date.split('-')[2]}</div>
                      <div className="event-month">{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(event.date.split('-')[1]) - 1]}</div>
                    </div>
                    <div className="event-details">
                      <p className="event-title">{event.title}</p>
                      <div className="event-type">
                        {event.type === 'meeting' ? 'Reunião' : event.type === 'presentation' ? 'Apresentação' : 'Treinamento'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-message">Nenhum evento próximo encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;