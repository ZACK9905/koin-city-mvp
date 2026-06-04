const STORAGE_KEY = 'koinCityMvpV1';

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const defaultState = {
  childName: '孩子',
  childAge: 12,
  theme: 'money',

  day: 1,

  coins: 120,
  xp: 0,
  level: 1,
  streak: 0,
  energy: 100,

  lastVisitDate: null,
  lastEventDate: null,
  lastReflectionDate: null,
  dailyLoginClaimedDate: null,

  completedQuests: [],
  questProgress: {},
  inventory: [],
  petStage: 0,
  houseLevel: 0,
  npcEventDone: false,
  npcEventDate: null,

  dailyLocationDate: null,
  dailyLocationActions: 0,
  locationHistory: [],

  tutorial: {
    completed: false,
    step: 0,
    awaiting: null,
    starterClaimed: false,
    petEggClaimed: false
  },

  pet: {
    species: null,
    stage: 'none',
    xp: 0,
    mood: 70,
    eggOwned: false
  },

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
    goal: 45,
    knowledge: 0,
    creativity: 0,
    fitness: 0,
    social: 0,
    business: 0,
    emotion: 0
  },

  history: [],
  reflections: []
};

let state = loadState();

window.state = state;

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
