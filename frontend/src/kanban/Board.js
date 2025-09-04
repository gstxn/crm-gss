import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/***********************************
 *  Utilidades internas
 ***********************************/
const findListContainingCard = (lists, cardId) =>
  lists.find((l) => l.cards.some((c) => c._id === cardId));

/***********************************
 *  Componente Card Sortable
 ***********************************/
// removed duplicate import useSortable here
const Card = ({ card }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white shadow rounded p-2 mb-2 cursor-grab"
      {...attributes}
      {...listeners}
    >
      {card.title}
    </div>
  );
};

/***********************************
 *  Componente List Sortable
 ***********************************/
const List = ({ listId, title, cards }) => {
  return (
    <div className="bg-gray-100 rounded p-4 w-64 mr-4 flex-shrink-0">
      <h3 className="font-semibold mb-4">{title}</h3>
      <SortableContext items={cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <Card key={card._id} card={card} />
        ))}
      </SortableContext>
    </div>
  );
};

/***********************************
 *  Board principal
 ***********************************/
const Board = () => {
  const [lists, setLists] = useState([]);
  const [activeCard, setActiveCard] = useState(null);

  // Sensores para mouse e teclado
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Primeiro busca todos os boards do usuário
        const { data: boards } = await axios.get("/api/kanban/v1/boards");
        if (boards?.length) {
          const boardId = boards[0]._id;
          // Busca detalhes do board específico (listas + cards)
          const { data: boardDetails } = await axios.get(`/api/kanban/v1/boards/${boardId}`);
          setLists(boardDetails.lists || []);
          return;
        }
      } catch (err) {
        console.error("Erro ao carregar Kanban:", err?.response?.data || err.message);
      }
      // Mock fallback em caso de erro ou sem boards
      setLists([
        {
          _id: "list-1",
          title: "A Fazer",
          cards: [
            { _id: "card-1", title: "Primeira tarefa" },
            { _id: "card-2", title: "Segunda tarefa" },
          ],
        },
        {
          _id: "list-2",
          title: "Em Progresso",
          cards: [{ _id: "card-3", title: "Implementar Kanban" }],
        },
        {
          _id: "list-3",
          title: "Concluído",
          cards: [],
        },
      ]);
    };
    fetchData();
  }, []);

  const handleDragStart = (event) => {
    const { active } = event;
    const sourceList = findListContainingCard(lists, active.id);
    setActiveCard(sourceList?.cards.find((c) => c._id === active.id) || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    // Se soltar em mesma posição não muda nada
    if (active.id === over.id) return;

    const sourceList = findListContainingCard(lists, active.id);
    const targetList = findListContainingCard(lists, over.id);

    if (!sourceList || !targetList) return;

    // Remove do source
    const activeCardData = sourceList.cards.find((c) => c._id === active.id);
    const newSourceCards = sourceList.cards.filter((c) => c._id !== active.id);

    // Define posição no destino (fim da lista)
    const newTargetCards = [...targetList.cards, activeCardData];

    const newLists = lists.map((l) => {
      if (l._id === sourceList._id) return { ...l, cards: newSourceCards };
      if (l._id === targetList._id) return { ...l, cards: newTargetCards };
      return l;
    });

    setLists(newLists);

    // TODO: Persistir mudança no backend (patch posição)
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex overflow-x-auto py-4">
        {lists.map((list) => (
          <List key={list._id} listId={list._id} title={list.title} cards={list.cards} />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="bg-white shadow-lg rounded p-2 w-60">{activeCard.title}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Board;