import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const users = []; // { username, email, password }
const blogEntries = []; // { id, authorId, authorUsername, title, content, createdAt }

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "super-secret-key-for-blog", // CHANGE THIS to a strong, random secret
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS in production
    // httpOnly: true, // Recommended for security
    // maxAge: 1000 * 60 * 60 * 24 // Example: 1 day
  }
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const initialBlogs = [
  {
    id: "init-1",
    title: "The Psychology of Procrastination",
    description: "Ever wondered why we delay even the simplest tasks? Dive into the science behind procrastination and learn techniques to beat it for good.",
    createdAt: new Date("2025-05-20T15:30:00"),
  },
  {
    id: "init-2",
    title: "A Journey Through the Multiverse",
    description: "Explore the fascinating concept of parallel universes in physics and how they might just be more real than science fiction.",
    createdAt: new Date("2025-05-21T10:00:00"),
  },
  {
    id: "init-3",
    title: "How I Made My First $1000 with a Side Hustle",
    description: "A beginner-friendly breakdown of how I turned a weekend project into a steady online income.",
    createdAt: new Date("2025-05-22T18:45:00"),
  },
  {
    id: "init-4",
    title: "Digital Privacy in 2025: Are We Safe Yet?",
    description: "With AI everywhere, what does privacy really mean now? A deep dive into how our data is used and how to protect it.",
    createdAt: new Date("2025-05-23T14:20:00"),
  },
  {
    id: "init-5",
    title: "Meditation for Coders: A Daily 10-Minute Routine",
    description: "Burnout is real. Here's a daily meditation routine tailored specifically for developers and creatives.",
    createdAt: new Date("2025-05-24T08:10:00"),
  },
  {
    id: "init-6",
    title: "CRISPR and the Future of Human Evolution",
    description: "Discover how gene editing technology is reshaping medicine and what it could mean for future generations.",
    createdAt: new Date("2025-05-25T13:55:00"),
  },
  {
    id: "init-7",
    title: "How Drawing Every Day Changed My Brain",
    description: "After 30 days of sketching, I noticed more than just better art. Here's how daily drawing improved my memory and focus.",
    createdAt: new Date("2025-05-26T11:40:00"),
  },
];

// Middleware to make user and redirectTo available in templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  if (req.query.redirectTo) {
    req.session.redirectTo = decodeURIComponent(req.query.redirectTo);
  }
  res.locals.redirectTo = req.session.redirectTo || null;
  next();
});


// --- Authentication Middleware ---

// Option 1: Simpler middleware that just requires login, DOES NOT clear session immediately.
// This will fix the POST /add_blog cycle.
function requireActiveSession(req, res, next) {
  if (req.session.user) {
    res.locals.user = req.session.user; // Ensure res.locals is up-to-date
    next();
  } else {
    const originalUrl = req.session.redirectTo || req.originalUrl || req.url; // Get intended URL
    res.redirect(`/sign_in?redirectTo=${encodeURIComponent(originalUrl)}&message=Please sign in to continue.`);
  }
}

// Option 2: If you MUST keep the "clear session for next GET" logic for some pages,
// then the page displaying the form (GET /add_blog) cannot use it if the POST needs the session.
// For now, we'll use requireActiveSession for /add_blog to make it work.
// The requireSignInAndClearSessionForNextGet is kept if you need it for other specific GETs.
function requireSignInAndClearSessionForNextGet(req, res, next) {
  if (req.session.user) {
    res.locals.user = req.session.user;
    delete req.session.user;
    next();
  } else {
    const originalUrl = req.originalUrl || req.url;
    res.redirect(`/sign_in?redirectTo=${encodeURIComponent(originalUrl)}&message=Please sign in to continue.`);
  }
}


// --- Routes ---

app.get("/", (req, res) => {
  const combinedBlogs = [...initialBlogs, ...blogEntries].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );
  res.render("home", { blogs: combinedBlogs });
});

app.get("/register", (req, res) => {
  if (req.session.user) {
    const redirectTo = req.session.redirectTo || '/';
    delete req.session.redirectTo;
    return res.redirect(redirectTo);
  }
  res.render("register", { message: req.query.message || null, username: req.query.username || "", email: req.query.email || "" });
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.render("register", { message: "All fields are required.", username, email });
  }
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    // Preserve redirectTo when redirecting
    let signInUrl = `/sign_in?message=${encodeURIComponent("Email already registered. Please sign in.")}&email=${encodeURIComponent(email)}`;
    if(req.session.redirectTo) {
        signInUrl += `&redirectTo=${encodeURIComponent(req.session.redirectTo)}`;
    }
    return res.redirect(signInUrl);
  }
  // IMPORTANT: HASH PASSWORDS in a real application!
  const newUser = { id: Date.now().toString(), username, email, password };
  users.push(newUser);
  req.session.user = newUser;
  const redirectTo = req.session.redirectTo || "/add_blog_form"; // Default to form after register
  delete req.session.redirectTo;
  res.redirect(redirectTo);
});

app.get("/sign_in", (req, res) => {
  if (req.session.user) {
    const redirectTo = req.session.redirectTo || '/';
    delete req.session.redirectTo;
    return res.redirect(redirectTo);
  }
  res.render("sign_in", { message: req.query.message || null, email: req.query.email || "" });
});

app.post("/sign_in", (req, res) => {
  const { email, password } = req.body;
  // IMPORTANT: Compare HASHED passwords in a real application!
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.render("sign_in", { message: "Invalid email or password.", email });
  }
  req.session.user = user;
  const redirectTo = req.session.redirectTo || "/add_blog_form"; // Default to form after sign in
  delete req.session.redirectTo;
  res.redirect(redirectTo);
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/?message=You have been signed out.");
  });
});

// Add Blog page - GET
// Using requireActiveSession to prevent clearing session before POST
app.get("/add_blog", requireActiveSession, (req, res) => {
  // If you still want the "clear session for next GET" behavior AFTER this page is viewed
  // AND after its POST, you'd need a more complex session handling or apply
  // requireSignInAndClearSessionForNextGet to the page you redirect to from POST /add_blog.
  res.render("add_blog", { message: null, title: "", content: "" });
});

// Add Blog page - POST
// Using requireActiveSession as well
app.post("/add_blog", requireActiveSession, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.render("add_blog", {
      message: "Title and content are required.",
      title: title || "",
      content: content || ""
    });
  }
  const newEntry = {
    id: Date.now().toString(),
    authorId: req.session.user.id, // Assuming user object has an id
    authorUsername: req.session.user.username,
    email: req.session.user.email, // If you store email on user session
    title,
    content,
    createdAt: new Date()
  };
  blogEntries.push(newEntry);
  res.redirect("/"); // Or to "/view" or the specific blog post page
});

// Other routes that were previously after the 404 handler:
app.get("/view", (req, res) => {
  const combinedBlogs = [...initialBlogs, ...blogEntries].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );
  res.render("view_all", { blogs: combinedBlogs });
});

app.get("/delete", requireActiveSession, (req, res) => { // Protect with auth
  // Use session for messages
  const messageToShow = req.session.deleteMessage || null;
  delete req.session.deleteMessage; // Clear after use
  res.render("delete.ejs", { message: messageToShow });
});
app.post("/delete", requireActiveSession, (req, res) => {
  const titleToDelete = req.body.blogTitle?.trim().toLowerCase();

  if (!titleToDelete) {
    req.session.deleteMessage = "Please provide a blog title to delete.";
    return res.redirect("/delete");
  }

  // Check if it's a default (undeletable) blog
  const existsInInitial = initialBlogs.some(
    (entry) => entry.title.trim().toLowerCase() === titleToDelete
  );

  if (existsInInitial) {
    req.session.deleteMessage = "This blog is part of the default collection and cannot be deleted.";
    return res.redirect("/delete");
  }

  // Allow deletion only from user-created blogs
  const index = blogEntries.findIndex(
    (entry) =>
      entry.title.trim().toLowerCase() === titleToDelete &&
      entry.authorId === req.session.user.id
  );

  if (index !== -1) {
    blogEntries.splice(index, 1);
    req.session.deleteMessage = "Blog deleted successfully!";
  } else {
    const existsButNotOwned = blogEntries.some(
      (entry) => entry.title.trim().toLowerCase() === titleToDelete
    );
    req.session.deleteMessage = existsButNotOwned
      ? "You are not authorized to delete this blog."
      : "Blog not found!";
  }

  res.redirect("/delete");
});


app.get("/edit", requireActiveSession, (req, res) => { // Protect with auth
  // For a real edit, you'd likely pass the blog ID or title to fetch existing data
  // e.g., /edit/:blogId or /edit?title=...
  // For now, a generic edit page.
  res.render("edit.ejs", {
      message: req.session.editMessage || null,
      blogToEdit: null // Populate this if you're fetching a specific blog for editing
  });
  delete req.session.editMessage;
});

app.post("/edit", requireActiveSession, (req, res) => { // Protect with auth
  const originalTitle = req.body.OriginalBlogTitle?.trim().toLowerCase(); // Assuming you have a field for original title
  const newTitle = req.body.EditedBlogTitle?.trim();
  const newDesc = req.body.EditedBlogDesc?.trim();

  if (!originalTitle || !newTitle || !newDesc) {
    req.session.editMessage = "Original title, new title, and new description are required.";
    return res.redirect("/edit"); // Or re-render with values
  }

  // Ensure user can only edit their own blogs
  const blogIndex = blogEntries.findIndex(
    (entry) => entry.title.trim().toLowerCase() === originalTitle && entry.authorId === req.session.user.id
  );

  if (blogIndex !== -1) {
    blogEntries[blogIndex].title = newTitle;
    blogEntries[blogIndex].description = newDesc; // Assuming 'description' is the field name
    blogEntries[blogIndex].updatedAt = new Date();
    req.session.editMessage = "Blog updated successfully!";
  } else {
    const blogExists = blogEntries.some(entry => entry.title.trim().toLowerCase() === originalTitle);
     if (blogExists) {
      req.session.editMessage = "Blog not found or you are not authorized to edit it.";
    } else {
      req.session.editMessage = "Original blog not found!";
    }
  }
  res.redirect("/edit"); // Redirect to GET /edit to show the message
});


// This route seems redundant if POST /add_blog is the primary way to create blogs.
// If it's a different flow, ensure it's protected and uses blogEntries.
app.post("/submit", requireActiveSession, (req, res) => {
  const { blogTitle, blogDesc } = req.body;
  if (!blogTitle || !blogDesc) {
    // Redirect back to the form it came from, or handle error appropriately
    return res.status(400).send("Title and description are required.");
  }
  blogEntries.push({
    id: Date.now().toString(),
    title: blogTitle,
    description: blogDesc, // Make sure your EJS for viewing uses 'description'
    authorId: req.session.user.id,
    authorUsername: req.session.user.username,
    createdAt: new Date()
  });
  res.redirect("/view");
});


// --- Catch-all for 404 Not Found (MOVED TO THE END) ---
app.use((req, res, next) => {
  res.status(404).render("404"); // res.locals.user is available
});

// --- Global Error Handler (MUST BE LAST) ---
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  res.status(500).render("error", {
    message: err.message || "Something went wrong on our side!",
    error: process.env.NODE_ENV === 'development' ? err : {} // Only show stack in dev
  });
});

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

module.exports = app;