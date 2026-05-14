function clamp(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
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

function dailySync() {
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

    // Reset daily content
    state.completedQuests = [];
    state.questProgress = {};
    state.npcEventDone = false;
    state.npcEventDate = null;
    state.energy = Math.min(100, (state.energy || 0) + 35);

    // Daily login reward
    if (state.dailyLoginClaimedDate !== today) {
      const loginBonus = 20 + Math.min(state.streak, 7) * 5;
      state.coins += loginBonus;
      state.dailyLoginClaimedDate = today;

      setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast(`每日登录奖励 +${loginBonus} 🪙`);
        }
        if (typeof createCoinBurst === 'function') {
          createCoinBurst(`+${loginBonus} 🪙`);
        }
      }, 500);
    }

    save();
  }
}

function addReward(coins, xp) {
  state.coins += coins;
  state.xp += xp;

  while (state.xp >= 100) {
    state.level += 1;
    state.xp -= 100;
    state.coins += 60;

    if (typeof createCoinBurst === 'function') {
      createCoinBurst('✨ LEVEL UP!');
    }
  }
}

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

  const earnedCoins = Math.floor(Math.random() * 20) + 18;
  const earnedXp = Math.floor(Math.random() * 15) + 12;

  addReward(earnedCoins, earnedXp);

  state.energy = Math.max(0, state.energy - 10);

  if (!state.questProgress) {
    state.questProgress = {};
  }

  if (choice.effect.impulse && choice.effect.impulse < 0) {
    state.questProgress.storyPositive = true;
  }

  if (choice.effect.saving && choice.effect.saving > 0) {
    state.questProgress.savingChoice = true;
  }

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
  render();
}

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

  if (!state.questProgress) {
    state.questProgress = {};
  }

  state.questProgress.reflection = true;
  state.lastReflectionDate = getTodayKey();

  state.reflections.unshift({
    text: txt,
    date: new Date().toLocaleDateString('zh-MY'),
    question: mentorQuestion()
  });

  state.stats.discipline = clamp(state.stats.discipline + 3);
  state.stats.resilience = clamp(state.stats.resilience + 3);

  addReward(25, 18);

  if (!state.completedQuests.includes('q2')) {
    state.completedQuests.push('q2');
  }

  input.value = '';

  createCoinBurst('+25 🪙');
  showToast('今日反思完成，成长值提升 🧠');

  save();
  render();
}

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
  render();
}

function buyItem(type, cost) {
  if (state.coins < cost) {
    alert('金币不足！继续完成任务吧～');
    return;
  }

  state.coins -= cost;
  state.inventory.push(type);

  if (type === 'pet') {
    state.petStage = Math.max(state.petStage, 1);
  }

  if (type === 'house') {
    state.houseLevel = Math.min(3, state.houseLevel + 1);
  }

  createCoinBurst(`-${cost} 🪙`);
  showToast('购买成功！你的城市变丰富了 ✨');

  save();
  render();
}

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

  if (!state.questProgress) {
    state.questProgress = {};
  }

  const gain = Math.floor(Math.random() * 10) + 5;

  addReward(gain, 8);

  state.energy = Math.max(0, state.energy - 5);
  state.stats.judgment = clamp(state.stats.judgment + 2);

  if (type === 'kind') {
    state.npcHearts.friend = clamp(state.npcHearts.friend + 5);
  }

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
  if (!confirm('确定要刷新今日任务和 NPC 事件吗？')) {
    return;
  }

  state.completedQuests = [];
  state.questProgress = {};
  state.npcEventDone = false;
  state.npcEventDate = null;
  state.lastEventDate = null;
  state.lastReflectionDate = null;

  save();
  render();
}
