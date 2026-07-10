let currentUser = localStorage.getItem("studyPlanCurrentUser") || "";
let tasks = [];

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const currentUserText = document.getElementById("currentUserText");

const taskTitle = document.getElementById("taskTitle");
const taskTopic = document.getElementById("taskTopic");
const taskDeadline = document.getElementById("taskDeadline");
const taskPriority = document.getElementById("taskPriority");
const needReview = document.getElementById("needReview");
const addTaskBtn = document.getElementById("addTaskBtn");

const taskList = document.getElementById("taskList");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const checkinCalendar = document.getElementById("checkinCalendar");

function getApiBase() {
  return `/api/users/${encodeURIComponent(currentUser)}`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "未设置";
  return value.replace("T", " ");
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "请求失败" }));
    throw new Error(error.message || "请求失败");
  }

  return response.json();
}

async function login() {
  const username = usernameInput.value.trim();

  if (!username) {
    alert("请输入用户名");
    return;
  }

  try {
    await requestJSON("/api/login", {
      method: "POST",
      body: JSON.stringify({ username })
    });

    currentUser = username;
    localStorage.setItem("studyPlanCurrentUser", currentUser);
    await showAppPage();
  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  localStorage.removeItem("studyPlanCurrentUser");
  currentUser = "";
  tasks = [];
  usernameInput.value = "";
  showLoginPage();
}

function showLoginPage() {
  loginPage.classList.remove("hidden");
  appPage.classList.add("hidden");
}

async function showAppPage() {
  loginPage.classList.add("hidden");
  appPage.classList.remove("hidden");
  currentUserText.textContent = currentUser;
  await loadTasks();
}

async function loadTasks() {
  if (!currentUser) {
    tasks = [];
    render();
    return;
  }

  try {
    tasks = await requestJSON(`${getApiBase()}/tasks`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

async function addTask() {
  const title = taskTitle.value.trim();
  const topic = taskTopic.value.trim();
  const deadline = taskDeadline.value;
  const priority = taskPriority.value;
  const review = needReview.checked;

  if (!title || !topic || !deadline) {
    alert("请填写完整任务信息：任务名称、学习主题和完成时间都不能为空。");
    return;
  }

  try {
    await requestJSON(`${getApiBase()}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title, topic, deadline, priority, needReview: review })
    });

    clearForm();
    await loadTasks();
  } catch (error) {
    alert(error.message);
  }
}

async function addRecommendTask(title, topic) {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 2);

  try {
    await requestJSON(`${getApiBase()}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        title,
        topic,
        deadline: toDateTimeLocal(deadline),
        priority: "medium",
        needReview: true
      })
    });

    await loadTasks();
  } catch (error) {
    alert(error.message);
  }
}

function clearForm() {
  taskTitle.value = "";
  taskTopic.value = "";
  taskDeadline.value = "";
  taskPriority.value = "high";
  needReview.checked = false;
}

async function completeTask(id) {
  try {
    await requestJSON(`${getApiBase()}/tasks/${id}/complete`, { method: "PATCH" });
    await loadTasks();
  } catch (error) {
    alert(error.message);
  }
}

async function markReminded(id) {
  try {
    await requestJSON(`${getApiBase()}/tasks/${id}/reminded`, { method: "PATCH" });
    await loadTasks();
  } catch (error) {
    console.error(error);
  }
}

async function deleteTask(id) {
  const confirmDelete = confirm("确定要删除这个任务吗？");
  if (!confirmDelete) return;

  try {
    await requestJSON(`${getApiBase()}/tasks/${id}`, { method: "DELETE" });
    await loadTasks();
  } catch (error) {
    alert(error.message);
  }
}

function getPriorityText(priority) {
  if (priority === "high") return "高优先级";
  if (priority === "medium") return "中优先级";
  return "低优先级";
}

function getPriorityClass(priority) {
  if (priority === "high") return "tag-red";
  if (priority === "medium") return "tag-orange";
  return "tag-gray";
}

function renderTaskList() {
  if (tasks.length === 0) {
    taskList.innerHTML = `<div class="empty">暂无任务，请先添加学习任务。</div>`;
    return;
  }

  taskList.innerHTML = tasks.map(task => `
    <div class="task-item ${task.completed ? "done" : ""}">
      <div class="task-info">
        <h3>${escapeHTML(task.title)}</h3>
        <p>
          <span class="tag tag-blue">${escapeHTML(task.topic)}</span>
          <span class="tag ${getPriorityClass(task.priority)}">${getPriorityText(task.priority)}</span>
          <span class="tag ${task.needReview ? "tag-green" : "tag-gray"}">${task.needReview ? "需要复习" : "无需复习"}</span>
          <span class="tag ${task.completed ? "tag-green" : "tag-gray"}">${task.completed ? "已完成" : "未完成"}</span>
        </p>
        <p>完成时间：${formatDateTime(task.deadline)}</p>
        <p>创建日期：${task.createdAt}${task.completedAt ? ` ｜ 打卡日期：${task.completedAt}` : ""}</p>
      </div>
      <div class="task-actions">
        ${task.completed ? "" : `<button class="done-btn" onclick="completeTask(${task.id})">完成打卡</button>`}
        <button class="delete-btn" onclick="deleteTask(${task.id})">删除</button>
      </div>
    </div>
  `).join("");
}

function renderStats() {
  const total = tasks.length;
  const finished = tasks.filter(task => task.completed).length;
  const today = getToday();
  const todayAdd = tasks.filter(task => task.createdAt === today).length;
  const todayFinished = tasks.filter(task => task.completedAt === today).length;
  const rate = total === 0 ? 0 : Math.round((finished / total) * 100);

  document.getElementById("totalCount").textContent = total;
  document.getElementById("finishedCount").textContent = finished;
  document.getElementById("todayAddCount").textContent = todayAdd;
  document.getElementById("finishRate").textContent = `${rate}%`;

  document.getElementById("tableTodayAdd").textContent = todayAdd;
  document.getElementById("tableTodayFinished").textContent = todayFinished;
  document.getElementById("tableTotal").textContent = total;
  document.getElementById("tableFinishRate").textContent = `${rate}%`;

  progressBar.style.width = `${rate}%`;
  progressText.textContent = `当前完成率：${rate}%`;
}

function renderCalendar() {
  const days = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    days.push(key);
  }

  const checkedDates = new Set(tasks.filter(task => task.completedAt).map(task => task.completedAt));

  checkinCalendar.innerHTML = days.map(date => {
    const checked = checkedDates.has(date);
    const label = date.slice(5).replace("-", "/");
    return `<div class="day ${checked ? "checked" : ""}"><strong>${label}</strong><span>${checked ? "已打卡" : "未打卡"}</span></div>`;
  }).join("");
}

function render() {
  renderTaskList();
  renderStats();
  renderCalendar();
}

function checkReminders() {
  if (!currentUser || tasks.length === 0) return;

  const now = new Date();

  tasks.forEach(task => {
    if (task.completed || task.reminded) return;

    const deadline = new Date(task.deadline);
    const diffMinutes = (deadline - now) / 1000 / 60;

    let remindBefore = 5;
    if (task.priority === "high") remindBefore = 30;
    if (task.priority === "medium") remindBefore = 15;
    if (task.priority === "low") remindBefore = 5;

    if (diffMinutes > 0 && diffMinutes <= remindBefore) {
      alert(`任务提醒：${task.title} 快到完成时间了！`);
      markReminded(task.id);
    }
  });
}

function toDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loginBtn.addEventListener("click", login);
usernameInput.addEventListener("keydown", event => {
  if (event.key === "Enter") login();
});
logoutBtn.addEventListener("click", logout);
addTaskBtn.addEventListener("click", addTask);

document.querySelectorAll(".recommend-btn").forEach(button => {
  button.addEventListener("click", () => {
    addRecommendTask(button.dataset.title, button.dataset.topic);
  });
});

setInterval(checkReminders, 60000);

if (currentUser) {
  showAppPage();
} else {
  showLoginPage();
}
