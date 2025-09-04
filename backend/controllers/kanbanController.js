const asyncHandler = require('express-async-handler');
const KanbanBoard = require('../models/KanbanBoard');
const KanbanList = require('../models/KanbanList');
const KanbanCard = require('../models/KanbanCard');
const KanbanComment = require('../models/KanbanComment');

// ===== BOARDS =====
exports.createBoard = asyncHandler(async (req, res) => {
  const { title, description, members = [] } = req.body;
  if (!title) return res.status(400).json({ message: 'Título é obrigatório' });
  const board = await KanbanBoard.create({
    title,
    description: description || '',
    owner: req.user._id,
    members,
  });
  res.status(201).json(board);
});

exports.getBoards = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const boards = await KanbanBoard.find({
    archived: false,
    $or: [{ owner: userId }, { members: userId }],
  }).sort({ updatedAt: -1 });
  res.json(boards);
});

exports.updateBoard = asyncHandler(async (req, res) => {
  const board = await KanbanBoard.findById(req.params.id);
  if (!board) return res.status(404).json({ message: 'Board não encontrado' });
  if (!board.owner.equals(req.user._id)) {
    return res.status(403).json({ message: 'Sem permissão' });
  }
  Object.assign(board, req.body, { updatedAt: Date.now() });
  await board.save();
  res.json(board);
});

exports.archiveBoard = asyncHandler(async (req, res) => {
  const board = await KanbanBoard.findById(req.params.id);
  if (!board) return res.status(404).json({ message: 'Board não encontrado' });
  if (!board.owner.equals(req.user._id)) {
    return res.status(403).json({ message: 'Sem permissão' });
  }
  board.archived = true;
  await board.save();
  res.json({ message: 'Board arquivado' });
});

// ===== LISTS =====
exports.createList = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Título é obrigatório' });
  const boardId = req.params.boardId;
  const listCount = await KanbanList.countDocuments({ board: boardId });
  const list = await KanbanList.create({ board: boardId, title, position: listCount });
  res.status(201).json(list);
});

exports.updateList = asyncHandler(async (req, res) => {
  const list = await KanbanList.findById(req.params.id);
  if (!list) return res.status(404).json({ message: 'Lista não encontrada' });
  Object.assign(list, req.body, { updatedAt: Date.now() });
  await list.save();
  res.json(list);
});

// ===== CARDS =====
exports.createCard = asyncHandler(async (req, res) => {
  const { title, description, dueDate } = req.body;
  if (!title) return res.status(400).json({ message: 'Título é obrigatório' });
  const listId = req.params.listId;
  const cardCount = await KanbanCard.countDocuments({ list: listId });
  const card = await KanbanCard.create({
    list: listId,
    title,
    description: description || '',
    dueDate: dueDate || null,
    position: cardCount,
  });
  res.status(201).json(card);
});

exports.updateCard = asyncHandler(async (req, res) => {
  const card = await KanbanCard.findById(req.params.id);
  if (!card) return res.status(404).json({ message: 'Card não encontrado' });
  Object.assign(card, req.body, { updatedAt: Date.now() });
  await card.save();
  res.json(card);
});

exports.moveCard = asyncHandler(async (req, res) => {
  const { listId, position } = req.body;
  const card = await KanbanCard.findById(req.params.id);
  if (!card) return res.status(404).json({ message: 'Card não encontrado' });

  const originalListId = card.list.toString();
  const targetListId = listId || originalListId;

  // Atualiza list & posição provisória
  card.list = targetListId;
  card.position = typeof position === 'number' ? position : card.position;
  await card.save();

  // Reindexa listas
  await reindexListCards(originalListId);
  if (targetListId !== originalListId) {
    await reindexListCards(targetListId);
  }

  res.json(card);
});

// ===== COMMENTS =====
exports.addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'Conteúdo é obrigatório' });
  const comment = await KanbanComment.create({
    card: req.params.cardId,
    author: req.user._id,
    content,
  });
  res.status(201).json(comment);
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await KanbanComment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comentário não encontrado' });
  if (!comment.author.equals(req.user._id)) {
    return res.status(403).json({ message: 'Sem permissão' });
  }
  await comment.remove();
  res.json({ message: 'Comentário removido' });
});

// Helper: garante posições sequenciais 0..n em uma lista
async function reindexListCards(listId) {
  const cards = await KanbanCard.find({ list: listId }).sort('position');
  await Promise.all(cards.map((c, idx) => {
    if (c.position !== idx) {
      c.position = idx;
      return c.save();
    }
    return Promise.resolve();
  }));
}

exports.getBoardDetails = asyncHandler(async (req, res) => {
  const board = await KanbanBoard.findById(req.params.id);
  if (!board) return res.status(404).json({ message: 'Board não encontrado' });

  // Verifica se usuário tem acesso
  const userId = req.user._id;
  const isMember = board.owner.equals(userId) || board.members.includes(userId);
  if (!isMember) return res.status(403).json({ message: 'Sem permissão' });

  // Busca listas e cartões
  const lists = await KanbanList.find({ board: board._id }).sort('position');
  const listIds = lists.map((l) => l._id);
  const cards = await KanbanCard.find({ list: { $in: listIds } }).sort('position');

  const listsWithCards = lists.map((l) => ({
    ...l.toObject(),
    cards: cards.filter((c) => c.list.equals(l._id)),
  }));

  res.json({ ...board.toObject(), lists: listsWithCards });
});