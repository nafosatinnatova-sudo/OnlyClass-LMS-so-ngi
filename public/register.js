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
  set("regIcon", "plus");
  set("loginIcon", "login");
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

const registerForm = document.getElementById("registerForm");
const regError = document.getElementById("regError");

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(regError);
  const fd = new FormData(registerForm);
  try {
    await api("/api/auth/register", {
      method: "POST",
      body: {
        fullName: String(fd.get("fullName") || "").trim(),
        age: String(fd.get("age") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        password: String(fd.get("password") || "")
      }
    });
    goDashboard();
  } catch (err) {
    showError(regError, err?.message);
  }
});

