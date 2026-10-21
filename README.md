# Task 2: Social Media Platform

A full-stack mini social media application fulfilling all requirements for **Task 2**:
- **User Profiles**: View user bio, follower count, following count, and user posts.
- **Posts & Comments**: Create text/image posts, like/unlike posts, and add comments.
- **Like/Follow System**: Real-time follow/unfollow capability and dynamic like count update.
- **Frontend**: Responsive HTML5, CSS3, JavaScript (Fetch API).
- **Backend**: Express.js (Node.js) REST API.
- **Database**: SQLite (via `better-sqlite3`) handling users, posts, comments, likes, and followers.

## Setup Instructions

1. **Prerequisites**: Ensure [Node.js](https://nodejs.org/) (v16+) is installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Application**:
   ```bash
   npm start
   ```
4. **Access App**: Open your browser and navigate to `http://localhost:3000`.

## Features
- Demo users pre-loaded (`vilas_m`, `alex_dev`, `sarah_code`).
- Create new posts, like posts, comment on posts.
- Follow and unfollow users with real-time stats updates.
- Filter feed by All Posts or Following feed.
