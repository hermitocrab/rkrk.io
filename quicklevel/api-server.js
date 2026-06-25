// QuickLevel API Server — CEFR-adaptive English test

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3003;

app.use(express.json());
app.use('/quicklevel/data/audio', express.static(path.join(__dirname, 'data', 'audio')));

const db = new sqlite3.Database(path.join(__dirname, 'data', 'scores.db'), (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to the scores database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    startTime INTEGER,
    endTime INTEGER,
    score INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT,
    questionId INTEGER,
    answer TEXT,
    isCorrect INTEGER,
    timestamp INTEGER
  )`);
});

const questions = require('./data/questions.json');

// Track used question IDs per session (in-memory, resets on restart)
const usedQuestions = new Map();

app.post('/api/start', (req, res) => {
  const sessionId = uuidv4();
  const startTime = Date.now();
  usedQuestions.set(sessionId, new Set());
  db.run('INSERT INTO sessions (id, startTime) VALUES (?, ?)', [sessionId, startTime], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const firstQuestion = getNextQuestion(sessionId, 'A1', true);
    res.json({ sessionId, question: firstQuestion });
  });
});

app.post('/api/answer', (req, res) => {
  const { sessionId, questionId, answer } = req.body;
  const question = questions.find(q => q.id === questionId);
  if (!question) return res.status(400).json({ error: 'Invalid question' });
  
  const isCorrect = question.answer === answer;

  db.get('SELECT COUNT(*) as count FROM answers WHERE sessionId = ?', [sessionId], (err, row) => {
    db.run('INSERT INTO answers (sessionId, questionId, answer, isCorrect, timestamp) VALUES (?, ?, ?, ?, ?)',
      [sessionId, questionId, answer, isCorrect ? 1 : 0, Date.now()],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const totalAnswered = (row ? row.count : 0) + 1;

        if (totalAnswered >= 20) {
          db.get('SELECT SUM(isCorrect) as score FROM answers WHERE sessionId = ?', [sessionId], (err3, result) => {
            db.run('UPDATE sessions SET endTime = ?, score = ? WHERE id = ?', [Date.now(), result.score, sessionId], () => {
              usedQuestions.delete(sessionId);
              return res.json({ finished: true });
            });
          });
        } else {
          const nextQuestion = getNextQuestion(sessionId, question.cefr, isCorrect);
          if (!nextQuestion) {
            return res.status(500).json({ error: 'No available question at this level' });
          }
          res.json({ nextQuestion });
        }
      });
  });
});

function getNextQuestion(sessionId, currentCefr, isCorrect) {
  const used = usedQuestions.get(sessionId) || new Set();
  const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  let nextCefrIndex = cefrLevels.indexOf(currentCefr);
  
  if (isCorrect && nextCefrIndex < cefrLevels.length - 1) nextCefrIndex++;
  else if (!isCorrect && nextCefrIndex > 0) nextCefrIndex--;
  
  // Try current level first, then expand search up/down
  for (let offset = 0; offset < cefrLevels.length; offset++) {
    for (let dir of [0, 1, -1]) {
      let idx = nextCefrIndex + (dir * offset);
      if (idx < 0 || idx >= cefrLevels.length) continue;
      const cefr = cefrLevels[idx];
      const available = questions.filter(q => q.cefr === cefr && !used.has(q.id));
      if (available.length > 0) {
        const pick = available[Math.floor(Math.random() * available.length)];
        used.add(pick.id);
        usedQuestions.set(sessionId, used);
        return pick;
      }
    }
  }
  return null;
}

function getCefrLevel(score) {
  if (score <= 5) return 'A1';
  if (score <= 8) return 'A2';
  if (score <= 12) return 'B1';
  if (score <= 15) return 'B2';
  if (score <= 18) return 'C1';
  return 'C2';
}

app.get('/api/result/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  db.all('SELECT * FROM answers WHERE sessionId = ?', [sessionId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    const score = rows.filter(r => r.isCorrect).length;
    const cefr = getCefrLevel(score);
    res.json({ sessionId, score, total: rows.length, cefr, answers: rows });
  });
});

app.get('/api/report/:sessionId', (req, res) => {
  res.sendFile(path.join(__dirname, 'report.html'));
});

app.listen(port, () => {
  console.log(`QuickLevel API server listening at http://localhost:${port}`);
});
