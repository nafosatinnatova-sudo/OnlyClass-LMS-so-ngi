import { icon } from "./icons.js";

const STORAGE_THEME = "onlyclass_theme";

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_THEME, theme);
  const themeIcon = document.getElementById("themeIcon");
  if (themeIcon) themeIcon.innerHTML = theme === "dark" ? icon("moon") : icon("sun");
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_THEME);
  setTheme(saved === "light" ? "light" : "dark");
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(cur === "dark" ? "light" : "dark");
}

function initIcons() {
  const set = (id, name) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(name);
  };
  set("brandMark", "spark");
  set("loginIcon2", "login");
  set("plusIcon", "plus");
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg || "Xatolik yuz berdi";
  el.classList.add("error--show");
}
function clearError(el) {
  if (!el) return;
  el.textContent = "";
  el.classList.remove("error--show");
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function goDashboard() {
  window.location.href = "/dashboard";
}

// Already logged in (cookie)
api("/api/me")
  .then(() => goDashboard())
  .catch(() => {});

initTheme();
initIcons();

const themeBtn = document.getElementById("themeBtn");
themeBtn?.addEventListener("click", toggleTheme);

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(loginError);
  const fd = new FormData(loginForm);
  try {
    await api("/api/auth/login", {
      method: "POST",
      body: {
        email: String(fd.get("email") || "").trim(),
        password: String(fd.get("password") || "")
      }
    });
    goDashboard();
  } catch (err) {
    showError(loginError, err?.message);
  }
});

