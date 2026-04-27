/* js/blogs.js
   Renders blog cards on the home page.

   Source of truth:
     - window.BLOG_POSTS (from js/posts-data.js) — works under file:// + http(s)://
     - Falls back to fetch('blogs/index.json') if the embedded data is missing.

   To add a new blog:
     1. Drop your .md file into the blogs/ folder
     2. Add an entry to blogs/index.json
     3. Regenerate js/posts-data.js (so it works locally too)
*/

(function () {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  async function loadPosts() {
    if (Array.isArray(window.BLOG_POSTS) && window.BLOG_POSTS.length) {
      return window.BLOG_POSTS;
    }
    // Fallback for legacy hosting where posts-data.js wasn't generated.
    const res = await fetch('blogs/index.json');
    if (!res.ok) throw new Error('index not found');
    return res.json();
  }

  async function loadBlogs() {
    try {
      const posts = await loadPosts();

      if (!posts || posts.length === 0) {
        grid.innerHTML = '<div class="blog-empty">🚀 First transmission incoming…<br>No posts yet.</div>';
        return;
      }

      grid.innerHTML = '';
      posts
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((post, i) => {
          const card = document.createElement('a');
          card.className = 'blog-card reveal';
          card.href = `blog.html?post=${encodeURIComponent(post.file)}`;
          card.style.transitionDelay = `${i * 80}ms`;
          card.innerHTML = `
            <div class="blog-meta">
              <span class="blog-date">${formatDate(post.date)}</span>
              ${post.tags ? post.tags.map(t => `<span class="blog-tag">${t}</span>`).join('') : ''}
            </div>
            <h3>${post.title}</h3>
            <p>${post.excerpt || ''}</p>
            <span class="blog-read-more">READ MORE →</span>
          `;
          grid.appendChild(card);
        });

      // Trigger reveal animations
      requestAnimationFrame(() => {
        document.querySelectorAll('.blog-card.reveal').forEach(el => {
          observer.observe(el);
        });
      });

    } catch (e) {
      console.error('Failed to load blogs:', e);
      grid.innerHTML = '<div class="blog-empty">📡 No blog posts yet.<br>Drop .md files in the blogs/ folder to get started.</div>';
    }
  }

  function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Shared IntersectionObserver for reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  loadBlogs();
})();
