import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE = '/api/kanban/v1';

// Automatically attach Authorization header with token (if available)
axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
   try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      } as any;
    }
  } catch (_) {
    // localStorage might be unavailable; fail silently
  }
  return config;
});

// Helper mappers to normalize backend _id to id so frontend always receives `id`
const mapCard = (card: any): Card & { _id?: string } => {
  if (!card) return card;
  return { ...card, id: card.id || card._id };
};

const mapList = (list: any): List & { _id?: string } => {
  if (!list) return list;
  return {
    ...list,
    id: list.id || list._id,
    boardId: list.boardId || list.board || list.board_id,
    cards: Array.isArray(list.cards) ? list.cards.map(mapCard) : [],
  } as any;
};

export const mapBoard = (board: any): (Board & { _id?: string }) & { lists?: List[] } => {
  if (!board) return board;
  return {
    ...board,
    id: board.id || board._id,
    lists: Array.isArray(board.lists) ? board.lists.map(mapList) : [],
  } as any;
};

export interface Board {
  id: string;
  title: string;
  description?: string;
  owner: string;
  members: string[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  archived: boolean;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string;
  assignees: string[];
  labels: string[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

// Boards
export const getBoards = async (): Promise<Board[]> => {
  const response = await axios.get(`${API_BASE}/boards`);
  return Array.isArray(response.data) ? response.data.map(mapBoard) : [];
};

export const getBoardDetails = async (boardId: string): Promise<Board & { lists: List[] }> => {
  if (!boardId) {
    throw new Error('ID do quadro não fornecido');
  }
  const response = await axios.get(`${API_BASE}/boards/${boardId}`);
  const mappedBoard = mapBoard(response.data);
  if (!mappedBoard.lists) {
    mappedBoard.lists = [];
  }
  return mappedBoard as Board & { lists: List[] };
};

export const createBoard = async (data: { title: string; description?: string; members?: string[] }): Promise<Board> => {
  const response = await axios.post(`${API_BASE}/boards`, data);
  return mapBoard(response.data);
};

export const updateBoard = async (boardId: string, data: Partial<Board>): Promise<Board> => {
  const response = await axios.put(`${API_BASE}/boards/${boardId}`, data);
  return mapBoard(response.data);
};

export const archiveBoard = async (boardId: string): Promise<{ message: string }> => {
  const response = await axios.put(`${API_BASE}/boards/${boardId}/archive`);
  return response.data;
};

// Lists
export const createList = async (boardId: string, data: { title: string }): Promise<List> => {
  const response = await axios.post(`${API_BASE}/boards/${boardId}/lists`, data);
  return mapList(response.data);
};

export const updateList = async (listId: string, data: Partial<List>): Promise<List> => {
  const response = await axios.put(`${API_BASE}/lists/${listId}`, data);
  return mapList(response.data);
};

// Cards
export const createCard = async (listId: string, data: { title: string; description?: string; dueDate?: string }): Promise<Card> => {
  const response = await axios.post(`${API_BASE}/lists/${listId}/cards`, data);
  return mapCard(response.data);
};

export const updateCard = async (cardId: string, data: Partial<Card>): Promise<Card> => {
  const response = await axios.put(`${API_BASE}/cards/${cardId}`, data);
  return mapCard(response.data);
};

export const moveCard = async (cardId: string, data: { listId: string; position: number }): Promise<Card> => {
  const response = await axios.put(`${API_BASE}/cards/${cardId}/move`, data);
  return mapCard(response.data);
};

// Comments
export const addComment = async (cardId: string, data: { content: string }): Promise<Comment> => {
  const response = await axios.post(`${API_BASE}/cards/${cardId}/comments`, data);
  return response.data;
};

export const deleteComment = async (commentId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_BASE}/comments/${commentId}`);
  return response.data;
};