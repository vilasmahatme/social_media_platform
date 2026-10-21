document.addEventListener('DOMContentLoaded', () => {
  fetchCurrentUser();
  fetchPosts();

  document.getElementById('btn-submit-post').addEventListener('click', createPost);
});

async function fetchCurrentUser() {
  const res = await fetch('/api/me');
  const user = await res.json();

  document.getElementById('nav-avatar').src = user.avatar;
  document.getElementById('nav-username').textContent = user.name;

  fetchUserProfile(user.id);
}

async function fetchUserProfile(userId) {
  const res = await fetch(`/api/users/${userId}`);
  const user = await res.json();

  document.getElementById('profile-avatar').src = user.avatar;
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-handle').textContent = `@${user.username}`;
  document.getElementById('profile-bio').textContent = user.bio;
  document.getElementById('stat-followers').textContent = user.followersCount;
  document.getElementById('stat-following').textContent = user.followingCount;
}

async function fetchPosts() {
  const res = await fetch('/api/posts');
  const posts = await res.json();

  const container = document.getElementById('posts-list');
  container.innerHTML = '';

  posts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'post-card';
    postEl.innerHTML = `
      <div class="post-header">
        <div class="author-info">
          <img src="${post.avatar}" class="avatar-sm" alt="Avatar">
          <div>
            <div class="author-name">${post.name}</div>
            <div class="text-muted" style="font-size:0.75rem;">@${post.username} • ${new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
        ${post.user_id !== 1 ? `<button class="btn btn-primary" style="padding:4px 10px; font-size:0.8rem;" onclick="toggleFollow(${post.user_id})">Follow/Unfollow</button>` : ''}
      </div>
      <div class="post-content">${post.content}</div>
      <div class="post-actions">
        <button class="action-btn ${post.isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
          <i class="fa-${post.isLiked ? 'solid' : 'regular'} fa-heart"></i> ${post.likesCount} Likes
        </button>
        <button class="action-btn">
          <i class="fa-regular fa-comment"></i> ${post.comments.length} Comments
        </button>
      </div>

      <div class="comments-section">
        ${post.comments.map(c => `
          <div class="comment-item">
            <span class="comment-author">${c.name}:</span>
            <span>${c.content}</span>
          </div>
        `).join('')}
        <div class="comment-input-box">
          <input type="text" id="comment-input-${post.id}" placeholder="Write a comment...">
          <button class="btn btn-primary" style="padding:4px 10px;" onclick="addComment(${post.id})">Send</button>
        </div>
      </div>
    `;
    container.appendChild(postEl);
  });
}

async function createPost() {
  const input = document.getElementById('post-input');
  const content = input.value.trim();
  if (!content) return;

  await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });

  input.value = '';
  fetchPosts();
}

async function toggleLike(postId) {
  await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  fetchPosts();
}

async function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;

  await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });

  input.value = '';
  fetchPosts();
}

async function toggleFollow(userId) {
  await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
  fetchCurrentUser();
  fetchPosts();
}
