# Collab Code AI - Real-Time Collaborative Code Editor with AI Pair Programmer

A real-time collaborative code editor that allows multiple developers to work together on the same codebase with AI assistance.

## 🎯 Project Goals

- **Real-time collaboration**: Multiple users can edit the same document simultaneously
- **AI pair programming**: Get intelligent code suggestions and explanations
- **Modern UI**: Clean, intuitive interface built with React and Monaco Editor
- **Scalable architecture**: Built with Node.js backend and WebSocket communication

## 🚀 Features (Planned)

### Core Features
- [ ] Real-time collaborative code editing
- [ ] Syntax highlighting for multiple languages
- [ ] AI-powered code suggestions and explanations
- [ ] User authentication and document ownership
- [ ] Document persistence and version history

### Advanced Features
- [ ] User presence indicators (see who's online)
- [ ] Real-time cursor and selection sharing
- [ ] Chat functionality between collaborators
- [ ] Dark/light theme support
- [ ] Code execution and sandboxing

## 🛠 Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Monaco Editor** - Code editor (same as VS Code)
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **JWT** - Authentication
- **OpenAI API** - AI code assistance

### Development & Deployment
- **Docker** - Containerization
- **Git** - Version control
- **ESLint/Prettier** - Code formatting

## 📁 Project Structure

```
collab-code-ai/
├── frontend/          # React application
├── backend/           # Node.js server
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collab-code-ai
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm start    # Start development server
```

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collab-code-ai
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

See our detailed roadmap in the project documentation for phase-by-phase development plans.

---

**Happy coding! 🚀** 