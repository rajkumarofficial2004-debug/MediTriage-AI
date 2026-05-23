# MedTriage - Urgent Care & Medical Triage Platform (VS Code Setup Guide)

This full-stack application utilizes **React (Vite) + TypeScript** on the client side and an **Express.js** backend routing custom comforts, triage logic, and **Gemini API** evaluations.

---

## 🚀 How to Export This Project to VS Code (Without ZIP File)

To get this entire project directly on your local machine without downloading a ZIP file:

1. Locate the **Settings** or **Export** option in the top right of the Google AI Studio build interface.
2. Select **Export to GitHub**.
3. Link your GitHub account and export it directly to a new repository.
4. Open your computer's terminal, navigate to your desired workspace, and clone the repository using:
   ```bash
   git clone <your-exported-github-repo-url>
   ```
5. Open this newly cloned folder directly in **VS Code**.

*(Alternatively, if you prefer, you can select **Export to ZIP** from the top right, download it, and extract the folder to open in VS Code.)*

---

## 🛠️ Local Machine Prerequisites

Make sure you have the following installed on your computer:
* **Node.js** (v18 or higher is recommended)
* **npm** (comes bundled with Node.js)
* **VS Code** (with the recommended *Vite*, *TypeScript*, and *Tailwind CSS* extension packages)

---

## 📦 Local Installation & Setup

Follow these steps inside your VS Code terminal to install and configure the application:

1. **Install Dependencies:**
   Open the VS Code built-in terminal (`Ctrl + ~` or `Cmd + ~`) and run:
   ```bash
   npm install
   ```

2. **Setup Your Environment Variables (`.env`):**
   Copy the `.env.example` file to a new file named `.env` in the root folder:
   ```bash
   cp .env.example .env
   ```
   Open the newly created `.env` file in VS Code and fill in the values:
   ```env
   # Your personal Gemini API Key
   GEMINI_API_KEY="your_actual_gemini_api_key_here"

   # URL where the app is running locally (usually http://localhost:3000)
   APP_URL="http://localhost:3000"
   ```

3. **Get a Gemini API Key:**
   If you don't already have one, create a free API key at [Google AI Studio (aistudio.google.com)](https://aistudio.google.com/) and paste it into your `.env` file.

---

## ⚡ Running the Application Locally

Our custom setup includes a single unified command to run both the Express backend and the Vite client concurrently:

### Development Mode (Recommended for testing)
To spin up the development environment, run:
```bash
npm run dev
```
* **Client & API Portal**: Open your browser to **`http://localhost:3000`**.
* In development, Express automatically mounts the Vite dev server as middleware to handle hot component reloads.

### Production Build & Test
If you want to compile and build the production bundle (exactly how it compiles in the Cloud Run container):
```bash
# 1. Compile the build (Vite asset packaging + esbuild node bundler)
npm run build

# 2. Boot up the standalone production server
npm run start
```

---

## 📁 Key Project Architecture

* **`/server.ts`**: The main Express backend server that provisions local route fallbacks for medical symptoms and routes secure, proxy-safe telemetry queries to the Google Gemini AI model.
* **`/src/geminiService.ts`**: Handles client-side API calls to our Express backend. If the backend fails or experiences rate limits, it contains a fully engineered offline medical comfort engine to provide users with direct physical relief remedies immediately.
* **`/src/App.tsx`**: The main React layout dashboard, housing the medical triage questionnaire, interactive chat panels, health history logs, and user configurations.
* **`/src/types.ts`**: Fully declared TypeScript interfaces guarding data persistence across offline and cloud sync cycles.
* **`/firestore.rules`**: Secure database policies enforcing safe access for personal user health evaluations.
