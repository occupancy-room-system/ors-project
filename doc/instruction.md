# Onboarding — Machine Setup

Everything you need to install to build, run, and test **Occupancy Room System (ORS)** on
Windows, macOS, or Linux. Follow the sections in order; the whole thing takes about 15–20
minutes, most of it downloads.

---

## 1. Required versions

These are the versions the project targets. Install exactly these unless a section below says
otherwise.

| Tool       | Version   | Used for                                   |
| ---------- | --------- | ------------------------------------------ |
| Java JDK   | `21 (LTS)` | `ors-server` (Spring Boot backend API)    |
| Node.js    | `20.x LTS` | `ors-frontend` (Next.js web application)  |
| Docker     | `24.x+`    | `ors-infra` (MySQL 8 database container)  |
| npm        | `10.x+`    | Frontend dependency management             |

You also need these, which have no pinned version — install whatever your OS provides:

| Tool  | Why                          |
| ----- | ---------------------------- |
| Git   | Cloning, committing          |
| Maven | Bundled via `./mvnw` wrapper — no separate install needed |

---

## 2. Install the toolchain

### Java 21

<details>
<summary><b>macOS</b></summary>

```bash
brew install openjdk@21
sudo ln -sfn $(brew --prefix openjdk@21)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk
```
</details>

<details>
<summary><b>Linux (Ubuntu / Debian)</b></summary>

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
```
</details>

<details>
<summary><b>Windows</b></summary>

```powershell
winget install EclipseAdoptium.Temurin.21.JDK
```

Or download the installer from https://adoptium.net/temurin/releases/?version=21

</details>

Verify:

```bash
java -version
# Expected: openjdk version "21.x.x"
```

---

### Node.js 20 LTS

<details>
<summary><b>macOS</b></summary>

```bash
brew install node@20
```
</details>

<details>
<summary><b>Linux (Ubuntu / Debian)</b></summary>

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
</details>

<details>
<summary><b>Windows</b></summary>

```powershell
winget install OpenJS.NodeJS.LTS
```

Or download from https://nodejs.org/en/download (choose the LTS version).

</details>

Verify:

```bash
node --version   # Expected: v20.x.x
npm --version    # Expected: 10.x.x
```

---

### Docker Desktop

Download and install from https://www.docker.com/products/docker-desktop

- **macOS / Windows**: Launch Docker Desktop and wait until the whale icon in the menu bar / system tray is steady (not animated).
- **Linux**: Follow https://docs.docker.com/engine/install/ for your distro. After install, run `sudo usermod -aG docker $USER` and log out/in.

Verify:

```bash
docker --version
docker compose version
# Expected: Docker version 24.x+, Docker Compose version v2.x+
```

---

## 3. Clone the repository

```bash
git clone <repository_url>
cd Sec_Project
```

You should see:

```
Sec_Project/
├── ors-infra/       # Docker MySQL 8 infrastructure
├── ors-server/      # Spring Boot 3.4 backend (port 8080)
├── ors-frontend/    # Next.js 16 web app (port 3000)
└── doc/             # Documentation
```

---

## 4. Start the database (`ors-infra`)

The database is MySQL 8 running in Docker on **host port 3307**.

**macOS / Linux:**

```bash
cd ors-infra
chmod +x startInfra.sh
./startInfra.sh
```

**Windows:**

```cmd
cd ors-infra
startInfra.bat
```

Verify the container is running:

```bash
docker ps -f name=ors-db
# STATUS column should say: Up
```

> The script automatically creates the Docker volume `occupancy_mysql_data` and runs the
> initial schema + seed SQL (`init/01-init.sql`) on a fresh volume. On subsequent starts it
> reuses the existing data — no data is lost.

Connection details if you need them directly:

| Parameter | Value        |
| --------- | ------------ |
| Host      | `localhost`  |
| Port      | `3307`       |
| Database  | `orsdb`      |
| User      | `root`       |
| Password  | `ors2026`    |

---

## 5. Start the backend (`ors-server`)

Open a **new terminal tab**, then:

**macOS / Linux:**

```bash
cd ors-server
chmod +x mvnw
./mvnw spring-boot:run
```

**Windows:**

```cmd
cd ors-server
mvnw.cmd spring-boot:run
```

Spring Boot connects to MySQL on port 3307, runs JPA schema migration, seeds 54 workstations,
and starts a background session-expiry scheduler. Startup takes about 10–15 seconds.

Successful startup log ends with:

```
>>> ORS Database already initialized with 54 workstations.
Tomcat started on port 8080 (http)
Started OrsApplication in x.xxx seconds
```

Verify the backend is alive:

```bash
curl http://localhost:8080/api/v1/health
```

Expected response:

```json
{
  "service": "ors-server",
  "status": "UP",
  "databaseTargetPort": 3307,
  "databaseConnected": true,
  "activeSessions": 2,
  "totalSeats": 54
}
```

---

## 6. Start the frontend (`ors-frontend`)

Open a **third terminal tab**, then:

```bash
cd ors-frontend
npm install
npm run dev
```

Expected output:

```
▲ Next.js 16.4.3 (webpack)
- Local:   http://localhost:3000
✓ Ready in 1.8s
```

Open http://localhost:3000 in your browser.

> `npm run dev` uses `--webpack` internally. Do **not** remove that flag — Next.js 16 with
> Tailwind CSS v4 crashes under Turbopack in this project.

---

## 7. Verify the full stack

With all three terminals running, open http://localhost:3000. You should see:

- **Navbar** with tabs: *2D Floor Plan*, *QR Check-In*, *My Session*, *History*, *Admin*
- **Availability banner**: e.g. `48 / 54 Desks Available`
- **Interactive 2D floor plan** with colour-coded desks (green = available, red = occupied, indigo = reserved, amber = expiring, grey = maintenance)
- **Current user** shown as `Alex Chen (Student)` in the top right

> If the banner says *"ORS Backend is starting or offline"*, click **Retry Connection** after
> the Spring Boot terminal shows `Tomcat started on port 8080`.

---

## 8. Demo accounts

These accounts are seeded automatically on first database startup.

| Role          | Name               | Email                                   | Password        |
| ------------- | ------------------ | --------------------------------------- | --------------- |
| Administrator | Prof. Robert Vance | `admin@university.edu`                  | `AdminPass123!` |
| Student       | Alex Chen          | `alex.chen@student.university.edu`      | `StudentPass123!` |
| Student       | Sarah Kim          | `sarah.kim@student.university.edu`      | `StudentPass123!` |
| Student       | Marcus Taylor      | `marcus.taylor@student.university.edu`  | `StudentPass123!` |
| Student       | Emily Zhao         | `emily.zhao@student.university.edu`     | `StudentPass123!` |

Click the user badge in the top-right header to switch accounts without typing credentials.

---

## 9. Troubleshooting

**Port already in use**

| Port | Module    | Fix                                                                 |
| ---- | --------- | ------------------------------------------------------------------- |
| 3307 | `ors-db`  | `docker stop ors-db && docker rm ors-db`, then rerun `./startInfra.sh` |
| 8080 | `ors-server` | `lsof -ti :8080 \| xargs kill -9` (macOS/Linux) or `netstat -ano \| findstr :8080` then `taskkill /PID <id> /F` (Windows) |
| 3000 | `ors-frontend` | `lsof -ti :3000 \| xargs kill -9` (macOS/Linux)                |

**`Cannot connect to the Docker daemon`**
Docker Desktop is not running. Open it and wait for the whale icon to stop animating.

**`Connection refused` to port 3307 on backend startup**
MySQL container is still initialising. Wait 10 seconds and rerun `./mvnw spring-boot:run`.

**Next.js Turbopack panic on `npm run dev`**
The `package.json` `dev` script already includes `--webpack`. If you see a Turbopack error,
make sure you are running `npm run dev` and not `npx next dev` directly.

**Reset the database to a clean state**

```bash
cd ors-infra
docker compose down
docker volume rm occupancy_mysql_data
./startInfra.sh   # re-runs 01-init.sql on a fresh volume
```

---

## Where to go next

- [`README.md`](../README.md) — project overview, feature list, architecture diagram
- [`doc/architecture.md`](../doc/architecture.md) — system design and module responsibilities
- [`doc/database-erd.md`](../doc/database-erd.md) — entity-relationship diagram for all 7 tables
- [`api-doc/api-documentation.md`](../api-doc/api-documentation.md) — REST API endpoint reference

