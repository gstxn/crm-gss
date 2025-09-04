// Script para popular um quadro Kanban de demonstração
const dotenv = require('dotenv');
const connectDB = require('../config/database');
const KanbanBoard = require('../models/KanbanBoard');
const KanbanList = require('../models/KanbanList');
const KanbanCard = require('../models/KanbanCard');

dotenv.config();

async function seed() {
  await connectDB();

  // Verifica se já existe um board seedado
  const exists = await KanbanBoard.findOne({ name: 'Operações – Kanban' });
  if (exists) {
    console.log('Quadro padrão já existente. Nada a fazer.');
    process.exit(0);
  }

  const board = await KanbanBoard.create({
    name: 'Operações – Kanban',
    archived: false,
  });

  // Cria listas
  const listsData = [
    { title: 'A Fazer', position: 1 },
    { title: 'Em Progresso', position: 2 },
    { title: 'Concluído', position: 3 },
  ];

  const lists = await Promise.all(
    listsData.map((l) =>
      KanbanList.create({ ...l, board: board._id })
    )
  );

  // Cria cards demo na primeira lista
  await KanbanCard.create([
    {
      title: 'Configurar ambiente',
      description: 'Garantir que o projeto roda localmente',
      list: lists[0]._id,
      board: board._id,
      position: 1,
    },
    {
      title: 'Implementar Kanban',
      description: 'Adicionar drag-and-drop e persistir no backend',
      list: lists[1]._id,
      board: board._id,
      position: 1,
    },
  ]);

  console.log('Seed Kanban concluído!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});