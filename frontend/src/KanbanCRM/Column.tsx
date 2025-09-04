import React from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card';

interface ColumnProps {
  id: string;
  title: string;
  cards: any[];
  onAddCard: (listId: string) => void;
  onCardClick?: (card: any) => void;
}

const Column: React.FC<ColumnProps> = ({ id, title, cards, onAddCard, onCardClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-column"
      {...attributes}
    >
      <div className="kanban-column-header" {...listeners}>
        <h3 className="kanban-column-title">{title}</h3>
      </div>
      <div className="kanban-column-content">
        <SortableContext items={cards.map((card) => card.id)}>
          {cards.map((card) => (
            <Card 
              key={card.id} 
              card={card} 
              onClick={onCardClick ? () => onCardClick(card) : undefined}
            />
          ))}
        </SortableContext>
      </div>
      <button 
        className="kanban-add-card-btn"
        onClick={() => onAddCard(id)}
      >
        + Adicionar Cartão
      </button>
    </div>
  );
};

export default Column;