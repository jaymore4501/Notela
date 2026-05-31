# ☁️ Notela — Cloud Deployment Guide

This guide provides instructions to compile, configure, run, and deploy the Notela student productivity platform in both local and cloud environments.

---

## 🛠️ 1. Installation

To install Notela on your host machine or deployment server:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Notela/Notela.git
    cd Notela
    ```

2.  **Install Node.js & Package Manager**:
    Ensure you have Node.js (version 20+ recommended) installed. Install dependencies using:
    ```bash
    npm install
    ```

---

## ⚙️ 2. Configuration & Environment Variables

Notela handles settings and secrets via environment variables. Do **not** commit environment configuration files to your source control.

Create a `.env.local` file in your root workspace directory (for local runs) or define the variables in your cloud hosting provider's panel (for production deployments).

### Required Environment Variable

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `MONGODB_URI` | Full connection URI to your MongoDB instance | `mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/notela?retryWrites=true&w=majority` |

*Note: The MongoDB database driver automatically creates collection indexes (for user auth and workspace caching performance) upon the first connection request in the deployed environment.*

---

## 🚀 3. Quick Start (Local Run)

To start the application locally for testing:

1.  **Run Development Mode**:
    ```bash
    npm run dev
    ```
2.  **Access the application**:
    Open a web browser and go to `http://localhost:3000`.
3.  **Build Check (Optional)**:
    Ensure there are no compilation errors prior to committing:
    ```bash
    npm run build
    ```

---

## ☁️ 4. Deploying to Cloud Providers

### 4.1 Provisioning MongoDB Atlas (Database Layer)
1.  Sign up for a free tier database at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a new Database User (username and password). Record these securely.
3.  Set up **Network Access**: Add `0.0.0.0/0` (allow access from anywhere) to allow dynamic serverless IPs from cloud hosts to reach your database.
4.  Copy the connection URI from Atlas and replace `<username>` and `<password>` with your created database credentials.

### 4.2 Deploying to Vercel (Serverless Next.js Hosting)
Vercel is the recommended hosting platform for Next.js applications:

1.  Import your repository into the **Vercel Dashboard**.
2.  Under **Environment Variables**, add:
    *   **Name**: `MONGODB_URI`
    *   **Value**: *[Your full MongoDB Atlas connection string]*
3.  Click **Deploy**. Vercel will build, optimize, and serve the application automatically.
4.  Once deployed, your database collection indexes are instantly verified and initialized upon the first successful API request.

---

## 📄 5. License
This project is open-source and licensed under the [MIT License](./LICENSE).
