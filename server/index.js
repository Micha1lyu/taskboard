require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
})

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/boards', require('./routes/boards'))
app.use('/api/boards', require('./routes/cards'))
app.use('/api/admin', require('./routes/admin'))

app.get('/', (req, res) => res.send('TaskBoard API is running 🚀'))

// Socket.io - 即時同步
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // 加入看板的 room
  socket.on('join_board', (boardId) => {
    socket.join(`board:${boardId}`)
    console.log(`Socket ${socket.id} joined board:${boardId}`)
  })

  // 卡片移動 - 廣播給同一個看板的其他人
  socket.on('card_moved', (data) => {
    // data: { boardId, cardId, column_id, position }
    socket.to(`board:${data.boardId}`).emit('card_moved', data)
  })

  // 卡片新增
  socket.on('card_added', (data) => {
    socket.to(`board:${data.boardId}`).emit('card_added', data)
  })

  // 卡片刪除
  socket.on('card_deleted', (data) => {
    socket.to(`board:${data.boardId}`).emit('card_deleted', data)
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
