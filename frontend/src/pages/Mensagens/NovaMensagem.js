import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPaperclip, FaTimes } from 'react-icons/fa';
import './NovaMensagem.css';

const NovaMensagem = () => {
  const navigate = useNavigate();
  const { id: mensagemResponderId } = useParams();
  
  const [formData, setFormData] = useState({
    assunto: '',
    conteudo: '',
    destinatarios: [],
    prioridade: 'Normal',
    relacionado: { tipo: 'Geral', id: null }
  });
  
  const [usuarios, setUsuarios] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [mensagemOriginal, setMensagemOriginal] = useState(null);
  const [entidadesRelacionadas, setEntidadesRelacionadas] = useState({
    oportunidades: [],
    medicos: [],
    clientes: []
  });
  
  // Carregar usuários e entidades relacionadas
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Carregar usuários
        const usuariosResponse = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsuarios(usuariosResponse.data);
        
        // Carregar entidades relacionadas (resumo)
        const [oportunidadesRes, medicosRes, clientesRes] = await Promise.all([
          axios.get('/api/oportunidades?limite=100&campos=titulo,id', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/medicos?limite=100&campos=nome,id', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/clientes?limite=100&campos=nome,id', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setEntidadesRelacionadas({
          oportunidades: oportunidadesRes.data.oportunidades || [],
          medicos: medicosRes.data.medicos || [],
          clientes: clientesRes.data.clientes || []
        });
        
        // Se for resposta a uma mensagem, carregar a mensagem original
        if (mensagemResponderId) {
          const mensagemRes = await axios.get(`/api/mensagens/${mensagemResponderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setMensagemOriginal(mensagemRes.data);
          
          // Preencher o formulário com dados da resposta
          setFormData({
            assunto: `Re: ${mensagemRes.data.assunto}`,
            conteudo: `\n\n\n-------- Mensagem Original --------\nDe: ${mensagemRes.data.remetente.nome}\nData: ${new Date(mensagemRes.data.criadoEm).toLocaleString()}\nAssunto: ${mensagemRes.data.assunto}\n\n${mensagemRes.data.conteudo}`,
            destinatarios: [mensagemRes.data.remetente._id],
            prioridade: mensagemRes.data.prioridade,
            relacionado: mensagemRes.data.relacionado
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados necessários. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mensagemResponderId]);
  
  // Manipular mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'relacionadoTipo') {
      setFormData({
        ...formData,
        relacionado: { ...formData.relacionado, tipo: value, id: null }
      });
    } else if (name === 'relacionadoId') {
      setFormData({
        ...formData,
        relacionado: { ...formData.relacionado, id: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  // Manipular seleção de destinatários
  const handleDestinatarioChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setFormData({ ...formData, destinatarios: selectedValues });
  };
  
  // Manipular upload de anexos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Verificar tamanho dos arquivos (limite de 10MB por arquivo)
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    
    if (validFiles.length < files.length) {
      alert('Alguns arquivos excedem o limite de 10MB e não foram adicionados.');
    }
    
    setAnexos([...anexos, ...validFiles]);
    e.target.value = null; // Limpar input para permitir selecionar o mesmo arquivo novamente
  };
  
  // Remover anexo
  const removeAnexo = (index) => {
    const novosAnexos = [...anexos];
    novosAnexos.splice(index, 1);
    setAnexos(novosAnexos);
  };
  
  // Enviar mensagem
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (!formData.assunto.trim()) {
      setError('O assunto é obrigatório.');
      return;
    }
    
    if (!formData.conteudo.trim()) {
      setError('O conteúdo da mensagem é obrigatório.');
      return;
    }
    
    if (formData.destinatarios.length === 0) {
      setError('Selecione pelo menos um destinatário.');
      return;
    }
    
    try {
      setEnviando(true);
      const token = localStorage.getItem('token');
      
      // Criar a mensagem
      const mensagemResponse = await axios.post('/api/mensagens', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const mensagemId = mensagemResponse.data._id;
      
      // Fazer upload dos anexos, se houver
      if (anexos.length > 0) {
        for (const anexo of anexos) {
          const formData = new FormData();
          formData.append('anexo', anexo);
          
          await axios.post(`/api/mensagens/${mensagemId}/anexo`, formData, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      }
      
      // Redirecionar para a lista de mensagens
      navigate('/mensagens');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem. Por favor, tente novamente.');
      setEnviando(false);
    }
  };
  
  // Formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  if (loading) {
    return <div className="loading-container">Carregando...</div>;
  }
  
  return (
    <div className="nova-mensagem-container">
      <div className="nova-mensagem-header">
        <Link to="/mensagens" className="btn-voltar">
          <FaArrowLeft /> Voltar
        </Link>
        <h1>{mensagemResponderId ? 'Responder Mensagem' : 'Nova Mensagem'}</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="mensagem-form">
        <div className="form-group">
          <label htmlFor="destinatarios">Para:</label>
          <select 
            id="destinatarios" 
            name="destinatarios" 
            multiple 
            value={formData.destinatarios}
            onChange={handleDestinatarioChange}
            required
          >
            {usuarios.map(usuario => (
              <option key={usuario._id} value={usuario._id}>
                {usuario.nome} ({usuario.email})
              </option>
            ))}
          </select>
          <small>Pressione Ctrl (ou Cmd) para selecionar múltiplos destinatários</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="assunto">Assunto:</label>
          <input 
            type="text" 
            id="assunto" 
            name="assunto" 
            value={formData.assunto}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="prioridade">Prioridade:</label>
            <select 
              id="prioridade" 
              name="prioridade" 
              value={formData.prioridade}
              onChange={handleChange}
            >
              <option value="Baixa">Baixa</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="relacionadoTipo">Relacionado a:</label>
            <select 
              id="relacionadoTipo" 
              name="relacionadoTipo" 
              value={formData.relacionado.tipo}
              onChange={handleChange}
            >
              <option value="Geral">Geral</option>
              <option value="Oportunidade">Oportunidade</option>
              <option value="Medico">Médico</option>
              <option value="Cliente">Cliente</option>
            </select>
          </div>
          
          {formData.relacionado.tipo !== 'Geral' && (
            <div className="form-group">
              <label htmlFor="relacionadoId">Selecione:</label>
              <select 
                id="relacionadoId" 
                name="relacionadoId" 
                value={formData.relacionado.id || ''}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {formData.relacionado.tipo === 'Oportunidade' && 
                  entidadesRelacionadas.oportunidades.map(item => (
                    <option key={item._id} value={item._id}>{item.titulo}</option>
                  ))
                }
                {formData.relacionado.tipo === 'Medico' && 
                  entidadesRelacionadas.medicos.map(item => (
                    <option key={item._id} value={item._id}>{item.nome}</option>
                  ))
                }
                {formData.relacionado.tipo === 'Cliente' && 
                  entidadesRelacionadas.clientes.map(item => (
                    <option key={item._id} value={item._id}>{item.nome}</option>
                  ))
                }
              </select>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="conteudo">Mensagem:</label>
          <textarea 
            id="conteudo" 
            name="conteudo" 
            value={formData.conteudo}
            onChange={handleChange}
            rows="10"
            required
          ></textarea>
        </div>
        
        <div className="form-group">
          <label>Anexos:</label>
          <div className="anexos-container">
            <label className="btn-anexo">
              <FaPaperclip /> Adicionar Anexo
              <input 
                type="file" 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
                multiple
              />
            </label>
            
            {anexos.length > 0 && (
              <ul className="anexos-lista">
                {anexos.map((file, index) => (
                  <li key={index}>
                    <span className="anexo-nome">{file.name}</span>
                    <span className="anexo-tamanho">{formatFileSize(file.size)}</span>
                    <button 
                      type="button" 
                      className="btn-remover-anexo"
                      onClick={() => removeAnexo(index)}
                    >
                      <FaTimes />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <small>Limite de 10MB por arquivo</small>
        </div>
        
        <div className="form-actions">
          <Link to="/mensagens" className="btn-cancelar">
            Cancelar
          </Link>
          <button 
            type="submit" 
            className="btn-enviar" 
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar Mensagem'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovaMensagem;