const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

// GET /api/boards/:boardId/cards - 取得看板所有欄位與卡片
router.get('/:boardId/cards', auth, async (req, res) => {
  try {
    const [columns] = await db.query(
      'SELECT * FROM columns WHERE board_id = ? ORDER BY position',
      [req.params.boardId]
    )
    const [cards] = await db.query(
      `SELECT c.*, u.name as assignee_name FROM cards c
       LEFT JOIN users u ON c.assignee_id = u.id
       WHERE c.column_id IN (SELECT id FROM columns WHERE board_id = ?)
       ORDER BY c.position`,
      [req.params.boardId]
    )

    // 把 cards 放到對應的 column 裡
    const result = columns.map(col => ({
      ...col,
      cards: cards.filter(card => card.column_id === col.id)
    }))

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

// POST /api/boards/:boardId/cards - 新增卡片
router.post('/:boardId/cards', auth, async (req, res) => {
  const { title, column_id } = req.body
  if (!title || !column_id)
    return res.status(400).json({ message: '請填寫卡片標題' })

  try {
    const [[{ maxPos }]] = await db.query(
      'SELECT MAX(position) as maxPos FROM cards WHERE column_id = ?',
      [column_id]
    )
    const position = (maxPos ?? -1) + 1

    const [result] = await db.query(
      'INSERT INTO cards (column_id, title, position) VALUES (?, ?, ?)',
      [column_id, title, position]
    )
    res.status(201).json({ id: result.insertId, column_id, title, position })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

// PATCH /api/boards/:boardId/cards/:cardId - 移動卡片（拖拉後更新）
router.patch('/:boardId/cards/:cardId', auth, async (req, res) => {
  const { column_id, position } = req.body
  try {
    await db.query(
      'UPDATE cards SET column_id = ?, position = ? WHERE id = ?',
      [column_id, position, req.params.cardId]
    )
    res.json({ message: 'ok' })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

// DELETE /api/boards/:boardId/cards/:cardId - 刪除卡片
router.delete('/:boardId/cards/:cardId', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM cards WHERE id = ?', [req.params.cardId])
    res.json({ message: '已刪除' })
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

module.exports = router
