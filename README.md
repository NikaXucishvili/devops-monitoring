# 🚀 DevOps Monitoring Platform

A full-stack **DevOps monitoring system** built with **React (Vite), Node.js, Docker, Jenkins, and Prometheus stack**.  
It provides real-time system metrics visualization, container monitoring, and a fully automated CI/CD pipeline.

---

# 📌 Features

- 📊 Real-time system monitoring dashboard (CPU, RAM, Disk, Network)
- 📈 Live sparkline graphs with historical data tracking
- 🚨 Alert system (critical / warning / normal states)
- 🐳 Fully containerized using Docker & Docker Compose
- 🔁 CI/CD automation using Jenkins
- 📡 Monitoring stack:
  - Prometheus (metrics collection)
  - Node Exporter (host metrics)
  - cAdvisor (container metrics)
- ⚡ Backend API (Node.js)
- 🎨 Frontend dashboard (React + Vite)

---

# 🏗 Architecture

Frontend (React/Vite)
        ↓
Backend (Node.js API)
        ↓
Prometheus ← Node Exporter + cAdvisor
        ↓
Jenkins (CI/CD Automation)
        ↓
Docker Compose (Container Orchestration)

---

# 📁 Project Structure

devops-monitoring/
│
├── frontend/            # React + Vite dashboard
├── backend/             # Node.js API
├── prometheus/          # Prometheus configuration
├── docker-compose.yml   # Multi-container setup
├── Jenkinsfile          # CI/CD pipeline
└── README.md

---

# ⚙️ Requirements

Before running this project, install:

- Docker
- Docker Compose
- Git
- Jenkins (optional for CI/CD execution)

---

# 🚀 How to Run Locally

## 1. Clone the repository

git clone https://github.com/NikaXucishvili/devops-monitoring.git
cd devops-monitoring

---

## 2. Start all services

docker compose up -d --build

---

## 3. Open in browser

| Service | URL |
|--------|-----|
| Frontend Dashboard | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Jenkins | http://localhost:8081 |
| Prometheus | http://localhost:9090 |
| Node Exporter | http://localhost:9100 |
| cAdvisor | http://localhost:8082 |

---

# 🔁 CI/CD Pipeline (Jenkins)

The Jenkins pipeline automates the full deployment process:

1. Pull latest code from GitHub
2. Install dependencies (frontend + backend)
3. Build frontend (Vite)
4. Build Docker images
5. Deploy using Docker Compose

---

# 🐳 Docker Services

- frontend → React Vite UI
- backend → Node.js API
- prometheus → metrics system
- node-exporter → system metrics
- cadvisor → container metrics
- jenkins → CI/CD automation server

---

# 📊 Monitoring Features

- CPU usage tracking
- RAM usage tracking
- Disk usage monitoring
- Network I/O visualization
- Real-time alerts (critical / warning / normal)
- Session-based history tracking

---

# 💡 What I Learned

- CI/CD pipeline design with Jenkins
- Docker container orchestration
- Full-stack DevOps architecture
- Monitoring systems with Prometheus
- Real-time dashboard development
- Production vs development environment separation

---

# 🚀 Future Improvements

- Grafana dashboard integration
- Kubernetes deployment
- GitHub Actions CI/CD alternative
- Cloud deployment (AWS / DigitalOcean)
- Authentication system for dashboard
- Multi-environment setup (dev/staging/prod)

---

# 👨‍💻 Author

Name: Nika Khutsishvili  
GitHub: https://github.com/NikaXucishvili  

---

# ⭐ If you like this project

Feel free to star ⭐ the repository and share it.
