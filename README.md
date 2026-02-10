# timegen — backend

Express + TypeScript starter for the Time Table Generator API.


Quick start

1. Install dependencies

```bash
npm install
```

2. Start in development mode (auto-restarts)

```bash
npm run dev
```

3. Build and run production

```bash
npm run build
npm start
```

Environment

Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.

Project structure (backend)

- `src/index.ts` — server entry
- `src/config` — env-based configuration
- `src/db` — MongoDB connection helper
- `src/models` — Mongoose models (`User`)
- `src/services` — business logic (auth, timetable)
- `src/controllers` — request handlers
- `src/routes` — route composition (`/api/auth`, `/api/timetable`)
- `src/middlewares` — auth and error handlers

Auth

Register/login endpoints available under `/api/auth`.

Local MongoDB with Docker Compose

1. Copy `.env.docker` and edit credentials if you wish (default values provided).

2. Start MongoDB and mongo-express UI:

```bash
docker compose --env-file .env.docker up -d
```

3. Set your app `.env` `MONGO_URI` to connect to the containerized DB. Example:

```
MONGO_URI=mongodb://admin:example@localhost:27017/timegen?authSource=admin
```

4. Stop and remove containers:

```bash
docker compose --env-file .env.docker down -v
```

Open the mongo-express UI at http://localhost:8081 (default from `.env.docker`).


