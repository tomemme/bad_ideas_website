const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve bad.html as the root page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'badideas.html'));
});

// Test route (optional, for debugging)
app.get('/test', (req, res) => {
  console.log('Reached /test route');
  res.send('Test route working!');
});

// Set up SQLite database
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to in-memory SQLite database');
  }
});

db.serialize(() => {
  db.run(
    'CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)',
    (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Messages table created');
      }
    }
  );
});

// Endpoint to submit messages
app.post('/submit', (req, res) => {
  console.log('Reached /submit route');
  const { content } = req.body;
  db.run('INSERT INTO messages (content) VALUES (?)', [content], function (err) {
    if (err) {
      console.error('Error inserting message:', err.message);
      return res.status(500).send('Error inserting message');
    }
    setTimeout(() => {
      db.run('DELETE FROM messages WHERE id = ?', [this.lastID], (err) => {
        if (err) {
          console.error('Error deleting message:', err.message);
        }
      });
    }, 5000); // Delete after 5 seconds
    res.status(200).send('Message received and will be deleted in 5 seconds');
  });
});

// Endpoint to get the latest message
app.get('/latest-message', (req, res) => {
  console.log('Reached /latest-message route');
  db.get('SELECT id, content FROM messages ORDER BY timestamp DESC LIMIT 1', [], (err, row) => {
    if (err) {
      console.error('Error retrieving message:', err.message);
      return res.status(500).json({ error: 'Error retrieving message' });
    }
    res.json(row || { content: '' }); // Return empty content if no row exists
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});