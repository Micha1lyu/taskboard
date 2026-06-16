const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

// 管理員 middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: '無管理員權限' })
  next()
}

// GET /api/admin/users - 取得所有使用者
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    )
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

// DELETE /api/admin/users/:id - 刪除帳號
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ message: '不能刪除自己' })
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ message: '已刪除' })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

// PATCH /api/admin/users/:id/role - 切換角色
router.patch('/users/:id/role', auth, adminOnly, async (req, res) => {
  const { role } = req.body
  if (!['user', 'admin'].includes(role))
    return res.status(400).json({ message: '無效角色' })
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id])
    res.json({ message: '已更新' })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

module.exports = router
