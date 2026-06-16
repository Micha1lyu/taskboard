import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { io } from 'socket.io-client'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import './Board.css'

// ── 可放置欄位 ───────────────────────────────
function DroppableColumn({ colId, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${colId}` })
  return (
    <div ref={setNodeRef} className={`cards-list${isOver ? ' col-over' : ''}`}>
      {children}
    </div>
  )
}

// ── 單張卡片元件 ──────────────────────────────
function SortableCard({ card, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `card-${card.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="card" {...attributes} {...listeners}>
      <span className="card-title">{card.title}</span>
      <button
        className="card-delete"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(card.id)}
      >
        ×
      </button>
    </div>
  )
}

// ── 主頁面 ───────────────────────────────────
export default function Board() {
  const { boardId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState(null)
  const [newCardInputs, setNewCardInputs] = useState({})
  const [socket, setSocket] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // 初始化 Socket.io
  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL)
    s.emit('join_board', boardId)
    setSocket(s)

    s.on('card_moved', ({ cardId, column_id, position }) => {
      setColumns(prev => moveCardLocally(prev, cardId, column_id, position))
    })
    s.on('card_added', (card) => {
      setColumns(prev => prev.map(col =>
        col.id === card.column_id ? { ...col, cards: [...col.cards, card] } : col
      ))
    })
    s.on('card_deleted', ({ cardId }) => {
      setColumns(prev => prev.map(col => ({
        ...col,
        cards: col.cards.filter(c => c.id !== cardId)
      })))
    })

    return () => s.disconnect()
  }, [boardId])

  useEffect(() => {
    fetchBoard()
  }, [boardId])

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/api/boards/${boardId}/cards`)
      setColumns(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const moveCardLocally = (cols, cardId, newColId, newPos) => {
    let movedCard = null
    const cleaned = cols.map(col => ({
      ...col,
      cards: col.cards.filter(c => {
        if (c.id === cardId) { movedCard = c; return false }
        return true
      })
    }))
    if (!movedCard) return cols
    return cleaned.map(col =>
      col.id === newColId
        ? { ...col, cards: [...col.cards, { ...movedCard, column_id: newColId }] }
        : col
    )
  }

  const handleDragStart = (event) => {
    const cardId = parseInt(event.active.id.replace('card-', ''))
    for (const col of columns) {
      const found = col.cards.find(c => c.id === cardId)
      if (found) { setActiveCard(found); break }
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const cardId = parseInt(active.id.replace('card-', ''))

    // 找目標 column（可以拖到 column 本身或另一張卡）
    let targetColId = null
    if (over.id.startsWith('col-')) {
      targetColId = parseInt(over.id.replace('col-', ''))
    } else if (over.id.startsWith('card-')) {
      const overCardId = parseInt(over.id.replace('card-', ''))
      for (const col of columns) {
        if (col.cards.find(c => c.id === overCardId)) {
          targetColId = col.id; break
        }
      }
    }
    if (!targetColId) return

    const newCols = moveCardLocally(columns, cardId, targetColId, 0)
    setColumns(newCols)

    // 更新 DB
    try {
      await api.patch(`/api/boards/${boardId}/cards/${cardId}`, {
        column_id: targetColId,
        position: 0,
      })
      socket?.emit('card_moved', { boardId, cardId, column_id: targetColId, position: 0 })
    } catch (err) {
      console.error(err)
    }
  }

  const addCard = async (colId) => {
    const title = newCardInputs[colId]?.trim()
    if (!title) return
    try {
      const { data } = await api.post(`/api/boards/${boardId}/cards`, {
        title,
        column_id: colId,
      })
      setColumns(prev => prev.map(col =>
        col.id === colId ? { ...col, cards: [...col.cards, data] } : col
      ))
      setNewCardInputs(prev => ({ ...prev, [colId]: '' }))
      socket?.emit('card_added', { boardId, ...data })
    } catch (err) {
      console.error(err)
    }
  }

  const deleteCard = async (cardId) => {
    try {
      await api.delete(`/api/boards/${boardId}/cards/${cardId}`)
      setColumns(prev => prev.map(col => ({
        ...col,
        cards: col.cards.filter(c => c.id !== cardId)
      })))
      socket?.emit('card_deleted', { boardId, cardId })
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="board-loading">載入看板中...</div>

  return (
    <div className="board-page">
      <nav className="board-nav">
        <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
        <span className="board-nav-title">📋 TaskBoard</span>
        <span className="online-badge">🟢 即時同步</span>
      </nav>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board-columns">
          {columns.map(col => (
            <div key={col.id} className="column" id={`col-${col.id}`}>
              <div className="column-header">
                <h3>{col.name}</h3>
                <span className="card-count">{col.cards.length}</span>
              </div>

              <SortableContext
                items={col.cards.map(c => `card-${c.id}`)}
                strategy={verticalListSortingStrategy}
              >
              <DroppableColumn colId={col.id}>
                  {col.cards.map(card => (
                    <SortableCard key={card.id} card={card} onDelete={deleteCard} />
                  ))}
              </DroppableColumn>
              </SortableContext>

              {/* 新增卡片 */}
              <div className="add-card-form">
                <input
                  type="text"
                  placeholder="新增卡片..."
                  value={newCardInputs[col.id] || ''}
                  onChange={(e) =>
                    setNewCardInputs(prev => ({ ...prev, [col.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && addCard(col.id)}
                  className="add-card-input"
                />
                <button className="btn-add-card" onClick={() => addCard(col.id)}>＋</button>
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="card card-overlay">
              <span className="card-title">{activeCard.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
