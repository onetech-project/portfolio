import { useEffect, useState } from 'react';
import './BlogList.css';

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/blog.json')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load posts:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="blog-list loading">Loading posts...</div>;
  }

  return (
    <div className="blog-list">
      <div className="blog-header">
        <h1>Blog</h1>
        <p className="subtitle">Thoughts on web, tech & strategy</p>
      </div>

      {posts.length === 0 ? (
        <div className="no-posts">No posts yet. Stay tuned.</div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              className="post-card"
            >
              {post.image && (
                <div className="post-image">
                  <img src={post.image} alt={post.title} />
                </div>
              )}
              <div className="post-content">
                <h2>{post.title}</h2>
                <p className="post-excerpt">{post.excerpt}</p>
                <div className="post-meta">
                  <span className="date">{new Date(post.date).toLocaleDateString()}</span>
                  <span className="read-time">{post.readTime} min read</span>
                </div>
                {post.tags.length > 0 && (
                  <div className="tags">
                    {post.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
