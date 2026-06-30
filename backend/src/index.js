import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import upload from './middleware/uploadMiddleware.js';
import {
  uploadAndParseFile,
  getInsights,
  getVisualizationRecommendations,
  askQuestion
} from './controllers/dataController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend origin (Vite defaults to http://localhost:5173 or http://127.0.0.1:5173)
app.use(cors({
  origin: '*', // Allow all in development, can narrow down to http://localhost:5173
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase JSON payload limit to handle dataset communication
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simple logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Praman AI Backend Service is running.' });
});

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), uploadAndParseFile);

// AI Agent Endpoints
app.post('/api/insights', getInsights);
app.post('/api/visualizations', getVisualizationRecommendations);
app.post('/api/chat', askQuestion);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Praman AI Backend listening on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`==================================================`);
});
