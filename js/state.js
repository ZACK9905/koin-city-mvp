// State management for Koin City MVP
// This file manages the application state

const STORAGE_KEY = 'koinCityMvpV1';

const defaultState = {
  childName: '孩子',
  childAge: 12,
  theme: 'money',
  day: 1,
  coins: 120,
  xp: 0,
  level: 1,
  streak: 1,
  energy: 100,
  completedQuests: [],
  questProgress: {},
  inventory: [],
  petStage: 0,
  houseLevel: 0,
  npcEventDone: false,
  npcHearts: {
    dad: 55,
    friend: 68,
    mentor: 35,
    merchant: 20
  },
  stats: {
    discipline: 50,
    saving: 50,
    judgment: 50,
    resilience: 50,
    impulse: 50,
    confidence: 50,
    goal: 45
  },
  history: [],
  reflections: []
};

let state = loadState();
let mapDrag = {
  ready: false,
  dragging: false,
  x: 0,
  y: 0,
  startX: 0,
  startY: 0
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return mergeState(structuredClone(defaultState), saved || {});
  } catch (e) {
    return structuredClone(defaultState);
  }
}

function mergeState(base, extra) {
  Object.keys(extra).forEach(k => {
    if (
      extra[k] &&
      typeof extra[k] === 'object' &&
      !Array.isArray(extra[k]) &&
      base[k]
    ) {
      base[k] = mergeState(base[k], extra[k]);
    } else {
      base[k] = extra[k];
    }
  });

  return base;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
