# Nexlance - Premium Freelance Marketplace (MERN Stack)

Nexlance is a professional, high-end freelance marketplace designed with the premium aesthetics of Fiverr and Upwork. It connects clients and freelancers, enabling real-time collaboration, job postings, interactive profiles, and file-sharing chat threads.

---

## 🚀 Key Features

* **🎨 Fiverr/Upwork-Style Premium UI:** Clean layout built using modern CSS variables, glassmorphic card designs, subtle hover animations, and dark-themed components.
* **🔒 Secure OTP Gmail Authentication:** tabbed credentials login, forgot password workflows, and OTP validation via Nodemailer integration.
* **🌐 Google OAuth 2.0 Integration:** Single-click login and registration with automated profile avatar fetching.
* **💬 Real-Time Chat System:** Real-time messaging using Socket.IO with typing indicators and online/offline status signals.
* **📎 Multi-Format File Attachments:** Share resume PDFs, project images, or zipped documents (up to 10MB) directly in chat bubbles.
* **🔗 Autolink Parser:** Detects web URLs within chat logs and formats them automatically into clickable hyperlinks.
* **📈 Dual Role Dashboards:**
  * **Client Dashboard:** Post new jobs, view application counts, manage proposals, and mark projects as completed.
  * **Freelancer Dashboard:** Browse active jobs, apply with cover letters/proposed budgets, toggle saved listings, and track application statuses.
* **📱 Responsive Layout & Mobile Drawer:** Re-engineered side drawer and backdrop layout optimized for mobile screens.
* **🔄 Seamless Page Scrolling:** Automatic scroll-to-top routing.

---

## 🛠️ Technology Stack

### Frontend (Client)
* **Core:** React 18, Vite (Fast build system)
* **Routing:** React Router v6
* **API Calls:** Axios (with auth bearer token interceptors)
* **Sockets:** Socket.io-client
* **Styling:** Vanilla CSS (Tailwind-free custom tokens design system)

### Backend (Server)
* **Core:** Node.js, Express.js
* **Database:** MongoDB (using Mongoose ODM)
* **Real-time Engine:** Socket.IO
* **Email Service:** Nodemailer (SMTP configuration)
* **File Uploads:** Multer (Disk storage engine)
* **Encryption:** Bcrypt.js (Password hashing) & JSON Web Tokens (JWT)

---

## 📂 Project Directory Structure

```text
Nexlance/
├── client/                 # React Frontend (Vite)
│   ├── public/             # Static Assets & Netlify redirects configuration
│   └── src/
│       ├── components/     # UI elements (Navbar, Footer, Spinner, EmptyState)
│       ├── context/        # Context Providers (Auth, Toast, Socket)
│       ├── pages/          # Full page views (Home, BrowseJobs, Dashboard, Profile)
│       ├── services/       # Modular API fetch methods (Job, Application, Profile)
│       └── utils/          # Formatting helpers and global constants
│
└── server/                 # Express Backend API
    ├── config/             # DB connection configs
    ├── controllers/        # Route logic controllers
    ├── middleware/         # Auth checkers, file loaders, error handlers
    ├── models/             # Mongoose DB schemas (User, Job, Application, Message)
    ├── routes/             # REST routing paths
    ├── socket/             # Real-time WebSocket handlers
    └── utils/              # Email handlers and text validators
```

---

## 💻 Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) installed.
* [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster active.

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/Kanhiya-Gulati/Nexlance.git
cd Nexlance

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the **`server`** directory:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_signing_key
PORT=5000
NODE_ENV=development
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

Create a `.env` file in the **`client`** directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 3. Run the Application
Start the Backend API Server:
```bash
cd server
npm run dev
```

Start the Vite Frontend Development Server:
```bash
cd client
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ Deployment Configurations

* **Frontend Hosting (Netlify):** Base directory: `client` | Build Command: `npm run build` | Publish Directory: `client/dist`. Includes `_redirects` for React Router reload routing.
* **Backend Hosting (Render):** Root Directory: `server` | Build Command: `npm install` | Start Command: `npm start`. Set environment keys on Render panel dashboard.

---

## 👨‍💻 Author

Developed and maintained by **Kanhiya Gulati**.

* **GitHub Profile:** [@Kanhiya-Gulati](https://github.com/Kanhiya-Gulati)
* **Email:** [kanhiyagulati11@gmail.com](mailto:kanhiyagulati11@gmail.com)

---

## 📄 License & Usage

This project is open-source. Anyone is free to use, modify, and distribute it for educational or personal projects. If you use this project, **please remember to credit the original author** by linking back to [Kanhiya Gulati's GitHub](https://github.com/Kanhiya-Gulati).
