import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [newBoardName, setNewBoardName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/api/boards')
      setBoards(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createBoard = async (e) => {
    e.preventDefault()
    if (!newBoardName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/api/boards', { name: newBoardName })
      setBoards([data, ...boards])
      setNewBoardName('')
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const deleteBoard = async (id) => {
    if (!confirm('確定要刪除這個看板嗎？')) return
    try {
      await api.delete(`/api/boards/${id}`)
      setBoards(boards.filter(b => b.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">📋 TaskBoard</div>
        <div className="nav-right">
          <span className="nav-user">👤 {user?.name}</span>
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn-admin">🛡️ 後台</Link>
          )}
          <button className="btn-logout" onClick={logout}>登出</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <h2 className="section-title">我的看板</h2>

        {/* 建立新看板 */}
        <form className="create-board-form" onSubmit={createBoard}>
          <input
            type="text"
            placeholder="輸入看板名稱..."
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            className="board-name-input"
          />
          <button type="submit" className="btn-create" disabled={creating}>
            {creating ? '建立中...' : '＋ 建立看板'}
          </button>
        </form>

        {/* 看板列表 */}
        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <div className="boards-grid">
            {boards.length === 0 && (
              <div className="empty-state">
                <p>還沒有看板，建立第一個吧！</p>
              </div>
            )}
            {boards.map(board => (
              <div key={board.id} className="board-card" onClick={() => navigate(`/board/${board.id}`)}>
                <div className="board-card-icon">📌</div>
                <div className="board-card-info">
                  <h3>{board.name}</h3>
                  <p className="board-meta">
                    {new Date(board.created_at).toLocaleDateString('zh-TW')}
                  </p>
                </div>
                {board.owner_id === user?.id && (
                  <button
                    className="btn-delete-board"
                    onClick={(e) => { e.stopPropagation(); deleteBoard(board.id) }}
                  >
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
