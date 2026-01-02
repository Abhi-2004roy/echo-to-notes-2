// server.js
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));
app.use(express.json());
app.use(cors());
app.options('*', cors());

// --- DEBUG CHECK ---
if (!process.env.GROQ_API_KEY) {
  console.error("❌ ERROR: GROQ_API_KEY is missing in .env file!");
  process.exit(1);
} else {
  console.log("✅ API Key loaded.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// 👇 HARDCODED STRICT PROMPT 👇
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
  console.log("📩 Received request..."); // DEBUG LOG
  const { text } = req.body;

  if (!text) {
    console.log("⚠️ No text provided in body.");
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    console.log(`🤖 Sending to Groq: "${text.substring(0, 20)}..."`);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        //"You are an expert editor. 1. Clean up grammar. 2. Extract 3 keywords. Return JSON: { \"cleanedContent\": \"...\", \"keywords\": [\"tag1\", \"tag2\"] }
        { role: "user", content: text }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    console.log("✅ Groq Success:", result.keywords);
    res.json(result);
  } catch (error) {
    console.error("❌ API Error:", error.message); // Print actual error
    res.status(500).json({ error: "AI processing failed", details: error.message });
  }
});

app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));
module.exports = app;