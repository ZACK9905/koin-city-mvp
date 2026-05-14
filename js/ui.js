function $(id) {
  return document.getElementById(id);
}

function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  $('page-' + page).classList.add('active');

  document.querySelectorAll('#mainNav button').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });

  render();
}

function createCoinBurst(text) {
  const div = document.createElement('div');
  div.className = 'coin-pop';
  div.textContent = text;
  div.style.left = window.innerWidth / 2 - 55 + 'px';
  div.style.top = '55%';

  document.body.appendChild(div);

  setTimeout(() => div.remove(), 900);
}

function showToast(text) {
  const old = document.querySelector('.toast');

  if (old) old.remove();

  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = text;

  document.body.appendChild(div);

  setTimeout(() => div.remove(), 2200);
}

function setupMapDrag() {
  const wrap = $('mapWrap');
  const map = $('worldMap');

  if (!wrap || mapDrag.ready) return;

  mapDrag.ready = true;

  wrap.addEventListener('mousedown', e => {
    mapDrag.dragging = true;
    mapDrag.startX = e.clientX - mapDrag.x;
    mapDrag.startY = e.clientY - mapDrag.y;
  });

  window.addEventListener('mouseup', () => {
    mapDrag.dragging = false;
  });

  window.addEventListener('mousemove', e => {
    if (!mapDrag.dragging) return;

    mapDrag.x = e.clientX - mapDrag.startX;
    mapDrag.y = e.clientY - mapDrag.startY;

    map.style.transform = `translate(${mapDrag.x}px,${mapDrag.y}px)`;
  });
}


function statLabel(key) {
  const labels = {
    discipline:'自律', saving:'储蓄', judgment:'判断力', resilience:'抗挫力', impulse:'冲动', confidence:'自信', goal:'目标感',
    knowledge:'知识', creativity:'创意', fitness:'活力', social:'沟通', business:'商业', emotion:'情绪'
  };
  return labels[key] || key;
}

function renderLocationButtons(keys) {
  return `<div class="action-row">${keys.map(key => {
    const t = locationTasks[key];
    return `<button class="btn ${key === 'park' ? 'green' : ''}" data-location-task="${key}">
      ${t.emoji} ${t.name}
      <small style="display:block;font-size:10px;opacity:.8;margin-top:2px">-${t.energyCost || 0}⚡ · +${t.xp}XP</small>
    </button>`;
  }).join('')}</div>`;
}

function renderCareerPreview() {
  return `<div style="display:grid;gap:10px;margin-top:12px">${careerPaths.map(job => {
    const progress = getCareerProgress(job);
    const missingText = progress.unlocked ? '✅ 已达到条件' : progress.missing.map(m => `${statLabel(m.stat)} 还差 ${m.need}`).join(' · ');
    return `<div style="background:#fff;border-radius:14px;padding:12px;border:1px solid rgba(124,92,252,.14)">
      <strong>${job.emoji} ${job.name}</strong>
      <p class="muted" style="margin-top:4px">${job.benefit}</p>
      <div class="lock-note" style="margin-top:8px">${missingText}</div>
    </div>`;
  }).join('')}</div>`;
}

function openZone(type) {
  const locked = (type === 'business' && state.level < 3) || (type === 'future' && state.level < 6);

  if (locked) {
    $('zoneContent').innerHTML = '🔒 这个区域还没解锁。继续完成任务、升级和探索吧！';
    return;
  }

  const remaining = Math.max(0, 2 - (state.dailyLocationActions || 0));

  const content = {
    home: `<b>🏠 我的家</b><br><br>这里是你的成长基地。你可以升级房间、查看宠物和摆放家具。
      <div class="lock-note">今日地点成长次数剩余：${remaining}/2</div>
      ${renderLocationButtons(['park'])}
      <div class="action-row"><button class="btn green" data-switch="city">查看房间</button><button class="btn secondary" data-switch="quests">去赚金币</button></div>`,

    shop: `<b>🏪 商店区</b><br><br>这里可以买家具、宠物和房间升级。金币不够就先去完成任务。
      <div class="action-row"><button class="btn green" data-scroll-shop="1">打开奖励商店</button><button class="btn secondary" data-switch="quests">去做任务</button></div>`,

    school: `<b>🏫 成长学院</b><br><br>这里不只是学校。你可以去不同地点训练不同能力。今天还剩 <b>${remaining}/2</b> 次地点成长。
      ${renderLocationButtons(['school','library','gym','studio','social'])}`,

    business: `<b>🏢 创业中心</b><br><br>你已经解锁创业系统！这里可以训练商业能力，也可以查看未来职业路线。
      <div class="lock-note">今日地点成长次数剩余：${remaining}/2</div>
      ${renderLocationButtons(['business'])}
      <h3 style="margin-top:16px">🚀 职业解锁预览</h3>
      ${renderCareerPreview()}`,

    future: `<b>🚀 未来都市</b><br><br>这里是高等级区域。继续成长后，你会遇到更大的机会和更难的人生选择。
      <div class="action-row"><button class="btn" data-switch="parent">查看成长报告</button></div>
      <h3 style="margin-top:16px">职业路线</h3>
      ${renderCareerPreview()}`
  };

  $('zoneContent').innerHTML = content[type];
}

function triggerRandomEvent() {
  if (document.querySelector('.floating-event')) return;

  const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  const div = document.createElement('div');

  div.className = 'floating-event';
  div.innerHTML = `<h3>${event.title}</h3><p class="muted">${event.desc}</p><button class="btn" id="claimEventBtn">领取奖励</button>`;

  document.body.appendChild(div);

  div.querySelector('#claimEventBtn').onclick = () => {
    addReward(event.reward, 12);
    createCoinBurst(`+${event.reward} 🪙`);
    div.remove();
    save();
    render();
  };

  setTimeout(() => {
    if (div.parentElement) div.remove();
  }, 12000);
}

function statLine(k, label) {
  const now = state.stats[k] || 0;
  const baseline = ['knowledge','creativity','fitness','social','business','emotion'].includes(k) ? 0 : 50;
  const diff = now - baseline;

  return `<div style="margin-bottom:12px"><div style="font-weight:900">${label} ${diff >= 0 ? '+' : ''}${diff}%</div><div class="bar"><div class="fill" style="width:${Math.max(0, now)}%"></div></div></div>`;
}

function renderTutorialStyles() {
  if (document.getElementById('koinTutorialStyles')) return;

  const style = document.createElement('style');
  style.id = 'koinTutorialStyles';
  style.textContent = `
    .koin-tutorial-overlay{
      position:fixed;inset:0;background:rgba(26,16,52,.55);backdrop-filter:blur(8px);z-index:3000;
      display:flex;align-items:center;justify-content:center;padding:22px;
    }
    .koin-tutorial-card{
      max-width:420px;width:100%;background:linear-gradient(160deg,#fff,#fff7ed);border-radius:28px;
      padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.25);border:2px solid rgba(255,255,255,.7);
      animation:koinPop .25s ease;
    }
    .koin-tutorial-card h2{font-size:22px;margin-bottom:10px}
    .koin-tutorial-card p{line-height:1.7;color:#5f5578;margin-bottom:14px}
    .koin-tutorial-koin{font-size:54px;margin-bottom:8px}
    .koin-tutorial-progress{height:8px;background:#eee7ff;border-radius:999px;overflow:hidden;margin:16px 0}
    .koin-tutorial-progress span{display:block;height:100%;background:linear-gradient(90deg,#ff8c42,#ff5c6e,#7c5cfc);border-radius:999px}
    .koin-tutorial-mini{
      position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:2600;
      width:min(440px,calc(100vw - 24px));background:#fff;border-radius:20px;padding:14px 16px;
      box-shadow:0 12px 40px rgba(0,0,0,.18);border:2px solid #ffe0b8;
      display:flex;gap:10px;align-items:center;
    }
    .koin-tutorial-mini strong{display:block;font-size:14px}
    .koin-tutorial-mini span{font-size:12px;color:#756e83}
    @keyframes koinPop{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
  `;
  document.head.appendChild(style);
}

function tutorialStepContent() {
  const step = state.tutorial.step;

  const content = [
    {
      title: '欢迎来到 Koin City 🌱',
      body: '这里不是考试游戏。这里是你的未来人生模拟器。每一次选择，都会影响你的金钱观、判断力、自律、人际关系和未来机会。',
      button: '开始我的人生模拟'
    },
    {
      title: '你的第一笔成长基金 🎁',
      body: '每个人的人生都需要第一笔资源。Koin 会给你 RM500 起始成长基金，还有一张普通书桌，帮助你开始经营自己的世界。',
      button: '领取 RM500 起始基金'
    },
    {
      title: '第一步：完成人生事件 🎮',
      body: '现在去完成人生事件。选择没有标准答案，但每个选择都会影响你的成长数据。',
      button: '带我去人生事件'
    },
    {
      title: '第二步：领取任务奖励 📜',
      body: '你刚刚已经完成了一个行动。现在去每日任务，领取你第一次靠选择赚到的奖励。',
      button: '带我去任务页'
    },
    {
      title: '第三步：买第一个家具 🛋️',
      body: '金钱不是只拿来看数字。你可以用金币买家具，让房间成长，也让未来获得更多加成。',
      button: '带我去商店'
    },
    {
      title: '第四步：查看成长报告 👨‍👩‍👧',
      body: 'Koin 不只记录金币，也记录你的判断力、自律和抗挫力。现在看看你的第一份成长报告。',
      button: '带我看成长报告'
    },
    {
      title: '第五步：领取宠物蛋 🥚',
      body: '你完成了第一轮成长。Koin 送你一颗普通宠物蛋。未来它会随着你的成长慢慢孵化。',
      button: '领取宠物蛋'
    },
    {
      title: '新手引导完成 🌟',
      body: '很好！你已经学会 Koin City 的基础循环：选择、成长、赚金币、买东西、照顾宠物、看见自己的进步。',
      button: '进入 Koin City'
    }
  ];

  return content[Math.min(step, content.length - 1)];
}

function renderTutorialOverlay() {
  renderTutorialStyles();

  document.querySelectorAll('.koin-tutorial-overlay,.koin-tutorial-mini').forEach(el => el.remove());

  if (!state.tutorial || state.tutorial.completed) return;

  if (state.tutorial.awaiting) {
    const mini = document.createElement('div');
    mini.className = 'koin-tutorial-mini';

    const copy = {
      lifeEvent: ['🎮', '完成一个人生事件', '选择一个答案后，Koin 会继续下一步。'],
      quest: ['📜', '领取一个任务奖励', '领取成功后，Koin 会继续下一步。'],
      shop: ['🛋️', '购买一个家具', '买到第一个物品后，Koin 会继续下一步。']
    }[state.tutorial.awaiting];

    mini.innerHTML = `<div style="font-size:28px">${copy[0]}</div><div><strong>${copy[1]}</strong><span>${copy[2]}</span></div>`;
    document.body.appendChild(mini);
    return;
  }

  const data = tutorialStepContent();
  const total = 7;
  const progress = Math.min(100, (state.tutorial.step / total) * 100);

  const overlay = document.createElement('div');
  overlay.className = 'koin-tutorial-overlay';

  overlay.innerHTML = `
    <div class="koin-tutorial-card">
      <div class="koin-tutorial-koin">🌱</div>
      <h2>${data.title}</h2>
      <p>${data.body}</p>
      <div class="koin-tutorial-progress"><span style="width:${progress}%"></span></div>
      <button class="btn green" style="width:100%;margin-top:8px" data-tutorial-action="primary">${data.button}</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function getNextAction() {
  if (state.history.length === 0) {
    return {
      title: '先完成第一个人生事件',
      text: '去「人生事件」做一个选择，看看你的城市会怎样改变。',
      buttons: [['开始事件', 'story', 'btn']]
    };
  }

  if (!hasDoneLifeEventToday()) {
    return {
      title: '今天还有一个人生事件',
      text: '每天完成一个主要事件，Koin City 会慢慢成长。',
      buttons: [['开始今日事件', 'story', 'btn']]
    };
  }

  if ((state.dailyLocationActions || 0) < 2) {
    return {
      title: '去地点训练能力',
      text: '今天还可以去学校、图书馆、健身房等地点成长。',
      buttons: [['打开城市地图', 'city', 'btn green']]
    };
  }

  if (!state.questProgress.reflection && !hasDoneReflectionToday()) {
    return {
      title: '完成一次 AI 反思',
      text: '写下至少 20 个字，训练表达与复盘能力。',
      buttons: [['去找导师', 'mentor', 'btn green']]
    };
  }

  if (state.completedQuests.length < dailyQuests.length) {
    return {
      title: '看看今日任务奖励',
      text: '你可能已经完成部分条件，可以去任务页领取奖励。',
      buttons: [['查看任务', 'quests', 'btn']]
    };
  }

  if (state.inventory.length === 0) {
    return {
      title: '去商店买第一个物品',
      text: '用金币买一个家具或宠物，让 Koin City 有成长感。',
      buttons: [['打开城市', 'city', 'btn green']]
    };
  }

  return {
    title: '今天的主要成长完成了',
    text: '明天回来会有新的事件、任务和关系选择。',
    buttons: [['探索地图', 'city', 'btn'], ['查看报告', 'parent', 'btn secondary']]
  };
}

function renderNextAction() {
  const a = getNextAction();

  $('nextActionTitle').textContent = a.title;
  $('nextActionText').textContent = a.text;

  $('nextActionButtons').innerHTML = a.buttons
    .map(b => `<button class="${b[2]}" data-switch="${b[1]}">${b[0]}</button>`)
    .join('');
}

function renderDailyEventLock(scene) {
  const locked = hasDoneLifeEventToday();

  if (!locked) {
    $('sceneTitle').textContent = `Day ${state.day} · ${scene.title}`;
    $('sceneText').textContent = scene.text;
    $('choices').innerHTML = scene.choices
      .map((c, i) => `<button class="choice" data-choice="${i}"><div class="reward">+ XP + 金币</div><strong>${c.label}</strong><small>${c.desc}</small></button>`)
      .join('');
    return;
  }

  $('sceneTitle').textContent = `Day ${state.day - 1} 已完成`;
  $('sceneText').innerHTML = `✅ 今天的人生事件已经完成。<br><br>明天回来会解锁新的选择。你现在可以去地点训练、完成反思、查看任务或升级 Koin City。`;

  $('choices').innerHTML = `
    <button class="choice" data-switch="city">
      <strong>🏫 去地点训练能力</strong>
      <small>学校、图书馆、健身房、创作室都会提升不同能力。</small>
    </button>
    <button class="choice" data-switch="quests">
      <strong>📜 查看今日任务</strong>
      <small>领取已经达成的任务奖励。</small>
    </button>
    <button class="choice" data-switch="city">
      <strong>🏙️ 回到 Koin City</strong>
      <small>用金币升级你的城市。</small>
    </button>
  `;
}


function renderCareerSummary() {
  const unlocked = careerPaths.filter(job => getCareerProgress(job).unlocked);
  if (unlocked.length) {
    return `已解锁职业方向：${unlocked.map(j => `${j.emoji}${j.name}`).join('、')}`;
  }
  const closest = careerPaths.map(job => {
    const progress = getCareerProgress(job);
    const totalNeed = progress.missing.reduce((sum, m) => sum + m.need, 0);
    return { job, totalNeed, progress };
  }).sort((a,b) => a.totalNeed - b.totalNeed)[0];
  return `最接近的职业方向：${closest.job.emoji} ${closest.job.name}。还需要：${closest.progress.missing.map(m => `${statLabel(m.stat)}+${m.need}`).join('、')}`;
}

function render() {
  if (typeof dailySync === 'function') {
    dailySync();
  }

  setupMapDrag();
  renderNextAction();

  $('coinCount').textContent = state.coins;
  $('levelCount').textContent = state.level;
  $('streakCount').textContent = state.streak;
  $('energyCount').textContent = state.energy;
  $('levelText').textContent = state.level;
  $('xpFill').style.width = state.xp + '%';

  const heroDay = $('heroDay');
  if (heroDay) heroDay.textContent = state.day;

  const miniMap = {
    discipline: $('m-discipline-mini'),
    saving: $('m-saving-mini'),
    judgment: $('m-judgment-mini'),
    resilience: $('m-resilience-mini')
  };

  Object.entries(miniMap).forEach(([k, el]) => {
    if (el) el.textContent = state.stats[k];
  });

  const petMap = ['🥚', '🐹', '🐼', '🐲'];
  const houseMap = ['🏚️', '🏠', '🏡', '🏰'];

  const petEmoji = state.pet && state.pet.eggOwned && state.pet.stage === 'egg' ? '🥚' : petMap[Math.min(state.petStage, 3)];

  $('petEmoji').textContent = petEmoji;
  $('petView').textContent = petEmoji;
  $('mainHouse').textContent = houseMap[Math.min(state.houseLevel, 3)];
  $('houseView').textContent = houseMap[Math.min(state.houseLevel, 3)];

  $('petDesc').textContent = state.pet && state.pet.eggOwned
    ? '你的宠物蛋正在等待孵化。每天回来照顾它吧。'
    : state.petStage ? '你的宠物正在陪你成长。' : '购买宠物伙伴后，它会陪你一起成长。';

  const houseDesc = [
    '继续成长来升级你的房间。',
    '你的房间开始变温暖了。',
    '你的世界越来越漂亮。',
    '你已经拥有梦想中的成长空间！'
  ];

  $('houseDesc').textContent = houseDesc[Math.min(state.houseLevel, 3)];
  $('weatherBox').textContent = weatherTypes[state.day % weatherTypes.length];

  $('bizZone').classList.toggle('locked', state.level < 3);
  $('bizZone').classList.toggle('active', state.level >= 3);
  $('futureZone').classList.toggle('locked', state.level < 6);
  $('futureZone').classList.toggle('active', state.level >= 6);

  ['discipline', 'saving', 'judgment', 'resilience'].forEach(k => {
    $('m-' + k).textContent = state.stats[k] + '%';
    $('b-' + k).style.width = state.stats[k] + '%';
  });

  const traits = analyzeTraits();

  $('personalityTags').innerHTML = traits
    .map(x => `<span class="tag ${x.includes('提升') || x.includes('稳定') ? 'green' : x.includes('冲动') || x.includes('失败') ? 'red' : 'purple'}">${x}</span>`)
    .join('');

  $('personalityText').textContent = `Koin 会根据 ${state.childName} 的选择，调整任务和导师提问。现在最值得训练的是：${traits[0]}。`;

  $('lifeSummary').innerHTML = `${state.childName} 现在来到第 <b>${state.day}</b> 天。系统记录了 <b>${state.history.length}</b> 次人生选择。${hasDoneLifeEventToday() ? '今天的主要事件已经完成。' : '今天还有一个主要事件可以完成。'}<br><br><b>职业方向：</b>${renderCareerSummary()}<br><b>今日地点成长：</b>${state.dailyLocationActions || 0}/2`;

  $('welcomeTitle').textContent = `欢迎回来，${state.childName}！`;

  const scene = currentScene();
  renderDailyEventLock(scene);

  $('timeline').innerHTML = state.history.length
    ? state.history.map(h => `<div class="event"><b>Day ${h.day} · ${h.title}</b><p class="muted">选择：${h.choice}</p><p>${h.result}</p><div style="margin-top:8px"><span class="tag">${h.tag}</span><span class="tag green">${h.reward}</span></div></div>`).join('')
    : '<p class="muted">还没有人生记录，先完成一个人生事件吧。</p>';

  $('questList').innerHTML = dailyQuests.map(q => {
    const done = state.completedQuests.includes(q.id);
    const ready = canClaimQuest(q);

    return `<div class="quest-card ${done ? 'done' : ''} ${ready && !done ? 'ready' : ''}">
      <div class="quest-badge">+${q.reward} 🪙</div>
      <div style="font-size:42px">${q.emoji}</div>
      <h3 style="margin:8px 0">${q.title}</h3>
      <p class="muted">${q.requirement}</p>
      <div class="lock-note">${done ? '✅ 今日已领取' : ready ? '🎁 已达成，可以领取' : '🔒 条件未完成'}</div>
      <button class="btn" style="margin-top:12px;width:100%" ${done ? 'disabled' : ''} data-quest="${q.id}" data-reward="${q.reward}">
        ${done ? '✅ 已完成' : ready ? '领取奖励' : '查看条件'}
      </button>
    </div>`;
  }).join('');

  const questDoneCount = $('questDoneCount');
  const questTotalCount = $('questTotalCount');
  const questStreakNum = $('questStreakNum');
  const questRingFill = $('questRingFill');

  if (questDoneCount) questDoneCount.textContent = state.completedQuests.length;
  if (questTotalCount) questTotalCount.textContent = dailyQuests.length;
  if (questStreakNum) questStreakNum.textContent = state.streak;

  if (questRingFill) {
    const circumference = 163.4;
    const progress = state.completedQuests.length / dailyQuests.length;
    questRingFill.style.strokeDashoffset = circumference - circumference * progress;
  }

  $('shopList').innerHTML = shopItems
    .map(item => `<div class="shop-item"><div class="emoji">${item.emoji}</div><strong>${item.name}</strong><p class="muted">${item.desc}</p><button class="btn green" data-buy="${item.type}" data-cost="${item.cost}">${item.cost} 金币购买</button></div>`)
    .join('');

  const specialItemMap = {
    starterDesk: '📚',
    starterBadge: '🌟'
  };

  const roomItems = state.inventory.filter(x => x !== 'house' && x !== 'pet').slice(0, 8);

  $('roomGrid').innerHTML = Array.from({ length: 8 }, (_, i) => {
    const item = shopItems.find(s => s.type === roomItems[i]);
    const emoji = item ? item.emoji : specialItemMap[roomItems[i]] || '';
    return `<div class="room-cell">${emoji}</div>`;
  }).join('');

  $('npcList').innerHTML = npcList
    .map(n => `<div class="npc-card"><div class="npc-face">${n.emoji}</div><strong>${n.name}</strong><p class="muted">${n.desc}</p><div class="heartbar"><div class="heartfill" style="width:${state.npcHearts[n.key]}%"></div></div></div>`)
    .join('');

  $('npcEvent').innerHTML = hasDoneNpcToday()
    ? '✅ 今天的 NPC 事件已经完成。你已经做出选择，明天会有新的关系事件。'
    : '今天，好朋友希望你帮他一起完成一个挑战，但你其实已经很累了。你会怎么回应？';

  $('npcCooldownText').textContent = hasDoneNpcToday() ? '今日已完成，不能重复刷奖励。' : '';

  const totalBond = Object.values(state.npcHearts).reduce((sum, v) => sum + v, 0);
  const totalBondScore = $('totalBondScore');
  const totalBondFill = $('totalBondFill');

  if (totalBondScore) totalBondScore.textContent = totalBond;
  if (totalBondFill) totalBondFill.style.width = Math.min(100, totalBond / 4) + '%';

  $('mentorQuestion').textContent = mentorQuestion();

  $('reflections').innerHTML = state.reflections.length
    ? state.reflections.map(r => `<div class="event"><b>${r.date}</b><p class="muted">${r.question}</p><p>${r.text}</p></div>`).join('')
    : '<p class="muted">还没有反思记录。</p>';

  $('growthReport').innerHTML =
    statLine('discipline', '自律') +
    statLine('saving', '储蓄稳定') +
    statLine('judgment', '判断力') +
    statLine('resilience', '抗挫力') +
    statLine('knowledge', '知识') +
    statLine('social', '沟通');

  $('parentAdvice').innerHTML = `<p>建议本周不要只看结果，可以多问：“你为什么这样选？”</p><p style="margin-top:8px">目前系统观察到：<b>${traits.join('、')}</b>。</p><p style="margin-top:8px"><b>职业方向：</b>${renderCareerSummary()}</p><p style="margin-top:8px">可以鼓励孩子明天选择一个地点训练，例如学校提升知识、健身房提升活力、社交区提升沟通。</p>`;

  $('shareSummary').innerHTML = `${state.childName} 本月完成了 ${state.history.length} 次人生选择练习。自律 ${state.stats.discipline - 50 >= 0 ? '+' : ''}${state.stats.discipline - 50}，知识 ${state.stats.knowledge}，创意 ${state.stats.creativity}，沟通 ${state.stats.social}。这不是成绩单，而是孩子真实的成长轨迹。`;

  $('childName').value = state.childName;
  $('childAge').value = state.childAge;
  $('theme').value = state.theme;

  renderTutorialOverlay();
}
