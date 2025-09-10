import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CardProps {
  card: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    assignees?: string[];
    labels?: string[];
  };
  onClick?: (card: any) => void;
}

const Card: React.FC<CardProps> = ({ card, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleClick = () => {
    if (onClick) onClick(card);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <h4 className="kanban-card-title">{card.title}</h4>
      </div>
      {card.description && (
        <div className="kanban-card-description">
          {card.description.length > 100
            ? `${card.description.substring(0, 97)}...`
            : card.description}
        </div>
      )}
      {card.dueDate && (
        <div className="kanban-card-due-date">
          <span className="kanban-card-due-date-label">Prazo:</span>
          <span className="kanban-card-due-date-value">
            {new Date(card.dueDate).toLocaleDateString()}
          </span>
        </div>
      )}
      {card.assignees && card.assignees.length > 0 && (
        <div className="kanban-card-assignees">
          {card.assignees.map((assignee, index) => (
            <span key={index} className="kanban-card-assignee">
              {assignee}
            </span>
          ))}
        </div>
      )}
      {card.labels && card.labels.length > 0 && (
        <div className="kanban-card-labels">
          {card.labels.map((label, index) => (
            <span key={index} className="kanban-card-label">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default Card;