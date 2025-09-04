import React from 'react';
import KanbanView from '../KanbanCRM/KanbanView';

const Kanban = () => {
  return (
    <div className="kanban-page">
      <h1 className="text-2xl font-bold mb-4">Kanban Board</h1>
      <KanbanView />
    </div>
  );
};

export default Kanban;