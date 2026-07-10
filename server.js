const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2), "utf-8");
  }
}

function readDatabase() {
  initDatabase();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw || '{"users":{}}');
}

function writeDatabase(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function ensureUser(db, username) {
  if (!db.users[username]) {
    db.users[username] = {
      username,
      createdAt: new Date().toISOString(),
      tasks: []
    };
  }

  return db.users[username];
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "学习养成计划系统后端运行正常" });
});

app.post("/api/login", (req, res) => {
  const { username } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ message: "用户名不能为空" });
  }

  const db = readDatabase();
  const user = ensureUser(db, username.trim());
  writeDatabase(db);

  res.json({
    message: "登录成功",
    user: {
      username: user.username,
      createdAt: user.createdAt
    }
  });
});

app.get("/api/users/:username/tasks", (req, res) => {
  const db = readDatabase();
  const user = ensureUser(db, req.params.username);
  writeDatabase(db);
  res.json(user.tasks);
});

app.post("/api/users/:username/tasks", (req, res) => {
  const { title, topic, deadline, priority, needReview } = req.body;

  if (!title || !topic || !deadline) {
    return res.status(400).json({ message: "任务名称、学习主题和完成时间不能为空" });
  }

  const db = readDatabase();
  const user = ensureUser(db, req.params.username);

  const task = {
    id: Date.now(),
    title: String(title).trim(),
    topic: String(topic).trim(),
    deadline,
    priority: priority || "medium",
    needReview: Boolean(needReview),
    completed: false,
    createdAt: getToday(),
    completedAt: null,
    reminded: false
  };

  user.tasks.unshift(task);
  writeDatabase(db);

  res.status(201).json(task);
});

app.patch("/api/users/:username/tasks/:taskId/complete", (req, res) => {
  const taskId = Number(req.params.taskId);
  const db = readDatabase();
  const user = ensureUser(db, req.params.username);
  const task = user.tasks.find(item => item.id === taskId);

  if (!task) {
    return res.status(404).json({ message: "任务不存在" });
  }

  task.completed = true;
  task.completedAt = getToday();

  writeDatabase(db);
  res.json(task);
});

app.patch("/api/users/:username/tasks/:taskId/reminded", (req, res) => {
  const taskId = Number(req.params.taskId);
  const db = readDatabase();
  const user = ensureUser(db, req.params.username);
  const task = user.tasks.find(item => item.id === taskId);

  if (!task) {
    return res.status(404).json({ message: "任务不存在" });
  }

  task.reminded = true;
  writeDatabase(db);
  res.json(task);
});

app.delete("/api/users/:username/tasks/:taskId", (req, res) => {
  const taskId = Number(req.params.taskId);
  const db = readDatabase();
  const user = ensureUser(db, req.params.username);
  const beforeCount = user.tasks.length;

  user.tasks = user.tasks.filter(item => item.id !== taskId);

  if (user.tasks.length === beforeCount) {
    return res.status(404).json({ message: "任务不存在" });
  }

  writeDatabase(db);
  res.json({ message: "删除成功" });
});

app.get("/api/users/:username/stats", (req, res) => {
  const db = readDatabase();
  const user = ensureUser(db, req.params.username);
  const tasks = user.tasks;
  const today = getToday();
  const total = tasks.length;
  const finished = tasks.filter(task => task.completed).length;
  const todayAdd = tasks.filter(task => task.createdAt === today).length;
  const todayFinished = tasks.filter(task => task.completedAt === today).length;
  const finishRate = total === 0 ? 0 : Math.round((finished / total) * 100);

  res.json({ total, finished, todayAdd, todayFinished, finishRate });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initDatabase();

app.listen(PORT, () => {
  console.log(`学习养成计划系统已启动：http://localhost:${PORT}`);
});
