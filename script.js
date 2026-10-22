function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function renderSchool(data) {
  const school = data.school || {};
  document.querySelectorAll("#school-name").forEach(el => {
    el.textContent = school.short_name || school.name || "Сувинская СОШ";
  });
  document.querySelectorAll("#footer-name").forEach(el => {
    el.textContent = school.short_name || school.name || "Сувинская СОШ";
  });
  if (school.name) document.title = `${school.name} — события и новости`;
  if (school.subtitle) document.getElementById("school-desc").textContent =
    school.subtitle || "МБОУ «Сувинская СОШ»";

  // О школе
  const aboutEl = document.getElementById("about-text");
  if (aboutEl) {
    const paras = (school.about && school.about.length)
      ? school.about.map(p => `<p>${escapeHtml(p)}</p>`).join("")
      : "<p>Информация о школе появится позже.</p>";
    aboutEl.innerHTML = paras;
  }

  // История
  const histEl = document.getElementById("history-list");
  if (histEl && school.history) {
    histEl.innerHTML = school.history.map(h => `
      <div class="timeline-item">
        <div class="timeline-year">${escapeHtml(h.year)}</div>
        <div class="timeline-text">${escapeHtml(h.text)}</div>
      </div>
    `).join("") || "<p>История появится позже.</p>";
  }

  // Инфраструктура
  const infraEl = document.getElementById("infra-list");
  if (infraEl && data.infrastructure) {
    infraEl.innerHTML = data.infrastructure.map(i => `
      <div class="card">
        <h3>${escapeHtml(i.title)}</h3>
        <p>${escapeHtml(i.text)}</p>
      </div>
    `).join("") || "<p>Пока нет данных.</p>";
  }

  // Достижения
  const achEl = document.getElementById("achievements-list");
  if (achEl && data.achievements) {
    achEl.innerHTML = data.achievements.map(a => `<li>${escapeHtml(a)}</li>`).join("");
  }

  // Директор
  const dirLine = document.getElementById("director-line");
  if (dirLine) {
    dirLine.textContent = school.director
      ? `Директор школы: ${school.director}`
      : "";
  }

  // Педагоги
  const staffEl = document.getElementById("staff-list");
  if (staffEl && data.staff && data.staff.team) {
    const items = data.staff.team.map(t => `
      <div class="staff-card">
        <div class="initials">${escapeHtml(initials(t.name))}</div>
        <div class="staff-name">${escapeHtml(t.name)}</div>
        <div class="staff-role">${escapeHtml(t.role)}</div>
      </div>
    `).join("");
    staffEl.innerHTML = items || "<p>Пока нет данных.</p>";
  }

  // Кружки
  const circEl = document.getElementById("circles-list");
  if (circEl && data.circles) {
    circEl.innerHTML = data.circles.map(c => `<span class="chip">${escapeHtml(c)}</span>`).join("");
  }

  // Контакты
  const contactsEl = document.getElementById("contacts-text");
  if (contactsEl) {
    const c = [];
    if (school.director) c.push("<strong>Директор:</strong> " + escapeHtml(school.director));
    if (school.address) c.push("📍 " + escapeHtml(school.address));
    if (school.phone) c.push("📞 " + escapeHtml(school.phone));
    if (school.email) c.push("✉️ " + escapeHtml(school.email));
    contactsEl.innerHTML = c.length
      ? c.join("<br>")
      : "Информация о контактах появится позже.";
  }

  // Ссылки
  if (school.vk) {
    const vk = document.getElementById("vk-link");
    if (vk) vk.href = school.vk;
  }
  if (school.governing_site) {
    const gs = document.getElementById("gov-site");
    if (gs) gs.href = school.governing_site;
  }
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/);
  if (parts.length < 2) return name ? name.slice(0, 1).toUpperCase() : "?";
  const last = parts[0].slice(0, 1).toUpperCase();
  const first = parts[1].slice(0, 1).toUpperCase();
  const sec = parts[2] ? parts[2].slice(0, 1).toUpperCase() : "";
  return last + first + sec;
}

function todayISO() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

let allEvents = [];
let activeFilter = "all";

function renderEvents(data) {
  allEvents = data.events || [];
  const list = document.getElementById("events-list");
  const shown = allEvents
    .filter(e => activeFilter === "all" || e.status === activeFilter)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  if (!shown.length) {
    list.innerHTML = "<p>Мероприятий пока нет.</p>";
    return;
  }

  list.innerHTML = shown.map(e => {
    const past = e.status === "past";
    const badge = past ? "past" : "future";
    const label = past ? "Прошедшее" : "Предстоящее";
    return `
      <div class="card ${past ? "past" : ""}">
        <span class="badge ${badge}">${label}</span>
        <h3>${escapeHtml(e.title)}</h3>
        <div class="date">${formatDate(e.date)}</div>
        ${e.place ? `<div class="place">📍 ${escapeHtml(e.place)}</div>` : ""}
        ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ""}
      </div>
    `;
  }).join("");
}

function renderNews(data) {
  const list = document.getElementById("news-list");
  const items = (data.news || []).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!items.length) {
    list.innerHTML = "<p>Новостей пока нет.</p>";
    return;
  }
  list.innerHTML = items.map(n => `
    <article>
      <div class="news-head">
        <span class="date">${formatDate(n.date)}</span>
        ${n.tag ? `<span class="tag">${escapeHtml(n.tag)}</span>` : ""}
      </div>
      <h3>${escapeHtml(n.title)}</h3>
      <p>${escapeHtml(n.text)}</p>
    </article>
  `).join("");
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.status;
    renderEvents({ events: allEvents });
  });
});

async function init() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();
    renderSchool(data);
    renderEvents(data);
    renderNews(data);
  } catch (err) {
    document.getElementById("events-list").innerHTML =
      "<p>Не удалось загрузить данные. Откройте сайт через GitHub Pages.</p>";
  }
  document.getElementById("year").textContent = new Date().getFullYear();
}

init();