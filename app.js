(() => {
  "use strict";

  const STORAGE_KEY = "petal.v1";
  const DEFAULT_SETTINGS = { sortPlayed: false, hidePlayed: false };

  // ---------- dates ----------
  const dayKey = (d = new Date()) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

  // ---------- state ----------
  // { version: 2, groups: [{id, name}], games: [{id, name, url, groupId, icon, lastPlayed, streak, undo}], settings }
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  // Spot-ink colours a group can be printed in (defined in styles.css as .c-<name>).
  const INKS = ["red", "blue", "mustard", "green", "pink", "teal", "violet", "orange"];
  const INK_NAMES = { red: "Red", blue: "Blue", mustard: "Mustard", green: "Green", pink: "Pink", teal: "Teal", violet: "Violet", orange: "Orange" };
  // the first ink not already used, or the least used one
  const nextInk = (groups) => {
    const count = (c) => groups.filter((g) => g.color === c).length;
    return INKS.reduce((best, c) => (count(c) < count(best) ? c : best), INKS[0]);
  };
  const makeGroup = (name, groups) => ({ id: uid(), name, color: nextInk(groups) });

  function fromCatalogue(list) {
    const groups = [];
    const byName = new Map();
    const games = list.map((g) => {
      let grp = byName.get(g.group);
      if (!grp) { grp = makeGroup(g.group, groups); groups.push(grp); byName.set(g.group, grp); }
      return newGame({ name: g.name, url: g.url, groupId: grp.id });
    });
    return { groups, games };
  }

  const newGame = (g) => ({ id: uid(), name: g.name, url: g.url, groupId: g.groupId, icon: g.icon || "",
                            lastPlayed: null, streak: 0, undo: null });

  function defaultState() {
    return { version: 2, ...fromCatalogue(window.DEFAULT_GAMES), settings: { ...DEFAULT_SETTINGS } };
  }

  // Accepts current and older saved data (and backup files) and normalises it.
  function migrate(s) {
    if (!s || !Array.isArray(s.games)) return null;
    const groups = Array.isArray(s.groups)
      ? s.groups.filter((g) => g && g.id && g.name).map((g) => ({ id: String(g.id), name: String(g.name), color: g.color }))
      : [];
    groups.forEach((g, i) => { if (!INKS.includes(g.color)) g.color = nextInk(groups.slice(0, i)); });
    const byName = new Map(groups.map((g) => [g.name, g]));
    const games = [];
    for (const g of s.games) {
      if (!g || !g.name || !g.url) continue;
      let groupId = g.groupId;
      if (!groups.some((x) => x.id === groupId)) {
        const name = g.group || "Other";
        let grp = byName.get(name);
        if (!grp) { grp = makeGroup(name, groups); groups.push(grp); byName.set(name, grp); }
        groupId = grp.id;
      }
      games.push({
        id: g.id || uid(), name: String(g.name), url: String(g.url), groupId,
        icon: s.version >= 2 ? String(g.icon || "") : "",
        lastPlayed: g.lastPlayed || null, streak: Number(g.streak) || 0, undo: g.undo || null,
      });
    }
    return { version: 2, groups, games, settings: { ...DEFAULT_SETTINGS, ...s.settings } };
  }

  function load() {
    try {
      const s = migrate(JSON.parse(localStorage.getItem(STORAGE_KEY)));
      if (s) return s;
    } catch (e) { /* fall through */ }
    return defaultState();
  }

  let state = load();
  let editing = false;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { toast("Couldn't save. Storage may be full."); }
  }

  const gamesIn = (groupId) => state.games.filter((g) => g.groupId === groupId);
  const groupById = (id) => state.groups.find((g) => g.id === id);
  const playedToday = (g) => g.lastPlayed === dayKey();
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
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid);
    return el;
  };
  const svg = (id) => {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
    u.setAttribute("href", `#${id}`);
    s.append(u);
    return s;
  };

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
  }

  function normaliseUrl(v) {
    v = (v || "").trim();
    if (v && !/^[a-z][a-z0-9+.-]*:/i.test(v)) v = "https://" + v;
    return v;
  }
  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
  }

  // ---------- icons ----------
  // The website's own icon via a favicon service, then a second service,
  // then a lettered tile. Results are remembered so re-renders don't flicker.
  const isLink = (s) => /^(https?:)?\/\//i.test(s) || /^data:image\//i.test(s);
  const iconSources = (url) => {
    const host = hostOf(url);
    if (!host) return [];
    return [
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
    ];
  };
  const resolved = new Map(); // key -> working src, or "" for "use letter"

  function iconEl(game) {
    const wrap = h("span", { class: "ico", "aria-hidden": "true" });
    const custom = (game.icon || "").trim();
    const letter = () => {
      wrap.className = "ico letter";
      wrap.replaceChildren((game.name || "?").trim().charAt(0).toUpperCase());
    };
    if (custom && !isLink(custom)) { wrap.className = "ico emoji"; wrap.textContent = custom; return wrap; }

    const sources = custom ? [custom] : iconSources(game.url);
    const key = custom || hostOf(game.url);
    if (resolved.has(key)) {
      const src = resolved.get(key);
      if (src) wrap.append(h("img", { src, alt: "", referrerpolicy: "no-referrer" })); else letter();
      return wrap;
    }
    let i = 0;
    const tryNext = () => {
      if (i >= sources.length) { resolved.set(key, ""); letter(); return; }
      const src = sources[i++];
      const img = h("img", { alt: "", referrerpolicy: "no-referrer" });
      img.onload = () => {
        // The Google service answers unknown sites with a tiny generic globe.
        if (!custom && src.includes("google.com") && img.naturalWidth <= 16) { img.remove(); tryNext(); return; }
        resolved.set(key, src);
      };
      img.onerror = () => { img.remove(); tryNext(); };
      img.src = src;
      wrap.replaceChildren(img);
    };
    if (!sources.length) letter(); else tryNext();
    return wrap;
  }

  // ---------- render ----------
  const pad2 = (n) => String(n).padStart(2, "0");
  const dayOfYear = (d) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 0)) / 864e5);

  function render() {
    const now = new Date();
    $("#folioNo").textContent = `No. ${dayOfYear(now)}`;
    $("#folioDate").textContent = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const total = state.games.length;
    const done = state.games.filter(playedToday).length;
    const round = $("#roundText");
    round.replaceChildren();
    if (total) {
      round.append(h("em", {}, "Today’s round"), " — ",
        done === total ? `all ${total} solved.` : `${done} of ${total} solved`);
    }
    const ordered = state.groups.flatMap((grp) => gamesIn(grp.id));
    $("#squares").replaceChildren(...ordered.map((g) =>
      h("i", { class: `c-${groupById(g.groupId).color}${playedToday(g) ? " on" : ""}` })));

    document.body.classList.toggle("editing", editing);
    $("#editBtn").textContent = editing ? "Done" : "Edit";
    $("#editBtn").classList.toggle("active", editing);

    const list = $("#list");
    list.replaceChildren();

    if (!state.groups.length && !editing) {
      list.append(h("div", { class: "empty" },
        h("p", {}, "Nothing on today’s page yet."),
        h("p", { class: "small" }, "Tap Add to put a game here, or browse the suggestions under Menu.")));
      return;
    }

    let n = 0;
    state.groups.forEach((grp, gi) => {
      const all = gamesIn(grp.id);
      if (!editing && !all.length) return;

      let shown = all;
      if (!editing && state.settings.hidePlayed) shown = shown.filter((g) => !playedToday(g));
      if (!editing && state.settings.sortPlayed) shown = [...shown].sort((a, b) => playedToday(a) - playedToday(b));
      const numbers = new Map(all.map((g) => [g, ++n]));

      const head = editing
        ? h("div", { class: "group-head" },
            h("button", { class: "group-name editable", onclick: () => openGroupSheet(grp) }, grp.name,
              h("span", { class: "rename" }, "edit")),
            h("div", { class: "move" },
              moveBtn("i-up", `Move ${grp.name} up`, gi === 0, () => moveGroup(gi, -1)),
              moveBtn("i-down", `Move ${grp.name} down`, gi === state.groups.length - 1, () => moveGroup(gi, 1))))
        : h("div", { class: "group-head" },
            h("h2", { class: "group-name" }, grp.name),
            h("span", { class: "group-count" }, `${all.filter(playedToday).length}/${all.length}`));

      const rows = h("div", { class: "rows" });
      shown.forEach((g) => rows.append(row(g, all, numbers.get(g))));
      if (editing) {
        rows.append(h("button", { class: "add-row", onclick: () => openGameSheet(null, grp.id) },
          h("span", { class: "num" }, "+"), h("em", {}, `Add a game to ${grp.name}`)));
      } else if (!shown.length) {
        rows.append(h("p", { class: "row-note" }, h("em", {}, "All solved.")));
      }
      list.append(h("section", { class: `group c-${grp.color}` }, head, rows));
    });

    if (editing) {
      list.append(h("button", { class: "add-row new-group", onclick: () => openGroupSheet(null) },
        h("span", { class: "num" }, "+"), h("em", {}, "Start a new group")));
    }
  }

  const moveBtn = (icon, label, disabled, fn) =>
    h("button", { class: "move-btn", "aria-label": label, disabled, onclick: fn }, svg(icon));

  function row(g, groupGames, number) {
    const played = playedToday(g);
    const streak = liveStreak(g);
    const detail = streak > 1 ? `${streak} days running` : played ? "Solved today" : hostOf(g.url);
    const text = h("span", { class: "row-text" },
      h("span", { class: "row-title" }, g.name),
      h("span", { class: "row-detail" }, detail));
    const num = h("span", { class: "num" }, pad2(number));

    if (editing) {
      const idx = groupGames.indexOf(g);
      return h("div", { class: "row" },
        h("button", { class: "row-main", onclick: () => openGameSheet(g), "aria-label": `Edit ${g.name}` }, num, iconEl(g), text),
        h("div", { class: "move" },
          moveBtn("i-up", `Move ${g.name} up`, idx === 0, () => moveGame(g, groupGames, -1)),
          moveBtn("i-down", `Move ${g.name} down`, idx === groupGames.length - 1, () => moveGame(g, groupGames, 1))));
    }

    return h("div", { class: `row${played ? " played" : ""}` },
      h("a", {
        class: "row-main", href: g.url, target: "_blank", rel: "noopener noreferrer",
        onclick: () => { if (!playedToday(g)) { setPlayed(g, true); setTimeout(render, 400); } },
      }, num, iconEl(g), text),
      h("button", {
        class: "check", "aria-pressed": String(played),
        "aria-label": played ? `Mark ${g.name} as not solved` : `Mark ${g.name} as solved`,
        onclick: () => { setPlayed(g, !played); render(); },
      }, svg("i-check")));
  }

  function moveGame(g, groupGames, dir) {
    const other = groupGames[groupGames.indexOf(g) + dir];
    if (!other) return;
    const a = state.games.indexOf(g), b = state.games.indexOf(other);
    [state.games[a], state.games[b]] = [state.games[b], state.games[a]];
    save(); render();
  }
  function moveGroup(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= state.groups.length) return;
    [state.groups[i], state.groups[j]] = [state.groups[j], state.groups[i]];
    save(); render();
  }

  // ---------- sheets ----------
  function openSheet(d) { d.showModal(); }
  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((d) =>
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  // ----- game sheet -----
  const gameSheet = $("#gameSheet");
  const gameForm = $("#gameForm");
  const groupSelect = $("#groupSelect");
  let editingGameId = null;
  let lastGroupChoice = null;

  function fillGroupSelect(selectedId) {
    groupSelect.replaceChildren(
      ...state.groups.map((g) => h("option", { value: g.id }, g.name)),
      h("option", { value: "__new" }, "New group…"));
    if (!state.groups.length) {
      // a game needs a group; make "Other" on the fly
      const grp = makeGroup("Other", state.groups);
      state.groups.push(grp); save();
      return fillGroupSelect(grp.id);
    }
    groupSelect.value = selectedId && groupById(selectedId) ? selectedId : state.groups[0].id;
    lastGroupChoice = groupSelect.value;
  }

  function updatePreview() {
    const fake = { name: gameForm.name.value || "?", url: normaliseUrl(gameForm.url.value), icon: gameForm.icon.value };
    $("#iconPreview").replaceChildren(iconEl(fake));
  }
  let previewTimer;
  ["input", "change"].forEach((ev) => gameForm.addEventListener(ev, (e) => {
    if (e.target === groupSelect) return;
    clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 350);
  }));

  function openGameSheet(g, groupId) {
    editingGameId = g ? g.id : null;
    $("#gameSheetTitle").textContent = g ? "Edit game" : "New game";
    $("#deleteGameWrap").hidden = !g;
    gameForm.name.value = g ? g.name : "";
    gameForm.url.value = g ? g.url : "";
    gameForm.icon.value = g ? g.icon : "";
    fillGroupSelect(g ? g.groupId : groupId);
    updatePreview();
    openSheet(gameSheet);
    if (!g) setTimeout(() => gameForm.name.focus(), 50);
  }

  groupSelect.addEventListener("change", () => {
    if (groupSelect.value !== "__new") { lastGroupChoice = groupSelect.value; return; }
    groupSelect.value = lastGroupChoice;
    openGroupSheet(null, (grp) => { fillGroupSelect(grp.id); });
  });

  gameForm.url.addEventListener("blur", () => { gameForm.url.value = normaliseUrl(gameForm.url.value); });

  gameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = normaliseUrl(gameForm.url.value);
    try { if (!/^https?:$/.test(new URL(url).protocol)) throw 0; }
    catch { toast("Enter a valid web link"); gameForm.url.focus(); return; }
    const name = gameForm.name.value.trim();
    if (!name) { gameForm.name.focus(); return; }
    const data = { name, url, icon: gameForm.icon.value.trim(), groupId: groupSelect.value };

    if (editingGameId) {
      const g = state.games.find((x) => x.id === editingGameId);
      const movedGroup = g.groupId !== data.groupId;
      Object.assign(g, data);
      if (movedGroup) { state.games.splice(state.games.indexOf(g), 1); state.games.push(g); }
    } else {
      state.games.push(newGame(data));
      toast(`Added ${name}`);
    }
    save(); gameSheet.close(); render();
  });

  $("#deleteGame").addEventListener("click", () => {
    const g = state.games.find((x) => x.id === editingGameId);
    if (!g || !confirm(`Delete ${g.name}?`)) return;
    state.games = state.games.filter((x) => x !== g);
    save(); gameSheet.close(); render();
  });

  // ----- group sheet -----
  const groupSheet = $("#groupSheet");
  const groupForm = $("#groupForm");
  let editingGroupId = null;
  let onGroupCreated = null;

  function openGroupSheet(grp, onCreated) {
    editingGroupId = grp ? grp.id : null;
    onGroupCreated = onCreated || null;
    $("#groupSheetTitle").textContent = grp ? "Edit group" : "New group";
    groupForm.name.value = grp ? grp.name : "";
    const chosen = grp ? grp.color : nextInk(state.groups);
    $("#inkChoices").replaceChildren(...INKS.map((c) =>
      h("label", { class: `ink-chip c-${c}`, title: INK_NAMES[c] },
        h("input", { type: "radio", name: "color", value: c, checked: c === chosen, "aria-label": INK_NAMES[c] }))));
    $("#deleteGroupWrap").hidden = !grp;
    const n = grp ? gamesIn(grp.id).length : 0;
    $("#deleteGroupNote").textContent = grp && n ? `Deleting this group also deletes its ${n} game${n === 1 ? "" : "s"}.` : "";
    openSheet(groupSheet);
    setTimeout(() => groupForm.name.focus(), 50);
  }

  groupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = groupForm.name.value.trim();
    if (!name) return;
    const clash = state.groups.find((g) => g.name.toLowerCase() === name.toLowerCase() && g.id !== editingGroupId);
    if (clash) { toast(`There's already a group called ${clash.name}`); return; }
    const color = INKS.includes(groupForm.color.value) ? groupForm.color.value : nextInk(state.groups);
    if (editingGroupId) {
      Object.assign(groupById(editingGroupId), { name, color });
    } else {
      const grp = { id: uid(), name, color };
      state.groups.push(grp);
      if (onGroupCreated) onGroupCreated(grp);
      else if (!editing) { editing = true; }
    }
    save(); groupSheet.close(); render();
  });

  $("#deleteGroup").addEventListener("click", () => {
    const grp = groupById(editingGroupId);
    if (!grp) return;
    const n = gamesIn(grp.id).length;
    if (n && !confirm(`Delete ${grp.name} and its ${n} game${n === 1 ? "" : "s"}?`)) return;
    state.groups = state.groups.filter((g) => g !== grp);
    state.games = state.games.filter((g) => g.groupId !== grp.id);
    save(); groupSheet.close(); render();
  });

  // ----- settings -----
  const menuSheet = $("#menuSheet");
  $("#menuBtn").addEventListener("click", () => {
    $("#sortPlayed").checked = state.settings.sortPlayed;
    $("#hidePlayed").checked = state.settings.hidePlayed;
    $("#installHint").textContent = installHint();
    openSheet(menuSheet);
  });
  $("#sortPlayed").addEventListener("change", (e) => { state.settings.sortPlayed = e.target.checked; save(); render(); });
  $("#hidePlayed").addEventListener("change", (e) => { state.settings.hidePlayed = e.target.checked; save(); render(); });
  $("#newGroupBtn").addEventListener("click", () => { menuSheet.close(); openGroupSheet(null); });

  function installHint() {
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (standalone) return "Your games and streaks live on this phone only. Export a backup now and then to keep them safe.";
    if (/iphone|ipad|ipod/i.test(navigator.userAgent))
      return "To install: tap Share in Safari, then Add to Home Screen.";
    if (/android/i.test(navigator.userAgent))
      return "To install: open the browser menu and tap Install app.";
    return "Open this page on your phone and add it to your home screen to use it like an app.";
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
      const s = migrate(JSON.parse(await file.text()));
      if (!s) throw new Error("bad");
      state = s; save(); render(); menuSheet.close(); toast(`Imported ${s.games.length} games`);
    } catch { toast("That file isn't a Petal backup"); }
  });
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Replace everything with the default games? Your own games, groups and streaks will be lost.")) return;
    state = defaultState(); save(); render(); menuSheet.close();
  });

  // ----- suggestions -----
  const suggestSheet = $("#suggestSheet");
  function renderSuggestions() {
    const key = (u) => u.replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/, "");
    const have = new Set(state.games.map((g) => key(g.url)));
    const items = [...window.DEFAULT_GAMES, ...window.SUGGESTED_GAMES].filter((s) => !have.has(key(s.url)));
    const list = $("#suggestList");
    if (!items.length) { list.replaceChildren(h("p", { class: "row-note" }, h("em", {}, "You have all of them."))); return; }
    list.replaceChildren(...items.map((s) =>
      h("div", { class: "row" },
        h("div", { class: "row-main" }, iconEl(s),
          h("span", { class: "row-text" }, h("span", { class: "row-title" }, s.name), h("span", { class: "row-detail" }, s.group))),
        h("button", { class: "tool add-btn", onclick: () => {
            let grp = state.groups.find((g) => g.name === s.group);
            if (!grp) { grp = makeGroup(s.group, state.groups); state.groups.push(grp); }
            state.games.push(newGame({ name: s.name, url: s.url, groupId: grp.id }));
            save(); render(); renderSuggestions();
          } }, "Add"))));
  }
  $("#suggestBtn").addEventListener("click", () => { menuSheet.close(); renderSuggestions(); openSheet(suggestSheet); });

  // ---------- wiring ----------
  $("#addBtn").addEventListener("click", () => openGameSheet(null, state.groups[0]?.id));
  $("#editBtn").addEventListener("click", () => { editing = !editing; render(); });

  // pick up a new day (or changes from another tab) when coming back to the app
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { state = load(); render(); } });
  window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) { state = load(); render(); } });

  render();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
