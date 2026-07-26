# WartegKita

Platform digital untuk mencari warteg/warung makan terdekat, melihat menu, memesan makanan, dan memantau status pesanan.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Golang + Gin
- Database: PostgreSQL
- State: Zustand
- HTTP Client: Axios

## Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```

## Menjalankan Backend
```bash
cd backend
go mod tidy
go run ./cmd/api
```

Frontend: http://localhost:5173
Backend: http://localhost:8080
