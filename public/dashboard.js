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

async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // ignore
  } finally {
    window.location.href = "/login";
  }
}

async function api(path, { method = "GET", body } = {}) {
  const doFetch = async () => {
    const res = await fetch(path, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  let { res, data } = await doFetch();
  if (res.status === 401) {
    // try refresh once
    const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (r.ok) {
      ({ res, data } = await doFetch());
    }
  }

  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function initIcons() {
  const set = (id, name) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(name);
  };
  set("brandMark", "spark");
  set("menuIcon", "menu");
  set("iHome", "spark");
  set("iVideo", "video");
  set("iTest", "test");
  set("iFile", "file");
  set("iChart", "chart");
  set("iUser", "user");
  set("iTg", "telegram");
  set("iLogout", "logout");
  set("iPlus", "plus");
  set("iShield", "shield");
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function safeText(s) {
  return String(s || "").replace(/[<>]/g, "");
}

function parseHash() {
  const hash = window.location.hash || "#/bosh-sahifa";
  const cleaned = hash.replace(/^#\//, "");
  const parts = cleaned.split("/").filter(Boolean);
  const base = parts[0] || "bosh-sahifa";
  return { hash, cleaned, parts, base };
}

function setActive(base) {
  document.querySelectorAll(".sideLink[data-route]").forEach((a) => {
    a.classList.toggle("sideLink--active", a.getAttribute("data-route") === base);
  });
}

function roleLabel(role) {
  if (role === "admin") return "OnlyClass";
  if (role === "teacher") return "Teacher";
  return "Student";
}

function avatarLetter(role) {
  if (role === "teacher") return "T";
  if (role === "admin") return "O";
  return "S";
}

function embedFor(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  // YouTube
  const yt1 = u.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i);
  const yt2 = u.match(/youtu\.be\/([A-Za-z0-9_-]+)/i);
  const id = yt1?.[1] || yt2?.[1];
  if (id) {
    const src = `https://www.youtube.com/embed/${id}`;
    return `<iframe src="${src}" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  // mp4/webm direct
  if (/\.(mp4|webm)(\?|#|$)/i.test(u)) {
    return `<video controls src="${u}"></video>`;
  }
  // fallback iframe
  return `<iframe src="${u}" title="Video"></iframe>`;
}

function hydrateUserUi(user) {
  const welcomeText = document.getElementById("welcomeText");
  const chipName = document.getElementById("chipName");
  const chipRole = document.getElementById("chipRole");
  const avatar = document.getElementById("avatarLetter");

  const role = user.role;
  const label = roleLabel(role);
  const who = role === "admin" ? "OnlyClass" : user.fullName;

  if (welcomeText) welcomeText.textContent = `Xush kelibsiz, ${who} ${label}`;
  if (chipName) chipName.textContent = who;
  if (chipRole) chipRole.textContent = label;
  if (avatar) avatar.textContent = avatarLetter(role);

  const teacherGroup = document.getElementById("teacherGroup");
  const adminGroup = document.getElementById("adminGroup");
  if (teacherGroup) teacherGroup.style.display = role === "teacher" || role === "admin" ? "" : "none";
  if (adminGroup) adminGroup.style.display = role === "admin" ? "" : "none";
}

function viewHome(user) {
  const stats = user.stats || {};
  const isStudent = user.role === "student";

  const cardLabels =
    user.role === "teacher"
      ? ["Testlar soni", "Yuklagan videolar", "Yuklagan qo‘llanmalar", "Reyting o‘rni"]
      : ["Test o‘rtacha %", "Ko‘rilgan videolar", "Yuklab olingan qo‘llanmalar", "Reyting o‘rni"];

  return el(`
    <div>
      <div class="panel" style="margin-bottom:14px">
        <h3 style="margin:0 0 8px">Dashboard</h3>
        <div class="cards4">
          <div class="card"><h3>${cardLabels[0]}</h3><div class="big">${safeText(stats.testsAvg ?? 0)}${isStudent ? "%" : ""}</div></div>
          <div class="card"><h3>${cardLabels[1]}</h3><div class="big">${safeText(stats.videosWatched ?? 0)}</div></div>
          <div class="card"><h3>${cardLabels[2]}</h3><div class="big">${safeText(stats.guidesDownloaded ?? 0)}</div></div>
          <div class="card"><h3>${cardLabels[3]}</h3><div class="big">${safeText(stats.ratingPlace ?? "—")}</div></div>
        </div>
        <div class="muted" style="font-size:13px; line-height:1.6">
          Bu demo — real videodars/test/qo‘llanma ma’lumotlari bo‘limlardan boshqariladi.
        </div>
      </div>

      <div class="cols2">
        <div class="panel">
          <h3 style="margin:0 0 10px">Tezkor yo‘llar</h3>
          <div class="list">
            <div class="item"><div><h4>Videodarslar</h4><p>Yo‘nalish → Ustoz → Darslar</p></div><a class="tag" href="#/video-darslar">Open</a></div>
            <div class="item"><div><h4>Testlar</h4><p>1 marta natija saqlanadi, 2 marta faqat ko‘rinadi</p></div><a class="tag" href="#/testlar">Open</a></div>
            <div class="item"><div><h4>Qo‘llanmalar</h4><p>Faqat .pdf — yuklab olish hisobi yuritiladi</p></div><a class="tag" href="#/qollanmalar">Open</a></div>
          </div>
        </div>
        <div class="panel">
          <h3 style="margin:0 0 10px">Aloqa</h3>
          <p class="muted" style="margin:0 0 14px; line-height:1.6">Support bo‘limi doim ochiq.</p>
          <a class="btn btn--primary" href="#/aloqa"><span>${icon("telegram")}</span><span>Aloqa</span></a>
        </div>
      </div>
    </div>
  `);
}

function viewContact() {
  return el(`
    <div class="panel">
      <h3 style="margin:0 0 10px">Aloqa</h3>
      <p class="muted" style="margin:0 0 14px; line-height:1.6">
        Telegram support yoki telefon orqali bog‘laning.
      </p>
      <div class="contactCards">
        <a class="contact" href="https://t.me/OnlyClassLMS_support" target="_blank" rel="noreferrer">
          <div class="contact__left">
            <div class="contact__icon">${icon("telegram")}</div>
            <div>
              <div class="contact__label">Telegram</div>
              <div class="contact__value">t.me/OnlyClassLMS_support</div>
            </div>
          </div>
          <span class="tag">Open</span>
        </a>
        <a class="contact" href="https://t.me/OnlyClassLMSsupport" target="_blank" rel="noreferrer">
          <div class="contact__left">
            <div class="contact__icon">${icon("telegram")}</div>
            <div>
              <div class="contact__label">Telegram</div>
              <div class="contact__value">t.me/OnlyClassLMSsupport</div>
            </div>
          </div>
          <span class="tag">Open</span>
        </a>
        <a class="contact" href="tel:+998700103658">
          <div class="contact__left">
            <div class="contact__icon">${icon("phone")}</div>
            <div>
              <div class="contact__label">Telefon</div>
              <div class="contact__value">+998 70 010 36 58</div>
            </div>
          </div>
          <span class="tag">Call</span>
        </a>
        <a class="contact" href="tel:+998700103758">
          <div class="contact__left">
            <div class="contact__icon">${icon("phone")}</div>
            <div>
              <div class="contact__label">Telefon</div>
              <div class="contact__value">+998 70 010 37 58</div>
            </div>
          </div>
          <span class="tag">Call</span>
        </a>
      </div>
    </div>
  `);
}

function viewProfile(user) {
  return el(`
    <div class="panel">
      <h3 style="margin:0 0 10px">Profil</h3>
      <p class="muted" style="margin:0 0 14px; line-height:1.6">
        Ism-familiya va telefonni yangilashingiz mumkin.
      </p>
      <form id="profileForm" class="glass" style="box-shadow:none">
        <div class="row">
          <div class="field">
            <label>Ism-familiya</label>
            <input name="fullName" value="${safeText(user.fullName)}" minlength="3" required />
          </div>
          <div class="field">
            <label>Yosh</label>
            <input name="age" value="${user.age ?? ""}" inputmode="numeric" />
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Email</label>
            <input value="${safeText(user.email)}" disabled />
          </div>
          <div class="field">
            <label>Telefon</label>
            <input name="phone" value="${safeText(user.phone ?? "")}" inputmode="tel" />
          </div>
        </div>
        <button class="btn btn--primary" type="submit">
          <span>${icon("shield")}</span>
          <span>Saqlash</span>
        </button>
        <span class="muted" id="profileMsg" style="margin-left:10px"></span>
      </form>
    </div>
  `);
}

function trackCards(tracks, baseHref) {
  const cards = tracks
    .map((t) => {
      const img = t.imageUrl
        ? `<img src="${safeText(t.imageUrl)}" alt="${safeText(t.title)}" loading="lazy" />`
        : "";
      return `
        <a class="mediaCard" href="${baseHref}/track/${t.id}">
          <div class="mediaCard__img">${img}</div>
          <div class="mediaCard__body">
            <div class="mediaCard__title">${safeText(t.title)}</div>
            <p class="mediaCard__desc">${safeText(t.description)}</p>
            <div class="metaRow">
              <span class="metaPill">${safeText(t.teachersCount ?? 0)} ustoz</span>
              <span class="metaPill">${icon("arrow")} Kirish</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
  return el(`<div class="gridCards">${cards || `<div class="muted">Yo‘nalishlar hozircha yo‘q.</div>`}</div>`);
}

function profileCards(profiles, baseHref) {
  const cards = profiles
    .map((p) => {
      const avatar = p.avatarUrl
        ? `<img src="${safeText(p.avatarUrl)}" alt="${safeText(p.teacherName)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" />`
        : "";
      return `
        <a class="mediaCard" href="${baseHref}/profile/${p.id}">
          <div class="mediaCard__img">${avatar}</div>
          <div class="mediaCard__body">
            <div class="mediaCard__title">${safeText(p.teacherName)}</div>
            <p class="mediaCard__desc"><b>${safeText(p.headline)}</b> — ${safeText(p.aboutShort)}</p>
            <div class="metaRow">
              <span class="metaPill">${safeText(p.videosCount ?? 0)} video</span>
              <span class="metaPill">${safeText(p.testsCount ?? 0)} test</span>
              <span class="metaPill">${safeText(p.guidesCount ?? 0)} pdf</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
  return el(`<div class="gridCards">${cards || `<div class="muted">Ustozlar hozircha yo‘q.</div>`}</div>`);
}

function viewVideoPlayer({ user, video, videos, comments }) {
  const list = videos
    .map((v, idx) => {
      const active = v.id === video.id ? "lessonBtn--active" : "";
      const desc = v.description ? safeText(v.description) : "—";
      return `
        <button class="lessonBtn ${active}" data-video="${v.id}" type="button">
          <div>
            <div class="t">${idx + 1}. ${safeText(v.title)}</div>
            <div class="d">${desc}</div>
          </div>
          <div class="lessonDur">${safeText(v.duration)}</div>
        </button>
      `;
    })
    .join("");

  const canComment = user.role === "student" || user.role === "admin";
  const commentsHtml = comments
    .map((c) => {
      return `
        <div class="item">
          <div>
            <h4>${safeText(c.authorName)}</h4>
            <p>${safeText(c.text)}</p>
          </div>
          <span class="tag">${new Date(c.createdAt).toLocaleDateString()}</span>
        </div>
      `;
    })
    .join("");

  const hasTest = !!video.testId;
  const hasGuide = !!video.guideId;

  return el(`
    <div class="videoLayout">
      <aside class="sideList">
        <div class="sideList__head">
          <div style="font-weight:900">Darslar</div>
          <span class="tag">${safeText(videos.length)} ta</span>
        </div>
        <div class="sideList__scroll" id="lessonsScroll">${list}</div>
      </aside>

      <section class="player">
        <div class="player__media">${embedFor(video.videoUrl)}</div>
        <div class="player__body">
          <h3 class="player__title">${safeText(video.title)}</h3>
          <p class="player__desc">${safeText(video.description || "")}</p>

          <div class="player__actions">
            <span class="metaPill">${icon("video")} ${safeText(video.views ?? 0)} views</span>
            <span class="metaPill">${icon("spark")} ${safeText(video.duration)}</span>
            ${hasTest ? `<a class="btn" href="#/testlar/test/${video.testId}"><span>${icon("test")}</span><span>Test</span></a>` : ""}
            ${hasGuide ? `<button class="btn" type="button" id="downloadGuide"><span>${icon("file")}</span><span>Qo‘llanma</span></button>` : ""}
          </div>
        </div>
      </section>

      <section class="panel" style="grid-column: 1 / -1">
        <h3 style="margin:0 0 10px">Kommentlar</h3>
        <div class="list" id="commentsList">${commentsHtml || `<div class="muted">Hozircha komment yo‘q.</div>`}</div>
        ${
          canComment
            ? `
            <div style="margin-top:12px">
              <textarea class="textarea" id="commentText" placeholder="Komment yozing..."></textarea>
              <div style="display:flex; gap:10px; margin-top:10px; align-items:center">
                <button class="btn btn--primary" id="sendComment" type="button">
                  <span>${icon("arrow")}</span><span>Yuborish</span>
                </button>
                <span class="muted" id="commentMsg"></span>
              </div>
            </div>
          `
            : `<p class="muted" style="margin:10px 0 0">Komment qoldirish faqat Student yoki Admin uchun.</p>`
        }
      </section>
    </div>
  `);
}

function viewTestsList(tests, teacherName) {
  const cards = tests
    .map((t) => {
      const qCount = Array.isArray(t.questions) ? t.questions.length : t.questionsCount || 0;
      const img = t.imageUrl
        ? `<img src="${safeText(t.imageUrl)}" alt="${safeText(t.title)}" loading="lazy" />`
        : "";
      return `
        <a class="mediaCard" href="#/testlar/test/${t.id}">
          <div class="mediaCard__img">${img}</div>
          <div class="mediaCard__body">
            <div class="mediaCard__title">${safeText(t.title)}</div>
            <p class="mediaCard__desc">Teacher: ${safeText(teacherName)} • ${safeText(qCount)} savol • ${safeText(t.level)}</p>
            <div class="metaRow">
              <span class="metaPill">${icon("test")} ${safeText(qCount)} savol</span>
              <span class="metaPill">${icon("arrow")} Boshlash</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
  return el(`<div class="gridCards">${cards || `<div class="muted">Testlar hozircha yo‘q.</div>`}</div>`);
}

function viewGuidesList(guides, teacherName) {
  const cards = guides
    .map((g) => {
      return `
        <div class="mediaCard">
          <div class="mediaCard__img"></div>
          <div class="mediaCard__body">
            <div class="mediaCard__title">${safeText(g.title)}</div>
            <p class="mediaCard__desc">Teacher: ${safeText(teacherName)} • ${safeText(g.description || "")}</p>
            <div class="metaRow">
              <span class="metaPill">${icon("file")} PDF</span>
              <span class="metaPill">${safeText(g.downloadCount ?? 0)} yuklab olish</span>
              <button class="btn" type="button" data-download="${g.id}">
                <span>${icon("arrow")}</span><span>Yuklab olish</span>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
  return el(`<div class="gridCards">${cards || `<div class="muted">Qo‘llanmalar hozircha yo‘q.</div>`}</div>`);
}

function viewTestRunner(test) {
  return el(`
    <div class="panel">
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap">
        <div>
          <h3 style="margin:0 0 6px">${safeText(test.title)}</h3>
          <p class="muted" style="margin:0; line-height:1.6">${safeText(test.level)} • ${safeText(test.questions.length)} savol</p>
        </div>
        <span class="tag" id="timerTag">—</span>
      </div>

      <div class="glass" style="margin-top:14px; box-shadow:none" id="qBox"></div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; align-items:center">
        <button class="btn" id="prevBtn" type="button">${icon("arrow")} Oldingi</button>
        <button class="btn btn--primary" id="nextBtn" type="button">${icon("arrow")} Keyingi</button>
        <span class="muted" id="progress"></span>
      </div>

      <div class="panel" style="margin-top:14px; display:none" id="resultBox"></div>
    </div>
  `);
}

function viewTeacherProfileCreate(track) {
  return el(`
    <div class="glass" style="box-shadow:none; margin-top:14px">
      <h3 style="margin:0 0 10px">Profil yaratish (${safeText(track.title)})</h3>
      <p class="muted" style="margin:0 0 14px; line-height:1.6">
        P qismi 20 ta belgidan oshmasligi shart.
      </p>
      <form id="createProfileForm">
        <div class="row">
          <div class="field">
            <label>Rasm URL</label>
            <input name="avatarUrl" placeholder="https://..." />
          </div>
          <div class="field">
            <label>H1 (qaysi darslar?)</label>
            <input name="headline" placeholder="Masalan: Frontend darslar" required minlength="2" />
          </div>
        </div>
        <div class="field">
          <label>P (max 20 belgi)</label>
          <input name="aboutShort" placeholder="Qisqacha..." required maxlength="20" />
        </div>
        <button class="btn btn--primary" type="submit"><span>${icon("plus")}</span><span>Profil yaratish</span></button>
        <span class="muted" id="createProfileMsg" style="margin-left:10px"></span>
      </form>
    </div>
  `);
}

function viewTeacherAddVideo(profileId) {
  return el(`
    <div class="glass" style="box-shadow:none; margin-top:14px">
      <h3 style="margin:0 0 10px">Video qo‘shish</h3>
      <form id="addVideoForm">
        <div class="field"><label>Video URL</label><input name="videoUrl" placeholder="YouTube yoki MP4 URL" required /></div>
        <div class="row">
          <div class="field"><label>Sarlavha</label><input name="title" required minlength="2" /></div>
          <div class="field"><label>Davomiyligi</label><input name="duration" placeholder="Masalan: 12:30" required /></div>
        </div>
        <div class="field"><label>Izoh</label><input name="description" placeholder="Qisqacha..." /></div>
        <div class="row">
          <div class="field"><label>Test ulash (ixtiyoriy testId)</label><input name="testId" placeholder="test_..." /></div>
          <div class="field"><label>Qo‘llanma ulash (ixtiyoriy guideId)</label><input name="guideId" placeholder="guide_..." /></div>
        </div>
        <button class="btn btn--primary" type="submit"><span>${icon("plus")}</span><span>Qo‘shish</span></button>
        <span class="muted" id="addVideoMsg" style="margin-left:10px"></span>
      </form>
      <p class="muted" style="margin:10px 0 0; font-size:12px; line-height:1.6">
        Test/Qo‘llanma ulash: avval Testlar/Qo‘llanmalarda yarating, so‘ng ID ni shu yerga kiriting.
      </p>
    </div>
  `);
}

function viewTeacherAddGuide(profileId) {
  return el(`
    <div class="glass" style="box-shadow:none; margin-top:14px">
      <h3 style="margin:0 0 10px">PDF qo‘llanma qo‘shish</h3>
      <form id="addGuideForm">
        <div class="field"><label>PDF URL</label><input name="pdfUrl" placeholder="https://.../file.pdf" required /></div>
        <div class="row">
          <div class="field"><label>Sarlavha</label><input name="title" required minlength="2" /></div>
          <div class="field"><label>Izoh</label><input name="description" placeholder="Qisqacha..." /></div>
        </div>
        <button class="btn btn--primary" type="submit"><span>${icon("plus")}</span><span>Qo‘shish</span></button>
        <span class="muted" id="addGuideMsg" style="margin-left:10px"></span>
      </form>
    </div>
  `);
}

function viewTeacherAddTest(profileId) {
  return el(`
    <div class="glass" style="box-shadow:none; margin-top:14px">
      <h3 style="margin:0 0 10px">Test yaratish</h3>
      <p class="muted" style="margin:0 0 10px; line-height:1.6">
        Har bir savol uchun timeout max 15 soniya.
      </p>
      <form id="addTestForm">
        <div class="row">
          <div class="field"><label>Test rasm URL (ixtiyoriy)</label><input name="imageUrl" placeholder="https://..." /></div>
          <div class="field"><label>Test sarlavhasi</label><input name="title" required minlength="2" /></div>
        </div>
        <div class="field">
          <label>Daraja</label>
          <input name="level" placeholder="oson / ortacha / qiyin" required />
        </div>

        <div class="panel" style="box-shadow:none; margin-top:12px">
          <h3 style="margin:0 0 10px; font-size:14px">1-savol</h3>
          <div class="field"><label>Savol text</label><input name="q1_text" required /></div>
          <div class="row">
            <div class="field"><label>Timeout (1-15)</label><input name="q1_timeout" inputmode="numeric" placeholder="10" required /></div>
            <div class="field"><label>To‘g‘ri javob index (0-3)</label><input name="q1_correct" inputmode="numeric" placeholder="0" required /></div>
          </div>
          <div class="row">
            <div class="field"><label>Variant A</label><input name="q1_a" required /></div>
            <div class="field"><label>Variant B</label><input name="q1_b" required /></div>
          </div>
          <div class="row">
            <div class="field"><label>Variant C</label><input name="q1_c" /></div>
            <div class="field"><label>Variant D</label><input name="q1_d" /></div>
          </div>
        </div>

        <button class="btn btn--primary" type="submit"><span>${icon("plus")}</span><span>Test yaratish</span></button>
        <span class="muted" id="addTestMsg" style="margin-left:10px"></span>
      </form>
      <p class="muted" style="margin:10px 0 0; font-size:12px; line-height:1.6">
        Demo versiya: tezkor 1 ta savolli test creator. Keyin ko‘p savolli builder qo‘shamiz.
      </p>
    </div>
  `);
}

function viewAdmin(users, tracks) {
  const rows = users
    .filter((u) => u.role !== "admin")
    .map((u) => {
      const role = u.role;
      const blocked = !!u.blocked;
      return `
        <tr>
          <td>${safeText(u.fullName)}</td>
          <td>${safeText(u.email)}</td>
          <td>${safeText(u.phone ?? "—")}</td>
          <td>${safeText(role)}</td>
          <td>${blocked ? "blocked" : "active"}</td>
          <td>
            <div class="actions">
              <button class="mini mini--ok" data-action="role" data-role="student" data-id="${u.id}">Student</button>
              <button class="mini mini--ok" data-action="role" data-role="teacher" data-id="${u.id}">Teacher</button>
              <button class="mini ${blocked ? "mini--ok" : "mini--danger"}" data-action="block" data-block="${blocked ? "0" : "1"}" data-id="${u.id}">
                ${blocked ? "Unblock" : "Block"}
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const trackList = (tracks || [])
    .map((t) => `<div class="item"><div><h4>${safeText(t.title)}</h4><p>${safeText(t.description)}</p></div><span class="tag">${safeText(t.teachersCount ?? 0)} ustoz</span></div>`)
    .join("");

  return el(`
    <div>
      <div class="panel">
        <h3 style="margin:0 0 10px">Admin panel</h3>
        <p class="muted" style="margin:0 0 14px; line-height:1.6">
          Role change + block/unblock. Admin nomi: <b>OnlyClass</b>.
        </p>
        <table class="table" id="usersTable">
          <thead>
            <tr>
              <th>Full name</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Role</th>
              <th>Status</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="panel" style="margin-top:14px">
        <h3 style="margin:0 0 10px">Yo‘nalish qo‘shish (faqat Admin)</h3>
        <form id="addTrackForm" class="glass" style="box-shadow:none">
          <div class="row">
            <div class="field"><label>Nomi</label><input name="title" required minlength="2" /></div>
            <div class="field"><label>Rasm URL (ixtiyoriy)</label><input name="imageUrl" placeholder="https://..." /></div>
          </div>
          <div class="field"><label>Tavsif</label><input name="description" required minlength="4" /></div>
          <button class="btn btn--primary" type="submit"><span>${icon("plus")}</span><span>Qo‘shish</span></button>
          <span class="muted" id="addTrackMsg" style="margin-left:10px"></span>
        </form>
      </div>

      <div class="panel" style="margin-top:14px">
        <h3 style="margin:0 0 10px">Yo‘nalishlar</h3>
        <div class="list">${trackList || `<div class="muted">Hozircha yo‘nalish yo‘q.</div>`}</div>
      </div>
    </div>
  `);
}

async function render(user) {
  const { base, parts } = parseHash();
  setActive(base);

  const view = document.getElementById("view");
  if (!view) return;
  view.innerHTML = "";

  // Home
  if (base === "bosh-sahifa") {
    view.appendChild(viewHome(user));
    return;
  }

  // Video darslar flow
  if (base === "video-darslar") {
    // #/video-darslar
    if (parts.length === 1) {
      const wrap = el(`<div class="panel"><h3 style="margin:0 0 10px">Video darslar — yo‘nalishlar</h3><div id="box"></div></div>`);
      view.appendChild(wrap);
      const { tracks } = await api("/api/tracks");
      wrap.querySelector("#box").appendChild(trackCards(tracks, "#/video-darslar"));
      return;
    }

    // #/video-darslar/track/:trackId
    if (parts[1] === "track" && parts[2]) {
      const wrap = el(`<div class="panel"><h3 style="margin:0 0 10px">Ustozlar</h3><div id="box"></div></div>`);
      view.appendChild(wrap);
      const { track, profiles } = await api(`/api/tracks/${parts[2]}/teachers`);
      wrap.querySelector("h3").textContent = `${track.title} — ustozlar`;
      wrap.querySelector("#box").appendChild(profileCards(profiles, "#/video-darslar"));
      return;
    }

    // #/video-darslar/profile/:profileId(/video/:videoId)?
    if (parts[1] === "profile" && parts[2]) {
      const profileId = parts[2];
      const videoId = parts[3] === "video" ? parts[4] : null;

      const { videos } = await api(`/api/profiles/${profileId}/videos`);
      if (!videos.length) {
        const p = await api(`/api/profiles/${profileId}`);
        const wrap = el(`<div class="panel"><h3 style="margin:0 0 10px">${safeText(p.profile.teacherName)} — videolar</h3><p class="muted">Hozircha video yo‘q.</p></div>`);
        view.appendChild(wrap);
        return;
      }

      const chosen = videoId && videos.some((v) => v.id === videoId) ? videoId : videos[0].id;
      if (!videoId) {
        window.location.hash = `#/video-darslar/profile/${profileId}/video/${chosen}`;
        return;
      }

      // watch count
      api(`/api/videos/${chosen}/watch`, { method: "POST" }).catch(() => {});

      const data = await api(`/api/videos/${chosen}`);
      const v = viewVideoPlayer({ user, video: data.video, videos: data.videos, comments: data.comments });
      view.appendChild(v);

      v.querySelector("#lessonsScroll")?.addEventListener("click", (e) => {
        const btn = e.target?.closest("button[data-video]");
        if (!btn) return;
        const vid = btn.getAttribute("data-video");
        if (!vid) return;
        window.location.hash = `#/video-darslar/profile/${profileId}/video/${vid}`;
      });

      // guide download
      if (data.video.guideId) {
        v.querySelector("#downloadGuide")?.addEventListener("click", async () => {
          const r = await api(`/api/guides/${data.video.guideId}/download`, { method: "POST" });
          window.open(r.url, "_blank", "noreferrer");
          render(window.__USER);
        });
      }

      // comments
      const send = v.querySelector("#sendComment");
      const txt = v.querySelector("#commentText");
      const msg = v.querySelector("#commentMsg");
      send?.addEventListener("click", async () => {
        if (!txt) return;
        const text = String(txt.value || "").trim();
        if (!text) return;
        if (msg) msg.textContent = "Yuborilmoqda...";
        try {
          await api(`/api/videos/${chosen}/comments`, { method: "POST", body: { text } });
          if (txt) txt.value = "";
          if (msg) msg.textContent = "Yuborildi.";
          render(window.__USER);
        } catch (err) {
          if (msg) msg.textContent = `Xatolik: ${err?.message}`;
        }
      });
      return;
    }

    view.appendChild(el(`<div class="panel"><h3 style="margin:0 0 10px">Video darslar</h3><p class="muted">Noto‘g‘ri yo‘l.</p></div>`));
    return;
  }

  // Tests flow
  if (base === "testlar") {
    // direct test runner: #/testlar/test/:id
    if (parts[1] === "test" && parts[2]) {
      const { test } = await api(`/api/tests/${parts[2]}`);
      if (!test?.questions?.length) {
        view.appendChild(el(`<div class="panel"><h3 style="margin:0 0 10px">Test</h3><p class="muted">Test topilmadi.</p></div>`));
        return;
      }

      const root = viewTestRunner(test);
      view.appendChild(root);

      let idx = 0;
      const answers = new Array(test.questions.length).fill(-1);
      let timer = null;
      let left = 0;

      const timerTag = root.querySelector("#timerTag");
      const qBox = root.querySelector("#qBox");
      const progress = root.querySelector("#progress");
      const prevBtn = root.querySelector("#prevBtn");
      const nextBtn = root.querySelector("#nextBtn");
      const resultBox = root.querySelector("#resultBox");

      function stopTimer() {
        if (timer) clearInterval(timer);
        timer = null;
      }

      function startTimer(sec) {
        stopTimer();
        left = sec;
        if (timerTag) timerTag.textContent = `${left}s`;
        timer = setInterval(() => {
          left -= 1;
          if (timerTag) timerTag.textContent = `${Math.max(0, left)}s`;
          if (left <= 0) {
            stopTimer();
            // auto next
            if (idx < test.questions.length - 1) {
              idx++;
              renderQ();
            } else {
              submit();
            }
          }
        }, 1000);
      }

      function renderQ() {
        const q = test.questions[idx];
        if (progress) progress.textContent = `${idx + 1} / ${test.questions.length}`;
        startTimer(Number(q.timeoutSeconds || 10));

        const opts = q.options
          .map((o, oi) => {
            const checked = answers[idx] === oi ? "checked" : "";
            return `
              <label class="item" style="cursor:pointer">
                <div>
                  <h4 style="margin:0 0 4px">${safeText(o)}</h4>
                  <p class="muted" style="margin:0">Variant ${oi + 1}</p>
                </div>
                <input type="radio" name="opt" value="${oi}" ${checked} />
              </label>
            `;
          })
          .join("");

        qBox.innerHTML = `
          <h3 style="margin:0 0 10px; font-size:16px">${safeText(q.text)}</h3>
          <div class="list" id="opts">${opts}</div>
          <p class="muted" style="margin:10px 0 0; font-size:12px">Timeout: ${safeText(q.timeoutSeconds)}s</p>
        `;

        qBox.querySelector("#opts")?.addEventListener("change", (e) => {
          const v = Number(e.target?.value);
          if (Number.isInteger(v)) answers[idx] = v;
        });

        if (prevBtn) prevBtn.disabled = idx === 0;
        if (nextBtn) nextBtn.textContent = idx === test.questions.length - 1 ? "Yakunlash" : "Keyingi";
      }

      async function submit() {
        stopTimer();
        if (nextBtn) nextBtn.disabled = true;
        if (prevBtn) prevBtn.disabled = true;
        if (timerTag) timerTag.textContent = "—";
        try {
          const r = await api(`/api/tests/${test.id}/attempts`, { method: "POST", body: { answers } });
          resultBox.style.display = "block";
          resultBox.innerHTML = `
            <h3 style="margin:0 0 10px">Natija</h3>
            <div class="cards4" style="grid-template-columns: repeat(3, 1fr)">
              <div class="card"><h3>To‘g‘ri</h3><div class="big">${safeText(r.result.correctCount)}</div></div>
              <div class="card"><h3>Jami</h3><div class="big">${safeText(r.result.totalQuestions)}</div></div>
              <div class="card"><h3>Foiz</h3><div class="big">${safeText(r.result.scorePercent)}%</div></div>
            </div>
            <p class="muted" style="margin:10px 0 0">
              ${r.saved ? "1-marta natija saqlandi (statistikaga qo‘shildi)." : "Bu qayta urinish — natija faqat sizga ko‘rinadi, saqlanmaydi."}
            </p>
            <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
              <button class="btn" type="button" id="retake"><span>${icon("arrow")}</span><span>Qayta ishlash</span></button>
              <a class="btn btn--primary" href="#/statistika"><span>${icon("chart")}</span><span>Statistika</span></a>
            </div>
          `;
          resultBox.querySelector("#retake")?.addEventListener("click", () => {
            idx = 0;
            for (let i = 0; i < answers.length; i++) answers[i] = -1;
            if (nextBtn) nextBtn.disabled = false;
            if (prevBtn) prevBtn.disabled = false;
            resultBox.style.display = "none";
            renderQ();
          });
          // refresh user stats
          const me = await api("/api/me");
          window.__USER = me.user;
          hydrateUserUi(me.user);
        } catch (err) {
          resultBox.style.display = "block";
          resultBox.innerHTML = `<h3 style="margin:0 0 10px">Xatolik</h3><p class="muted">${safeText(err?.message)}</p>`;
        } finally {
          if (nextBtn) nextBtn.disabled = false;
          if (prevBtn) prevBtn.disabled = false;
        }
      }

      prevBtn?.addEventListener("click", () => {
        if (idx > 0) {
          idx--;
          renderQ();
        }
      });
      nextBtn?.addEventListener("click", () => {
        if (idx < test.questions.length - 1) {
          idx++;
          renderQ();
        } else {
          submit();
        }
      });

      renderQ();
      return;
    }

    // #/testlar/track/:trackId
    if (parts[1] === "track" && parts[2]) {
      const wrap = el(`<div class="panel"><h3 style="margin:0 0 10px">Ustozlar (Testlar)</h3><div id="box"></div></div>`);
      view.appendChild(wrap);
      const { track, profiles } = await api(`/api/tracks/${parts[2]}/teachers`);
      wrap.querySelector("h3").textContent = `${track.title} — ustozlar`;
      wrap.querySelector("#box").appendChild(profileCards(profiles, "#/testlar"));
      return;
    }

    // #/testlar/profile/:profileId
    if (parts[1] === "profile" && parts[2]) {
      const profileId = parts[2];
      const p = await api(`/api/profiles/${profileId}`);
      const { tests } = await api(`/api/profiles/${profileId}/tests`);
      const wrap = el(`<div><div class="panel"><h3 style="margin:0 0 10px">${safeText(p.profile.teacherName)} — testlar</h3><div id="box"></div></div></div>`);
      view.appendChild(wrap);
      wrap.querySelector("#box").appendChild(viewTestsList(tests, p.profile.teacherName));
      return;
    }

    // root: tracks
    const wrap = el(`<div class="panel"><h3 style="margin:0 0 10px">Testlar — yo‘nalishlar</h3><div id="box"></div></div>`);
    view.appendChild(wrap);
    const { tracks } = await api("/api/tracks");
    wrap.querySelector("#box").appendChild(trackCards(tracks, "#/testlar"));
    return;
  }

  // Guides flow
  if (base === "qollanmalar") {
    if (parts[1] === "track" && parts[2]) {
      const wrap = el(`<div class="panel"><h3 style="margin:0 0 10px">Ustozlar (Qo‘llanmalar)</h3><div id="box"></div></div>`);
      view.appendChild(wrap);
      const { track, profiles } = await api(`/api/tracks/${parts[2]}/teachers`);
      wrap.querySelector("h3").textContent = `${track.title} — ustozlar`;
      wrap.querySelector("#box").appendChild(profileCards(profiles, "#/qollanmalar"));
      return;
    }

    if (parts[1] === "profile" && parts[2]) {
      const profileId = parts[2];
      const p = await api(`/api/profiles/${profileId}`);
      const { guides } = await api(`/api/profiles/${profileId}/guides`);
      const wrap = el(`<div><div class="panel"><h3 style="margin:0 0 10px">${safeText(p.profile.teacherName)} — qo‘llanmalar</h3><div id="box"></div></div></div>`);
      view.appendChild(wrap);
      const grid = viewGuidesList(guides, p.profile.teacherName);
      wrap.querySelector("#box").appendChild(grid);
      grid.addEventListener("click", async (e) => {
        const btn = e.target?.closest("button[data-download]");
        if (!btn) return;
        const id = btn.getAttribute("data-download");
        if (!id) return;
        btn.disabled = true;
        try {
          const r = await api(`/api/guides/${id}/download`, { method: "POST" });
          window.open(r.url, "_blank", "noreferrer");
          // refresh stats
          const me = await api("/api/me");
          window.__USER = me.user;
          hydrateUserUi(me.user);
          render(window.__USER);
        } catch (err) {
          alert(err?.message || "Xatolik");
        } finally {
          btn.disabled = false;
        }
      });
      return;
    }

    const wrap = el(`<div class="panel"><h3 style="margin:0 0 10px">Qo‘llanmalar — yo‘nalishlar</h3><div id="box"></div></div>`);
    view.appendChild(wrap);
    const { tracks } = await api("/api/tracks");
    wrap.querySelector("#box").appendChild(trackCards(tracks, "#/qollanmalar"));
    return;
  }

  // Statistics
  if (base === "statistika") {
    const data = await api("/api/statistics");
    const root = el(`
      <div class="panel">
        <h3 style="margin:0 0 10px">Statistika</h3>
        <div class="cards4" style="margin-bottom:12px">
          <div class="card"><h3>Jami o‘quvchilar</h3><div class="big">${safeText(data.totals.students)}</div></div>
          <div class="card"><h3>Jami teacherlar</h3><div class="big">${safeText(data.totals.teachers)}</div></div>
          <div class="card"><h3>Yo‘nalishlar</h3><div class="big">${safeText(data.totals.tracks)}</div></div>
          <div class="card"><h3>Sizning rol</h3><div class="big">${safeText(roleLabel(user.role))}</div></div>
        </div>

        <div class="tabs">
          <button class="tab tab--active" data-tab="students" type="button">${icon("user")} Students</button>
          <button class="tab" data-tab="teachers" type="button">${icon("user")} Teachers</button>
        </div>

        <div id="tabBox"></div>
      </div>
    `);
    view.appendChild(root);

    const tabBox = root.querySelector("#tabBox");
    function renderStudents() {
      const rows = data.students
        .map(
          (s) => `
          <tr>
            <td>${safeText(s.fullName)}</td>
            <td>${safeText(s.guidesDownloaded)}</td>
            <td>${safeText(s.videosWatched)}</td>
            <td>${safeText(s.testsAvg)}%</td>
          </tr>
        `
        )
        .join("");
      tabBox.innerHTML = `
        <table class="table">
          <thead><tr><th>Full name</th><th>Qo‘llanmalar</th><th>Videolar</th><th>Test o‘rtacha</th></tr></thead>
          <tbody>${rows || ""}</tbody>
        </table>
      `;
    }
    function renderTeachers() {
      const rows = data.teachers
        .map(
          (t) => `
          <tr>
            <td>${safeText(t.fullName)}</td>
            <td>${safeText(t.videosUploaded)}</td>
            <td>${safeText(t.testsCreated)}</td>
            <td>${safeText(t.guidesUploaded)}</td>
          </tr>
        `
        )
        .join("");
      tabBox.innerHTML = `
        <table class="table">
          <thead><tr><th>Full name</th><th>Videolar</th><th>Testlar</th><th>Qo‘llanmalar</th></tr></thead>
          <tbody>${rows || ""}</tbody>
        </table>
      `;
    }

    renderStudents();
    root.querySelectorAll(".tab").forEach((b) => {
      b.addEventListener("click", () => {
        root.querySelectorAll(".tab").forEach((x) => x.classList.remove("tab--active"));
        b.classList.add("tab--active");
        const tab = b.getAttribute("data-tab");
        if (tab === "teachers") renderTeachers();
        else renderStudents();
      });
    });
    return;
  }

  // Profile
  if (base === "profil") {
    const v = viewProfile(user);
    view.appendChild(v);
    const form = v.querySelector("#profileForm");
    const msg = v.querySelector("#profileMsg");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (msg) msg.textContent = "Saqlanmoqda...";
      const fd = new FormData(form);
      try {
        const updated = await api("/api/me", {
          method: "PATCH",
          body: {
            fullName: String(fd.get("fullName") || "").trim(),
            age: String(fd.get("age") || "").trim(),
            phone: String(fd.get("phone") || "").trim()
          }
        });
        if (msg) msg.textContent = "Saqlandi.";
        window.__USER = updated.user;
        hydrateUserUi(updated.user);
      } catch (err) {
        if (msg) msg.textContent = `Xatolik: ${err?.message}`;
      }
    });
    return;
  }

  // Teacher panel (create profile + add content)
  if (base === "teacher-panel") {
    if (user.role !== "teacher" && user.role !== "admin") {
      view.appendChild(el(`<div class="panel"><h3 style="margin:0 0 10px">Teacher panel</h3><p class="muted">Bu bo‘lim faqat Teacher (yoki Admin) uchun.</p></div>`));
      return;
    }

    const root = el(`<div class="panel"><h3 style="margin:0 0 10px">Teacher panel</h3><div id="box"></div></div>`);
    view.appendChild(root);
    const box = root.querySelector("#box");
    const { tracks } = await api("/api/tracks");
    box.appendChild(trackCards(tracks, "#/teacher-panel"));

    // #/teacher-panel/track/:id
    if (parts[1] === "track" && parts[2]) {
      const trackId = parts[2];
      const { track, profiles } = await api(`/api/tracks/${trackId}/teachers`);
      root.querySelector("h3").textContent = `Teacher panel — ${track.title}`;
      box.innerHTML = "";

      const my = profiles.find((p) => p.teacherId === user.id);
      if (!my) {
        const create = viewTeacherProfileCreate(track);
        box.appendChild(create);
        create.querySelector("#createProfileForm")?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const msg = create.querySelector("#createProfileMsg");
          if (msg) msg.textContent = "Yaratilmoqda...";
          const fd = new FormData(e.target);
          try {
            await api(`/api/teacher/tracks/${trackId}/profile`, {
              method: "POST",
              body: {
                avatarUrl: String(fd.get("avatarUrl") || "").trim(),
                headline: String(fd.get("headline") || "").trim(),
                aboutShort: String(fd.get("aboutShort") || "").trim()
              }
            });
            if (msg) msg.textContent = "Yaratildi.";
            window.location.hash = `#/teacher-panel/track/${trackId}`;
          } catch (err) {
            if (msg) msg.textContent = `Xatolik: ${err?.message}`;
          }
        });
        return;
      }

      // Manage existing profile
      box.appendChild(
        el(`
          <div class="panel" style="box-shadow:none; background:transparent; border:none; padding:0">
            <div class="item">
              <div>
                <h4 style="margin:0 0 4px">${safeText(my.teacherName)} — profilingiz</h4>
                <p class="muted" style="margin:0">${safeText(my.headline)} • ${safeText(my.aboutShort)}</p>
              </div>
              <span class="tag">profileId: ${safeText(my.id)}</span>
            </div>
          </div>
        `)
      );

      const addVideo = viewTeacherAddVideo(my.id);
      const addGuide = viewTeacherAddGuide(my.id);
      const addTest = viewTeacherAddTest(my.id);
      box.appendChild(addVideo);
      box.appendChild(addGuide);
      box.appendChild(addTest);

      addVideo.querySelector("#addVideoForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = addVideo.querySelector("#addVideoMsg");
        if (msg) msg.textContent = "Qo‘shilmoqda...";
        const fd = new FormData(e.target);
        try {
          await api(`/api/teacher/profiles/${my.id}/videos`, {
            method: "POST",
            body: {
              videoUrl: String(fd.get("videoUrl") || "").trim(),
              title: String(fd.get("title") || "").trim(),
              description: String(fd.get("description") || "").trim(),
              duration: String(fd.get("duration") || "").trim(),
              testId: String(fd.get("testId") || "").trim() || null,
              guideId: String(fd.get("guideId") || "").trim() || null
            }
          });
          if (msg) msg.textContent = "Qo‘shildi.";
          e.target.reset();
        } catch (err) {
          if (msg) msg.textContent = `Xatolik: ${err?.message}`;
        }
      });

      addGuide.querySelector("#addGuideForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = addGuide.querySelector("#addGuideMsg");
        if (msg) msg.textContent = "Qo‘shilmoqda...";
        const fd = new FormData(e.target);
        try {
          await api(`/api/teacher/profiles/${my.id}/guides`, {
            method: "POST",
            body: {
              pdfUrl: String(fd.get("pdfUrl") || "").trim(),
              title: String(fd.get("title") || "").trim(),
              description: String(fd.get("description") || "").trim()
            }
          });
          if (msg) msg.textContent = "Qo‘shildi.";
          e.target.reset();
        } catch (err) {
          if (msg) msg.textContent = `Xatolik: ${err?.message}`;
        }
      });

      addTest.querySelector("#addTestForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = addTest.querySelector("#addTestMsg");
        if (msg) msg.textContent = "Yaratilmoqda...";
        const fd = new FormData(e.target);
        const options = [fd.get("q1_a"), fd.get("q1_b"), fd.get("q1_c"), fd.get("q1_d")]
          .map((x) => String(x || "").trim())
          .filter((x) => x);
        try {
          const r = await api(`/api/teacher/profiles/${my.id}/tests`, {
            method: "POST",
            body: {
              imageUrl: String(fd.get("imageUrl") || "").trim(),
              title: String(fd.get("title") || "").trim(),
              level: String(fd.get("level") || "").trim(),
              questions: [
                {
                  text: String(fd.get("q1_text") || "").trim(),
                  timeoutSeconds: Number(String(fd.get("q1_timeout") || "10")),
                  correctIndex: Number(String(fd.get("q1_correct") || "0")),
                  options
                }
              ]
            }
          });
          if (msg) msg.textContent = `Yaratildi. testId: ${r.test.id}`;
        } catch (err) {
          if (msg) msg.textContent = `Xatolik: ${err?.message}`;
        }
      });

      return;
    }

    // default teacher panel root
    root.querySelector("h3").textContent = "Teacher panel — yo‘nalish tanlang";
    return;
  }

  // Admin panel
  if (base === "admin") {
    if (user.role !== "admin") {
      view.appendChild(el(`<div class="panel"><h3 style="margin:0 0 10px">Admin panel</h3><p class="muted">Bu bo‘lim faqat Admin uchun.</p></div>`));
      return;
    }
    const [{ users }, { tracks }] = await Promise.all([api("/api/admin/users"), api("/api/tracks")]);
    const v = viewAdmin(users, tracks);
    view.appendChild(v);

    v.querySelector("#usersTable")?.addEventListener("click", async (e) => {
      const btn = e.target?.closest("button");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (!action || !id) return;
      btn.disabled = true;
      try {
        if (action === "role") {
          const role = btn.getAttribute("data-role");
          await api(`/api/admin/users/${id}/role`, { method: "POST", body: { role } });
        } else if (action === "block") {
          const block = btn.getAttribute("data-block") === "1";
          await api(`/api/admin/users/${id}/block`, { method: "POST", body: { block } });
        }
        render(window.__USER);
      } catch (err) {
        alert(err?.message || "Xatolik");
      } finally {
        btn.disabled = false;
      }
    });

    v.querySelector("#addTrackForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = v.querySelector("#addTrackMsg");
      if (msg) msg.textContent = "Qo‘shilmoqda...";
      const fd = new FormData(e.target);
      try {
        await api("/api/admin/tracks", {
          method: "POST",
          body: {
            title: String(fd.get("title") || "").trim(),
            description: String(fd.get("description") || "").trim(),
            imageUrl: String(fd.get("imageUrl") || "").trim()
          }
        });
        if (msg) msg.textContent = "Qo‘shildi.";
        e.target.reset();
        render(window.__USER);
      } catch (err) {
        if (msg) msg.textContent = `Xatolik: ${err?.message}`;
      }
    });
    return;
  }

  // Contact
  if (base === "aloqa") {
    view.appendChild(viewContact());
    return;
  }

  view.appendChild(el(`<div class="panel"><h3 style="margin:0 0 10px">Topilmadi</h3><p class="muted">Bo‘lim mavjud emas.</p></div>`));
}

async function boot() {
  initTheme();
  initIcons();

  const themeBtn = document.getElementById("themeBtn");
  themeBtn?.addEventListener("click", toggleTheme);

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", logout);

  const sideToggle = document.getElementById("sideToggle");
  const dashRoot = document.getElementById("dashRoot");
  sideToggle?.addEventListener("click", () => {
    const isMobile = window.matchMedia("(max-width: 820px)").matches;
    if (isMobile) dashRoot?.classList.toggle("sidebar--open");
    else dashRoot?.classList.toggle("sidebar--collapsed");
  });
  document.addEventListener("click", (e) => {
    const isMobile = window.matchMedia("(max-width: 820px)").matches;
    if (!isMobile) return;
    if (!dashRoot?.classList.contains("sidebar--open")) return;
    const sidebar = document.querySelector(".sidebar");
    if (sidebar?.contains(e.target)) return;
    dashRoot.classList.remove("sidebar--open");
  });

  try {
    const { user } = await api("/api/me");
    window.__USER = user;
    hydrateUserUi(user);
    await render(user);
    window.addEventListener("hashchange", () => render(window.__USER));
  } catch (err) {
    window.location.href = "/login";
  }
}

boot();

