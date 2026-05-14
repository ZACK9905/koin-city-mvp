// Systems for Koin City MVP
// This file contains game systems and logic
function clamp(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function currentScene() {
  return scenes[(state.day - 1) % scenes.length];
}

function addReward(coins, xp) {
  state.coins += coins;
  state.xp += xp;

  while (state.xp >= 100) {
    state.level += 1;
    state.xp -= 100;
    state.coins += 60;
    createCoinBurst('✨ LEVEL UP!');
  }
}

function applyChoice(i) {
  const scene = currentScene();
  const choice = scene.choices[i];

  Object.entries(choice.effect).forEach(([k, v]) => {
    state.stats[k] = clamp((state.stats[k] || 50) + v);
  });

  const earnedCoins = Math.floor(Math.random() * 20) + 18;
  const earnedXp = Math.floor(Math.random() * 15) + 12;

  addReward(earnedCoins, earnedXp);
  state.energy = Math.max(0, state.energy - 8);
  state.streak += 1;

  if (choice.effect.impulse && choice.effect.impulse < 0) {
    state.questProgress.storyPositive = true;
  }

  if (choice.effect.saving && choice.effect.saving > 0) {
    state.questProgress.savingChoice = true;
  }

  if (['平衡选择', '投资学习', '复盘能力', '解决问题'].includes(choice.tag)) {
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

  state.day += 1;

  createCoinBurst(`+${earnedCoins} 🪙`);
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
  const txt = $('reflectionInput').value.trim();

  if (!txt) {
    alert('先写下你的想法，再提交哦。');
    return;
  }

  if (txt.length < 20) {
    alert('反思太短了，至少写 20 个字，才算真正有思考。');
    return;
  }

  state.questProgress.reflection = true;

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

  $('reflectionInput').value = '';

  createCoinBurst('+25 🪙');
  showToast('反思完成，成长值提升 🧠');

  save();
  render();
}

function canClaimQuest(quest) {
  return !!state.questProgress[quest.type];
}

function completeQuest(id, reward) {
  const quest = dailyQuests.find(q => q.id === id);

  if (!quest) return;
  if (state.completedQuests.includes(id)) return;

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
  if (state.npcEventDone) {
    alert('今天的 NPC 事件已经完成了，不能重复刷奖励。');
    return;
  }

  const gain = Math.floor(Math.random() * 10) + 5;

  addReward(gain, 8);
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

  createCoinBurst(`+${gain} 🪙`);
  save();
  render();
}

function saveSettings() {
  state.childName = $('childName').value || '孩子';
  state.childAge = parseInt($('childAge').value, 10) || 12;
  state.theme = $('theme').value;

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

  save();
  render();
}
