import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
// Removendo importação não utilizada
import Column from './Column';
import Card from './Card';
import CardModal from './CardModal';
import BoardModal from './BoardModal';
import { useKanbanBoard } from './hooks/useKanbanBoard';
import './kanban.css';

interface KanbanViewProps {}

const KanbanView: React.FC<KanbanViewProps> = () => {
  const {
    loading,
    error,
    boards,
    currentBoard,
    lists,
    loadBoards,
    loadBoard,
    createBoard,
    createList,
    createCard,
    updateCard,
    moveCard,
  } = useKanbanBoard({ autoLoad: true });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'card' | 'column' | null>(null);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (boards.length > 0 && !currentBoard) {
      // Ensure the board has a valid ID before loading
      if (boards[0] && boards[0].id) {
        loadBoard(boards[0].id);
      }
    }
  }, [boards, currentBoard, loadBoard]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const { id } = active;
    
    if (id.toString().startsWith('card-')) {
      setActiveType('card');
    } else if (id.toString().startsWith('column-')) {
      setActiveType('column');
    }
    
    setActiveId(id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveType(null);
      return;
    }
    
    if (active.id !== over.id) {
      if (activeType === 'card') {
        const activeCardId = active.id;
        const overCardId = over.id;
        
        // Find the lists containing the cards
        const activeList = lists.find(list => 
          list.cards.some(card => card.id === activeCardId)
        );
        
        const overList = lists.find(list => 
          list.cards.some(card => card.id === overCardId)
        );
        
        if (activeList && overList) {
          // Find the position of the cards in their respective lists
          const overCardIndex = overList.cards.findIndex(card => card.id === overCardId);
          
          // Move the card
          moveCard(activeCardId, { listId: overList.id, position: overCardIndex });
        }
      }
    }
    
    setActiveId(null);
    setActiveType(null);
  };

  const handleCardClick = (card: any) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };

  const handleCardSave = (updatedCard: any) => {
    updateCard(updatedCard.id, updatedCard);
    setIsCardModalOpen(false);
    setSelectedCard(null);
  };

  const handleAddCard = (listId: string) => {
    const newCard = {
      title: 'Novo Cartão',
      description: '',
      list: listId,
    };
    createCard(listId, newCard);
  };

  const handleCreateBoard = async (boardData: { title: string; description?: string; members?: string[] }) => {
    try {
      const newBoard = await createBoard(boardData);
      if (newBoard && newBoard.id) {
        loadBoard(newBoard.id);
        setIsBoardModalOpen(false);
      } else {
console.error('Error creating board: Invalid ID');
      }
    } catch (err: any) {
      console.error(err.message || 'Error creating board');
    }
  };

  if (loading) return <div className="kanban-loading">Carregando...</div>;
  if (error) return <div className="kanban-error">Erro: {error}</div>;
  
  if (!currentBoard) {
    return (
      <div className="kanban-container">
        <div className="kanban-empty">
          <p>Nenhum quadro encontrado</p>
          <button 
            className="kanban-add-board-btn"
            onClick={() => setIsBoardModalOpen(true)}
          >
            + Criar Novo Quadro
          </button>
          {isBoardModalOpen && (
            <BoardModal
              isOpen={isBoardModalOpen}
              onClose={() => setIsBoardModalOpen(false)}
              onSave={handleCreateBoard}
              users={[]}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h1 className="kanban-title">{currentBoard.title}</h1>
        <div className="kanban-actions">
          <button 
            className="kanban-add-board-btn"
            onClick={() => setIsBoardModalOpen(true)}
          >
            + Novo Quadro
          </button>
          {boards.length > 1 && (
            <select 
              className="kanban-board-selector"
              value={currentBoard.id}
              onChange={(e) => loadBoard(e.target.value)}
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>
                  {board.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {lists.map((list) => (
            <Column
              key={list.id}
              id={list.id}
              title={list.title}
              cards={list.cards || []}
              onAddCard={handleAddCard}
              onCardClick={handleCardClick}
            />
          ))}
          
          <button 
            className="kanban-add-list"
            onClick={() => createList(currentBoard.id, { title: 'Nova Lista' })}
          >
            + Adicionar Lista
          </button>
        </div>
        
        <DragOverlay>
          {activeId && activeType === 'card' && (
            <Card 
              card={lists
                .flatMap(list => list.cards)
                .find(card => card.id === activeId) || {
                  id: '',
                  title: '',
                  description: '',
                  dueDate: '',
                  assignees: [],
                  labels: []
                }
              } 
            />
          )}
        </DragOverlay>
      </DndContext>
      
      {isCardModalOpen && selectedCard && (
        <CardModal
          isOpen={isCardModalOpen}
          card={selectedCard}
          onSave={handleCardSave}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedCard(null);
          }}
          onDelete={() => {}} // Add implementation as needed
          users={[]} // Add users array as needed
        />
      )}
      
      {isBoardModalOpen && (
        <BoardModal
          isOpen={isBoardModalOpen}
          onClose={() => setIsBoardModalOpen(false)}
          onSave={handleCreateBoard}
          users={[]}
        />
      )}
    </div>
  );
};

export default KanbanView;