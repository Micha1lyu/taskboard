import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import './Admin.css'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users')
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id, name) => {
    if (!confirm(`確定要刪除 ${name} 的帳號嗎？此操作無法復原。`)) return
    try {
      await api.delete(`/api/admin/users/${id}`)
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || '刪除失敗')
    }
  }

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role: newRole })
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } catch (err) {
      alert('更新失敗')
    }
  }

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
        <span className="admin-nav-title">🛡️ 管理員後台</span>
        <span className="admin-badge">admin</span>
      </nav>

      <main className="admin-main">
        <h2 className="admin-section-title">
          所有使用者
          <span className="user-count">{users.length} 人</span>
        </h2>

        {loading ? (
          <div className="admin-loading">載入中...</div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名稱</th>
                  <th>Email</th>
                  <th>角色</th>
                  <th>註冊時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={u.id === user.id ? 'row-self' : ''}>
                    <td className="td-id">#{u.id}</td>
                    <td className="td-name">{u.name}</td>
                    <td className="td-email">{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === 'admin' ? '🛡️ 管理員' : '👤 一般'}
                      </span>
                    </td>
                    <td className="td-date">
                      {new Date(u.created_at).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="td-actions">
                      {u.id !== user.id && (
                        <>
                          <button
                            className="btn-role"
                            onClick={() => toggleRole(u.id, u.role)}
                          >
                            {u.role === 'admin' ? '降為一般' : '升為管理員'}
                          </button>
                          <button
                            className="btn-del-user"
                            onClick={() => deleteUser(u.id, u.name)}
                          >
                            刪除
                          </button>
                        </>
                      )}
                      {u.id === user.id && <span className="self-label">（你）</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
