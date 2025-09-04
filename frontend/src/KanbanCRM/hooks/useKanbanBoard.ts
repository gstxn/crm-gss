import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export interface UseKanbanBoardOptions {
  boardId?: string;
  autoLoad?: boolean;
}

export const useKanbanBoard = (options: UseKanbanBoardOptions = {}) => {
  const { boardId, autoLoad = true } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<api.Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<api.Board | null>(null);
  const [lists, setLists] = useState<api.List[]>([]);

  // Carregar todos os boards
  const loadBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBoards();
      setBoards(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar quadros');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar um board específico com suas listas e cards
  const loadBoard = useCallback(async (id: string) => {
    if (!id) {
      setError('ID do quadro não fornecido');
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBoardDetails(id);
      setCurrentBoard(data);
      setLists(data.lists || []);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar quadro');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar um novo board
  const createBoard = useCallback(async (data: { title: string; description?: string; members?: string[] }) => {
    setLoading(true);
    setError(null);
    try {
      const newBoard = await api.createBoard(data);
      setBoards(prev => [...prev, newBoard]);
      return newBoard;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao criar quadro');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar um board
  const updateBoard = useCallback(async (id: string, data: Partial<api.Board>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedBoard = await api.updateBoard(id, data);
      setBoards(prev => prev.map(b => b.id === id ? updatedBoard : b));
      if (currentBoard?.id === id) {
        setCurrentBoard(updatedBoard);
      }
      return updatedBoard;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao atualizar quadro');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentBoard]);

  // Arquivar um board
  const archiveBoard = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.archiveBoard(id);
      setBoards(prev => prev.filter(b => b.id !== id));
      if (currentBoard?.id === id) {
        setCurrentBoard(null);
        setLists([]);
      }
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao arquivar quadro');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentBoard]);

  // Criar uma nova lista
  const createList = useCallback(async (boardId: string, data: { title: string }) => {
    setLoading(true);
    setError(null);
    try {
      const newList = await api.createList(boardId, data);
      setLists(prev => [...prev, { ...newList, cards: [] }]);
      return newList;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao criar lista');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar uma lista
  const updateList = useCallback(async (listId: string, data: Partial<api.List>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedList = await api.updateList(listId, data);
      setLists(prev => prev.map(l => {
        if (l.id === listId) {
          return { ...updatedList, cards: l.cards };
        }
        return l;
      }));
      return updatedList;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao atualizar lista');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar um novo card
  const createCard = useCallback(async (listId: string, data: { title: string; description?: string; dueDate?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const newCard = await api.createCard(listId, data);
      setLists(prev => prev.map(l => {
        if (l.id === listId) {
          return { ...l, cards: [...l.cards, newCard] };
        }
        return l;
      }));
      return newCard;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao criar cartão');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar um card
  const updateCard = useCallback(async (cardId: string, data: Partial<api.Card>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedCard = await api.updateCard(cardId, data);
      setLists(prev => prev.map(l => {
        const cardIndex = l.cards.findIndex(c => c.id === cardId);
        if (cardIndex >= 0) {
          const newCards = [...l.cards];
          newCards[cardIndex] = updatedCard;
          return { ...l, cards: newCards };
        }
        return l;
      }));
      return updatedCard;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao atualizar cartão');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mover um card
  const moveCard = useCallback(async (cardId: string, data: { listId: string; position: number }) => {
    // Atualização otimista da UI
    let originalLists = [...lists];
    let sourceList;
    let sourceCard;
    let sourceCardIndex = -1;

    // Encontrar o card e sua lista de origem
    for (const list of lists) {
      sourceCardIndex = list.cards.findIndex(c => c.id === cardId);
      if (sourceCardIndex >= 0) {
        sourceList = list;
        sourceCard = list.cards[sourceCardIndex];
        break;
      }
    }

    if (!sourceList || !sourceCard) return null;

    // Atualizar UI otimisticamente
    setLists(prev => {
      const newLists = prev.map(l => {
        // Remover o card da lista de origem
        if (l.id === sourceList!.id) {
          return {
            ...l,
            cards: l.cards.filter(c => c.id !== cardId)
          };
        }
        // Adicionar o card na lista de destino
        if (l.id === data.listId) {
          const newCards = [...l.cards];
          // Inserir na posição correta
          newCards.splice(data.position, 0, sourceCard!);
          return { ...l, cards: newCards };
        }
        return l;
      });
      return newLists;
    });

    // Chamar API
    setLoading(true);
    setError(null);
    try {
      const updatedCard = await api.moveCard(cardId, data);
      // Recarregar o board para garantir que tudo está sincronizado
      if (currentBoard) {
        await loadBoard(currentBoard.id);
      }
      return updatedCard;
    } catch (err: any) {
      // Reverter UI em caso de erro
      setLists(originalLists);
      setError(err.response?.data?.message || err.message || 'Erro ao mover cartão');
      return null;
    } finally {
      setLoading(false);
    }
  }, [lists, currentBoard, loadBoard]);

  // Adicionar um comentário
  const addComment = useCallback(async (cardId: string, data: { content: string }) => {
    setLoading(true);
    setError(null);
    try {
      const newComment = await api.addComment(cardId, data);
      return newComment;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao adicionar comentário');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir um comentário
  const deleteComment = useCallback(async (commentId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteComment(commentId);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao excluir comentário');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (autoLoad) {
      if (boardId) {
        loadBoard(boardId);
      } else {
        loadBoards().then(boards => {
          if (boards.length > 0) {
            loadBoard(boards[0].id);
          }
        });
      }
    }
  }, [autoLoad, boardId, loadBoard, loadBoards]);

  return {
    loading,
    error,
    boards,
    currentBoard,
    lists,
    loadBoards,
    loadBoard,
    createBoard,
    updateBoard,
    archiveBoard,
    createList,
    updateList,
    createCard,
    updateCard,
    moveCard,
    addComment,
    deleteComment,
  };
};