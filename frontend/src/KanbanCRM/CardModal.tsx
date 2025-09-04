import React, { useState, useEffect } from 'react';

interface CardModalProps {
  card: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: any) => void;
  onDelete: (cardId: string) => void;
  users: any[];
}

const CardModal: React.FC<CardModalProps> = ({
  card,
  isOpen,
  onClose,
  onSave,
  onDelete,
  users = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
      setAssignees(card.assignees || []);
      setLabels(card.labels || []);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...card,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assignees,
      labels,
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    // Aqui você pode implementar a lógica para adicionar comentários
    // através da API quando estiver pronta
    console.log('Adicionar comentário:', newComment);
    setNewComment('');
  };

  const handleAssigneeChange = (userId: string) => {
    setAssignees(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleLabelChange = (label: string) => {
    setLabels(prev => {
      if (prev.includes(label)) {
        return prev.filter(l => l !== label);
      } else {
        return [...prev, label];
      }
    });
  };

  return (
    <div className="kanban-modal-overlay">
      <div className="kanban-modal">
        <div className="kanban-modal-header">
          <h2>Editar Cartão</h2>
          <button className="kanban-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="kanban-modal-form">
          <div className="kanban-modal-content">
            <div className="kanban-modal-field">
              <label htmlFor="title">Título</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="kanban-modal-field">
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="kanban-modal-field">
              <label htmlFor="dueDate">Data de Vencimento</label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="kanban-modal-field">
              <label>Responsáveis</label>
              <div className="kanban-modal-assignees">
                {users.map((user) => (
                  <div key={user.id} className="kanban-modal-assignee">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={assignees.includes(user.id)}
                      onChange={() => handleAssigneeChange(user.id)}
                    />
                    <label htmlFor={`user-${user.id}`}>{user.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="kanban-modal-field">
              <label>Etiquetas</label>
              <div className="kanban-modal-labels">
                {['Urgente', 'Importante', 'Baixa Prioridade', 'Bug', 'Feature'].map((label) => (
                  <div key={label} className="kanban-modal-label">
                    <input
                      type="checkbox"
                      id={`label-${label}`}
                      checked={labels.includes(label)}
                      onChange={() => handleLabelChange(label)}
                    />
                    <label htmlFor={`label-${label}`}>{label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="kanban-modal-comments">
              <h3>Comentários</h3>
              <div className="kanban-modal-comments-list">
                {card.comments?.map((comment: any) => (
                  <div key={comment.id} className="kanban-modal-comment">
                    <div className="kanban-modal-comment-header">
                      <span className="kanban-modal-comment-author">{comment.author}</span>
                      <span className="kanban-modal-comment-date">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="kanban-modal-comment-body">{comment.content}</div>
                  </div>
                ))}
              </div>
              <div className="kanban-modal-add-comment">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  rows={2}
                />
                <button
                  type="button"
                  className="kanban-modal-add-comment-btn"
                  onClick={handleAddComment}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
          <div className="kanban-modal-footer">
            <button
              type="button"
              className="kanban-modal-delete-btn"
              onClick={() => onDelete(card.id)}
            >
              Excluir
            </button>
            <button type="submit" className="kanban-modal-save-btn">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardModal;