# Adityagopala Poolla — Portfolio

Personal portfolio website with a solar system theme, built with HTML, CSS & JavaScript.  
Deployed on **GitHub Pages**.

---

## 🚀 Quick Start

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git

# Just open in browser (no build step needed!)
open index.html
```

---

## 📁 Project Structure

```
portfolio/
├── index.html              ← Main landing page
├── blog.html               ← Individual blog post reader
│
├── css/
│   ├── style.css           ← Base styles, nav, footer, variables
│   ├── solar.css           ← Solar system hero animation
│   └── sections.css        ← About, Skills, Experience, Blogs, Contact
│
├── js/
│   ├── starfield.js        ← Canvas star background
│   ├── solar.js            ← Planet click navigation
│   ├── nav.js              ← Navbar scroll state & hamburger
│   ├── blogs.js            ← Blog post loader (reads index.json)
│   └── main.js             ← Scroll reveal & contact form
│
├── blogs/                  ← ✍️  YOUR BLOG POSTS LIVE HERE
│   ├── index.json          ← Master list of posts (update this!)
│   ├── getting-started-with-kafka.md
│   └── reactive-programming-spring-webflux.md
│
└── .github/
    └── workflows/
        └── deploy.yml      ← GitHub Actions auto-deploy
```

---

## ✍️ Adding a New Blog Post

**Step 1** — Write your post as a `.md` file and save it to `blogs/`:

```
blogs/my-new-post.md
```

**Step 2** — Add an entry to `blogs/index.json`:

```json
{
  "file": "my-new-post.md",
  "title": "My New Post Title",
  "date": "2025-05-01",
  "tags": ["Java", "Spring"],
  "excerpt": "A short description shown on the blog card."
}
```

**Step 3** — Commit and push:

```bash
git add blogs/
git commit -m "Add new blog post: My New Post"
git push origin main
```

GitHub Actions will automatically deploy to GitHub Pages within ~60 seconds. ✅

---

## 🌐 GitHub Pages Deployment

### First-Time Setup

1. Create a repo named `YOUR_USERNAME.github.io` on GitHub
2. Push this project to `main` branch
3. Go to **Settings → Pages**
4. Set Source to **GitHub Actions**
5. Push any commit — the workflow triggers automatically

Your site will be live at: `https://YOUR_USERNAME.github.io`

### Custom Domain (Optional)

1. Add a `CNAME` file in the root with your domain:
   ```
   yourname.dev
   ```
2. Configure DNS with your domain registrar

---

## 📬 Contact Form

The contact form currently shows a success message (client-side only).  
To make it functional, use [Formspree](https://formspree.io):

1. Sign up at formspree.io
2. Create a form and get your form ID
3. In `index.html`, update the form tag:
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
4. Remove the JS handler in `main.js`

---

## 🎨 Customization

- **Colors & fonts** → `css/style.css` (CSS variables at top)
- **Solar system** → `css/solar.css`
- **Your info** → `index.html` (About, Experience, Skills sections)
- **Profile links** → Update LinkedIn, LeetCode URLs in `index.html`
