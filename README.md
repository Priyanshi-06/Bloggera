# 📝 Bloggera — A Simple & Elegant Blog App

**Bloggera** is a minimal full-stack blogging web application built with **Node.js**, **Express**, and **EJS**. It allows users to register, sign in, and manage their own blog posts — all from a beautifully styled interface.

---

## 🚀 Features

- 👤 **User Authentication**  
  Secure sign-in and session handling using `express-session`.

- ✍️ **Create Blog Posts**  
  Authenticated users can compose new blogs with a title and description.

- ✏️ **Edit Blog Posts**  
  Users can edit their own blog entries with real-time feedback.

- 🗑️ **Delete Blog Posts**  
  Delete functionality is restricted to the blog's author only.

- 📚 **View All Blogs**  
  View a combined list of featured and user-generated blogs, sorted by date.
---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js
- **Templating**: EJS
- **Styling**: CSS (via `/public` folder)
- **Session**: express-session
- **Utilities**: body-parser, path, url

---

## 🧑‍💻 Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Priyanshi-06/bloggera.git
   cd bloggera

<h2>🔧 Installation Steps</h2>

<ol>
  <li>
    <strong>Install dependencies:</strong>
    <pre><code class="language-bash">npm install</code></pre>
  </li>
  <li>
    <strong>Run the application:</strong>
    <pre><code class="language-bash">node app.js
# or if you're using nodemon
nodemon app.js</code></pre>
  </li>
  <li>
    <strong>Open in browser:</strong>
    <pre><code class="language-url">http://localhost:3000</code></pre>
  </li>
</ol>

---

## 📌 Notes

- Passwords are stored as plain text (for demo). Use hashing in production.
- Memory-based session store is not production-safe. Replace with Redis or MongoDB store in real use.

---

## 🌐 Live Demo

🚀 Check out the live app on Vercel:  
🔗 https://bloggera-priyanshis-projects-29eb0687.vercel.app/

---

## 🧑‍🎓 Author

Made with 💻 by [Priyanshi](https://github.com/Priyanshi-06)


