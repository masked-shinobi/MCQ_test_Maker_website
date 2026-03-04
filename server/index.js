const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const multer = require('multer');

const quizzesDir = path.join(__dirname, '..', 'quizzes');
const metadataPath = path.join(quizzesDir, 'metadata.json');
const resultsFilePath = path.join(__dirname, 'results.json');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, quizzesDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

if (!fs.existsSync(resultsFilePath)) {
    fs.writeFileSync(resultsFilePath, JSON.stringify([]));
}

// Utility to read metadata and sync with physical files
const getMetadata = () => {
    let metadata = [];
    if (fs.existsSync(metadataPath)) {
        try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (e) {
            metadata = [];
        }
    }

    // Auto-discovery: Check for CSV files not in metadata
    if (fs.existsSync(quizzesDir)) {
        const files = fs.readdirSync(quizzesDir);
        const csvFiles = files.filter(f => f.endsWith('.csv'));
        let changed = false;

        csvFiles.forEach(file => {
            if (!metadata.find(m => m.filename === file)) {
                metadata.push({
                    id: file,
                    name: file.replace('_mcq.csv', '').replace('.csv', '').replace(/_/g, ' ').toUpperCase(),
                    filename: file
                });
                changed = true;
            }
        });

        // Cleanup: Remove metadata entries if physical file is gone
        const existingMetadata = metadata.filter(m => csvFiles.includes(m.filename));
        if (existingMetadata.length !== metadata.length) {
            metadata = existingMetadata;
            changed = true;
        }

        if (changed) saveMetadata(metadata);
    }

    return metadata;
};

// Utility to save metadata
const saveMetadata = (data) => {
    fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
};

// Get list of available quizzes (from metadata)
app.get('/api/quizzes', (req, res) => {
    res.json(getMetadata());
});

// Upload a new quiz
app.post('/api/quizzes/upload', upload.single('file'), (req, res) => {
    const { name } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const metadata = getMetadata();
    const newQuiz = {
        id: file.filename,
        name: name || file.filename.replace('.csv', '').toUpperCase(),
        filename: file.filename
    };

    metadata.push(newQuiz);
    saveMetadata(metadata);

    res.status(201).json(newQuiz);
});

// Rename/Update a quiz
app.patch('/api/quizzes/:id', (req, res) => {
    const { id } = req.params;
    const { name, filename: newFilename } = req.body;
    let metadata = getMetadata();
    const quizIndex = metadata.findIndex(q => q.id === id);

    if (quizIndex === -1) return res.status(404).json({ error: 'Quiz not found' });

    const quiz = metadata[quizIndex];

    // If filename is changing, rename the actual file
    if (newFilename && newFilename !== quiz.filename) {
        const oldPath = path.join(quizzesDir, quiz.filename);
        const newPath = path.join(quizzesDir, newFilename);

        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
        }
        quiz.filename = newFilename;
        quiz.id = newFilename; // Update ID to match filename if that's the convention
    }

    if (name) quiz.name = name;

    metadata[quizIndex] = quiz;
    saveMetadata(metadata);

    res.json(quiz);
});

// Delete a quiz
app.delete('/api/quizzes/:id', (req, res) => {
    const { id } = req.params;
    let metadata = getMetadata();
    const quiz = metadata.find(q => q.id === id);

    if (quiz) {
        const filePath = path.join(quizzesDir, quiz.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        metadata = metadata.filter(q => q.id !== id);
        saveMetadata(metadata);
    }

    res.status(204).send();
});

app.get('/api/questions', (req, res) => {
    const quizFile = req.query.quiz || 'ir_mcq.csv';
    const csvFilePath = path.join(quizzesDir, quizFile);

    const results = [];
    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ error: 'CSV file not found: ' + quizFile });
    }
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
            // Map the CSV headers to the JSON keys expected by the frontend
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
