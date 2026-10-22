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

  // О школе
  const aboutEl = document.getElementById("about-text");
  if (aboutEl) {
    if (school.about) {
      aboutEl.innerHTML = `<p>${escapeHtml(school.about)}</p>`;
    } else {
      aboutEl.innerHTML = "<p>Информация о школе появится позже.</p>";
    }
  }

  // Контакты
  const contactsEl = document.getElementById("contacts-text");
  if (contactsEl) {
    const contacts = [];
    if (school.director) contacts.push("<strong>Директор:</strong> " + escapeHtml(school.director));
    if (school.address) contacts.push("📍 " + escapeHtml(school.address));
    if (school.phone) contacts.push("📞 " + escapeHtml(school.phone));
    if (school.email) contacts.push("✉️ " + escapeHtml(school.email));
    if (school.city) contacts.push("🏢 " + escapeHtml(school.city));
    contactsEl.innerHTML = contacts.length
      ? contacts.join("<br>")
      : "Информация о контактах появится позже.";
  }

  // Ссылка на VK
  if (school.vk) {
    const vkLink = document.getElementById("vk-link");
    if (vkLink) vkLink.href = school.vk;
  }
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
    const past = e.status === "past" || (e.date && e.date < todayISO() && e.status !== "future");
    const badge = past ? "past" : "future";
    const label = past ? "Прошедшее" : "Предстоящее";
    return `
      <div class="card ${past ? "past" : ""}">
        <span class="badge ${badge}">${label}</span>
        <h3>${escapeHtml(e.title)}</h3>
        <div class="date">${formatDate(e.date)}</div>
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
      <h3>${escapeHtml(n.title)}</h3>
      <div class="date">${formatDate(n.date)}</div>
      <p>${escapeHtml(n.text)}</p>
    </article>
  `).join("");
}

// Обработка вкладок
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