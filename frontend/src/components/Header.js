import React, { useState, useEffect } from 'react';
import { FaBell, FaUser, FaEnvelope, FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Header.css';

// Helper para obter userInfo de forma segura
const getUserInfo = () => {
  const raw = localStorage.getItem('userInfo');
  if (!raw || raw === 'undefined') return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('userInfo inválido:', e);
    return null;
  }
};

const Header = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userName, setUserName] = useState('');
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState([]);
  const [showMensagens, setShowMensagens] = useState(false);

  useEffect(() => {
    // Aqui seria feita uma chamada à API para buscar as notificações
    // Simulando algumas notificações para demonstração
    setNotifications([
      { id: 1, message: 'Nova oportunidade cadastrada', time: '10 min atrás' },
      { id: 2, message: 'Médico atualizou documentação', time: '1 hora atrás' },
      { id: 3, message: 'Lembrete: Contato com Hospital São Lucas', time: '3 horas atrás' },
    ]);

    // Buscar informações do usuário do localStorage de forma segura
    const userInfo = getUserInfo();
    if (userInfo && (userInfo.nome || userInfo.name)) {
      setUserName(userInfo.nome || userInfo.name);
    }
    
    // Buscar mensagens não lidas
    const fetchMensagensNaoLidas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get('/api/mensagens/nao-lidas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMensagensNaoLidas(response.data.mensagens);
      } catch (error) {
        console.error('Erro ao buscar mensagens não lidas:', error);
      }
    };
    
    fetchMensagensNaoLidas();
    
    // Atualizar mensagens não lidas a cada 2 minutos
    const interval = setInterval(fetchMensagensNaoLidas, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Ajusta classes da sidebar quando a largura da janela muda
  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;
      if (window.innerWidth > 768) {
         // Em desktop, garante que a sidebar não use estilo mobile
         sidebar.classList.remove('open');
       } else {
         // Em mobile, remove estado de colapso de desktop
         sidebar.classList.remove('collapsed');
       }
       document.body.classList.toggle('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    };
    // Estado inicial
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowMensagens(false);
  };
  
  const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Em dispositivos móveis, desliza a sidebar para dentro/fora da tela
      sidebar.classList.toggle('open');
    } else {
      // Em telas maiores, usa o mecanismo de colapso existente
      sidebar.classList.toggle('collapsed');
      // Garante que a classe 'open' seja removida caso tenha sido aplicada
      sidebar.classList.remove('open');
      // Sincroniza estado colapsado com o body para estilizar título
      document.body.classList.toggle('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    }
  };

  const toggleMensagens = () => {
    setShowMensagens(!showMensagens);
    setShowNotifications(false);
  };

  return (
    <header className="header">
      <div className="header-title">
        <button className="menu-btn" onClick={toggleSidebar}><FaBars /></button>
        <Link to="/" className="logo">Gestão Serviços Saúde</Link>
      </div>
      <div className="header-actions">
        <div className="notification-container">
          <button className="notification-btn" onClick={toggleMensagens}>
            <FaEnvelope />
            {mensagensNaoLidas.length > 0 && (
              <span className="notification-badge">{mensagensNaoLidas.length}</span>
            )}
          </button>
          {showMensagens && (
            <div className="notification-dropdown">
              <h3>Mensagens não lidas</h3>
              {mensagensNaoLidas.length > 0 ? (
                <ul>
                  {mensagensNaoLidas.map((mensagem) => (
                    <li key={mensagem._id}>
                      <Link to={`/mensagens`} onClick={() => setShowMensagens(false)}>
                        <p><strong>{mensagem.remetente.nome}</strong>: {mensagem.assunto}</p>
                        <span className="notification-time">
                          {new Date(mensagem.criadoEm).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li className="ver-todas">
                    <Link to="/mensagens" onClick={() => setShowMensagens(false)}>Ver todas as mensagens</Link>
                  </li>
                </ul>
              ) : (
                <p className="no-notifications">Nenhuma mensagem não lida.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="notification-container">
          <button className="notification-btn" onClick={toggleNotifications}>
            <FaBell />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <h3>Notificações</h3>
              {notifications.length > 0 ? (
                <ul>
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <p>{notification.message}</p>
                      <small>{notification.time}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-notifications">Nenhuma notificação</p>
              )}
            </div>
          )}
        </div>
        <div className="user-info">
          <span className="user-name">{userName || 'Usuário'}</span>
          <div className="user-avatar">
            <FaUser />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;