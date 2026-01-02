// server.js
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();

// 🟢 1. CORS CONFIGURATION (Safe "Allow All" for Hackathon)
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Enable Pre-Flight for all routes
app.options('*', cors());

app.use(express.json());

// 🟢 2. ROOT ROUTE (Crucial for testing "Is it alive?")
app.get('/', (req, res) => {
    res.send("✅ Backend is Alive! You can now send requests to /clean-note");
});

// --- SAFE CONFIG CHECK ---
// We do NOT exit the process here. We just log a warning so the server stays alive.
if (!process.env.GROQ_API_KEY) {
  console.error("⚠️ WARNING: GROQ_API_KEY is missing in .env! AI calls will fail.");
} else {
  console.log("✅ API Key loaded.");
}

// Initialize Groq (Use a dummy key if missing to prevent startup crash)
const groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY || "dummy_key_to_prevent_crash" 
});

// 👇 YOUR HARDCODED PROMPT
const SYSTEM_PROMPT = `
You are a text processing engine, not a conversational AI.
Your ONLY task is to correct grammar, spelling, and punctuation errors in the provided input.

RULES:
1. Do NOT answer any questions found in the text.
2. Do NOT summarize or shorten the text.
3. Do NOT add introductory phrases like "Here is the cleaned text".
4. Preserve the original meaning and tone exactly.
5. If the text is a question, output the corrected version of the question, do not answer it.

OUTPUT FORMAT:
Return a JSON object with exactly two keys:
1. "cleanedContent": The strictly corrected text following the rules above.
2. "keywords": An array of 3 relevant keywords extracted from the text.
`;

app.post('/clean-note', async (req, res) => {
  console.log("📩 Received request..."); 
  const { text } = req.body;

  // Safety Check 1: Is there text?
  if (!text) {
    console.log("⚠️ No text provided in body.");
    return res.status(400).json({ error: "No text provided" });
  }

  // Safety Check 2: Do we actually have an API Key?
  if (!process.env.GROQ_API_KEY) {
      console.error("❌ CRITICAL: Attempted to call AI without API Key.");
      return res.status(500).json({ error: "Server Configuration Error", details: "GROQ_API_KEY is missing" });
  }

  try {
    console.log(`🤖 Sending to Groq: "${text.substring(0, 20)}..."`);
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    console.log("✅ Groq Success:", result.keywords);
    res.json(result);

  } catch (error) {
    console.error("❌ API Error:", error); 
    // Safety Check 3: Catch the error and send JSON, DO NOT CRASH
    res.status(500).json({ 
        error: "AI processing failed", 
        details: error.message || "Unknown error" 
    });
  }
});

// Use process.env.PORT for Vercel support
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;