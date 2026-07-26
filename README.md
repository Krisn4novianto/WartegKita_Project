# 🍛 WartegKita

**WartegKita** adalah platform pemesanan makanan berbasis web yang menghubungkan pelanggan dengan warteg dan warung makan di sekitarnya. Aplikasi ini memungkinkan pengguna menemukan warung terdekat, melihat katalog menu, melakukan pemesanan secara online, memilih metode pembayaran, serta memantau status pesanan secara real-time. Di sisi lain, pemilik warung dapat mengelola menu, stok, dan pesanan melalui dashboard merchant yang sederhana dan responsif.

---

# 📖 Latar Belakang

Warteg dan warung makan merupakan salah satu pilihan utama masyarakat Indonesia karena menawarkan makanan dengan harga terjangkau. Namun, sebagian besar warung tradisional masih mengandalkan pemesanan secara langsung sehingga pelanggan harus datang ke lokasi untuk mengetahui menu yang tersedia.

WartegKita dikembangkan sebagai solusi digital yang memudahkan pelanggan menemukan warung makan terdekat, memesan makanan secara online, serta membantu pemilik usaha memperluas jangkauan pelanggan melalui platform berbasis web.

---

# ✨ Fitur Utama

## 👤 Customer

* Registrasi dan Login
* Mencari warteg atau warung makan terdekat
* Menampilkan daftar merchant berdasarkan lokasi
* Pencarian merchant dan menu
* Melihat detail merchant
* Melihat daftar kategori makanan
* Melihat detail menu beserta gambar
* Menambahkan menu ke keranjang
* Mengubah jumlah pesanan
* Checkout pesanan
* Memilih metode pengiriman
* Memilih metode pembayaran
* Melakukan pembayaran
* Riwayat pesanan
* Melihat status pesanan secara real-time
* Responsive pada Desktop dan Mobile

---

## 🏪 Seller (Merchant)

* Login Merchant
* Dashboard Merchant
* Menambah menu baru
* Mengubah data menu
* Menghapus menu
* Upload gambar makanan
* Mengatur harga menu
* Mengatur stok menu
* Mengaktifkan atau menonaktifkan menu
* Melihat daftar pesanan
* Mengubah status pesanan
* Dashboard yang responsif

---

## 💳 Metode Pembayaran

* QRIS
* Virtual Account
* Transfer Bank
* Cash on Delivery (COD)
* PayPal *(simulasi)*

---

# 🛠 Tech Stack

## Frontend

* React
* TypeScript
* Vite
* React Router DOM
* Zustand
* Axios
* Lucide React
* SweetAlert2
* CSS3

## Backend

* Golang
* Gin Framework
* REST API
* JWT Authentication

## Database

* PostgreSQL

---

# 📂 Struktur Project

```text
WartegKita_Project
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   ├── store
│   │   ├── styles
│   │   ├── types
│   │   └── utils
│   └── package.json
│
├── backend
│   ├── cmd
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── utils
│   ├── go.mod
│   └── go.sum
│
└── README.md
```

---

# 🚀 Instalasi

## 1. Clone Repository

```bash
git clone https://github.com/Krisn4novianto/WartegKita_Project.git
```

```bash
cd WartegKita_Project
```

---

## 2. Menjalankan Frontend

Masuk ke folder frontend.

```bash
cd frontend
```

Install dependency.

```bash
npm install
```

Jalankan aplikasi.

```bash
npm run dev
```

Frontend akan berjalan pada:

```text
http://localhost:5173
```

---

## 3. Menjalankan Backend

Masuk ke folder backend.

```bash
cd backend
```

Install dependency Go.

```bash
go mod tidy
```

Jalankan server.

```bash
go run ./cmd/api
```

Backend akan berjalan pada:

```text
http://localhost:8080
```

---

# 🔌 REST API

Contoh endpoint yang tersedia.

| Method | Endpoint                | Keterangan          |
| ------ | ----------------------- | ------------------- |
| POST   | `/api/v1/auth/register` | Registrasi pengguna |
| POST   | `/api/v1/auth/login`    | Login               |
| GET    | `/api/v1/sellers`       | Daftar merchant     |
| GET    | `/api/v1/menus`         | Daftar menu         |
| POST   | `/api/v1/orders`        | Membuat pesanan     |
| GET    | `/api/v1/orders`        | Riwayat pesanan     |

---

# 📱 Tampilan Aplikasi

Aplikasi memiliki beberapa halaman utama:

* Login
* Register
* Home
* Explore Merchant
* Detail Merchant
* Keranjang
* Checkout
* Pembayaran
* Riwayat Pesanan
* Dashboard Seller
* Kelola Menu
* Kelola Pesanan

---

# 🎯 Tujuan Pengembangan

WartegKita dikembangkan sebagai implementasi sistem pemesanan makanan berbasis web menggunakan arsitektur **Frontend–Backend** dengan REST API. Proyek ini bertujuan untuk menerapkan konsep Full Stack Development menggunakan React, TypeScript, Golang, dan PostgreSQL sekaligus memberikan solusi digital bagi usaha warteg dan warung makan.

---

# 👨‍💻 Developer

**Krisna Novianto**

* Full Stack Developer
* React + TypeScript
* Golang (Gin)
* PostgreSQL
* REST API

---

# 📄 License

Project ini dibuat untuk tujuan pembelajaran, pengembangan portofolio, dan implementasi sistem pemesanan makanan berbasis web.
