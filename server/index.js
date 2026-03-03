const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const csvFilePath = path.join(__dirname, '..', 'ir_mcq.csv');
const resultsFilePath = path.join(__dirname, 'results.json');

if (!fs.existsSync(resultsFilePath)) {
    fs.writeFileSync(resultsFilePath, JSON.stringify([]));
}

app.get('/api/questions', (req, res) => {
    const results = [];
    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ error: 'CSV file not found' });
    }
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
            // Map the CSV headers to the JSON keys expected by the frontend
            // Supports both Uppercase (Question) and Lowercase (question) headers
            results.push({
                question: data.Question || data.question,
                optionA: data.OptionA || data.optionA,
                optionB: data.OptionB || data.optionB,
                optionC: data.OptionC || data.optionC,
                optionD: data.OptionD || data.optionD,
                answer: data.Answer || data.answer
            });
        })
        .on('end', () => {
            // Filter out empty rows if any
            const filteredResults = results.filter(q => q.question);
            res.json(filteredResults);
        })
        .on('error', () => res.status(500).json({ error: 'Error parsing CSV' }));
});

app.get('/api/results', (req, res) => {
    try {
        const data = fs.readFileSync(resultsFilePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.json([]);
    }
});

app.post('/api/results', (req, res) => {
    try {
        const newResult = {
            id: Date.now(),
            ...req.body,
            date: new Date().toISOString()
        };
        const data = JSON.parse(fs.readFileSync(resultsFilePath, 'utf8'));
        data.push(newResult);
        fs.writeFileSync(resultsFilePath, JSON.stringify(data, null, 2));
        res.status(201).json(newResult);
    } catch (e) {
        res.status(500).json({ error: 'Failed to save result' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
