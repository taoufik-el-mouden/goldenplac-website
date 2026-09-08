# Goldenplac Website

> Professional responsive website for **Goldenplac SL**, a Madrid-based company specialized in Pladur and interior renovation services.

[![Live Demo](https://img.shields.io/badge/Live-Demo-2ea44f?style=for-the-badge)](https://taoufik-el-mouden.github.io/goldenplac-website/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/taoufik-el-mouden/goldenplac-website)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#tech-stack)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#tech-stack)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111)](#tech-stack)

## 🚀 Live Demo

**Production-style static deployment:**

👉 https://taoufik-el-mouden.github.io/goldenplac-website/

## 📌 Project Overview

Goldenplac Website is a complete front-end web project designed to present a renovation company professionally online. The project focuses on a modern responsive interface, clear service presentation, project showcases, interactive customer tools, and simple browser-based content management.

The project was developed as a practical portfolio project demonstrating front-end development, responsive UI design, JavaScript application logic, browser storage, and static deployment with GitHub Pages.

## ✨ Key Features

- 📱 **Responsive design** for desktop, tablet, and mobile
- 🏗️ **Services and project showcase** for renovation activities
- 🖼️ **Before & After gallery** for visual project presentation
- 🧮 **Interactive renovation calculator**
- 💬 **Customer testimonials section**
- 🔐 **Admin interface** for local/demo content management
- 💾 **LocalStorage persistence** for browser-side data
- 🔒 **Web Crypto API** used in client-side security-related logic
- 🎨 **Reusable CSS components** and structured front-end assets
- ⚡ **Static deployment** through GitHub Pages and GitHub Actions

## 🛠️ Tech Stack

### Frontend

- **HTML5** — semantic page structure
- **CSS3** — responsive layout, components, and visual styling
- **JavaScript (ES6+)** — application logic and interactions
- **SVG** — scalable interface graphics and icons

### Browser APIs

- **LocalStorage API** — client-side persistence
- **Web Crypto API** — browser-side cryptographic functionality

### Deployment

- **GitHub Pages** — static hosting
- **GitHub Actions** — automated deployment workflow

## 🧩 Project Structure

```text
goldenplac-website/
├── index.html              # Main website
├── admin.html              # Admin/demo interface
├── tarjeta-visita.html     # Digital business card page
├── css/
│   ├── main.css
│   ├── components.css
│   └── admin.css
├── js/
│   ├── app.js
│   ├── store.js
│   └── admin.js
├── assets/
│   └── images/             # Website image assets
├── img/                    # Additional visual assets
├── .github/
│   └── workflows/
│       └── pages.yml       # GitHub Pages deployment workflow
└── README.md
```

## ⚙️ Run Locally

This project is a static front-end application and does not require a backend server.

### Option 1 — Python

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2 — Local project script

On Windows, you can also use the included `run_local.bat` script when available in the repository.

## 🔐 Security Note

The admin area is intentionally implemented with browser-side logic and LocalStorage because this project is designed as a static/demo application.

It should **not** be presented as a production-grade authentication system. A real production implementation should use a secure server-side backend, protected sessions, database authorization, and server-side validation.

## 📦 Deployment

The project is deployed automatically to GitHub Pages using the workflow in:

```text
.github/workflows/pages.yml
```

Every push to the `main` branch can trigger the deployment workflow.

## 🎯 What This Project Demonstrates

- Responsive web development
- Front-end architecture and file organization
- JavaScript DOM and application logic
- Client-side state management with LocalStorage
- Interactive UI components
- Form and calculator logic
- Gallery and content presentation
- Browser APIs
- Git and GitHub workflow
- CI/CD-style static deployment with GitHub Actions

## 👨‍💻 Developer

**Taoufik El Mouden**

- GitHub: https://github.com/taoufik-el-mouden
- LinkedIn: https://www.linkedin.com/in/el-mouden-taoufik-968088292/
- Portfolio: https://taoufik-el-mouden.xo.je

## 📄 CV / LinkedIn Description

**Goldenplac Website — Responsive Renovation Company Website**

Developed a responsive front-end website for a renovation company using HTML5, CSS3, and JavaScript. Implemented service and project showcases, a before/after gallery, an interactive renovation calculator, testimonials, browser-based data persistence, and an admin/demo interface. Deployed the project to GitHub Pages with GitHub Actions.

## ⭐ Portfolio Highlights

**Role:** Front-End Developer / Web Developer  
**Type:** Professional client-style website / Portfolio project  
**Focus:** Responsive UI, JavaScript interactions, browser APIs, and deployment  
**Status:** Live and deployed

---

⭐ If you find this project useful or interesting, feel free to explore the repository and live demo.