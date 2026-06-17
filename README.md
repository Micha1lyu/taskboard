# 📋 TaskBoard — 即時任務協作平台

互動式網頁設計期末專題  
**線上Demo：** https://taskboard-eight-xi.vercel.app

---

## 📌 專案簡介

TaskBoard 是一個類似 Trello 的即時任務協作平台。  
使用者可以建立看板、新增任務卡片並拖拉移動狀態，所有操作透過 Socket.io 即時同步給所有在線使用者。

---

## ✨ 功能列表

- 🔐 會員系統（註冊 / 登入 / 登出）
- 🪙 JWT 身份驗證
- 📋 建立 / 刪除看板
- 🗂️ 三欄看板（待辦 / 進行中 / 完成）
- 🃏 新增 / 刪除任務卡片
- 🖱️ 拖拉卡片跨欄移動
- ⚡ Socket.io 即時同步（多人同時操作）
- 🛡️ 管理員後台（查看 / 刪除帳號 / 升降權限）

---

## 🛠️ 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React (Vite) + Vanilla CSS |
| 後端 | Node.js + Express |
| 即時通訊 | Socket.io |
| 資料庫 | MySQL |
| 身份驗證 | JWT + bcryptjs |
| 拖拉功能 | @dnd-kit/core |

---

## 🚀 部署架構

```
使用者瀏覽器
     ↕
Vercel（前端 React）
     ↕
Render（後端 Express + Socket.io）
     ↕
Railway（MySQL 資料庫）
```

---

## 🗄️ 資料庫結構

```sql
users       — 使用者帳號（id, name, email, password_hash, role）
boards      — 看板（id, name, owner_id）
board_members — 看板成員
columns     — 欄位（id, board_id, name, position）
cards       — 任務卡片（id, column_id, title, position）
```

---

## ⚙️ 本機開發

### 前置需求
- Node.js 18+
- MySQL 8.0+
- Git

### 安裝步驟

**1. Clone 專案**
```bash
git clone https://github.com/Micha1lyu/taskboard.git
cd taskboard
```

**2. 安裝後端依賴**
```bash
npm install
```

**3. 安裝前端依賴**
```bash
cd client
npm install
cd ..
```

**4. 設定環境變數**

複製並編輯 `.env`：
```
PORT=3001
JWT_SECRET=your_secret_key

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密碼
DB_NAME=taskboard
```

前端 `client/.env`：
```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

**5. 建立資料庫**

在 MySQL 執行 `server/schema.sql`

**6. 啟動伺服器**

後端：
```bash
node server/index.js
```

前端（另開終端機）：
```bash
cd client
npm run dev
```

打開 http://localhost:5173

---

## 🛡️ 設定管理員帳號

註冊帳號後，在 MySQL 執行：
```sql
USE taskboard;
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

重新登入後即可看到管理員後台。

---

## 📁 專案結構

```
taskboard/
├── server/
│   ├── index.js          # Express 主程式 + Socket.io
│   ├── db.js             # MySQL 連線池
│   ├── schema.sql        # 資料庫結構
│   ├── middleware/
│   │   └── auth.js       # JWT 驗證 middleware
│   └── routes/
│       ├── auth.js       # 登入 / 註冊 API
│       ├── boards.js     # 看板 CRUD API
│       ├── cards.js      # 卡片 CRUD API
│       └── admin.js      # 管理員 API
├── client/
│   ├── src/
│   │   ├── App.jsx       # 路由設定
│   │   ├── api.js        # Axios 封裝
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Board.jsx
│   │       └── Admin.jsx
│   └── vercel.json
└── README.md
```

---

## 👤 作者

Michael Yu — 互動式網頁設計期末專題 2026
