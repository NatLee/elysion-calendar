# Elysion Calendar

![demo](./doc/demo.gif)

快速查詢艾利森日K用的小小日曆 🥰

## Usage

1. Clone this repository

2. Use docker compose to build and run the project

```bash
docker compose up --build
```

3. Open your browser and go to `http://localhost:3000`

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

5. Open your browser and go to `http://localhost:3000`


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