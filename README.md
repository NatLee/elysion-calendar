# Elysion Calendar

![demo](./doc/demo.gif)

快速查詢艾利森日K用的小小日曆 🥰

## Usage

### Development Mode (with Watch Support)

For development with hot reloading and watch mode:

```bash
# Start development environment
./dev.sh

# Or manually:
docker-compose -f docker-compose.dev.yml up --build
```

This will start:
- Frontend with hot reload at `http://localhost:3001`
- Backend with auto-reload at `http://localhost:8000`
- Nginx proxy at `http://localhost:3000`

### Production Mode

For production deployment:

```bash
# Start production environment
./prod.sh

# Or manually:
docker-compose up --build
```

This will start the application at `http://localhost:3000`

### Quick Start

1. Clone this repository
2. Choose your mode and run the appropriate command above
3. Open your browser and navigate to the provided URL

## Frontend Debug

1. Go to `frontend` directory

```bash
cd frontend
```

2. Install dependencies

```bash
yarn install
```

3. Start the frontend server

```bash
yarn start
```

4. Back to the root directory and start the backend server

```bash
cd ..
docker compose up -f docker-compose.dev.yml --build
```

5. Open your browser and go to `http://localhost:3001`

> Notice: Port 3000 is your default frontend server, but you need to through the backend NGINX server to access the frontend.


## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/NatLee"><img src="https://avatars.githubusercontent.com/u/10178964?v=3?s=100" width="100px;" alt="Nat Lee"/><br /><sub><b>Nat Lee</b></sub></a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

[MIT](./LICENSE)