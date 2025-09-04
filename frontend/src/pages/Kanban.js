import React from 'react';
import Board from '../kanban/Board';

const Kanban = () => {
  return (
    <div className="kanban-page">
      <h1 className="text-2xl font-bold mb-4">Kanban Board</h1>
      <Board />
    </div>
  );
};

export default Kanban;