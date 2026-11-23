// Built-in game catalogue. DEFAULT_GAMES is what a fresh install starts with;
// SUGGESTED_GAMES appear under Settings → "Add more popular games".
window.DEFAULT_GAMES = [
  // New York Times
  { name: "Wordle",          url: "https://www.nytimes.com/games/wordle/index.html", emoji: "🟩", group: "NYT Games", color: "#6aaa64" },
  { name: "Connections",     url: "https://www.nytimes.com/games/connections",       emoji: "🟪", group: "NYT Games", color: "#b07fd8" },
  { name: "Strands",         url: "https://www.nytimes.com/games/strands",           emoji: "🧵", group: "NYT Games", color: "#7fb3c8" },
  { name: "Spelling Bee",    url: "https://www.nytimes.com/puzzles/spelling-bee",    emoji: "🐝", group: "NYT Games", color: "#f7da21" },
  { name: "The Mini",        url: "https://www.nytimes.com/crosswords/game/mini",    emoji: "✏️", group: "NYT Games", color: "#4f85e5" },
  { name: "Pips",            url: "https://www.nytimes.com/games/pips",              emoji: "🎲", group: "NYT Games", color: "#d98a4a" },
  { name: "Letter Boxed",    url: "https://www.nytimes.com/puzzles/letter-boxed",    emoji: "🔲", group: "NYT Games", color: "#fc716b" },
  { name: "Tiles",           url: "https://www.nytimes.com/puzzles/tiles",           emoji: "🀄", group: "NYT Games", color: "#b5e352" },
  { name: "Sudoku",          url: "https://www.nytimes.com/puzzles/sudoku",          emoji: "🔢", group: "NYT Games", color: "#f99a1c" },

  // LinkedIn
  { name: "Queens",          url: "https://www.linkedin.com/games/queens/",          emoji: "👑", group: "LinkedIn", color: "#a98bd6" },
  { name: "Tango",           url: "https://www.linkedin.com/games/tango/",           emoji: "🌗", group: "LinkedIn", color: "#e9a23b" },
  { name: "Zip",             url: "https://www.linkedin.com/games/zip/",             emoji: "〰️", group: "LinkedIn", color: "#e46f3c" },
  { name: "Mini Sudoku",     url: "https://www.linkedin.com/games/mini-sudoku/",     emoji: "🔢", group: "LinkedIn", color: "#3c8dd9" },
  { name: "Crossclimb",      url: "https://www.linkedin.com/games/crossclimb/",      emoji: "🪜", group: "LinkedIn", color: "#4fa98a" },
  { name: "Pinpoint",        url: "https://www.linkedin.com/games/pinpoint/",        emoji: "📍", group: "LinkedIn", color: "#3a74b7" },

  // Other
  { name: "Krillion",        url: "https://krillion.io/",                            emoji: "🦐", group: "Other", color: "#ef7f8f" },
];

window.SUGGESTED_GAMES = [
  { name: "Worldle",    url: "https://worldlegame.io/",           emoji: "🌍", group: "Geography", color: "#4a9d6f" },
  { name: "Globle",     url: "https://globle-game.com/",          emoji: "🌐", group: "Geography", color: "#3d8ccf" },
  { name: "Travle",     url: "https://travle.earth/",             emoji: "🧭", group: "Geography", color: "#5c9e8c" },
  { name: "Framed",     url: "https://framed.wtf/",               emoji: "🎬", group: "Movies & Music", color: "#c4473a" },
  { name: "Bandle",     url: "https://bandle.app/",               emoji: "🎸", group: "Movies & Music", color: "#7c5cbf" },
  { name: "Contexto",   url: "https://contexto.me/",              emoji: "🧠", group: "Words", color: "#8a66c9" },
  { name: "Quordle",    url: "https://www.merriam-webster.com/games/quordle/", emoji: "4️⃣", group: "Words", color: "#e0a63a" },
  { name: "Waffle",     url: "https://wafflegame.net/daily",      emoji: "🧇", group: "Words", color: "#e7b443" },
  { name: "Semantle",   url: "https://semantle.com/",             emoji: "🔤", group: "Words", color: "#5b8fd6" },
  { name: "Nerdle",     url: "https://nerdlegame.com/",           emoji: "➗", group: "Numbers", color: "#820458" },
  { name: "Costcodle",  url: "https://costcodle.com/",            emoji: "🛒", group: "Other", color: "#e31837" },
  { name: "Metazooa",   url: "https://metazooa.com/",             emoji: "🦒", group: "Other", color: "#c58a3d" },
  { name: "Guardian Crossword (Quick)", url: "https://www.theguardian.com/crosswords/series/quick", emoji: "📰", group: "Crosswords", color: "#052962" },
  { name: "NYT Crossword", url: "https://www.nytimes.com/crosswords", emoji: "📰", group: "NYT Games", color: "#222222" },
];
