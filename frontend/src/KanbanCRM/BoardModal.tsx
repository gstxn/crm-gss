import React, { useState } from 'react';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (boardData: { title: string; description?: string; members?: string[] }) => void;
  users?: any[];
}

const BoardModal: React.FC<BoardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  users = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description: description || undefined,
      members: selectedMembers.length > 0 ? selectedMembers : undefined,
    });
    // Limpar o formulário
    setTitle('');
    setDescription('');
    setSelectedMembers([]);
  };

  const handleMemberChange = (userId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  return (
    <div className="kanban-modal-overlay">
      <div className="kanban-modal">
        <div className="kanban-modal-header">
          <h2>Novo Quadro</h2>
          <button className="kanban-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="kanban-modal-form">
          <div className="kanban-modal-content">
            <div className="kanban-modal-field">
              <label htmlFor="title">Título*</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Digite o título do quadro"
              />
            </div>
            <div className="kanban-modal-field">
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descreva o propósito deste quadro"
              />
            </div>
            {users.length > 0 && (
              <div className="kanban-modal-field">
                <label>Membros</label>
                <div className="kanban-modal-members">
                  {users.map((user) => (
                    <div key={user.id} className="kanban-modal-member">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={selectedMembers.includes(user.id)}
                        onChange={() => handleMemberChange(user.id)}
                      />
                      <label htmlFor={`user-${user.id}`}>{user.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="kanban-modal-footer">
            <button type="button" className="kanban-modal-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="kanban-modal-save"
              disabled={!title.trim()}
            >
              Criar Quadro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardModal;