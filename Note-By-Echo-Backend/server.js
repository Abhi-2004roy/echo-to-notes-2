const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Basic CORS (Allow Everything)
app.use(cors()); 

app.use(express.json());

// 2. Simple Test Route (GET)
app.get('/', (req, res) => {
    res.send("Backend is Alive!");
});

// 3. The Clean Route (Mock Version for Testing)
app.post('/clean-note', (req, res) => {
    console.log("Received body:", req.body);
    // Send back dummy data to prove connection works
    res.json({ 
        cleanedContent: "Test successful! The backend is connected.", 
        keywords: ["Test", "Works"] 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));