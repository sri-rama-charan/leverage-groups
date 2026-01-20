# How to Start the Project

## 1. Start the "Magic Bubbles" (Database)

1.  Open **Docker Desktop** app.
2.  Open a terminal in `c:\projects\leverage-groups`.
3.  Run:
    ```bash
    docker-compose up -d
    ```
    _(The `-d` means "detach", so it runs in the background and gives you your terminal back)_

## 2. Start the "Wizard" (Backend)

1.  Open a **new** terminal (or tab).
2.  Go to the server folder:
    ```bash
    cd server
    ```
3.  Start it:
    ```bash
    npm run dev
    ```

## 3. Start the "Gate" (Frontend)

1.  Open a **new** terminal (or tab).
2.  Go to the client folder:
    ```bash
    cd client
    ```
3.  Start it:
    ```bash
    npm run dev
    ```

---

**Summary for Pros:**
`docker-compose up -d` → `cd server && npm run dev` → `cd client && npm run dev`
