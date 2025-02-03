import express from "express";
import axios from "axios";  
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import pdfParse from "pdf-parse";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

let nasaData = "";

// Get __dirname in an ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdfPath = path.join(__dirname, "test", "data", "05-versions-space.pdf");
console.log("Looking for PDF at:", pdfPath);

fs.readFile(pdfPath, (err, pdfBuffer) => {
  if (err) {
    console.error("Error reading PDF file:", err);
  } else {
    pdfParse(pdfBuffer)
      .then((data) => {
        nasaData = data.text;
        console.log("PDF data extracted successfully.");
      })
      .catch((error) => {
        console.error("Error parsing PDF:", error);
      });
  }
});

// --- SEARCH FUNCTION ---
const searchPdfForAnswer = (question) => {
  if (!nasaData) return null;

  const normalizedQuestion = question.trim().toLowerCase();
  const normalizedData = nasaData.toLowerCase();

  const index = normalizedData.indexOf(normalizedQuestion);
  if (index !== -1) {
    return nasaData.substring(index, index + 500) + "...";
  }

  return null;
};

// --- RESPONSE HANDLING ---
const formatResponseAsGuide = (answer) => {
  return `📘 NASA Style Guide:\n\n${answer}`;
};

// --- GEMINI API ---
const fetchGeminiResponse = async (message, context) => {
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Gemini API key is missing.");
    return "Server misconfiguration: API key is missing.";
  }

  const promptText = `You are the NASA Style Guide. Answer as if you are the official document.\n\nContext: ${context}\n\nQuestion: ${message}`;
  const payload = { contents: [{ parts: [{ text: promptText }] }] };

  try {
    const response = await axios.post(`${apiUrl}?key=${apiKey}`, payload, {
      headers: { "Content-Type": "application/json" }
    });

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Error calling Gemini API:", error.response?.data || error.message);
    return "Sorry, I couldn't process that request.";
  }
};

// Serve static frontend files from React (Vite) build
const frontendPath = path.join(__dirname, "../Ember-RAG-FAQ/dist");
app.use(express.static(frontendPath));


// Catch-all for Vite's client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Error loading the frontend");
    }
  });
});

// --- API ENDPOINT ---
app.post("/api/message", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  // Handle greetings naturally
  const greetings = ["hello", "hi", "hey", "Hey there"];
  if (greetings.includes(message.toLowerCase())) {
    return res.json({ response: "Welcome to the NASA Style Guide. What section would you like to reference?" });
  }

  

  // Search for an answer in the extracted PDF content
  const pdfAnswer = searchPdfForAnswer(message);
  if (pdfAnswer) {
    return res.json({ response: formatResponseAsGuide(pdfAnswer) });
  }

  // If no direct match, ask Gemini
  const responseText = await fetchGeminiResponse(message, nasaData);
  res.json({ response: formatResponseAsGuide(responseText) });
});

// --- SERVER LISTENER ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
