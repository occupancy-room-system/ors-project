# Occupancy Room System (ORS) — End-to-End Setup & Run Guide

A complete step-by-step onboarding guide to set up, configure, and run the **Occupancy Room System (ORS)** from a clean machine to full-stack execution.

---

## 📑 Table of Contents

1. [Project Architecture & Directory Structure](#1-project-architecture--directory-structure)
2. [Required Toolchain & Versions](#2-required-toolchain--versions)
3. [Machine Setup: Automated (One-Click) vs. Manual](#3-machine-setup-automated-one-click-vs-manual)
4. [Step-by-Step Execution (Start to End)](#4-step-by-step-execution-start-to-end)
   - [Step 1: Start Database Infrastructure (`ors-infra`)](#step-1-start-database-infrastructure-ors-infra)
   - [Step 2: Start Spring Boot Backend (`ors-server`)](#step-2-start-spring-boot-backend-ors-server)
   - [Step 3: Start Next.js Frontend (`ors-frontend`)](#step-3-start-nextjs-frontend-ors-frontend)
5. [Verify Full-Stack Integration](#5-verify-full-stack-integration)
6. [Administrator Account & Access](#6-administrator-account--access)
7. [Common Pitfalls & Troubleshooting](#7-common-pitfalls--troubleshooting)
8. [Database Reset & Clean State](#8-database-reset--clean-state)
9. [Continuous Integration (CI) Workflow](#9-continuous-integration-ci-workflow)

---

## 1. Project Architecture & Directory Structure

The project is structured as a monorepo with three independent modules. Each module has a specific role and must be executed in its own terminal directory:

```text
Sec_Project/
├── ors-infra/          # Infrastructure & Database
│   ├── docker-compose.yml   # Docker Compose MySQL 8 definition
│   ├── init/
│   │   └── 01-init.sql      # Schema initialization & baseline data
│   ├── set_up.sh / .bat     # One-click environment installer & verifier
│   ├── startInfra.sh / .bat # One-click database startup script
│   └── README.md            # Infra overview & connection specs
│
├── ors-server/         # Backend API (Spring Boot 3.4, Java 21)
│   ├── mvnw / mvnw.cmd      # Maven wrapper (no local Maven install needed)
│   ├── pom.xml              # Maven dependencies & build config
│   └── src/                 # REST endpoints, JPA repositories, security rules
│
├── ors-frontend/       # Web Application (Next.js 16, React 19, Tailwind CSS)
│   ├── package.json         # Node dependencies and scripts
│   ├── app/                 # Next.js App Router (pages & admin dashboard)
│   └── components/          # Reusable UI & 2D Floor Plan components
│
├── instruction/        # Step-by-step developer setup instructions
├── doc/                # Architectural, database ERD, and threat modeling docs
└── api-doc/            # REST API endpoint reference
```

> [!IMPORTANT]
> **Directory Scope Rules:**
> - `npm` commands (`npm install`, `npm run dev`) **ONLY** run inside `ors-frontend/`. `ors-infra/` contains no Node files or `package.json`.
> - `mvn` commands (`mvn spring-boot:run`) **ONLY** run inside `ors-server/`.
> - Docker scripts (`startInfra.sh` / `startInfra.bat`) **ONLY** run inside `ors-infra/`.

---

## 2. Required Toolchain & Versions

Before running the application, ensure the following core tools are installed on your machine:

| Component | Target Version | Purpose |
| :--- | :--- | :--- |
| **Java JDK** | `21 (LTS)` | Runs the Spring Boot 3.4 backend (`ors-server`) |
| **Node.js** | `20.x LTS` or `22.x LTS` | Runs the Next.js 16 frontend (`ors-frontend`) |
| **npm** | `10.x+` | Package manager for the frontend |
| **Docker & Compose**| `24.x+` / Compose `v2.x+` | Runs the MySQL 8 database (`ors-infra`) |
| **Git** | Any modern version | Source code repository control |
| **Maven** | `3.9.x+` (`mvn`) | Build and execution tool for Spring Boot |

---

## 3. Machine Setup: Automated (One-Click) vs. Manual

### Option A: One-Click Automated Setup (`ors-infra`)

The `ors-infra` directory includes an automated setup script that detects your OS, installs any missing dependencies (Java 21, Node.js, Docker, Git), and prints a verification matrix.

#### macOS & Linux:
```bash
cd ors-infra
chmod +x set_up.sh
./set_up.sh
```

#### Windows:
Double-click **`set_up.bat`** in the `ors-infra` folder, or run in Git Bash:
```powershell
cd ors-infra
./set_up.sh
```

---

### Option B: Manual Setup by OS

If you prefer installing tools manually, follow these commands:

<details>
<summary><b>macOS (Homebrew)</b></summary>

```bash
# 1. Install Java 21 LTS
brew install openjdk@21
sudo ln -sfn $(brew --prefix openjdk@21)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk

# 2. Install Node.js 20 LTS
brew install node@20

# 3. Install Docker Desktop
brew install --cask docker
# Open Docker from Applications and wait until running
```
</details>

<details>
<summary><b>Linux (Ubuntu / Debian)</b></summary>

```bash
# 1. Update package lists
sudo apt update

# 2. Install Java 21
sudo apt install -y openjdk-21-jdk

# 3. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install Docker Engine
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Log out and log back in to apply docker group
```
</details>

<details>
<summary><b>Windows (winget)</b></summary>

```powershell
# 1. Install Java 21
winget install EclipseAdoptium.Temurin.21.JDK

# 2. Install Node.js LTS
winget install OpenJS.NodeJS.LTS

# 3. Install Docker Desktop
winget install Docker.DockerDesktop
```
</details>

#### Verify Installation:
```bash
java -version           # Expected: openjdk version "21.x.x"
node -version           # Expected: v20.x.x or v22.x.x
npm -version            # Expected: 10.x.x or 11.x.x
docker --version        # Expected: Docker version 24.x+
docker compose version  # Expected: Docker Compose version v2.x+
```

---

## 4. Step-by-Step Execution (Start to End)

To run the complete system, follow these 3 steps in order across **3 separate terminal windows / tabs**.

```
[Terminal 1: Database]   --> ors-infra/   (Host Port: 3307)
[Terminal 2: Backend]    --> ors-server/  (Host Port: 8080)
[Terminal 3: Frontend]   --> ors-frontend/(Host Port: 3000)
```

---

### Step 1: Start Database Infrastructure (`ors-infra`)

The database is MySQL 8 running inside a Docker container mapped to host port **3307**.

1. Open **Terminal 1** and navigate to `ors-infra`:
   ```bash
   cd Sec_Project/ors-infra
   ```

2. Make startup scripts executable and launch the container:
   - **macOS / Linux:**
     ```bash
     chmod +x startInfra.sh
     ./startInfra.sh
     ```
   - **Windows:**
     ```cmd
     startInfra.bat
     ```

   *Alternatively, using standard Docker Compose:*
   ```bash
   docker volume create occupancy_mysql_data
   docker compose up -d
   ```

3. Confirm that the container is healthy:
   ```bash
   docker ps -f name=ors-db
   ```
   **Expected STATUS:** `Up ... (healthy)` or `Up ...`

#### Database Parameters Reference:
| Parameter | Configuration | Notes |
| :--- | :--- | :--- |
| **Host** | `localhost` | Local machine |
| **Port** | `3307` | Mapped from container port `3306` to prevent conflict with local MySQL |
| **Database Name** | `orsdb` | Automatically initialized |
| **Username** | `root` | Root account |
| **Password** | `ors2026` | Root password |
| **Data Volume** | `occupancy_mysql_data` | Persistent Docker storage |

---

### Step 2: Start Spring Boot Backend (`ors-server`)

The backend connects to MySQL on port 3307, manages database migrations, seeds room layouts and workstations, and exposes REST API endpoints.

1. Open **Terminal 2** and navigate to `ors-server`:
   ```bash
   cd Sec_Project/ors-server
   ```

2. Run the application:
   ```bash
   mvn spring-boot:run
   ```

3. Wait until the startup log finishes. The output should conclude with:
   ```text
   Tomcat started on port 8080 (http)
   Started OrsApplication in x.xxx seconds
   ```

4. Verify backend health:
   ```bash
   curl http://localhost:8080/api/v1/health
   ```
   **Expected JSON output:**
   ```json
   {
     "service": "ors-server",
     "status": "UP",
     "databaseTargetPort": 3307,
     "databaseConnected": true,
     "totalSeats": 54
   }
   ```

---

### Step 3: Start Next.js Frontend (`ors-frontend`)

The frontend is built with Next.js 16 and Tailwind CSS v4, communicating with the backend at `http://localhost:8080`.

1. Open **Terminal 3** and navigate to `ors-frontend`:
   ```bash
   cd Sec_Project/ors-frontend
   ```

2. Install dependencies (first time or when dependencies change):
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

   **Expected output:**
   ```text
   ▲ Next.js 16.x.x (webpack)
   - Local:        http://localhost:3000
   - Network:      http://...
   ✓ Ready in 1.5s
   ```

> [!NOTE]
> `npm run dev` automatically includes `--webpack` to ensure stable compilation with Tailwind CSS v4. Do not run `npx next dev` without webpack.

---

## 5. Verify Full-Stack Integration

1. Open your browser and go to:
   ```text
   http://localhost:3000
   ```
2. You will see:
   - **Live Availability Banner**: Displays available desks vs. total capacity in the SE Lab.
   - **2D Floor Plan Canvas**: Shows Station A–E, Group Tables 1–5, and walkway entrance with color-coded seat statuses:
     - 🟢 **Green**: Available
     - ⚪ **Dark Gray**: Occupied / In Use
     - 🟣 **Indigo**: Reserved
     - 🟡 **Amber**: Expiring Soon
     - 🟠 **Orange / Wrench**: Under Maintenance
   - **Admin Management Panel**: Navigate to `http://localhost:3000/admin` to manage workstations, view live sessions, and configure users.

---

## 6. Administrator Account & Access

The database is initialized with a dedicated default administrator account:

| Field | Value |
| :--- | :--- |
| **Username** | `admin` |
| **Email** | `admin@gmail.com` |
| **Password** | `admin123` |
| **Role** | `ADMINISTRATOR` |
| **Admin Route** | [http://localhost:3000/admin](http://localhost:3000/admin) |

Team members can sign in with these credentials (using either `admin` or `admin@gmail.com` and password `admin123`) to access the admin dashboard, create/manage workstations, update desk statuses, and inspect sessions.

---

## 7. Common Pitfalls & Troubleshooting

### Error: `npm error enoent Could not read package.json in ors-infra`
- **Cause:** You ran `npm run dev` or `npm install` while inside `ors-infra/`.
- **Solution:** `ors-infra` is strictly for Docker. Switch to `ors-frontend`:
  ```bash
  cd ../ors-frontend
  npm run dev
  ```

### Port Conflicts (Already in Use)

| Port | Service | Resolution Command |
| :--- | :--- | :--- |
| **3307** | `ors-db` (MySQL) | `docker stop ors-db && docker rm ors-db` then re-run `./startInfra.sh` |
| **8080** | `ors-server` | macOS/Linux: `lsof -ti :8080 \| xargs kill -9`<br>Windows: `netstat -ano \| findstr :8080` then `taskkill /PID <PID> /F` |
| **3000** | `ors-frontend` | macOS/Linux: `lsof -ti :3000 \| xargs kill -9` |

### Error: `Cannot connect to the Docker daemon`
- **Cause:** Docker Desktop is not running or stopped.
- **Solution:** Open Docker Desktop from your operating system applications and wait until the status displays running.

### Error: `Connection refused` to port 3307 on backend startup
- **Cause:** The MySQL container is still initializing tables.
- **Solution:** Wait 5–10 seconds for the database to complete its first-time setup, then restart `mvn spring-boot:run`.

---

## 8. Database Reset & Clean State

If you want to clear all data and start from a completely clean database:

```bash
# 1. Stop and remove the Docker container and volume
cd Sec_Project/ors-infra
docker compose down
docker volume rm occupancy_mysql_data

# 2. Re-create volume and run 01-init.sql cleanly
./startInfra.sh
```

Once the database restarts, re-run `mvn spring-boot:run` in `ors-server/` to repopulate default rooms and workstations.

---

## 9. Continuous Integration (CI) Workflow

### What is CI and Why Do We Use It?
**Continuous Integration (CI)** is an automated quality-assurance system running on GitHub Actions. Every time code is pushed or a pull request is created:
1. **Prevents Broken Code**: An automated virtual machine checks out the code, installs dependencies, compiles everything, and runs all test suites. If an error is introduced, GitHub marks the commit with a ❌ red badge so broken code cannot reach `main`.
2. **Eliminates "It Works on My Machine"**: Because tests run on clean Ubuntu cloud runners, it proves the code works on any standard environment, not just your local laptop.
3. **Automates Regression Testing**: You don't have to manually remember to run tests before merging — CI does it for you.

### What ORS CI Checks Automatically:
The CI pipeline is defined in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) and runs three parallel jobs:

| Job | What it Does | Technology |
| :--- | :--- | :--- |
| **`Backend CI`** | Builds Java 21, runs integration & unit tests (`mvn test`), verifies executable `.jar` packaging | Spring Boot 3.4, JUnit 5, H2 In-Memory DB |
| **`Frontend CI`** | Installs clean dependencies (`npm ci`), runs TypeScript compilation, and verifies production web build (`npm run build`) | Next.js 16, TypeScript, React 19, Tailwind CSS |
| **`Infrastructure CI`** | Validates `docker-compose.yml` syntax and checks existence of `01-init.sql` schema | Docker Compose CLI |

### How to Use CI:
- **Automatic Execution**: You don't need to run any special command. Whenever you run:
  ```bash
  git push origin feature/your-feature-name
  ```
  GitHub automatically starts the CI workflow.
- **Viewing Test Results**:
  1. Open your repository on GitHub: `https://github.com/occupancy-room-system/ors-project`
  2. Click the **"Actions"** tab at the top.
  3. Click the latest workflow run to see live logs and status checkmarks (✅ Passed / ❌ Failed) for all jobs.
- **Pull Requests**: Pull requests show a green checkmark (`All checks have passed`) before you merge into `main`.

---

## 📚 Related Documentation

- [`README.md`](../README.md) — System overview, feature highlights, and architectural diagrams
- [`ors-infra/README.md`](../ors-infra/README.md) — Infrastructure setup details and Docker parameters
- [`doc/architecture.md`](../doc/architecture.md) — Deep-dive architecture and component design
- [`doc/database-erd.md`](../doc/database-erd.md) — Relational database schema and constraints
- [`api-doc/api-documentation.md`](../api-doc/api-documentation.md) — REST API endpoints and payload specifications
