# ORS Infrastructure

One-click automated developer environment setup and Docker services for the ORS project.

---

## 🚀 One-Click Setup for Empty Machines

The setup scripts install, configure, and verify all required dependencies from an empty machine:

- **Git** (Version control)
- **Java 21 LTS** (OpenJDK 21 / Eclipse Temurin for `ors-server`)
- **Apache Maven** (Spring Boot build tool)
- **Node.js LTS & npm** (For `ors-frontend` / Next.js)
- **Docker Desktop & Docker Compose** (For MySQL container)

### Run Setup:

#### On macOS / Linux:
```bash
cd ors-infra
./set_up.sh
```

#### On Windows:
Double-click **`set_up.bat`** (or in Git Bash: `./set_up.sh`).

---

## 📊 Verification Matrix & Pass/Fail Output

The script executes a self-contained test matrix verifying tool versions against regular expressions:

```text
==> Verifying All Requirements
  [PASS]  Git: git version 2.50.1
  [PASS]  Java (JDK 21): openjdk version "21.0.5" 2024-10-15 LTS
  [PASS]  Apache Maven: Apache Maven 3.9.12
  [PASS]  Node.js (LTS): v24.18.0
  [PASS]  npm: 11.16.0
  [PASS]  Docker CLI: Docker version 28.3.2
  [PASS]  Docker Compose: Docker Compose version v5.3.1

==> Result: 7 Passed, 0 Failed
✔ SUCCESS: Your machine is 100% ready to run the ORS project!
```

---

## 🗄️ Start MySQL Infrastructure

Starts the `ors-db` MySQL container with volume persistence and health-checking:

#### On macOS / Linux:
```bash
cd ors-infra
./startInfra.sh
```

#### On Windows:
Double-click **`startInfra.bat`**.

### Database Parameters:
- **Host:** `localhost`
- **Port:** `3307` (mapped from container `3306`)
- **Database:** `orsdb`
- **Username:** `root`
- **Password:** `ors2026`
- **Volume:** `occupancy_mysql_data`
- **Container:** `ors-db`

---

## 💻 Running the Entire Application

1. **Start Database:**
   ```bash
   cd ors-infra && ./startInfra.sh
   ```
2. **Start Backend (`ors-server`):**
   ```bash
   cd ../ors-server && mvn spring-boot:run
   ```
3. **Start Frontend (`ors-frontend`):**
   ```bash
   cd ../ors-frontend && npm install && npm run dev
   ```
