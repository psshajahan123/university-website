# 🎓 EduPortal — University Results Management System

A full-stack web application to display and manage semester results across multiple universities, built with **React + Vite** (frontend) and **Node.js + Express + MySQL** (backend).

---

## 📁 File Structure

```
university-results/
│
├── frontend/                        # React + Vite application
│   ├── public/
│   ├── src/
│   │   ├── App.jsx                  # Main component (views: Dashboard, Results, Student)
│   │   ├── App.css                  # Global styles & design system
│   │   └── main.jsx                 # React entry point
│   ├── index.html                   # HTML shell
│   ├── vite.config.js               # Vite + proxy config
│   └── package.json
│
├── backend/                         # Node.js + Express API
│   ├── server.js                    # Express server + all API routes
│   ├── .env.example                 # Environment variable template
│   ├── .env                         # Your actual env vars (git-ignored)
│   └── package.json
│
├── database/
│   └── schema.sql                   # MySQL schema + triggers + seed data
│
└── README.md                        # This file
```

---

## 🗄️ Database Schema

```
universities  ─┐
departments   ─┤
students      ─┼─→  results  ←─ subjects
               ┘
```

| Table          | Purpose                                   |
|----------------|-------------------------------------------|
| `universities` | University master list                    |
| `departments`  | Department per university                 |
| `students`     | Student info linked to university & dept  |
| `subjects`     | Subject catalog with credit hours         |
| `results`      | Result record per student × subject × sem |

---

## ⚙️ Prerequisites

Ensure the following are installed:

| Tool       | Version  | Install                                |
|------------|----------|----------------------------------------|
| Node.js    | v18+     | https://nodejs.org                     |
| npm        | v9+      | Comes with Node                        |
| MySQL      | v8+      | https://dev.mysql.com/downloads/       |
| Git        | Any      | https://git-scm.com                    |

---

## 🚀 Setup & Deployment

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/university-results.git
cd university-results
```

---

### Step 2 — Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# OR run schema directly
mysql -u root -p < database/schema.sql
```

This creates the `university_results` database, all tables, a grade trigger, and seeds sample data.

**Verify the setup:**
```sql
USE university_results;
SHOW TABLES;
SELECT COUNT(*) FROM students;
```

---

### Step 3 — Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=university_results
PORT=5000
```

---

### Step 4 — Install & Run Backend

```bash
# From /backend directory
npm install

# Production start
npm start

# Development (auto-restart on file change)
npm run dev
```

✅ Backend runs at: **http://localhost:5000**

Test it:
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/universities
curl http://localhost:5000/api/results?semester=3&year=2023
curl http://localhost:5000/api/results/student/2021CS001
```

---

### Step 5 — Install & Run Frontend

```bash
# From /frontend directory (open a new terminal)
cd ../frontend
npm install

# Development server
npm run dev
```

✅ Frontend runs at: **http://localhost:3000**

> API calls to `/api/*` are auto-proxied to `http://localhost:5000` via Vite config — no CORS issues in development.

---

## 🏗️ Build for Production

### Build Frontend

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Serve Frontend with Express (optional)

Add this to `backend/server.js` before `app.listen`:

```js
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

Then start only the backend:
```bash
cd backend
npm start
```

Full app available at **http://localhost:5000** ✅

---

## ☁️ Deploy to a VPS / Cloud Server (Ubuntu)

### Install dependencies on server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm mysql-server nginx git

# Enable & secure MySQL
sudo systemctl start mysql
sudo mysql_secure_installation
```

### Setup MySQL on server

```bash
sudo mysql -u root -p < database/schema.sql
```

### Clone & configure

```bash
git clone https://github.com/your-username/university-results.git
cd university-results/backend
cp .env.example .env
nano .env   # fill in your DB credentials
```

### Build & install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install && npm run build
```

### Run with PM2 (process manager)

```bash
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name "university-results-api"
pm2 save
pm2 startup   # enable auto-start on reboot
```

### Configure Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/university-results
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve React build
    root /path/to/university-results/frontend/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/university-results /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Add HTTPS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

---

## 🐳 Docker Compose (Optional)

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: university_results
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASSWORD: rootpass
      DB_NAME: university_results
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

```bash
docker-compose up --build
```

---

## 📡 API Reference

| Method | Endpoint                         | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | `/health`                        | Server health check                |
| GET    | `/api/universities`              | List all universities              |
| GET    | `/api/results`                   | Results (filters: university, semester, year) |
| GET    | `/api/results/student/:regNo`    | Full result card for a student     |
| GET    | `/api/stats`                     | Summary statistics                 |

---

## 🔧 Environment Variables

| Variable      | Default               | Description              |
|---------------|-----------------------|--------------------------|
| `DB_HOST`     | `localhost`           | MySQL host               |
| `DB_USER`     | `root`                | MySQL username           |
| `DB_PASSWORD` | *(empty)*             | MySQL password           |
| `DB_NAME`     | `university_results`  | Database name            |
| `PORT`        | `5000`                | Backend server port      |

---

## 🧑‍💻 Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, CSS3 (custom)       |
| Backend  | Node.js, Express 4                  |
| Database | MySQL 8 (with stored triggers)      |
| Dev Tool | Nodemon, PM2, Nginx                 |

---

## 📝 License

MIT — free to use and modify.
