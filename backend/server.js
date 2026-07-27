// backend/server.js
// Simple Node.js server using built-in http module (no Express!)

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5000;

// --- Helper: Read a JSON file ---
function readJSON(filename) {
  const filePath = path.join(__dirname, "data", filename);
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

// --- Helper: Write a JSON file ---
function writeJSON(filename, data) {
  const filePath = path.join(__dirname, "data", filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- Helper: Parse request body ---
function getBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(JSON.parse(body || "{}")));
  });
}

// --- Helper: Send JSON response ---
function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Allow frontend to connect
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

// --- Main server ---
const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  // Handle browser preflight requests (CORS)
  if (method === "OPTIONS") {
    sendJSON(res, 200, {});
    return;
  }

  // POST /register
  if (method === "POST" && url === "/register") {
    const body = await getBody(req);
    const users = readJSON("users.json");

    // Check if email already exists
    const exists = users.find((u) => u.email === body.email);
    if (exists) {
      sendJSON(res, 400, { error: "Email already registered" });
      return;
    }

    // Create new user (simple, no password hashing for beginners)
    const newUser = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      password: body.password,
    };

    users.push(newUser);
    writeJSON("users.json", users);
    sendJSON(res, 201, { message: "Registered successfully" });
    return;
  }

  // POST /login
  if (method === "POST" && url === "/login") {
    const body = await getBody(req);
    const users = readJSON("users.json");

    // Find user with matching email and password
    const user = users.find(
      (u) => u.email === body.email && u.password === body.password
    );

    if (!user) {
      sendJSON(res, 401, { error: "Invalid email or password" });
      return;
    }

    // Send user info back (without password)
    sendJSON(res, 200, { id: user.id, name: user.name, email: user.email });
    return;
  }

  // GET /posts
  if (method === "GET" && url === "/posts") {
    const posts = readJSON("posts.json");
    sendJSON(res, 200, posts);
    return;
  }

  // POST /posts
  if (method === "POST" && url === "/posts") {
    const body = await getBody(req);
    const posts = readJSON("posts.json");

    const newPost = {
      id: Date.now().toString(),
      title: body.title,
      content: body.content,
      author: body.author,
      authorId: body.authorId,
      image: body.image || "",   // Optional image URL
      createdAt: new Date().toISOString(),
    };

    posts.push(newPost);
    writeJSON("posts.json", posts);
    sendJSON(res, 201, newPost);
    return;
  }

  // DELETE /posts/:id
  if (method === "DELETE" && url.startsWith("/posts/")) {
    const id = url.split("/")[2]; // Get ID from URL
    const posts = readJSON("posts.json");

    const filtered = posts.filter((p) => p.id !== id);
    writeJSON("posts.json", filtered);
    sendJSON(res, 200, { message: "Post deleted" });
    return;
  }

  // Route not found
  sendJSON(res, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
