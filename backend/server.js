import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processGraph } from './processor.js';

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS for all origins so the evaluator can call it
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Credentials configured from .env
const getCredentials = () => {
  return {
    user_id: process.env.USER_ID || "johndoe_17091999",
    email_id: process.env.EMAIL_ID || "john.doe@college.edu",
    college_roll_number: process.env.COLLEGE_ROLL_NUMBER || "21CS1001"
  };
};

// POST /bfhl Endpoint
app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Missing 'data' field in request body. It must be an array of node strings."
      });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: "'data' must be an array of node strings."
      });
    }

    const credentials = getCredentials();
    const result = processGraph(data, credentials);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in POST /bfhl:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing graph hierarchy."
    });
  }
});

// GET /bfhl Endpoint (Optional fallback, commonly used in Bajaj challenges for simple verification)
app.get('/bfhl', (req, res) => {
  return res.status(200).json({
    operation_code: 1
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Bajaj Full Stack Challenge - Hierarchical Graph Processor API is running.');
});

// Start Server in local environment (only if not running on Vercel serverless)
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
