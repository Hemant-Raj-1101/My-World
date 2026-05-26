/* ═══════════════════════════════════════════════════
   MY WORLD (OAF) — script.js
   Beginner-friendly, fully commented JavaScript
═══════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────
   SECTION 1: INITIAL SETUP
───────────────────────────────────────────────────*/

// Credentials — stored only in frontend (no server)
const MAIN_USER = "Hemant Raj";
const MAIN_PASS = "Hema0846.";
const VAULT_PASS = "Hema5525.";
const ENTRY_PASS = "Hema5525."; // same vault password for locked entries

// Run when the page fully loads
window.addEventListener("DOMContentLoaded", () => {
  setDateDisplay();     // Show current date in topbar
  buildRatingButtons(); // Build 1–10 rating buttons
  loadAllData();        // Load everything from LocalStorage
  initParticles();      // Start the vault background particles
});

/* ─────────────────────────────────────────────────
   SECTION 2: HELPER UTILITIES
───────────────────────────────────────────────────*/

// Show today's date in the topbar
function setDateDisplay() {
  const el = document.getElementById("current-date-display");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// Save any JS object to LocalStorage under a key
function saveToLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Load a JS object from LocalStorage (returns default if not found)
function loadFromLS(key, defaultVal) {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultVal;
  try { return JSON.parse(raw); } catch { return defaultVal; }
}

// Generate a unique ID using timestamp + random number
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Get today's date string in YYYY-MM-DD format
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Format date nicely for display
function niceDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  } catch { return dateStr; }
}

// Show a temporary feedback message, then clear it
function showFeedback(elementId, message, timeout = 3000) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  setTimeout(() => { el.textContent = ""; }, timeout);
}

/* ─────────────────────────────────────────────────
   SECTION 3: SCREEN MANAGEMENT
───────────────────────────────────────────────────*/

// Switch visible screen by ID (hides all others)
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

/* ─────────────────────────────────────────────────
   SECTION 4: LOGIN SYSTEM
───────────────────────────────────────────────────*/

const loginBtn = document.getElementById("login-btn");

// Handle login button click
loginBtn.addEventListener("click", handleLogin);

// Also allow pressing Enter key to log in
document.getElementById("login-password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});
document.getElementById("login-username").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

function handleLogin() {
  const user = document.getElementById("login-username").value.trim();
  const pass = document.getElementById("login-password").value.trim();
  const errEl = document.getElementById("login-error");

  if (user === MAIN_USER && pass === MAIN_PASS) {
    // Correct — go to dashboard
    errEl.classList.add("hidden");
    showScreen("dashboard-screen");
    updateOverviewStats();
  } else {
    // Wrong — show error (can retry infinitely)
    errEl.classList.remove("hidden");
  }
}

/* ─────────────────────────────────────────────────
   SECTION 5: DASHBOARD SIDEBAR NAVIGATION
───────────────────────────────────────────────────*/

// All sidebar navigation links
const navItems = document.querySelectorAll(".nav-item");

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    if (!section) return;

    // Update active link style
    navItems.forEach(n => n.classList.remove("active"));
    item.classList.add("active");

    // Update page title in topbar
    const titles = {
      "overview":      "Dashboard 🏠",
      "daily-goals":   "Daily Goals 📅",
      "weekly-goals":  "Weekly Goals 📆",
      "checklist":     "Checklist ✅",
      "mood":          "Mood Tracker 😊",
      "satisfaction":  "Satisfaction ⭐",
      "notes":         "Quick Notes 📝",
      "analytics":     "Analytics 📊"
    };
    document.getElementById("page-title").textContent = titles[section] || section;

    // Hide all sections, show target
    document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
    const target = document.getElementById("section-" + section);
    if (target) target.classList.add("active");

    // Refresh analytics if that section is opened
    if (section === "analytics") renderAnalytics();

    // Close sidebar on mobile
    document.getElementById("sidebar").classList.remove("open");
  });
});

// Hamburger menu toggle (mobile)
document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// Logout button
document.getElementById("logout-btn").addEventListener("click", () => {
  showScreen("login-screen");
  // Clear login fields
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
});

/* ─────────────────────────────────────────────────
   SECTION 6: VAULT ACCESS (Mode 2)
───────────────────────────────────────────────────*/

// Open the vault password popup
document.getElementById("vault-btn").addEventListener("click", () => {
  document.getElementById("vault-password-input").value = "";
  document.getElementById("vault-error").classList.add("hidden");
  document.getElementById("vault-popup").classList.remove("hidden");
});

// Cancel vault popup
document.getElementById("vault-cancel-btn").addEventListener("click", () => {
  document.getElementById("vault-popup").classList.add("hidden");
});

// Check vault password and enter
document.getElementById("vault-enter-btn").addEventListener("click", checkVaultPassword);
document.getElementById("vault-password-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkVaultPassword();
});

function checkVaultPassword() {
  const val = document.getElementById("vault-password-input").value.trim();
  if (val === VAULT_PASS) {
    document.getElementById("vault-popup").classList.add("hidden");
    enterVault();
  } else {
    document.getElementById("vault-error").classList.remove("hidden");
  }
}

// Enter vault with transition animation
function enterVault() {
  showScreen("vault-screen");
  // Add transition class for visual effect
  const vs = document.getElementById("vault-screen");
  vs.classList.add("transitioning");
  setTimeout(() => vs.classList.remove("transitioning"), 900);

  // Load and render diary entries
  renderEntries();
  // Go to vault home section
  switchVaultSection("vault-home");
}

// Exit vault — go back to dashboard
document.getElementById("exit-vault-btn").addEventListener("click", () => {
  showScreen("dashboard-screen");
  updateOverviewStats();
});

/* ─────────────────────────────────────────────────
   SECTION 7: VAULT SIDEBAR NAVIGATION
───────────────────────────────────────────────────*/

document.querySelectorAll(".vault-nav-item").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const section = item.dataset.vsection;
    switchVaultSection(section);
  });
});

function switchVaultSection(sectionId) {
  // Update active nav link
  document.querySelectorAll(".vault-nav-item").forEach(n => n.classList.remove("active"));
  const activeNav = document.querySelector(`.vault-nav-item[data-vsection="${sectionId}"]`);
  if (activeNav) activeNav.classList.add("active");

  // Show target section
  document.querySelectorAll(".vault-section").forEach(s => s.classList.remove("active"));
  const target = document.getElementById("vsection-" + sectionId);
  if (target) target.classList.add("active");

  // Refresh entries list when viewing all entries
  if (sectionId === "vault-entries") renderEntries();
}

/* ─────────────────────────────────────────────────
   SECTION 8: DAILY GOALS
───────────────────────────────────────────────────*/

// Load goals from storage
function getDailyGoals() { return loadFromLS("oaf_daily_goals", []); }
function saveDailyGoals(goals) { saveToLS("oaf_daily_goals", goals); }

// Add a new daily goal
document.getElementById("add-daily-goal").addEventListener("click", () => {
  const text = document.getElementById("daily-goal-input").value.trim();
  const priority = document.getElementById("daily-goal-priority").value;
  const date = document.getElementById("daily-goal-date").value;

  if (!text) { alert("Please enter a goal! 📝"); return; }

  const goals = getDailyGoals();
  goals.push({ id: makeId(), text, priority, date, done: false });
  saveDailyGoals(goals);

  // Clear form
  document.getElementById("daily-goal-input").value = "";
  document.getElementById("daily-goal-date").value = "";

  renderDailyGoals();
  updateOverviewStats();
});

// Render all daily goals as cards
function renderDailyGoals() {
  const goals = getDailyGoals();
  const container = document.getElementById("daily-goals-list");

  if (goals.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><p>No daily goals yet. Add one above! 💪</p></div>`;
    return;
  }

  container.innerHTML = goals.map(g => `
    <div class="goal-card ${g.done ? "done" : ""}">
      <div class="goal-body">
        <div class="goal-title-text">${escapeHtml(g.text)}</div>
        <div class="goal-meta">
          <span class="priority-tag priority-${g.priority}">${g.priority}</span>
          ${g.date ? `<span class="goal-date-tag">📅 ${niceDate(g.date)}</span>` : ""}
        </div>
      </div>
      <div class="goal-actions">
        <button class="btn-icon" onclick="toggleDailyGoal('${g.id}')" title="Toggle done">
          ${g.done ? "↩️" : "✅"}
        </button>
        <button class="btn-icon danger" onclick="deleteDailyGoal('${g.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `).join("");
}

// Toggle a daily goal as done/undone
function toggleDailyGoal(id) {
  const goals = getDailyGoals().map(g => g.id === id ? { ...g, done: !g.done } : g);
  saveDailyGoals(goals);
  renderDailyGoals();
  updateOverviewStats();
}

// Delete a daily goal
function deleteDailyGoal(id) {
  const goals = getDailyGoals().filter(g => g.id !== id);
  saveDailyGoals(goals);
  renderDailyGoals();
  updateOverviewStats();
}

/* ─────────────────────────────────────────────────
   SECTION 9: WEEKLY GOALS
───────────────────────────────────────────────────*/

function getWeeklyGoals() { return loadFromLS("oaf_weekly_goals", []); }
function saveWeeklyGoals(goals) { saveToLS("oaf_weekly_goals", goals); }

document.getElementById("add-weekly-goal").addEventListener("click", () => {
  const text = document.getElementById("weekly-goal-input").value.trim();
  const priority = document.getElementById("weekly-goal-priority").value;
  const date = document.getElementById("weekly-goal-date").value;

  if (!text) { alert("Please enter a goal! 📝"); return; }

  const goals = getWeeklyGoals();
  goals.push({ id: makeId(), text, priority, date, done: false });
  saveWeeklyGoals(goals);

  document.getElementById("weekly-goal-input").value = "";
  document.getElementById("weekly-goal-date").value = "";

  renderWeeklyGoals();
});

function renderWeeklyGoals() {
  const goals = getWeeklyGoals();
  const container = document.getElementById("weekly-goals-list");

  if (goals.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📆</div><p>No weekly goals yet. Set your week! 🗓️</p></div>`;
    return;
  }

  container.innerHTML = goals.map(g => `
    <div class="goal-card ${g.done ? "done" : ""}">
      <div class="goal-body">
        <div class="goal-title-text">${escapeHtml(g.text)}</div>
        <div class="goal-meta">
          <span class="priority-tag priority-${g.priority}">${g.priority}</span>
          ${g.date ? `<span class="goal-date-tag">📅 ${niceDate(g.date)}</span>` : ""}
        </div>
      </div>
      <div class="goal-actions">
        <button class="btn-icon" onclick="toggleWeeklyGoal('${g.id}')">${g.done ? "↩️" : "✅"}</button>
        <button class="btn-icon danger" onclick="deleteWeeklyGoal('${g.id}')">🗑️</button>
      </div>
    </div>
  `).join("");
}

function toggleWeeklyGoal(id) {
  const goals = getWeeklyGoals().map(g => g.id === id ? { ...g, done: !g.done } : g);
  saveWeeklyGoals(goals);
  renderWeeklyGoals();
}

function deleteWeeklyGoal(id) {
  const goals = getWeeklyGoals().filter(g => g.id !== id);
  saveWeeklyGoals(goals);
  renderWeeklyGoals();
}

/* ─────────────────────────────────────────────────
   SECTION 10: TASK CHECKLIST
───────────────────────────────────────────────────*/

function getTasks() { return loadFromLS("oaf_tasks", []); }
function saveTasks(tasks) { saveToLS("oaf_tasks", tasks); }

document.getElementById("add-task").addEventListener("click", addTask);
document.getElementById("task-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

function addTask() {
  const text = document.getElementById("task-input").value.trim();
  if (!text) return;

  const tasks = getTasks();
  tasks.push({ id: makeId(), text, done: false });
  saveTasks(tasks);

  document.getElementById("task-input").value = "";
  renderTasks();
  updateOverviewStats();
}

function renderTasks() {
  const tasks = getTasks();
  const container = document.getElementById("task-list");

  if (tasks.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✅</div><p>No tasks yet. Stay productive! 🎯</p></div>`;
    return;
  }

  container.innerHTML = tasks.map(t => `
    <div class="task-item ${t.done ? "done" : ""}">
      <input type="checkbox" class="task-checkbox" ${t.done ? "checked" : ""} onchange="toggleTask('${t.id}')" />
      <span class="task-label">${escapeHtml(t.text)}</span>
      <button class="task-delete" onclick="deleteTask('${t.id}')">🗑️</button>
    </div>
  `).join("");
}

function toggleTask(id) {
  const tasks = getTasks().map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks(tasks);
  renderTasks();
  updateOverviewStats();
}

function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
  updateOverviewStats();
}

/* ─────────────────────────────────────────────────
   SECTION 11: MOOD TRACKER
───────────────────────────────────────────────────*/

function getMoodLog() { return loadFromLS("oaf_mood_log", []); }
function saveMoodLog(log) { saveToLS("oaf_mood_log", log); }

// Quick mood buttons on overview page
document.querySelectorAll(".mood-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const mood = btn.dataset.mood;
    logMood(mood);
    document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("quick-mood-feedback").textContent = `Mood logged: ${mood} ✨`;
    updateOverviewStats();
  });
});

// Big mood buttons on mood tracker page
document.querySelectorAll(".mood-big-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const mood = btn.dataset.mood;
    logMood(mood);
    document.querySelectorAll(".mood-big-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("mood-log-feedback").textContent = `${mood} logged for today ✅`;
    renderWeeklyMoodLog();
    updateOverviewStats();
  });
});

// Log or update today's mood entry
function logMood(emoji) {
  const log = getMoodLog();
  const today = todayStr();
  // Check if today already has an entry
  const existing = log.findIndex(e => e.date === today);
  if (existing >= 0) {
    log[existing].mood = emoji;  // Update
  } else {
    log.push({ date: today, mood: emoji }); // Add new
  }
  saveMoodLog(log);
}

// Show last 7 mood entries in the weekly log
function renderWeeklyMoodLog() {
  const log = getMoodLog();
  const container = document.getElementById("weekly-mood-log");
  if (!container) return;

  // Get last 7 entries (most recent first)
  const recent = [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  if (recent.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem">No mood entries yet 🌫️</p>`;
    return;
  }

  container.innerHTML = recent.map(e => `
    <div class="mood-log-entry">
      <span class="log-emoji">${e.mood}</span>
      <span class="log-date">${niceDate(e.date)}</span>
    </div>
  `).join("");
}

/* ─────────────────────────────────────────────────
   SECTION 12: SATISFACTION TRACKER
───────────────────────────────────────────────────*/

function getRatings() { return loadFromLS("oaf_ratings", []); }
function saveRatings(r) { saveToLS("oaf_ratings", r); }

let selectedRating = null;

// Build rating buttons 1–10
function buildRatingButtons() {
  const row = document.getElementById("rating-row");
  if (!row) return;
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement("button");
    btn.className = "rating-btn";
    btn.textContent = i;
    btn.addEventListener("click", () => {
      selectedRating = i;
      document.querySelectorAll(".rating-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    row.appendChild(btn);
  }
}

document.getElementById("save-rating").addEventListener("click", () => {
  if (!selectedRating) { showFeedback("rating-feedback", "Please select a rating first! ⭐"); return; }
  const ratings = getRatings();
  ratings.push({ date: todayStr(), rating: selectedRating });
  saveRatings(ratings);
  showFeedback("rating-feedback", `Rating ${selectedRating}/10 saved for today! 🌟`);
  selectedRating = null;
  document.querySelectorAll(".rating-btn").forEach(b => b.classList.remove("selected"));
  renderPastRatings();
});

function renderPastRatings() {
  const ratings = getRatings();
  const container = document.getElementById("past-ratings");
  if (!container) return;

  const recent = [...ratings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  if (recent.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem">No ratings yet. Rate your day! ⭐</p>`;
    return;
  }

  container.innerHTML = recent.map(r => `
    <div class="past-rating-row">
      <span>${niceDate(r.date)}</span>
      <span class="past-rating-badge">${r.rating}/10</span>
    </div>
  `).join("");
}

/* ─────────────────────────────────────────────────
   SECTION 13: QUICK NOTES
───────────────────────────────────────────────────*/

function getNotes() { return loadFromLS("oaf_notes", []); }
function saveNotes(notes) { saveToLS("oaf_notes", notes); }

document.getElementById("save-note").addEventListener("click", () => {
  const title = document.getElementById("note-title").value.trim();
  const body = document.getElementById("note-body").value.trim();

  if (!title && !body) { alert("Please write something! 📝"); return; }

  const notes = getNotes();
  notes.unshift({ id: makeId(), title: title || "Untitled", body, date: todayStr() });
  saveNotes(notes);

  document.getElementById("note-title").value = "";
  document.getElementById("note-body").value = "";

  renderNotes();
  updateOverviewStats();
});

function renderNotes() {
  const notes = getNotes();
  const container = document.getElementById("notes-list");

  if (notes.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><p>No notes yet. Jot something down! 💡</p></div>`;
    return;
  }

  container.innerHTML = notes.map(n => `
    <div class="note-card">
      <div class="note-card-title">${escapeHtml(n.title)}</div>
      <div class="note-card-body">${escapeHtml(n.body)}</div>
      <div class="note-card-date">📅 ${niceDate(n.date)}</div>
      <button class="note-delete" onclick="deleteNote('${n.id}')">🗑️ Delete</button>
    </div>
  `).join("");
}

function deleteNote(id) {
  const notes = getNotes().filter(n => n.id !== id);
  saveNotes(notes);
  renderNotes();
  updateOverviewStats();
}

/* ─────────────────────────────────────────────────
   SECTION 14: OVERVIEW STATS
───────────────────────────────────────────────────*/

function updateOverviewStats() {
  // Daily goals count
  const dGoals = getDailyGoals();
  document.getElementById("stat-daily").textContent = dGoals.length;

  // Completed tasks count
  const tasks = getTasks();
  const doneTasks = tasks.filter(t => t.done).length;
  document.getElementById("stat-tasks").textContent = `${doneTasks}/${tasks.length}`;

  // Today's mood
  const log = getMoodLog();
  const todayMood = log.find(e => e.date === todayStr());
  document.getElementById("stat-mood").textContent = todayMood ? todayMood.mood : "—";

  // Notes count
  document.getElementById("stat-notes").textContent = getNotes().length;
}

/* ─────────────────────────────────────────────────
   SECTION 15: ANALYTICS
───────────────────────────────────────────────────*/

function renderAnalytics() {
  renderGoalAnalytics();
  renderTaskAnalytics();
  renderMoodAnalytics();
  renderSatisfactionAnalytics();
}

function renderGoalAnalytics() {
  const daily = getDailyGoals();
  const weekly = getWeeklyGoals();
  const dDone = daily.filter(g => g.done).length;
  const wDone = weekly.filter(g => g.done).length;

  const el = document.getElementById("analytics-goals");
  el.innerHTML = `
    <div class="analytics-stat">
      <span>Daily Goals</span>
      <span class="analytics-stat-val">${daily.length}</span>
    </div>
    ${makeProgressRow("Daily Completed", dDone, daily.length)}
    <div class="analytics-stat">
      <span>Weekly Goals</span>
      <span class="analytics-stat-val">${weekly.length}</span>
    </div>
    ${makeProgressRow("Weekly Completed", wDone, weekly.length)}
  `;
}

function renderTaskAnalytics() {
  const tasks = getTasks();
  const done = tasks.filter(t => t.done).length;
  const el = document.getElementById("analytics-tasks");
  el.innerHTML = `
    <div class="analytics-stat">
      <span>Total Tasks</span>
      <span class="analytics-stat-val">${tasks.length}</span>
    </div>
    ${makeProgressRow("Completed", done, tasks.length)}
    <div class="analytics-stat">
      <span>Pending</span>
      <span class="analytics-stat-val">${tasks.length - done}</span>
    </div>
  `;
}

function renderMoodAnalytics() {
  const log = getMoodLog();
  const recent = [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const el = document.getElementById("analytics-mood");

  if (recent.length === 0) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:0.88rem">No mood data yet 🌫️</p>`;
    return;
  }

  // Count each mood
  const counts = {};
  recent.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });

  el.innerHTML = Object.entries(counts).map(([mood, count]) => `
    <div class="analytics-stat">
      <span>${mood}</span>
      <span class="analytics-stat-val">${count}x</span>
    </div>
  `).join("");
}

function renderSatisfactionAnalytics() {
  const ratings = getRatings();
  const recent = [...ratings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const el = document.getElementById("analytics-satisfaction");

  if (recent.length === 0) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:0.88rem">No rating data yet ⭐</p>`;
    return;
  }

  const avg = (recent.reduce((s, r) => s + r.rating, 0) / recent.length).toFixed(1);
  const max = Math.max(...recent.map(r => r.rating));
  const min = Math.min(...recent.map(r => r.rating));

  el.innerHTML = `
    <div class="analytics-stat"><span>Average (last 7)</span><span class="analytics-stat-val">${avg}/10</span></div>
    <div class="analytics-stat"><span>Best Day</span><span class="analytics-stat-val">${max}/10</span></div>
    <div class="analytics-stat"><span>Lowest Day</span><span class="analytics-stat-val">${min}/10</span></div>
    ${makeProgressRow("Avg Score", parseFloat(avg), 10)}
  `;
}

// Helper: build a progress bar row HTML
function makeProgressRow(label, value, total) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return `
    <div class="progress-row">
      <span style="min-width:120px;font-size:0.82rem;color:var(--text-muted)">${label}</span>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="progress-label" style="font-size:0.82rem">${pct}%</span>
    </div>
  `;
}

/* ─────────────────────────────────────────────────
   SECTION 16: BACKUP — EXPORT & IMPORT
───────────────────────────────────────────────────*/

// Export all LocalStorage data as JSON file
document.getElementById("export-btn").addEventListener("click", () => {
  const data = {
    daily_goals:   getDailyGoals(),
    weekly_goals:  getWeeklyGoals(),
    tasks:         getTasks(),
    mood_log:      getMoodLog(),
    ratings:       getRatings(),
    notes:         getNotes(),
    diary_entries: getDiaryEntries(),
    exported_at:   new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "myworld_backup.json";
  a.click();
  URL.revokeObjectURL(url);

  showFeedback("backup-feedback", "✅ Backup exported successfully!");
});

// Import data from JSON file
document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);

      // Restore each data key if present
      if (data.daily_goals)   saveToLS("oaf_daily_goals", data.daily_goals);
      if (data.weekly_goals)  saveToLS("oaf_weekly_goals", data.weekly_goals);
      if (data.tasks)         saveToLS("oaf_tasks", data.tasks);
      if (data.mood_log)      saveToLS("oaf_mood_log", data.mood_log);
      if (data.ratings)       saveToLS("oaf_ratings", data.ratings);
      if (data.notes)         saveToLS("oaf_notes", data.notes);
      if (data.diary_entries) saveToLS("oaf_diary", data.diary_entries);

      // Reload everything
      loadAllData();
      showFeedback("backup-feedback", "✅ Backup imported successfully!");
    } catch {
      showFeedback("backup-feedback", "❌ Invalid backup file.");
    }
  };
  reader.readAsText(file);
  e.target.value = ""; // Reset file input
});

/* ─────────────────────────────────────────────────
   SECTION 17: DIARY VAULT — ENTRY MANAGEMENT
───────────────────────────────────────────────────*/

function getDiaryEntries() { return loadFromLS("oaf_diary", []); }
function saveDiaryEntries(entries) { saveToLS("oaf_diary", entries); }

// Set today as default date in new entry form
document.getElementById("entry-date").value = todayStr();

// Save new diary entry
document.getElementById("save-entry-btn").addEventListener("click", () => {
  const title = document.getElementById("entry-title").value.trim();
  const date = document.getElementById("entry-date").value;
  const body = document.getElementById("entry-body").value.trim();
  const locked = document.getElementById("entry-lock").checked;

  if (!body) { showFeedback("entry-save-feedback", "Please write something first 🖊️"); return; }

  const entries = getDiaryEntries();
  entries.unshift({
    id: makeId(),
    title: title || "Untitled Entry",
    date: date || todayStr(),
    body,
    locked,
    createdAt: new Date().toISOString()
  });
  saveDiaryEntries(entries);

  // Clear form
  document.getElementById("entry-title").value = "";
  document.getElementById("entry-body").value = "";
  document.getElementById("entry-lock").checked = false;
  document.getElementById("entry-date").value = todayStr();

  showFeedback("entry-save-feedback", "✅ Entry saved to the vault.");
  renderEntries();
});

// Render all diary entries
function renderEntries() {
  const entries = getDiaryEntries();
  const container = document.getElementById("entries-list");
  if (!container) return;

  if (entries.length === 0) {
    container.innerHTML = `<div class="empty-state" style="color:var(--vault-muted)">
      <div class="empty-state-icon">🕯️</div>
      <p>No entries yet. Start writing.</p>
    </div>`;
    return;
  }

  container.innerHTML = entries.map(e => `
    <div class="entry-card">
      <div class="entry-card-body">
        <div class="entry-card-title">
          ${e.locked ? "🔒 " : ""}${escapeHtml(e.title)}
        </div>
        <div class="entry-card-meta">
          <span>📅 ${niceDate(e.date)}</span>
          ${e.locked ? `<span class="entry-locked-badge">Locked</span>` : ""}
        </div>
      </div>
      <div class="entry-card-actions">
        <button class="btn-vault-sm" onclick="openEntry('${e.id}')">👁️ View</button>
        <button class="btn-vault-sm danger" onclick="confirmDeleteEntry('${e.id}')">🗑️</button>
      </div>
    </div>
  `).join("");
}

// Track which entry is being opened/deleted
let pendingEntryId = null;

// Open a diary entry (with unlock check if locked)
function openEntry(id) {
  const entries = getDiaryEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  if (entry.locked) {
    // Show unlock popup
    pendingEntryId = id;
    document.getElementById("entry-unlock-input").value = "";
    document.getElementById("entry-unlock-error").classList.add("hidden");
    document.getElementById("entry-unlock-popup").classList.remove("hidden");
  } else {
    showEntryModal(entry);
  }
}

// Unlock entry password check
document.getElementById("entry-unlock-btn").addEventListener("click", () => {
  const val = document.getElementById("entry-unlock-input").value.trim();
  if (val === ENTRY_PASS) {
    document.getElementById("entry-unlock-popup").classList.add("hidden");
    const entries = getDiaryEntries();
    const entry = entries.find(e => e.id === pendingEntryId);
    if (entry) showEntryModal(entry);
  } else {
    document.getElementById("entry-unlock-error").classList.remove("hidden");
  }
});
document.getElementById("entry-unlock-cancel").addEventListener("click", () => {
  document.getElementById("entry-unlock-popup").classList.add("hidden");
  pendingEntryId = null;
});
document.getElementById("entry-unlock-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("entry-unlock-btn").click();
});

// Display full entry in modal
function showEntryModal(entry) {
  document.getElementById("view-entry-title").textContent = entry.title;
  document.getElementById("view-entry-date").textContent = niceDate(entry.date);
  document.getElementById("view-entry-body").textContent = entry.body;
  // Store ID for deletion
  document.getElementById("delete-view-btn").dataset.id = entry.id;
  document.getElementById("view-entry-modal").classList.remove("hidden");
}

// Close view modal
document.getElementById("close-view-btn").addEventListener("click", () => {
  document.getElementById("view-entry-modal").classList.add("hidden");
});

// Delete entry from modal
document.getElementById("delete-view-btn").addEventListener("click", () => {
  const id = document.getElementById("delete-view-btn").dataset.id;
  if (confirm("Delete this entry permanently? 🗑️")) {
    const entries = getDiaryEntries().filter(e => e.id !== id);
    saveDiaryEntries(entries);
    document.getElementById("view-entry-modal").classList.add("hidden");
    renderEntries();
  }
});

// Delete entry from entries list
function confirmDeleteEntry(id) {
  if (confirm("Delete this diary entry forever? 🗑️")) {
    const entries = getDiaryEntries().filter(e => e.id !== id);
    saveDiaryEntries(entries);
    renderEntries();
  }
}

/* ─────────────────────────────────────────────────
   SECTION 18: LOAD ALL DATA ON STARTUP
───────────────────────────────────────────────────*/

function loadAllData() {
  renderDailyGoals();
  renderWeeklyGoals();
  renderTasks();
  renderWeeklyMoodLog();
  renderPastRatings();
  renderNotes();
  renderEntries();
  updateOverviewStats();
}

/* ─────────────────────────────────────────────────
   SECTION 19: PARTICLES BACKGROUND (Vault Mode)
───────────────────────────────────────────────────*/

function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  // Resize canvas on window resize
  window.addEventListener("resize", () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  // Create 80 floating particles
  const particles = [];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    Math.random() * 1.5 + 0.3,        // radius
      dx:   (Math.random() - 0.5) * 0.35,     // x velocity
      dy:   (Math.random() - 0.5) * 0.35,     // y velocity
      alpha: Math.random() * 0.4 + 0.1        // opacity
    });
  }

  // Animation loop
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 170, 255, ${p.alpha})`;
      ctx.fill();

      // Move particle
      p.x += p.dx;
      p.y += p.dy;

      // Wrap around edges
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ─────────────────────────────────────────────────
   SECTION 20: SECURITY — ESCAPE HTML
   Prevents XSS by escaping user-typed content
───────────────────────────────────────────────────*/

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
