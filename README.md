# TeleVault

A file management platform that uses Telegram as a secure cloud storage backend.

## 🚀 Features

-   **Massive File Support**: Automatically splits files over 2GB into multiple parts to bypass Telegram's limits. Supports 10GB, 20GB, or even larger archives.
-   **Seamless Streaming**: Download large multi-part files as a single continuous stream directly in your browser.
-   **Direct Telegram Link**: High-speed transfers using the MTProto protocol with up to 16 parallel upload workers.
-   **Total Privacy**: No intermediate servers store your data; files go directly from your local system to your private Telegram channel.

## 🛠️ Project Structure

-   `/backend`: Node.js/Express server handling Telegram MTProto integration.
-   `/frontend`: React/Vite dashboard for managing and downloading files.

## ⚙️ Setup Instructions

### 1. Prerequisites
-   Node.js (v18+)
-   Telegram `API_ID` and `API_HASH` (get them from [my.telegram.org](https://my.telegram.org))

### 2. Backend Configuration
1.  Navigate to `backend/`.
2.  Create a `.env` file based on `.env.example`.
3.  Fill in your Telegram credentials.
4.  Run `npm install`.

### 3. Frontend Configuration
1.  Navigate to `frontend/`.
2.  Run `npm install`.

### 4. Running the Project
From the root directory, run:
```bash
npm run dev
```
This will start both the backend and the frontend simultaneously.

