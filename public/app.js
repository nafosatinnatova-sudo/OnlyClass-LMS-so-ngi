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
  const theme = saved === "light" ? "light" : "dark";
  setTheme(theme);
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
  set("brandMark2", "spark");
  set("sparkIcon", "spark");
  set("ctaArrow", "arrow");
  set("shieldIcon", "shield");
  set("loginIcon", "login");
  set("menuIcon", "menu");

  set("kpiVideo", "video");
  set("kpiTest", "test");
  set("kpiFile", "file");
  set("kpiSupport", "telegram");

  set("fVideo", "video");
  set("fMentor", "user");
  set("fTest", "test");
  set("fSupport", "telegram");
  set("fCert", "shield");
  set("fShield", "lock");

  set("tg1", "telegram");
  set("tg2", "telegram");
  set("ph1", "phone");
  set("ph2", "phone");
}

function initDrawer() {
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");
  if (!burger || !drawer) return;

  const close = () => drawer.classList.remove("drawer--open");
  const toggle = () => drawer.classList.toggle("drawer--open");

  burger.addEventListener("click", toggle);
  drawer.addEventListener("click", (e) => {
    if (e.target && e.target.matches("a")) close();
  });
  document.addEventListener("click", (e) => {
    if (!drawer.classList.contains("drawer--open")) return;
    if (drawer.contains(e.target)) return;
    if (burger.contains(e.target)) return;
    close();
  });
}

function initSmoothOffsetScroll() {
  // sticky navbar offset correction
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH = 74;
      const y = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: y, behavior: "smooth" });
      history.replaceState(null, "", href);
    });
  });
}

initTheme();
initIcons();
initDrawer();
initSmoothOffsetScroll();

const themeBtn = document.getElementById("themeBtn");
if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

