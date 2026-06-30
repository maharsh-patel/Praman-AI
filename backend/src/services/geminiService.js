import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('WARNING: GEMINI_API_KEY is not configured or is using the default placeholder. Running in offline/mock mode.');
}

/**
 * Helper to call Gemini model with fallback
 */
async function callGemini(prompt, systemInstruction = '') {
  if (!genAI) {
    return JSON.stringify({
      error: "Gemini API key is not configured. Please add your GEMINI_API_KEY in the backend/.env file to enable AI features.",
      mock: true
    });
  }

  try {
    // Using gemini-1.5-flash as it is highly capable and free-tier friendly
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: systemInstruction
    });

    return result.response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // If JSON mode fails or generic error occurs, try standard call
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return JSON.stringify({ text: result.response.text() });
    } catch (fallbackError) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }
}

/**
 * AI Agent: Insight Agent & Report Agent
 * Generates an executive summary and business insights
 */
export async function generateDataInsights(metadata, sampleRows) {
  const prompt = `
    You are the "Insight Agent" and "Report Agent" for IDataAgent AI.
    Analyze the following dataset metadata and sample rows to generate a structured executive summary and business recommendations.

    Dataset Metadata:
    - File Name: ${metadata.fileName}
    - Total Rows: ${metadata.rowCount}
    - Total Columns: ${metadata.columnCount}
    - Columns: ${JSON.stringify(metadata.columns)}
    
    Sample Rows (First few rows):
    ${JSON.stringify(sampleRows, null, 2)}

    Please return a JSON object with the following structure:
    {
      "executiveSummary": "A concise summary paragraph of what this dataset represents.",
      "keyFindings": [
        "Finding 1 (e.g. key trends, distribution insights, anomalies, correlations)",
        "Finding 2",
        "Finding 3"
      ],
      "businessRecommendations": [
        "Recommendation 1 with actionable insights",
        "Recommendation 2",
        "Recommendation 3"
      ],
      "anomaliesOrWarnings": [
        "Warning about missing values, outliers, or suspicious data points (if any)"
      ]
    }
  `;

  const systemInstruction = "You are a professional business intelligence analyst and data scientist. Provide responses strictly as JSON.";

  try {
    const rawResponse = await callGemini(prompt, systemInstruction);
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error('Failed to parse AI insights JSON:', error);
    // Provide a detailed fallback object
    return {
      executiveSummary: `This dataset contains ${metadata.rowCount} rows and ${metadata.columnCount} columns. Columns include: ${metadata.columns.map(c => c.name).join(', ')}. (Offline Mode / Gemini Error: ${error.message})`,
      keyFindings: [
        `Dataset parsed successfully with ${metadata.rowCount} rows.`,
        "Basic summary statistics are available in the data grid preview.",
        "To get advanced AI findings, ensure your Gemini API key is configured correctly in backend/.env."
      ],
      businessRecommendations: [
        "Verify column data types and clean up any missing records.",
        "Add a valid Google Gemini API key to see automated domain-specific recommendations."
      ],
      anomaliesOrWarnings: [
        "System is running in fallback mode. Please check server logs for API errors."
      ]
    };
  }
}

/**
 * AI Agent: Visualization Agent
 * Analyzes columns and statistical indicators to suggest the best charts.
 */
export async function recommendVisualizations(metadata) {
  const prompt = `
    You are the "Visualization Agent" for IDataAgent AI.
    Analyze the column metadata of this dataset and suggest the best 3 visualizations (charts).

    Columns and Statistics:
    ${JSON.stringify(metadata.columns, null, 2)}

    Select pairs of columns that make logical sense to visualize together (e.g., Category vs Value, Date vs Sales, Correlation between two numbers).
    For each visualization, specify:
    1. Chart title
    2. Recommended Chart Type (choose from: "bar", "line", "pie", "scatter")
    3. xAxisColumn (the column name for the x-axis / labels)
    4. yAxisColumn (the column name for the y-axis / values)
    5. Description explaining why this chart is useful.

    Return a JSON object with this format:
    {
      "recommendations": [
        {
          "title": "Sales Trend Over Time",
          "type": "line",
          "xAxisColumn": "Date",
          "yAxisColumn": "Sales",
          "description": "Shows how sales fluctuated daily/monthly."
        }
      ]
    }
  `;

  const systemInstruction = "You are a data visualization expert. Recommend charts that tell a story. Provide responses strictly as JSON.";

  try {
    const rawResponse = await callGemini(prompt, systemInstruction);
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error('Failed to parse AI visualization recommendations JSON:', error);
    // Dynamic local fallback based on available columns
    const numericCols = metadata.columns.filter(c => c.type === 'numeric').map(c => c.name);
    const textCols = metadata.columns.filter(c => c.type === 'text').map(c => c.name);

    const fallbackRecs = [];
    if (textCols.length > 0 && numericCols.length > 0) {
      fallbackRecs.push({
        title: `Distribution of ${numericCols[0]} by ${textCols[0]}`,
        type: "bar",
        xAxisColumn: textCols[0],
        yAxisColumn: numericCols[0],
        description: "Standard bar chart representing numeric values across different categories."
      });
    }
    if (numericCols.length > 1) {
      fallbackRecs.push({
        title: `${numericCols[0]} vs ${numericCols[1]} Scatter`,
        type: "scatter",
        xAxisColumn: numericCols[0],
        yAxisColumn: numericCols[1],
        description: "Scatter plot examining the correlation between two numerical attributes."
      });
    }

    return {
      recommendations: fallbackRecs.length > 0 ? fallbackRecs : [
        {
          title: "Columns Preview",
          type: "bar",
          xAxisColumn: metadata.columns[0]?.name || "Index",
          yAxisColumn: metadata.columns[1]?.name || "Value",
          description: "Default fallback visualization suggestion."
        }
      ]
    };
  }
}

/**
 * AI Agent: Data Q&A / Natural Language Agent
 * Answers arbitrary questions about the dataset by reading metadata and sample data.
 */
export async function askQuestionAboutData(metadata, sampleRows, question, chatHistory = []) {
  // To keep payload size small and comply with rate limits, we pass the metadata summary and sample rows.
  const prompt = `
    You are the "Data Analysis Agent" and "Q&A Agent" for IDataAgent AI.
    Answer the user's question about the dataset.

    Dataset Summary:
    - Name: ${metadata.fileName}
    - Total Rows: ${metadata.rowCount}
    - Columns: ${JSON.stringify(metadata.columns, null, 2)}
    
    Here is a sample of the dataset's contents (first 20 rows):
    ${JSON.stringify(sampleRows, null, 2)}

    Chat History:
    ${JSON.stringify(chatHistory)}

    User's Question: "${question}"

    Instructions:
    1. If the question can be answered from the summary or sample rows, answer it clearly and concisely.
    2. If the question requires calculating something across the entire dataset (e.g., "What is the total sum of sales?"), provide the exact logic and estimate it based on the sample, or let the user know what the column stats suggest (e.g., refer to the min/max/mean from metadata).
    3. Be professional, direct, and structure your answer using Markdown. Use lists, bold text, or mini tables if needed.
    4. Since you only see metadata and a subset of rows, qualify your answer if you need more data, but be as helpful as possible.

    Return a JSON object with this format:
    {
      "answer": "Your markdown formatted answer here."
    }
  `;

  const systemInstruction = "You are a helpful and intelligent data assistant. Respond in JSON with an 'answer' field containing markdown.";

  try {
    const rawResponse = await callGemini(prompt, systemInstruction);
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error('Failed to parse Q&A response JSON:', error);
    return {
      answer: `**Failed to get answer from AI Agent.**\n\nError: ${error.message}\n\n*Please ensure that your Gemini API key is active and correct.*`
    };
  }
}
