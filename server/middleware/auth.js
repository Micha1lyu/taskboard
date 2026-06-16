const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) return res.status(401).json({ message: '未登入' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { id, email, name }
    next()
  } catch (err) {
    return res.status(403).json({ message: 'Token 無效或已過期' })
  }
}
