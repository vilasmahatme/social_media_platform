const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new Database(':memory:'); // Uses in-memory database with pre-populated demo data

// Database Schema Setup
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    avatar TEXT
  );

  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE likes (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE follows (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY(follower_id) REFERENCES users(id),
    FOREIGN KEY(following_id) REFERENCES users(id)
  );
`);

// Insert Initial Demo Data
const insertUser = db.prepare('INSERT INTO users (username, name, bio, avatar) VALUES (?, ?, ?, ?)');
insertUser.run('vilas_m', 'Vilas Mahatme', 'Full Stack Developer | Java & Node.js enthusiast', 'https://api.dicebear.com/7.x/bottts/svg?seed=vilas');
insertUser.run('alex_dev', 'Alex Chen', 'Building cool frontend apps with HTML/CSS/JS!', 'https://api.dicebear.com/7.x/bottts/svg?seed=alex');
insertUser.run('sarah_code', 'Sarah Miller', 'Backend Developer | Express & Python fan', 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah');

const insertPost = db.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)');
insertPost.run(1, 'Excited to complete Task 2: Social Media Platform! Built with Express.js and SQLite.');
insertPost.run(2, 'Just finished designing a responsive portfolio website layout!');
insertPost.run(3, 'Node.js + Express is such a great stack for lightweight REST APIs.');

const insertComment = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)');
insertComment.run(1, 2, 'Great work Vilas! The architecture looks solid.');
insertComment.run(1, 3, 'Awesome project submission!');

const insertFollow = db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)');
insertFollow.run(1, 2);
insertFollow.run(1, 3);
insertFollow.run(2, 1);

const insertLike = db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)');
insertLike.run(1, 2);
insertLike.run(1, 3);

// --- REST API ROUTES ---

// Current logged in user (Default: Vilas - ID 1)
const CURRENT_USER_ID = 1;

// Get Current User info
app.get('/api/me', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(CURRENT_USER_ID);
  res.json(user);
});

// Get User Profile with Stats
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const followersCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(userId).count;
  const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(userId).count;
  const isFollowing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(CURRENT_USER_ID, userId) ? true : false;

  res.json({
    ...user,
    followersCount,
    followingCount,
    isFollowing
  });
});

// Get Feed Posts
app.get('/api/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.name, u.username, u.avatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as isLiked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all(CURRENT_USER_ID);

  posts.forEach(post => {
    post.comments = db.prepare(`
      SELECT c.*, u.name, u.username, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(post.id);
  });

  res.json(posts);
});

// Create Post
app.post('/api/posts', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });

  const result = db.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)').run(CURRENT_USER_ID, content);
  res.json({ id: result.lastInsertRowid, success: true });
});

// Like / Unlike Post
app.post('/api/posts/:id/like', (req, res) => {
  const postId = req.params.id;
  const existing = db.prepare('SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?').get(postId, CURRENT_USER_ID);

  if (existing) {
    db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(postId, CURRENT_USER_ID);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, CURRENT_USER_ID);
    res.json({ liked: true });
  }
});

// Comment on Post
app.post('/api/posts/:id/comments', (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment required' });

  db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').run(postId, CURRENT_USER_ID, content);
  res.json({ success: true });
});

// Follow / Unfollow User
app.post('/api/users/:id/follow', (req, res) => {
  const targetUserId = req.params.id;
  if (parseInt(targetUserId) === CURRENT_USER_ID) return res.status(400).json({ error: 'Cannot follow yourself' });

  const existing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(CURRENT_USER_ID, targetUserId);

  if (existing) {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(CURRENT_USER_ID, targetUserId);
    res.json({ following: false });
  } else {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(CURRENT_USER_ID, targetUserId);
    res.json({ following: true });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
