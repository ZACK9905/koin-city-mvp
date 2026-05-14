// ---------- Core Helpers ----------
function clamp(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

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

function ensureDailyStateFields() {
  if (!state.completedQuests) state.completedQuests = [];
  if (!state.questProgress) state.questProgress = {};
  if (!state.inventory) state.inventory = [];
  if (!state.history) state.history = [];
  if (!state.reflections) state.reflections = [];

  if (!state.tutorial) {
    state.tutorial = {
      completed: false,
      step: 0,
      awaiting: null,
      starterClaimed: false,
      petEggClaimed: false
    };
  }

  if (!state.pet) {
    state.pet = {
      species: null,
      stage: 'none',
      xp: 0,
      mood: 70,
      eggOwned: false
    };
  }

  if (!state.npcHearts) {
    state.npcHearts = { dad: 55, friend: 68, mentor: 35, merchant: 20 };
  }

  if (!state.stats) state.stats = {};
  const statDefaults = {
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
  };

  Object.entries(statDefaults).forEach(([key, value]) => {
    if (typeof state.stats[key] !== 'number') {
      state.stats[key] = value;
    }
  });

  if (typeof state.streak !== 'number') state.streak = 0;
  if (typeof state.energy !== 'number') state.energy = 100;
  if (typeof state.day !== 'number') state.day = 1;

  if (typeof state.lastVisitDate === 'undefined') state.lastVisitDate = null;
  if (typeof state.lastEventDate === 'undefined') state.lastEventDate = null;
  if (typeof state.lastReflectionDate === 'undefined') state.lastReflectionDate = null;
  if (typeof state.dailyLoginClaimedDate === 'undefined') state.dailyLoginClaimedDate = null;
  if (typeof state.npcEventDate === 'undefined') state.npcEventDate = null;
  if (typeof state.npcEventDone === 'undefined') state.npcEventDone = false;
}

function currentScene() {
  return scenes[(state.day - 1) % scenes.length];
}

function hasDoneLifeEventToday() {
  return state.lastEventDate === getTodayKey();
}

function hasDoneNpcToday() {
  return state.npcEventDate === getTodayKey() || state.npcEventDone === true;
}

function hasDoneReflectionToday() {
  return state.lastReflectionDate === getTodayKey();
}

// ---------- Daily System ----------
function dailySync() {
  ensureDailyStateFields();

  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  if (!state.lastVisitDate) {
    state.lastVisitDate = today;
    state.streak = Math.max(state.streak || 0, 1);
    save();
    return;
  }

  if (state.lastVisitDate !== today) {
    if (state.lastVisitDate === yesterday) {
      state.streak = (state.streak || 0) + 1;
    } else {
      state.streak = 1;
    }

    state.lastVisitDate = today;

    state.completedQuests = [];
    state.questProgress = {};
    state.npcEventDone = false;
    state.npcEventDate = null;
    state.energy = Math.min(100, (state.energy || 0) + 35);

    if (state.dailyLoginClaimedDate !== today) {
      const loginBonus = 20 + Math.min(state.streak, 7) * 5;
      state.coins += loginBonus;
      state.dailyLoginClaimedDate = today;

      setTimeout(() => {
        if (typeof showToast === 'function') showToast(`每日登录奖励 +${loginBonus} 🪙`);
        if (typeof createCoinBurst === 'function') createCoinBurst(`+${loginBonus} 🪙`);
      }, 500);
    }

    save();
  }
}

// ---------- Tutorial System ----------
function tutorialIsActive() {
  ensureDailyStateFields();
  return !state.tutorial.completed;
}

function claimStarterPack() {
  ensureDailyStateFields();

  if (state.tutorial.starterClaimed) {
    return;
  }

  state.coins += 500;
  state.inventory.push('starterDesk');
  state.tutorial.starterClaimed = true;

  createCoinBurst('+500 🪙');
  showToast('获得 RM500 起始成长基金 🎁');

  save();
}

function claimTutorialPetEgg() {
  ensureDailyStateFields();

  if (state.tutorial.petEggClaimed) {
    return;
  }

  state.pet.eggOwned = true;
  state.pet.stage = 'egg';
  state.pet.species = 'mystery';
  state.tutorial.petEggClaimed = true;

  createCoinBurst('🥚');
  showToast('获得普通宠物蛋！明天继续照顾它 🥚');

  save();
}

function goTutorialStep(step) {
  ensureDailyStateFields();
  state.tutorial.step = step;
  state.tutorial.awaiting = null;
  save();
  render();
}

function tutorialPrimaryAction() {
  ensureDailyStateFields();

  const step = state.tutorial.step;

  if (step === 0) {
    state.tutorial.step = 1;
    save();
    render();
    return;
  }

  if (step === 1) {
    claimStarterPack();
    state.tutorial.step = 2;
    state.tutorial.awaiting = 'lifeEvent';
    save();
    switchPage('story');
    return;
  }

  if (step === 2) {
    state.tutorial.awaiting = 'lifeEvent';
    save();
    switchPage('story');
    return;
  }

  if (step === 3) {
    state.tutorial.awaiting = 'quest';
    save();
    switchPage('quests');
    return;
  }

  if (step === 4) {
    state.tutorial.awaiting = 'shop';
    save();
    switchPage('city');
    setTimeout(() => {
      const shopList = document.getElementById('shopList');
      if (shopList) shopList.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
    return;
  }

  if (step === 5) {
    state.tutorial.step = 6;
    state.tutorial.awaiting = null;
    save();
    switchPage('parent');
    return;
  }

  if (step === 6) {
    claimTutorialPetEgg();
    state.tutorial.step = 7;
    state.tutorial.awaiting = null;
    save();
    render();
    return;
  }

  if (step === 7) {
    state.tutorial.completed = true;
    state.tutorial.awaiting = null;
    state.inventory.push('starterBadge');
    addReward(30, 20);
    showToast('新手引导完成！获得成长新手称号 🌟');
    save();
    render();
  }
}

function tutorialActionCompleted(type) {
  ensureDailyStateFields();

  if (state.tutorial.completed) return;

  if (type === 'lifeEvent' && state.tutorial.step <= 2) {
    state.tutorial.step = 3;
    state.tutorial.awaiting = null;
    showToast('很好！现在去领取第一个任务奖励 📜');
    save();
    render();
    return;
  }

  if (type === 'quest' && state.tutorial.step <= 3) {
    state.tutorial.step = 4;
    state.tutorial.awaiting = null;
    showToast('奖励领取成功！现在去买第一个家具 🛋️');
    save();
    render();
    return;
  }

  if (type === 'shop' && state.tutorial.step <= 4) {
    state.tutorial.step = 5;
    state.tutorial.awaiting = null;
    showToast('家具购买成功！去看看成长报告 👨‍👩‍👧');
    save();
    render();
  }
}

// ---------- Reward / Progression ----------
function addReward(coins, xp) {
  state.coins += coins;
  state.xp += xp;

  while (state.xp >= 100) {
    state.level += 1;
    state.xp -= 100;
    state.coins += 60;
    if (typeof createCoinBurst === 'function') createCoinBurst('✨ LEVEL UP!');
  }
}

// ---------- Life Event ----------
function applyChoice(i) {
  dailySync();

  if (hasDoneLifeEventToday()) {
    alert('今天的人生事件已经完成了。\n\n明天回来会解锁新的事件。');
    return;
  }

  if (state.energy < 10) {
    alert('能量不足。休息一下，明天再继续成长。');
    return;
  }

  const scene = currentScene();
  const choice = scene.choices[i];

  if (!choice) return;

  Object.entries(choice.effect).forEach(([k, v]) => {
    state.stats[k] = clamp((state.stats[k] || 50) + v);
  });

  state.stats.knowledge = clamp((state.stats.knowledge || 0) + 4);
  state.stats.emotion = clamp((state.stats.emotion || 0) + 2);

  const earnedCoins = Math.floor(Math.random() * 20) + 18;
  const earnedXp = Math.floor(Math.random() * 15) + 12;

  addReward(earnedCoins, earnedXp);
  state.energy = Math.max(0, state.energy - 10);

  if (!state.questProgress) state.questProgress = {};

  if (choice.effect.impulse && choice.effect.impulse < 0) state.questProgress.storyPositive = true;
  if (choice.effect.saving && choice.effect.saving > 0) state.questProgress.savingChoice = true;

  if (['平衡选择', '投资学习', '复盘能力', '解决问题', '有界限的善良', '市场判断', '寻找支持'].includes(choice.tag)) {
    state.questProgress.storyPositive = true;
  }

  state.history.unshift({
    day: state.day,
    title: scene.title,
    choice: choice.label,
    result: choice.result,
    tag: choice.tag,
    reward: `+${earnedCoins} 金币 · +${earnedXp} XP`,
    date: new Date().toLocaleDateString('zh-MY')
  });

  state.lastEventDate = getTodayKey();
  state.day += 1;

  createCoinBurst(`+${earnedCoins} 🪙`);
  showToast('今日人生事件完成 ✨ 明天回来继续成长');

  save();
  tutorialActionCompleted('lifeEvent');
  render();
}

// ---------- Personality / Mentor ----------
function analyzeTraits() {
  const s = state.stats;
  const arr = [];

  if (s.impulse > 60) arr.push('容易冲动');
  if (s.resilience < 45) arr.push('怕失败');
  if (s.discipline < 45) arr.push('容易拖延');
  if (s.confidence < 45) arr.push('怕拒绝');
  if (s.goal < 50) arr.push('目标感需要加强');
  if (s.judgment > 62) arr.push('判断力正在提升');
  if (s.saving > 62) arr.push('储蓄稳定');

  return arr.length ? arr : ['成长状态稳定'];
}

function mentorQuestion() {
  const traits = analyzeTraits();

  if (traits.includes('容易冲动')) {
    return 'Koin 想问你：刚刚那个选择，是你真的需要，还是只是当下很想要？如果再给你 10 秒思考，你会改变决定吗？';
  }

  if (traits.includes('怕失败')) {
    return 'Koin 想问你：这次没有做到，代表你不行，还是代表方法需要调整？下一次你可以把目标变小到什么程度？';
  }

  if (traits.includes('容易拖延')) {
    return 'Koin 想问你：你一直拖延的真正原因是什么？太难、太无聊，还是不知道第一步？';
  }

  if (traits.includes('怕拒绝')) {
    return 'Koin 想问你：你帮助别人时，有没有同时保护自己？你可以怎样温柔但坚定地表达界限？';
  }

  return 'Koin 想问你：今天的选择让你更接近怎样的自己？你下一步想训练哪一个能力？';
}

function saveReflection() {
  dailySync();

  const input = $('reflectionInput');

  if (!input) {
    alert('找不到反思输入框，请确认 mentor 页面结构没有被删除。');
    return;
  }

  const txt = input.value.trim();

  if (!txt) {
    alert('先写下你的想法，再提交哦。');
    return;
  }

  if (txt.length < 20) {
    alert('反思太短了，至少写 20 个字，才算真正有思考。');
    return;
  }

  if (hasDoneReflectionToday()) {
    alert('今天已经完成一次深度反思了。\n\n你可以明天再回来继续记录新的成长。');
    return;
  }

  if (!state.questProgress) state.questProgress = {};

  state.questProgress.reflection = true;
  state.lastReflectionDate = getTodayKey();

  state.reflections.unshift({
    text: txt,
    date: new Date().toLocaleDateString('zh-MY'),
    question: mentorQuestion()
  });

  state.stats.discipline = clamp(state.stats.discipline + 3);
  state.stats.resilience = clamp(state.stats.resilience + 3);
  state.stats.emotion = clamp((state.stats.emotion || 0) + 3);

  addReward(25, 18);

  if (!state.completedQuests.includes('q2')) state.completedQuests.push('q2');

  input.value = '';

  createCoinBurst('+25 🪙');
  showToast('今日反思完成，成长值提升 🧠');

  save();
  render();
}

// ---------- Quests ----------
function canClaimQuest(quest) {
  if (!quest || !state.questProgress) return false;
  return !!state.questProgress[quest.type];
}

function completeQuest(id, reward) {
  dailySync();

  const quest = dailyQuests.find(q => q.id === id);

  if (!quest) return;

  if (state.completedQuests.includes(id)) {
    showToast('这个任务今天已经领取过了 ✅');
    return;
  }

  if (!canClaimQuest(quest)) {
    alert('还不能领取奖励：\n\n' + quest.requirement);
    return;
  }

  state.completedQuests.push(id);

  addReward(reward, 15);
  state.energy = Math.min(100, state.energy + 10);

  createCoinBurst(`+${reward} 🪙`);
  showToast('任务奖励已领取 🎁');

  save();
  tutorialActionCompleted('quest');
  render();
}

// ---------- Shop ----------
function buyItem(type, cost) {
  if (state.coins < cost) {
    alert('金币不足！继续完成任务吧～');
    return;
  }

  state.coins -= cost;
  state.inventory.push(type);

  if (type === 'pet') state.petStage = Math.max(state.petStage, 1);
  if (type === 'house') state.houseLevel = Math.min(3, state.houseLevel + 1);

  if (type === 'lamp') state.stats.knowledge = clamp((state.stats.knowledge || 0) + 2);
  if (type === 'tree') state.stats.emotion = clamp((state.stats.emotion || 0) + 2);

  createCoinBurst(`-${cost} 🪙`);
  showToast('购买成功！你的城市变丰富了 ✨');

  save();
  tutorialActionCompleted('shop');
  render();
}

// ---------- NPC ----------
function npcAction(type) {
  dailySync();

  if (hasDoneNpcToday()) {
    alert('今天的 NPC 事件已经完成了，不能重复刷奖励。\n\n明天会有新的关系事件。');
    return;
  }

  if (state.energy < 5) {
    alert('能量不足。明天再处理关系事件吧。');
    return;
  }

  if (!state.questProgress) state.questProgress = {};

  const gain = Math.floor(Math.random() * 10) + 5;

  addReward(gain, 8);

  state.energy = Math.max(0, state.energy - 5);
  state.stats.judgment = clamp(state.stats.judgment + 2);
  state.stats.social = clamp((state.stats.social || 0) + 3);

  if (type === 'kind') state.npcHearts.friend = clamp(state.npcHearts.friend + 5);

  if (type === 'boundary') {
    state.stats.confidence = clamp(state.stats.confidence + 5);
    state.questProgress.npcBoundary = true;
  }

  if (type === 'honest') {
    state.npcHearts.dad = clamp(state.npcHearts.dad + 4);
    state.stats.resilience = clamp(state.stats.resilience + 3);
    state.questProgress.npcBoundary = true;
  }

  state.npcEventDone = true;
  state.npcEventDate = getTodayKey();

  createCoinBurst(`+${gain} 🪙`);
  showToast('今日关系事件已完成 💛');

  save();
  render();
}

// ---------- Settings ----------
function saveSettings() {
  const childNameInput = $('childName');
  const childAgeInput = $('childAge');
  const themeInput = $('theme');

  state.childName = childNameInput ? childNameInput.value || '孩子' : state.childName;
  state.childAge = childAgeInput ? parseInt(childAgeInput.value, 10) || 12 : state.childAge;
  state.theme = themeInput ? themeInput.value : state.theme;

  save();
  render();

  alert('已保存');
}

function resetGame() {
  if (confirm('确定要重新开始游戏吗？目前的城市和记录都会清空。')) {
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(defaultState);
    render();
  }
}

function resetDailyDemo() {
  if (!confirm('确定要刷新今日任务和 NPC 事件吗？')) return;

  state.completedQuests = [];
  state.questProgress = {};
  state.npcEventDone = false;
  state.npcEventDate = null;
  state.lastEventDate = null;
  state.lastReflectionDate = null;

  save();
  render();
}
