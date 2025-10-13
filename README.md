# Dynamic Repository Explorer

A full-stack application that allows users to explore GitHub repositories with a clean, modern interface.

## Features

- Browse GitHub repositories with real-time search
- View repository details including stars, forks, and open issues
- Responsive design that works on desktop and mobile
- Caching for improved performance
- Rate limiting for API protection

## Technologies Used

### Frontend
- **React** - Frontend library for building user interfaces
- **TypeScript** - Static typing for JavaScript
- **Vite** - Build tool and development server
- **Axios** - HTTP client for API requests
- **React Query** - Data fetching and state management
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Static typing for JavaScript
- **GitHub REST API** - For fetching repository data
- **Node-Cache** - In-memory caching
- **Express Rate Limit** - Basic rate-limiting middleware
- **Envalid** - Environment variable validation
- **CORS** - Cross-Origin Resource Sharing middleware

### Development Tools
- **Git** - Version control
- **npm** - Package management
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **ts-node-dev** - Development execution

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn
- GitHub Personal Access Token (with `repo` and `user` scopes)

## Setup Instructions

### Backend (Service) Setup

1. Navigate to the service directory:
   ```bash
   cd service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `service` directory with the following content:
   ```env
   NODE_ENV=development
   PORT=3001
   ALLOWED_ORIGINS=http://localhost:3000
   GITHUB_TOKEN=your_github_token_here
   CACHE_TTL=300
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend (Client) Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `client` directory with the following content:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Testing

### Backend Tests

The backend includes unit and integration tests using Jest and Supertest.

To run the backend tests:

```bash
cd service
npm test
```

Test coverage includes:
- API endpoint testing
- Service layer testing
- Error handling
- Input validation

### Frontend Tests

The frontend uses React Testing Library for component testing.

To run the frontend tests:

```bash
cd client
npm test
```

Test coverage includes:
- Component rendering
- Error boundaries
- User interactions
- State management

### Running Tests with Coverage

To generate coverage reports:

```bash
# Backend coverage
cd service
npm test -- --coverage

# Frontend coverage
cd ../client
npm test -- --coverage
```

## Project Structure

```
dynamic-repo-explorer/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # React source code
│       ├── components/    # Reusable UI components
│       ├── services/      # API service layer
│       └── styles/        # Global styles
└── service/               # Backend Node.js/Express service
    ├── src/
    │   ├── config/       # Configuration files
    │   ├── controllers/  # Request handlers
    │   ├── routes/       # API routes
    │   └── services/     # Business logic
    └── tests/            # Test files
```

## AI Usage Statement

This project was developed with the assistance of Windsurf (Codeium) AI in the following areas:

1. **Project Setup**: Initial project structure and configuration files were set up using Windsurf's AI capabilities
2. **Code Implementation**: Implementation of core features including:
   - GitHub API integration and data fetching logic
   - Error handling and boundary implementation
   - State management and component architecture
3. **Troubleshooting**: Assistance with debugging and resolving technical issues
4. **Code Reviews**: Suggestions for code improvements and best practices

All code was reviewed and modified as needed to meet project requirements and ensure quality standards.

## License

This project is licensed under the MIT License - see the [LICENSE] file for details.

## Acknowledgments

- GitHub API for providing the repository data
- Create React App for the frontend scaffolding
- Express.js for the backend server
- Various open-source libraries and tools used throughout the project
