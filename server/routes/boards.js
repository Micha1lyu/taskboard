const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

// GET /api/boards - 取得我的所有看板
router.get('/', auth, async (req, res) => {
  try {
    const [boards] = await db.query(
      `SELECT b.* FROM boards b
       LEFT JOIN board_members bm ON b.id = bm.board_id
       WHERE b.owner_id = ? OR bm.user_id = ?
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [req.user.id, req.user.id]
    )
    res.json(boards)
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

// POST /api/boards - 建立看板
router.post('/', auth, async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ message: '請輸入看板名稱' })

  try {
    const [result] = await db.query(
      'INSERT INTO boards (name, owner_id) VALUES (?, ?)',
      [name, req.user.id]
    )
    const boardId = result.insertId

    // 建立預設三個欄位
    await db.query(
      'INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [boardId, '待辦', 0, boardId, '進行中', 1, boardId, '完成', 2]
    )

    res.status(201).json({ id: boardId, name, owner_id: req.user.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

// DELETE /api/boards/:id - 刪除看板
router.delete('/:id', auth, async (req, res) => {
  try {
    const [boards] = await db.query(
      'SELECT * FROM boards WHERE id = ? AND owner_id = ?',
      [req.params.id, req.user.id]
    )
    if (boards.length === 0)
      return res.status(403).json({ message: '無權限' })

    await db.query('DELETE FROM boards WHERE id = ?', [req.params.id])
    res.json({ message: '已刪除' })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

module.exports = router
