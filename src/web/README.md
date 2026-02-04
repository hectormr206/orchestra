# Orchestra Web UI

Modern web interface for Orchestra CLI built with React, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Start and monitor orchestration tasks
- **Sessions**: View and manage active/completed sessions
- **Plugins**: Browse and install plugins from marketplace
- **Settings**: Configure server connection and preferences
- **Real-time updates**: WebSocket integration for live monitoring
- **Dark/Light theme**: Toggle between themes
- **Responsive design**: Works on desktop and mobile

## Development

```bash
cd src/web
npm install
npm run dev
```

The web UI will be available at `http://localhost:3000`.

## Build

```bash
npm run build
```

Production files will be in `dist/`.

## Architecture

- **Vite**: Fast build tool and dev server
- **React 19**: UI framework
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS
- **Axios**: HTTP client for API calls
- **TypeScript**: Type safety

## API Integration

The web UI connects to Orchestra Server at `http://localhost:8080` by default. Configure the server URL in Settings.

## Pages

- `/` - Dashboard (task input and stats)
- `/sessions` - Sessions list and details
- `/plugins` - Plugin marketplace
- `/settings` - Configuration

## Environment Variables

- `VITE_API_URL` - Orchestra Server URL (default: http://localhost:8080)
- `VITE_AUTH_TOKEN` - Optional authentication token

## License

MIT
