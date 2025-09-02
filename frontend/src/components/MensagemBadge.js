import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MensagemBadge.css';

const MensagemBadge = () => {
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);

  useEffect(() => {
    const fetchMensagensNaoLidas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get('/api/mensagens/nao-lidas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMensagensNaoLidas(response.data.total || 0);
      } catch (error) {
        console.error('Erro ao buscar mensagens não lidas:', error);
      }
    };
    
    fetchMensagensNaoLidas();
    
    // Atualizar a cada 2 minutos
    const interval = setInterval(fetchMensagensNaoLidas, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (mensagensNaoLidas === 0) {
    return null;
  }

  return (
    <span className="mensagem-badge">{mensagensNaoLidas}</span>
  );
};

export default MensagemBadge;