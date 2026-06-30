# Implementation Plan - IDataAgent AI: Transform Data into Decisions

IDataAgent AI is a full-stack, AI-powered data assistant that allows users to upload structured data (CSV/Excel files), preview it, automatically analyze and visualize it with dynamic charts, and query the dataset using natural language powered by the Google Gemini API (Free Tier).

## User Review Required

> [!IMPORTANT]
> - **Gemini API Key**: To use the AI capabilities, you will need a free API key from [Google AI Studio](https://aistudio.google.com/). We will guide you to save it in a `.env` file in the `backend/` directory.
> - **Local Port Configuration**: By default, the backend will run on port `5000` and the frontend on port `5173` (Vite's default). Ensure these ports are available.
> - **File Size Limits**: In the MVP, we will limit file uploads to 5MB and support CSV and XLSX/XLS files to ensure reliable parsing in memory.

## Proposed Changes

We will create a multi-package folder structure (frontend and backend) within the project root `e:/uvpce/Capstone Project`.

```
Capstone Project/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── dataController.js
│   │   ├── services/
│   │   │   └── geminiService.js
│   │   ├── middleware/
│   │   │   └── uploadMiddleware.js
│   │   └── index.js
│   ├── .env
│   ├── .gitignore
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.jsx
    │   │   ├── DataPreview.jsx
    │   │   ├── FileUpload.jsx
    │   │   ├── InsightPanel.jsx
    │   │   └── Visualizations.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── vite.config.js
```

---

### Component: Backend (Node.js + Express)

The backend handles file upload parsing, data transformation, metadata extraction (Auto-Analysis Agent), and interfaces with the Google Gemini API (Insight, Visualization recommendation, and Q&A Agent).

#### [NEW] [backend/package.json](file:///e:/uvpce/Capstone%20Project/backend/package.json)
Contains backend dependencies: `express`, `cors`, `multer` (for upload handling), `xlsx` (for parsing XLSX and CSV), `dotenv`, and `@google/generative-ai` (Gemini SDK).

#### [NEW] [backend/.env](file:///e:/uvpce/Capstone%20Project/backend/.env)
Contains configurations like `PORT=5000` and `GEMINI_API_KEY=your_key_here`.

#### [NEW] [backend/src/middleware/uploadMiddleware.js](file:///e:/uvpce/Capstone%20Project/backend/src/middleware/uploadMiddleware.js)
Multer configuration to accept CSV and Excel files, validating size and mime-types.

#### [NEW] [backend/src/services/geminiService.js](file:///e:/uvpce/Capstone%20Project/backend/src/services/geminiService.js)
Encapsulates Gemini API calls, constructing prompt templates for:
1. **Visualization suggestions** (recommending matching charts for selected features).
2. **Executive summaries & insights** (interpreting dataset statistical properties).
3. **Chat Q&A** (answering questions about the data by passing context summaries or row subsets to Gemini).

#### [NEW] [backend/src/controllers/dataController.js](file:///e:/uvpce/Capstone%20Project/backend/src/controllers/dataController.js)
Contains business logic for:
- Uploading and parsing files with `xlsx`.
- Extracting metadata: column headers, inferred types (numeric, date, text), missing values, basic row/col counts, and summary statistics (min, max, mean, categories).
- Serving parsed dataset segments for previews.
- Orchestrating Gemini requests.

#### [NEW] [backend/src/index.js](file:///e:/uvpce/Capstone%20Project/backend/src/index.js)
Entry point setting up the Express application, logging middleware, CORS, and endpoint routing.

---

### Component: Frontend (React + Vite + Tailwind CSS + Chart.js)

The frontend provides a polished dashboard for users to interact with their data, explore visualizations, and chat with their AI data assistant.

#### [NEW] [frontend/package.json](file:///e:/uvpce/Capstone%20Project/frontend/package.json)
Contains frontend dependencies: `react`, `react-dom`, `chart.js`, `react-chartjs-2`, `lucide-react` (icons), and development tools (Vite, TailwindCSS, Autoprefixer, PostCSS).

#### [NEW] [frontend/tailwind.config.js](file:///e:/uvpce/Capstone%20Project/frontend/tailwind.config.js) & [frontend/postcss.config.js](file:///e:/uvpce/Capstone%20Project/frontend/postcss.config.js)
Configures Tailwind CSS utilities and responsive styling.

#### [NEW] [frontend/src/index.css](file:///e:/uvpce/Capstone%20Project/frontend/src/index.css)
Initializes Tailwind layers and custom styling for a modern dashboard (e.g., sleek card backgrounds, modern scrollbars, vibrant animations).

#### [NEW] [frontend/src/components/FileUpload.jsx](file:///e:/uvpce/Capstone%20Project/frontend/src/components/FileUpload.jsx)
A drag-and-drop file upload area supporting file drop, showing upload progress/state, and handling error reporting.

#### [NEW] [frontend/src/components/DataPreview.jsx](file:///e:/uvpce/Capstone%20Project/frontend/src/components/DataPreview.jsx)
A responsive table showing the first 10-20 rows of the uploaded dataset, displaying inferred data types, column filters, and dataset shape.

#### [NEW] [frontend/src/components/Visualizations.jsx](file:///e:/uvpce/Capstone%20Project/frontend/src/components/Visualizations.jsx)
Renders dynamic charts (Bar, Line, Pie/Doughnut, Scatter) using Chart.js based on selected columns. Also displays AI recommended charts.

#### [NEW] [frontend/src/components/InsightPanel.jsx](file:///e:/uvpce/Capstone%20Project/frontend/src/components/InsightPanel.jsx)
Displays:
1. **Executive Summary**: The structural and high-level AI analysis of the dataset.
2. **AI Q&A Chat**: An interactive chat interface where users ask questions (e.g., "What was the highest sales month?", "Find the anomalies in column X") and receive context-aware responses.

#### [NEW] [frontend/src/components/Dashboard.jsx](file:///e:/uvpce/Capstone%20Project/frontend/src/components/Dashboard.jsx)
Main dashboard container orchestrating the state (current file data, active view tab, loaded summaries) and rendering the widgets.

---

## Verification Plan

### Automated Tests
We will verify endpoints manually using Curl or custom test scripts, and test React rendering using Vite's server.

### Manual Verification
1. **Backend Server Launch**:
   - Run `npm install` and `npm run dev` (or `node src/index.js`) in `backend/`.
   - Verify health check endpoint returns 200 OK.
2. **Upload & Parse Verification**:
   - Upload sample CSV files and Excel files.
   - Verify response returns metadata containing: list of columns, data types, and row data.
3. **Gemini API Integration**:
   - Send requests requesting executive summaries.
   - Run Q&A with typical data questions and verify relevance of AI response.
4. **Frontend UI Walkthrough**:
   - Run `npm run dev` in `frontend/`.
   - Verify responsive navigation works on mobile and desktop layout.
   - Walk through upload -> preview -> auto-generated insights -> chart rendering -> Q&A chat.
   - Export reports (using print layout or simple download option).
