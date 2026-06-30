import * as xlsx from 'xlsx';
import { generateDataInsights, recommendVisualizations, askQuestionAboutData } from '../services/geminiService.js';

/**
 * Helper: Infers data types and calculates statistics for each column
 */
function analyzeDataset(data, fileName) {
  if (!data || data.length === 0) {
    return {
      fileName,
      rowCount: 0,
      columnCount: 0,
      columns: []
    };
  }

  const rowCount = data.length;
  // Get all unique keys across all rows
  const keys = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => keys.add(key));
  });
  const columnNames = Array.from(keys);
  
  const columnsAnalysis = columnNames.map(colName => {
    let nullCount = 0;
    let numericCount = 0;
    let dateCount = 0;
    const values = [];

    data.forEach(row => {
      const val = row[colName];
      if (val === null || val === undefined || val === '') {
        nullCount++;
      } else {
        values.push(val);
        // Check if numeric
        if (!isNaN(Number(val)) && typeof val !== 'boolean') {
          numericCount++;
        }
        // Simple date check
        if (isNaN(Number(val)) && !isNaN(Date.parse(val))) {
          dateCount++;
        }
      }
    });

    const nonNullCount = values.length;
    let inferredType = 'text';

    if (nonNullCount > 0) {
      if (numericCount / nonNullCount > 0.8) {
        inferredType = 'numeric';
      } else if (dateCount / nonNullCount > 0.8) {
        inferredType = 'date';
      }
    }

    const stats = {
      missingValues: nullCount,
      missingPercentage: parseFloat(((nullCount / rowCount) * 100).toFixed(2))
    };

    if (inferredType === 'numeric') {
      const numValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      const sum = numValues.reduce((acc, curr) => acc + curr, 0);
      const min = Math.min(...numValues);
      const max = Math.max(...numValues);
      const mean = parseFloat((sum / numValues.length).toFixed(2));
      
      // Calculate median
      numValues.sort((a, b) => a - b);
      const mid = Math.floor(numValues.length / 2);
      const median = numValues.length % 2 !== 0 ? numValues[mid] : parseFloat(((numValues[mid - 1] + numValues[mid]) / 2).toFixed(2));

      stats.min = min;
      stats.max = max;
      stats.mean = mean;
      stats.median = median;
      stats.sum = parseFloat(sum.toFixed(2));
    } else {
      // Categorical frequency
      const freq = {};
      values.forEach(v => {
        const strVal = String(v).trim();
        freq[strVal] = (freq[strVal] || 0) + 1;
      });

      const uniqueCount = Object.keys(freq).length;
      const sortedFreq = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      stats.uniqueValues = uniqueCount;
      stats.topCategories = sortedFreq;
    }

    return {
      name: colName,
      type: inferredType,
      stats
    };
  });

  return {
    fileName,
    rowCount,
    columnCount: columnNames.length,
    columns: columnsAnalysis
  };
}

/**
 * Controller: Handles CSV/Excel upload and parsing
 */
export async function uploadAndParseFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a CSV or Excel file.' });
    }

    const originalName = req.file.originalname;
    
    // Parse using SheetJS (XLSX) from the file buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    
    // Use the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse to JSON format
    const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: null });

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'The uploaded file is empty.' });
    }

    // Auto-Analysis Agent: infer columns types & statistics
    const metadata = analyzeDataset(rawData, originalName);

    // Return parsing results: metadata, sample rows for preview, and full parsed data
    return res.status(200).json({
      message: 'File parsed and analyzed successfully.',
      metadata,
      previewRows: rawData.slice(0, 100), // First 100 rows for preview grid
      fullData: rawData // All rows for local client manipulation
    });
  } catch (error) {
    console.error('File parsing error:', error);
    return res.status(500).json({ error: `Failed to process file: ${error.message}` });
  }
}

/**
 * Controller: Handles generating dataset insights using Gemini
 */
export async function getInsights(req, res) {
  try {
    const { metadata, sampleRows } = req.body;

    if (!metadata || !sampleRows) {
      return res.status(400).json({ error: 'Missing metadata or sampleRows in request body.' });
    }

    const insights = await generateDataInsights(metadata, sampleRows);
    return res.status(200).json(insights);
  } catch (error) {
    console.error('Insights generation error:', error);
    return res.status(500).json({ error: `Failed to generate insights: ${error.message}` });
  }
}

/**
 * Controller: Handles recommending charts for the dataset
 */
export async function getVisualizationRecommendations(req, res) {
  try {
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({ error: 'Missing dataset metadata.' });
    }

    const recommendations = await recommendVisualizations(metadata);
    return res.status(200).json(recommendations);
  } catch (error) {
    console.error('Visualization recommendation error:', error);
    return res.status(500).json({ error: `Failed to recommend visualizations: ${error.message}` });
  }
}

/**
 * Controller: Handles natural language Q&A about the dataset
 */
export async function askQuestion(req, res) {
  try {
    const { metadata, sampleRows, question, chatHistory } = req.body;

    if (!metadata || !sampleRows || !question) {
      return res.status(400).json({ error: 'Missing metadata, sampleRows, or question in request body.' });
    }

    const answerResponse = await askQuestionAboutData(metadata, sampleRows, question, chatHistory || []);
    return res.status(200).json(answerResponse);
  } catch (error) {
    console.error('Q&A Agent error:', error);
    return res.status(500).json({ error: `Failed to get response from Q&A Agent: ${error.message}` });
  }
}
