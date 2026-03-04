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

// --- PRODUCTION READINESS FIX ---
// Ensure the quizzes directory exists
if (!fs.existsSync(quizzesDir)) {
    fs.mkdirSync(quizzesDir, { recursive: true });
}

// Ensure the results file exists
if (!fs.existsSync(resultsFilePath)) {
    fs.writeFileSync(resultsFilePath, JSON.stringify([]));
}
// --------------------------------

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, quizzesDir);
    },
    filename: (req, file, cb) => {
        // Prefix with userId to handle user-specific files and prevent collisions
        const userId = req.body.userId || 'global';
        cb(null, `${userId}_${file.originalname}`);
    }
});
const upload = multer({ storage });

// Utility to read metadata and sync with physical files (without enrichment)
const readMetadata = () => {
    let metadata = [];
    if (fs.existsSync(metadataPath)) {
        try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            // Remove questionCount if it somehow got saved and strip to clean format
            metadata = metadata.map(({ questionCount, ...rest }) => rest);
        } catch (e) {
            metadata = [];
        }
    }

    if (fs.existsSync(quizzesDir)) {
        const files = fs.readdirSync(quizzesDir);
        const csvFiles = files.filter(f => f.endsWith('.csv'));
        let changed = false;

        // 1. Remove entries for files that don't exist
        const initialLength = metadata.length;
        metadata = metadata.filter(m => csvFiles.includes(m.filename));
        if (metadata.length !== initialLength) changed = true;

        // 2. Strict Deduplication: Keep only the first entry for each filename
        const seenFilenames = new Set();
        const uniqueMetadata = [];
        metadata.forEach(m => {
            if (!seenFilenames.has(m.filename)) {
                seenFilenames.add(m.filename);
                // Ensure every entry has a userId
                if (!m.userId) {
                    // Try to infer userId from filename prefix
                    const parts = m.filename.split('_');
                    if (parts.length > 1 && parts[0].length > 10) { // Looks like a UUID or Supabase ID
                        m.userId = parts[0];
                    } else {
                        m.userId = 'global';
                    }
                    changed = true;
                }
                uniqueMetadata.push(m);
            } else {
                changed = true; // Found a duplicate to remove
            }
        });
        metadata = uniqueMetadata;

        // 3. Auto-discovery: Add missing files
        csvFiles.forEach(file => {
            if (!seenFilenames.has(file)) {
                // Try to infer userId from filename prefix
                const parts = file.split('_');
                let userId = 'global';
                let displayName = file.replace('.csv', '').replace(/_/g, ' ').toUpperCase();

                if (parts.length > 1 && parts[0].length > 10) {
                    userId = parts[0];
                    displayName = parts.slice(1).join('_').replace('.csv', '').replace(/_/g, ' ').toUpperCase();
                }

                metadata.push({
                    id: file,
                    name: displayName,
                    filename: file,
                    userId: userId
                });
                seenFilenames.add(file);
                changed = true;
            }
        });

        if (changed) {
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        }
    }
    return metadata;
};

// Utility to get metadata with question counts for the UI (not saved to file)
const getMetadata = (userId) => {
    let metadata = readMetadata();

    // Filter by userId if provided
    if (userId) {
        metadata = metadata.filter(m => m.userId === 'global' || m.userId === userId);
    }

    return metadata.map(quiz => {
        const filePath = path.join(quizzesDir, quiz.filename);
        let count = 0;
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8').trim();
                if (content) {
                    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
                    count = lines.length > 0 ? lines.length - 1 : 0;
                }
            } catch (err) {
                console.error(`Error reading ${quiz.filename}:`, err);
            }
        }
        return { ...quiz, questionCount: count };
    });
};

// Utility to save metadata
const saveMetadata = (data) => {
    // Strip questionCount before saving to file
    const cleanData = data.map(({ questionCount, ...rest }) => rest);
    fs.writeFileSync(metadataPath, JSON.stringify(cleanData, null, 2));
};

// Get list of available quizzes (from metadata)
app.get('/api/quizzes', (req, res) => {
    const { userId } = req.query;
    const data = getMetadata(userId);
    res.json(data);
});

// Upload a new quiz
app.post('/api/quizzes/upload', upload.single('file'), (req, res) => {
    const { name, userId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // readMetadata will handle auto-discovery of the newly uploaded file if it's there
    let metadata = readMetadata();

    // Check if it's already there (either by auto-discovery or previous upload)
    const existingIndex = metadata.findIndex(m => m.filename === file.filename);

    if (existingIndex !== -1) {
        // Update existing entry if a name was provided
        if (name) {
            metadata[existingIndex].name = name;
        }
        // Update userId if provided
        if (userId) {
            metadata[existingIndex].userId = userId;
        }
        saveMetadata(metadata);
        return res.status(201).json(metadata[existingIndex]);
    }

    const newQuiz = {
        id: file.filename,
        name: name || file.filename.replace('.csv', '').toUpperCase(),
        filename: file.filename,
        userId: userId || 'global'
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
    const { userId } = req.query;
    try {
        const data = fs.readFileSync(resultsFilePath, 'utf8');
        let results = JSON.parse(data);
        if (userId) {
            results = results.filter(r => r.userId === userId);
        }
        res.json(results);
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

app.get('/api/leaderboard', (req, res) => {
    try {
        const results = JSON.parse(fs.readFileSync(resultsFilePath, 'utf8'));
        const metadata = readMetadata();

        // Group by userId
        const userStats = {};
        results.forEach(r => {
            const uid = r.userId || 'guest';
            if (!userStats[uid]) {
                userStats[uid] = {
                    userId: uid,
                    userName: r.userName,
                    totalTests: 0,
                    totalCorrect: 0,
                    totalQuestions: 0,
                    bestAccuracy: 0
                };
            }
            userStats[uid].totalTests++;
            userStats[uid].totalCorrect += r.score;
            userStats[uid].totalQuestions += r.total;
            const accuracy = r.total > 0 ? (r.score / r.total) : 0;
            if (accuracy > userStats[uid].bestAccuracy) {
                userStats[uid].bestAccuracy = accuracy;
            }
        });

        // Convert to array and calculate rank
        const leaderboard = Object.values(userStats).map(user => {
            const avgAccuracy = user.totalQuestions > 0 ? (user.totalCorrect / user.totalQuestions) : 0;
            // Experience factor: weigh accuracy by number of tests completed
            const powerScore = (avgAccuracy * 100) + (user.totalTests * 2);

            // Add private dataset count for this user
            const privateModules = metadata.filter(m => m.userId === user.userId).length;

            return {
                ...user,
                avgAccuracy: Math.round(avgAccuracy * 100),
                powerScore: Math.round(powerScore),
                privateModules
            };
        });

        // Sort by powerScore descending
        leaderboard.sort((a, b) => b.powerScore - a.powerScore);

        // Add rank index
        leaderboard.forEach((u, i) => u.rank = i + 1);

        res.json(leaderboard);
    } catch (e) {
        console.error("Leaderboard calculation failed:", e);
        res.status(500).json({ error: 'Failed to generate leaderboard' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Keep-alive to prevent unexpected exit in some environments
setInterval(() => { }, 1000000);
