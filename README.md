# AI Code Agent
## Product Summary

AI Code Agent is a tool that allows developers to integrate their GitHub repositories with AI, understanding the codebase and assisting in the development process. By using the Google Gemini API, it can perform intelligent queries on the codebase, provide code suggestions, and apply automatic corrections.

## Key Features

### 1. GitHub Integration and User Management

- User login with GitHub OAuth
- Access and listing of the user's GitHub repositories
- Automatic indexing of the selected repository and saving to the vector database

### 2. Codebase Indexing and AI Training

- Automatic code indexing with GitHub repository URL
- Storage of code structure in the vector database (MongoDB)
- Training the Gemini AI model on the codebase
- Real-time code analysis and indexing status tracking

### 3. AI Chat Interface

- Modern and user-friendly interface similar to ChatGPT
- Syntax highlighting with colored code responses
- Ability to select files and query specific code snippets
- Code generation, editing, and error correction suggestions
- Chat history and context tracking

## Technical Architecture

### Frontend

- React + TypeScript
- Vite build tool
- Key Libraries:
  - React Router (page management)
  - CodeMirror/Monaco Editor (code viewing/editing)
  - Axios (HTTP requests)
  - TailwindCSS (styling)
  - React Query (data management)

### Backend

- Node.js + Express.js
- Key Features:
  - RESTful API endpoints
  - WebSocket support (real-time communication)
  - GitHub API integration
  - Google Gemini API integration
  - Vector database management

### Database

- MongoDB
  - User information
  - Repo metadata
  - Vector indices
  - Chat history

## Security Requirements

- Secure authentication with GitHub OAuth 2.0
- Secure management of API keys
- Rate limiting and DDoS protection
- Encryption of user data

## Performance Requirements

- Page load time < 2 seconds
- AI response time < 3 seconds
- Concurrent user support
- Scalable database structure

## API Endpoints

### Auth Endpoints

```http
POST /api/auth/github/login     # Start GitHub OAuth
GET  /api/auth/github/callback  # GitHub OAuth callback
POST /api/auth/logout          # Logout
GET  /api/auth/me              # Current user information
```

### GitHub Endpoints

```http
GET  /api/github/repos                    # List user's repositories
POST /api/github/repos/index              # Start repository indexing
GET  /api/github/repos/:owner/:repo       # Get repository details
GET  /api/github/repos/:owner/:repo/files # List repository files
GET  /api/github/repos/:owner/:repo/file  # Get content of a specific file
```

### Gemini AI Endpoints

```http
POST /api/ai/chat                # Chat with AI
POST /api/ai/analyze            # Code analysis
POST /api/ai/suggest            # Code suggestion
POST /api/ai/fix                # Error correction
GET  /api/ai/chat/history       # Chat history
```

### Database Endpoints

```http
GET    /api/db/vectors/:repoId  # Get repository vectors
POST   /api/db/vectors/search   # Perform vector search
DELETE /api/db/vectors/:repoId  # Delete repository vectors
```

### WebSocket Endpoints

```websocket
ws://api/ws/indexing  # Indexing status tracking
ws://api/ws/chat     # Real-time AI chat
```

## Installation

```bash
# Frontend installation
cd frontend
npm install
npm run dev

# Backend installation
cd backend
npm install
npm run dev
```

## Environment Variables

```env
# Backend
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GEMINI_API_KEY=
MONGODB_URI=

# Frontend
VITE_API_URL=
```

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

## Color Scheme

The Tailwind color scheme used in the project:

```javascript
{
  'iris': {
    DEFAULT: '#454ade',
    100: '#090a31',
    200: '#111463',
    300: '#1a1e94',
    400: '#2328c6',
    500: '#454ade',
    600: '#6a6ee5',
    700: '#8f92eb',
    800: '#b4b6f2',
    900: '#dadbf8'
  },
  'space_cadet': {
    DEFAULT: '#1b1f3b',
    100: '#05060c',
    200: '#0b0c18',
    300: '#101324',
    400: '#161930',
    500: '#1b1f3b',
    600: '#363d75',
    700: '#515caf',
    800: '#8b92ca',
    900: '#c5c9e4'
  },
  'electric_purple': {
    DEFAULT: '#b14aed',
    100: '#260639',
    200: '#4c0b71',
    300: '#7211aa',
    400: '#9816e2',
    500: '#b14aed',
    600: '#c16ef1',
    700: '#d092f4',
    800: '#e0b7f8',
    900: '#efdbfb'
  },
  'french_mauve': {
    DEFAULT: '#c874d9',
    100: '#2e0e34',
    200: '#5b1d68',
    300: '#892b9c',
    400: '#b33fca',
    500: '#c874d9',
    600: '#d38fe0',
    700: '#deabe8',
    800: '#e9c7f0',
    900: '#f4e3f7'
  },
  'fairy_tale': {
    DEFAULT: '#e1bbc9',
    100: '#391925',
    200: '#73324a',
    300: '#ac4c6f',
    400: '#c8829c',
    500: '#e1bbc9',
    600: '#e7c9d4',
    700: '#edd7df',
    800: '#f3e4ea',
    900: '#f9f2f4'
  }
}
```

This color scheme is consistently used in UI components to provide a modern and professional appearance.
