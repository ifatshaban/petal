(() => {
  "use strict";

  const STORAGE_KEY = "petal.v1";
  const COLORS = ["#6aaa64", "#f7da21", "#fc716b", "#b07fd8", "#4f85e5", "#3c8dd9",
                  "#4fa98a", "#e9a23b", "#e46f3c", "#ef7f8f", "#8a8a8a", "#222222"];

  // ---------- dates ----------
  const dayKey = (d = new Date()) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

  // ---------- state ----------
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const fresh = (g) => ({ id: uid(), name: g.name, url: g.url, emoji: g.emoji || "", group: g.group || "Other",
                          color: g.color || COLORS[0], lastPlayed: null, streak: 0, undo: null });

  function defaultState() {
    return { version: 1, games: window.DEFAULT_GAMES.map(fresh), settings: { sortPlayed: false, hidePlayed: false } };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.games)) {
          s.settings = Object.assign({ sortPlayed: false, hidePlayed: false }, s.settings);
          return s;
        }
      }
    } catch (e) { /* fall through to defaults */ }
    return defaultState();
  }

  let state = load();
  let editing = false;
  let editingId = null;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { toast("Couldn't save — storage is full or blocked"); }
  }

  const playedToday = (g) => g.lastPlayed === dayKey();
  // A streak only counts if the chain reaches today or yesterday.
  const liveStreak = (g) => (g.lastPlayed === dayKey() || g.lastPlayed === yesterdayKey()) ? g.streak : 0;

  function setPlayed(g, played) {
    const today = dayKey();
    if (played && g.lastPlayed !== today) {
      g.undo = { lastPlayed: g.lastPlayed, streak: g.streak };
      g.streak = g.lastPlayed === yesterdayKey() ? g.streak + 1 : 1;
      g.lastPlayed = today;
    } else if (!played && g.lastPlayed === today) {
      if (g.undo) { g.lastPlayed = g.undo.lastPlayed; g.streak = g.undo.streak; }
      else { g.lastPlayed = null; g.streak = 0; }
      g.undo = null;
    }
    save();
  }

  // ---------- DOM helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid);
    return el;
  };

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  // ---------- render ----------
  function groupsInOrder() {
    const order = [];
    const map = new Map();
    for (const g of state.games) {
      if (!map.has(g.group)) { map.set(g.group, []); order.push(g.group); }
      map.get(g.group).push(g);
    }
    return order.map((name) => [name, map.get(name)]);
  }

  function render() {
    const today = new Date();
    $("#today").textContent = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    const total = state.games.length;
    const done = state.games.filter(playedToday).length;
    $("#barFill").style.width = total ? `${(done / total) * 100}%` : "0%";
    $("#progressText").textContent = total
      ? (done === total ? `All ${total} done today 🎉` : `${done} of ${total} played today`)
      : "";

    document.body.classList.toggle("editing", editing);
    $("#editBtn").textContent = editing ? "Done" : "Edit";
    $("#editBtn").setAttribute("aria-pressed", String(editing));

    const list = $("#list");
    list.replaceChildren();

    if (!total) {
      list.append(h("div", { class: "empty" },
        h("p", {}, "No games yet."),
        h("p", { class: "muted" }, "Tap ＋ to add one, or pick from popular games in Settings.")));
      return;
    }

    for (const [groupName, games] of groupsInOrder()) {
      let shown = games.slice();
      if (!editing && state.settings.hidePlayed) shown = shown.filter((g) => !playedToday(g));
      if (!editing && state.settings.sortPlayed) {
        shown.sort((a, b) => Number(playedToday(a)) - Number(playedToday(b)));
      }
      const doneInGroup = games.filter(playedToday).length;
      const section = h("section", { class: "group" },
        h("h2", { class: "group-title" },
          h("span", {}, groupName),
          h("span", { class: "muted small" }, `${doneInGroup}/${games.length}`)));

      if (!shown.length) {
        section.append(h("p", { class: "muted small group-done" }, "All played ✓"));
      } else {
        const grid = h("div", { class: "grid" });
        shown.forEach((g) => grid.append(tile(g, games)));
        section.append(grid);
      }
      list.append(section);
    }
  }

  function tile(g, groupGames) {
    const played = playedToday(g);
    const streak = liveStreak(g);
    const badge = h("span", { class: "badge", style: `--c:${g.color}` }, g.emoji || initials(g.name));
    const meta = h("span", { class: "meta" },
      h("span", { class: "name" }, g.name),
      h("span", { class: "sub" }, streak > 1 ? `🔥 ${streak} day streak` : played ? "Played today" : hostOf(g.url)));

    if (editing) {
      const idx = groupGames.indexOf(g);
      return h("div", { class: "tile edit", style: `--c:${g.color}` },
        h("button", { class: "tile-main", onclick: () => openGameDialog(g), "aria-label": `Edit ${g.name}` }, badge, meta),
        h("div", { class: "move" },
          h("button", { class: "icon-btn sm", "aria-label": "Move up", disabled: idx === 0, onclick: () => move(g, groupGames, -1) }, "↑"),
          h("button", { class: "icon-btn sm", "aria-label": "Move down", disabled: idx === groupGames.length - 1, onclick: () => move(g, groupGames, 1) }, "↓")));
    }

    return h("div", { class: `tile${played ? " played" : ""}`, style: `--c:${g.color}` },
      h("a", {
        class: "tile-main", href: g.url, target: "_blank", rel: "noopener noreferrer",
        onclick: () => { if (!playedToday(g)) { setPlayed(g, true); setTimeout(render, 300); } },
      }, badge, meta),
      h("button", {
        class: "check", "aria-pressed": String(played),
        "aria-label": played ? `Mark ${g.name} as not played` : `Mark ${g.name} as played`,
        onclick: () => { setPlayed(g, !played); render(); },
      }, played ? "✓" : ""));
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  }

  function move(g, groupGames, dir) {
    const idx = groupGames.indexOf(g);
    const other = groupGames[idx + dir];
    if (!other) return;
    const a = state.games.indexOf(g), b = state.games.indexOf(other);
    [state.games[a], state.games[b]] = [state.games[b], state.games[a]];
    save(); render();
  }

  // ---------- add / edit dialog ----------
  const gameDialog = $("#gameDialog");
  const form = $("#gameForm");

  function buildColorChoices(selected) {
    const wrap = $("#colorChoices");
    wrap.replaceChildren(...COLORS.map((c) =>
      h("label", { class: "swatch", style: `--c:${c}` },
        h("input", { type: "radio", name: "color", value: c, checked: c === selected, "aria-label": c }))));
    if (!COLORS.includes(selected)) {
      wrap.append(h("label", { class: "swatch", style: `--c:${selected}` },
        h("input", { type: "radio", name: "color", value: selected, checked: true, "aria-label": selected })));
    }
  }

  function openGameDialog(g) {
    editingId = g ? g.id : null;
    $("#gameDialogTitle").textContent = g ? "Edit game" : "Add a game";
    $("#deleteGame").hidden = !g;
    form.name.value = g ? g.name : "";
    form.url.value = g ? g.url : "";
    form.emoji.value = g ? g.emoji : "";
    form.group.value = g ? g.group : (state.games.at(-1)?.group || "");
    $("#groupList").replaceChildren(...groupsInOrder().map(([n]) => h("option", { value: n })));
    buildColorChoices(g ? g.color : COLORS[Math.floor(Math.random() * COLORS.length)]);
    gameDialog.showModal();
    if (!g) form.name.focus();
  }

  form.url.addEventListener("blur", () => {
    const v = form.url.value.trim();
    if (v && !/^[a-z][a-z0-9+.-]*:/i.test(v)) form.url.value = "https://" + v;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let url = form.url.value.trim();
    if (url && !/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "https://" + url;
    try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) throw 0; }
    catch { toast("Please enter a valid web link"); form.url.focus(); return; }

    const data = {
      name: form.name.value.trim(),
      url,
      emoji: form.emoji.value.trim(),
      group: form.group.value.trim() || "Other",
      color: form.color.value || COLORS[0],
    };
    if (!data.name) { form.name.focus(); return; }

    if (editingId) {
      Object.assign(state.games.find((g) => g.id === editingId), data);
    } else {
      // insert after the last game in the same group so groups stay together
      const lastIdx = state.games.map((g) => g.group).lastIndexOf(data.group);
      const g = fresh(data);
      if (lastIdx === -1) state.games.push(g); else state.games.splice(lastIdx + 1, 0, g);
      toast(`Added ${data.name}`);
    }
    save(); gameDialog.close(); render();
  });

  $("#deleteGame").addEventListener("click", () => {
    const g = state.games.find((x) => x.id === editingId);
    if (!g || !confirm(`Delete ${g.name}?`)) return;
    state.games = state.games.filter((x) => x.id !== editingId);
    save(); gameDialog.close(); render(); toast(`Deleted ${g.name}`);
  });

  // ---------- settings ----------
  const menuDialog = $("#menuDialog");
  $("#menuBtn").addEventListener("click", () => {
    $("#sortPlayed").checked = state.settings.sortPlayed;
    $("#hidePlayed").checked = state.settings.hidePlayed;
    $("#installHint").textContent = installHint();
    menuDialog.showModal();
  });
  $("#sortPlayed").addEventListener("change", (e) => { state.settings.sortPlayed = e.target.checked; save(); render(); });
  $("#hidePlayed").addEventListener("change", (e) => { state.settings.hidePlayed = e.target.checked; save(); render(); });

  function installHint() {
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (standalone) return "Installed on your home screen ✓";
    if (/iphone|ipad|ipod/i.test(navigator.userAgent))
      return "Install: tap the Share button in Safari, then “Add to Home Screen”.";
    if (/android/i.test(navigator.userAgent))
      return "Install: open your browser's ⋮ menu and tap “Add to Home screen” or “Install app”.";
    return "Open this page on your phone and use “Add to Home Screen” to install it like an app.";
  }

  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `petal-backup-${dayKey()}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const s = JSON.parse(await file.text());
      if (!s || !Array.isArray(s.games)) throw new Error("bad file");
      s.games = s.games.filter((g) => g && g.name && g.url).map((g) => Object.assign(fresh(g), g, { id: g.id || uid() }));
      s.settings = Object.assign({ sortPlayed: false, hidePlayed: false }, s.settings);
      state = s; save(); render(); menuDialog.close(); toast(`Imported ${s.games.length} games`);
    } catch { toast("That file isn't a Petal backup"); }
  });
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Replace your list with the default games? Your custom games and streaks will be lost.")) return;
    state = defaultState(); save(); render(); menuDialog.close(); toast("Reset to defaults");
  });

  // ---------- suggestions ----------
  const suggestDialog = $("#suggestDialog");
  function renderSuggestions() {
    const have = new Set(state.games.map((g) => g.url.replace(/\/+$/, "")));
    const items = [...window.DEFAULT_GAMES, ...window.SUGGESTED_GAMES]
      .filter((s) => !have.has(s.url.replace(/\/+$/, "")));
    const list = $("#suggestList");
    if (!items.length) { list.replaceChildren(h("p", { class: "muted" }, "You've added them all!")); return; }
    list.replaceChildren(...items.map((s) =>
      h("button", { class: "suggest", onclick: () => {
          const lastIdx = state.games.map((g) => g.group).lastIndexOf(s.group);
          const g = fresh(s);
          if (lastIdx === -1) state.games.push(g); else state.games.splice(lastIdx + 1, 0, g);
          save(); render(); renderSuggestions(); toast(`Added ${s.name}`);
        } },
        h("span", { class: "badge sm", style: `--c:${s.color}` }, s.emoji),
        h("span", { class: "meta" }, h("span", { class: "name" }, s.name), h("span", { class: "sub" }, s.group)),
        h("span", { class: "plus" }, "＋"))));
  }
  $("#suggestBtn").addEventListener("click", () => { menuDialog.close(); renderSuggestions(); suggestDialog.showModal(); });

  // ---------- wiring ----------
  $("#addBtn").addEventListener("click", () => openGameDialog(null));
  $("#editBtn").addEventListener("click", () => { editing = !editing; render(); });
  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()));
  // tap on the backdrop closes dialogs
  document.querySelectorAll("dialog").forEach((d) =>
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  // re-render when coming back to the app (handles the day rolling over)
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { state = load(); render(); } });
  window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) { state = load(); render(); } });

  render();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
