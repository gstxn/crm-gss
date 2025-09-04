const express = require('express');
const router = express.Router();

// Placeholder endpoint to confirm module is active
router.get('/status', (req, res) => {
  res.json({ message: 'Kanban API v1 ativo' });
});

const { protect } = require('../middleware/authMiddleware');
const {
  createBoard,
  getBoards,
  getBoardDetails,
  updateBoard,
  archiveBoard,
  createList,
  updateList,
  moveList,
  createCard,
  updateCard,
  moveCard,
  addComment,
  deleteComment,
} = require('../controllers/kanbanController');

router.get('/boards/:id', protect, getBoardDetails);
// ===== Boards =====
router.post('/boards', protect, createBoard);
router.get('/boards', protect, getBoards);
router.put('/boards/:id', protect, updateBoard);
router.put('/boards/:id/archive', protect, archiveBoard);

// ===== Lists =====
router.post('/boards/:boardId/lists', protect, createList);
router.put('/lists/:id', protect, updateList);
router.put('/lists/:id/move', protect, moveList);

// ===== Cards =====
router.post('/lists/:listId/cards', protect, createCard);
router.put('/cards/:id', protect, updateCard);
router.put('/cards/:id/move', protect, moveCard);

// ===== Comments =====
router.post('/cards/:cardId/comments', protect, addComment);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;