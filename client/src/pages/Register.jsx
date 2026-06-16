import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', form)
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '註冊失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">📋</div>
        <h1 className="auth-title">TaskBoard</h1>
        <p className="auth-subtitle">建立你的帳號</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">名稱</label>
            <input
              id="name"
              type="text"
              placeholder="你的名字"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">密碼</label>
            <input
              id="reg-password"
              type="password"
              placeholder="至少 6 個字元"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '建立中...' : '建立帳號'}
          </button>
        </form>

        <p className="auth-link">
          已有帳號？ <Link to="/login">立即登入</Link>
        </p>
      </div>
    </div>
  )
}
