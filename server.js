const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up SQLite database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

// Endpoint to submit messages
app.post('/submit', (req, res) => {
  const { content } = req.body;
  db.run("INSERT INTO messages (content) VALUES (?)", [content], function (err) {
    if (err) {
      return res.status(500).send("Error inserting message");
    }
    setTimeout(() => {
      db.run("DELETE FROM messages WHERE id = ?", [this.lastID]);
    }, 5000); // Delete after 10 seconds
    res.status(200).send("Message received and will be deleted in 10 seconds");
  });
});

// Endpoint to get the latest message
app.get('/latest-message', (req, res) => {
  db.get("SELECT id, content FROM messages ORDER BY timestamp DESC LIMIT 1", [], (err, row) => {
    if (err) {
      return res.status(500).send("Error retrieving message");
    }
    res.json(row);
  });
});

// Serve static files
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
