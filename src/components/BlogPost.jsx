import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BlogPost.css';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/blog.json')
      .then(res => res.json())
      .then(posts => {
        const found = posts.find(p => p.slug === slug);
        if (found) {
          setPost(found);
        } else {
          navigate('/blog');
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/blog');
        setLoading(false);
      });
  }, [slug, navigate]);

  if (loading) {
    return <div className="blog-post loading">Loading...</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <article className="blog-post">
      <div className="post-header">
        <a href="/blog" className="back-link">← Back to Blog</a>
        <h1>{post.title}</h1>
        <div className="post-info">
          <span className="author">{post.author}</span>
          <span className="separator">•</span>
          <span className="date">{new Date(post.date).toLocaleDateString()}</span>
          <span className="separator">•</span>
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

      {post.image && (
        <img src={post.image} alt={post.title} className="post-image" />
      )}

      <div
        className="post-body"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
