// Built-in catalogue. DEFAULT_GAMES is what a fresh install starts with;
// SUGGESTED_GAMES show up under Settings → Suggested Games.
// Icons are fetched automatically from each game's website.
window.DEFAULT_GAMES = [
  { name: "Wordle",       url: "https://www.nytimes.com/games/wordle/index.html", group: "NYT Games" },
  { name: "Connections",  url: "https://www.nytimes.com/games/connections",       group: "NYT Games" },
  { name: "Strands",      url: "https://www.nytimes.com/games/strands",           group: "NYT Games" },
  { name: "Spelling Bee", url: "https://www.nytimes.com/puzzles/spelling-bee",    group: "NYT Games" },
  { name: "The Mini",     url: "https://www.nytimes.com/crosswords/game/mini",    group: "NYT Games" },
  { name: "Pips",         url: "https://www.nytimes.com/games/pips",              group: "NYT Games" },
  { name: "Letter Boxed", url: "https://www.nytimes.com/puzzles/letter-boxed",    group: "NYT Games" },
  { name: "Tiles",        url: "https://www.nytimes.com/puzzles/tiles",           group: "NYT Games" },
  { name: "Sudoku",       url: "https://www.nytimes.com/puzzles/sudoku",          group: "NYT Games" },

  { name: "Queens",       url: "https://www.linkedin.com/games/queens/",          group: "LinkedIn" },
  { name: "Tango",        url: "https://www.linkedin.com/games/tango/",           group: "LinkedIn" },
  { name: "Zip",          url: "https://www.linkedin.com/games/zip/",             group: "LinkedIn" },
  { name: "Mini Sudoku",  url: "https://www.linkedin.com/games/mini-sudoku/",     group: "LinkedIn" },
  { name: "Crossclimb",   url: "https://www.linkedin.com/games/crossclimb/",      group: "LinkedIn" },
  { name: "Pinpoint",     url: "https://www.linkedin.com/games/pinpoint/",        group: "LinkedIn" },

  { name: "Krillion",     url: "https://krillion.io/",                            group: "Other" },
];

window.SUGGESTED_GAMES = [
  { name: "NYT Crossword", url: "https://www.nytimes.com/crosswords",              group: "NYT Games" },
  { name: "Worldle",       url: "https://worldlegame.io/",                         group: "Geography" },
  { name: "Globle",        url: "https://globle-game.com/",                        group: "Geography" },
  { name: "Travle",        url: "https://travle.earth/",                           group: "Geography" },
  { name: "Framed",        url: "https://framed.wtf/",                             group: "Movies & Music" },
  { name: "Bandle",        url: "https://bandle.app/",                             group: "Movies & Music" },
  { name: "Contexto",      url: "https://contexto.me/",                            group: "Words" },
  { name: "Quordle",       url: "https://www.merriam-webster.com/games/quordle/",  group: "Words" },
  { name: "Waffle",        url: "https://wafflegame.net/daily",                    group: "Words" },
  { name: "Semantle",      url: "https://semantle.com/",                           group: "Words" },
  { name: "Nerdle",        url: "https://nerdlegame.com/",                         group: "Numbers" },
  { name: "Costcodle",     url: "https://costcodle.com/",                          group: "Other" },
  { name: "Metazooa",      url: "https://metazooa.com/",                           group: "Other" },
  { name: "Guardian Quick Crossword", url: "https://www.theguardian.com/crosswords/series/quick", group: "Crosswords" },
];
