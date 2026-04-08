// Blog renderer for vanilla JS portfolio

export async function loadBlogPosts() {
  try {
    const response = await fetch('/blog.json');
    return await response.json();
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    return [];
  }
}

export function renderBlogList(container, posts) {
  if (posts.length === 0) {
    container.innerHTML = `
      <div class="blog-list">
        <div class="blog-header">
          <h1>Blog</h1>
          <p class="subtitle">Thoughts on web, tech & strategy</p>
        </div>
        <div class="no-posts">No posts yet. Stay tuned.</div>
      </div>
    `;
    return;
  }

  const postsHTML = posts
    .map(post => `
      <a href="/portfolio/blog/${post.slug}" class="post-card">
        ${post.image && post.image !== 'null' ? `
          <div class="post-image">
            <img src="${post.image}" alt="${post.title}" />
          </div>
        ` : ''}
        <div class="post-content">
          <h2>${post.title}</h2>
          <p class="post-excerpt">${post.excerpt}</p>
          <div class="post-meta">
            <span class="date">${new Date(post.date).toLocaleDateString()}</span>
            <span class="read-time">${post.readTime} min read</span>
          </div>
          ${post.tags.length > 0 ? `
            <div class="tags">
              ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </a>
    `)
    .join('');

  container.innerHTML = `
    <div class="blog-list">
      <div class="blog-header">
        <h1>Blog</h1>
        <p class="subtitle">Thoughts on web, tech & strategy</p>
      </div>
      <div class="posts-grid">
        ${postsHTML}
      </div>
    </div>
  `;
}

export function renderBlogPost(container, post) {
  if (!post) {
    container.innerHTML = `
      <div class="blog-post">
        <p>Post not found. <a href="/portfolio/blog">Back to blog</a></p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <article class="blog-post">
      <div class="post-header">
        <a href="/portfolio/blog" class="back-link">← Back to Blog</a>
        <h1>${post.title}</h1>
        <div class="post-info">
          <span class="author">${post.author}</span>
          <span class="separator">•</span>
          <span class="date">${new Date(post.date).toLocaleDateString()}</span>
          <span class="separator">•</span>
          <span class="read-time">${post.readTime} min read</span>
        </div>
        ${post.tags.length > 0 ? `
          <div class="tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      ${post.image && post.image !== 'null' ? `
        <img src="${post.image}" alt="${post.title}" class="post-image" />
      ` : ''}

      <div class="post-body">
        ${post.content}
      </div>
    </article>
  `;
}
