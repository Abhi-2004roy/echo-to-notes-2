# 🎙️ Echo to Notes

**Echo to Notes** is a full-stack voice note application designed for frictionless thought capture. Unlike standard voice recorders, this app listens for a specific trigger phrase, captures your thought, waits for you to finish speaking, and uses AI to clean up the grammar and spelling before saving it as a neat, swipeable card.

## ✨ Key Features

### 🧠 Intelligent Voice Processing
- **Trigger Word:** Automatically starts recording when you say **"Note this"**.
- **Smart Silence Detection:** Waits for **2.5 seconds of silence** before cutting the recording to ensure you are finished speaking.
- **AI Cleaning:** Uses **Groq (Llama 3)** to correct grammar, punctuation, and spelling while preserving the original tone. It strictly cleans text—it does not answer questions.
- **Keyword Extraction:** Automatically tags every note with 3 relevant keywords.

### 🎨 Modern UI/UX
- **Interactive Layouts:** Switch between a swipeable **Stack View** (Tinder-style) and a comprehensive **Grid View**.
- **Animations:** Powered by **Framer Motion** for smooth gestures and transitions.
- **Dynamic Themes:**
  - ☀️ **Light Mode:** Steel Blue gradient with high-contrast text strokes.
  - 🌙 **Dark Mode:** Deep Pink/Purple gradient for low-light usage.
- **Search & Stash:** Filter notes by text or keywords; swipe cards off-screen to "stash" them.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Framer Motion, CSS Modules
- **Backend:** Node.js, Express.js
- **AI/LLM:** Groq SDK (Model: `llama-3.1-8b-instant`)
- **State Management:** React Hooks (`useRef`, `useState`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- A free API Key from [Groq Console](https://console.groq.com/)

### 1. Clone the Repository
```bash
git clone [https://github.com/Abhi-2004roy/Echo-To-Notes](https://github.com/Abhi-2004roy/Echo-To-Notes)
cd echo-to-notes

Navigate to the server folder and install dependencies:

Bash

cd server
npm install
Create a .env file in the server root:

Code snippet

GROQ_API_KEY=your_groq_api_key_here
PORT=5000
Start the backend server:

Bash

node server.js
Output should read: 🚀 Server running on http://localhost:5000

3. Frontend Setup
Open a new terminal, navigate to the client folder:

Bash

cd client
npm install
npm start
The app will launch at http://localhost:3000.

📖 Usage Guide
Activate: Allow microphone permissions.

Speak: Say "Note this, remind me to buy milk and eggs tomorrow."

Wait: Stop talking. After 2.5 seconds of silence, the app will process the audio.

Result: A new card appears with the text: "Remind me to buy milk and eggs tomorrow." (Grammar fixed, trigger phrase removed).

🧩 Code Structure Highlights
Backend: AI Prompting (server.js)
We use a strict system prompt to ensure Llama 3 acts as a cleaner, not a chatbot.

JavaScript

const SYSTEM_PROMPT = `
You are a text processing engine...
Your ONLY task is to correct grammar, spelling, and punctuation...
1. Do NOT answer any questions...
2. Return JSON with "cleanedContent" and "keywords"...
`;
Frontend: Voice Logic
We buffer audio and use a silence timer to prevent cutting off the user mid-sentence.

JavaScript

// Logic: If collecting, reset timer on every new word.
if (isCollecting.current) {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(async () => {
        // Process Note
    }, 2500); // 2.5s wait
}
🗺️ Roadmap
[x] Voice Activation ("Note this")

[x] AI Grammar Correction

[x] Dark/Light Mode

[ ] Database Integration (MongoDB) - Coming Soon

[ ] Visual Audio Waveform - Coming Soon

[ ] Export to Notion/Obsidian

🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
