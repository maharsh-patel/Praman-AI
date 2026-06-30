# Praman AI - Upload. Analyze. Visualize. Ask.

Praman AI is an intelligent data assistant that parses structured spreadsheet datasets, computes automated statistical insights, renders dynamic visual charts, and enables natural language interaction with your data using Google's Gemini API (Free Tier).

## Tech Stack
- **Backend**: Node.js + Express (ports: 5000)
- **Frontend**: React + Vite + Tailwind CSS (ports: 5173)
- **Visuals**: Chart.js + React-Chartjs-2
- **AI Engine**: Google Gemini API (gemini-1.5-flash)
- **Data Parser**: SheetJS (XLSX)

---

## Getting Started (Step-by-Step)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (LTS version recommended).

---

### Step 1: Configure Backend & API Key
1. Open the file [backend/.env](file:///e:/uvpce/Capstone%20Project/backend/.env).
2. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
3. Replace the placeholder `your_gemini_api_key_here` with your actual key:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
   *(Note: If you do not add an API key, the app will run in **Offline/Fallback Mode** with local statistical insights and pre-configured mocks.)*

---

### Step 2: Install and Start the Backend
Open a terminal in the project directory and run:

```bash
# Navigate to the backend directory
cd backend

# Install dependencies (use npm.cmd on Windows if scripts are disabled)
npm install

# Start the backend server in development mode
npm run dev
```
The backend will run on [http://localhost:5000](http://localhost:5000). You can verify it is active by checking the health endpoint [http://localhost:5000/health](http://localhost:5000/health).

---

### Step 3: Install and Start the Frontend
Open a **new separate terminal** in the project directory and run:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```
Vite will host the frontend dashboard on [http://localhost:5173](http://localhost:5173). Open this URL in your web browser.

---

## Testing Your Setup

1. On the homepage, upload the provided sample dataset: [sample_sales_data.csv](file:///e:/uvpce/Capstone%20Project/sample_sales_data.csv).
2. Explore the tabs:
   - **Data Grid & Stats**: View the dataset structure, missing value analysis, and column summaries.
   - **Chart Sandbox**: Toggle between Bar, Line, Pie, and Scatter charts, select different axes, or check AI-recommended charts.
   - **AI Insights & Chat**: Read the Gemini executive summary and try chatting with the agent (e.g., *"What product has the highest profit margin?"*).
3. Click **Export Report** in the header to save/print a PDF snapshot of your dashboard.
