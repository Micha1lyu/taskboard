const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ message: '請填寫所有欄位' })

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0)
      return res.status(409).json({ message: '此 Email 已被註冊' })

    const hash = await bcrypt.hash(password, 10)
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    )

    const token = jwt.sign(
      { id: result.insertId, email, name, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, user: { id: result.insertId, name, email, role: 'user' } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: '請填寫 Email 和密碼' })

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length === 0)
      return res.status(401).json({ message: 'Email 或密碼錯誤' })

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return res.status(401).json({ message: 'Email 或密碼錯誤' })

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

module.exports = router
