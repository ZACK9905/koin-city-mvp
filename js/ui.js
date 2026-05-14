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

  if (old) {
    old.remove();
  }

  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = text;

  document.body.appendChild(div);

  setTimeout(() => div.remove(), 2200);
}

function setupMapDrag() {
  const wrap = $('mapWrap');
  const map = $('worldMap');

  if (!wrap || mapDrag.ready) {
    return;
  }

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

function openZone(type) {
  const locked = (type === 'business' && state.level < 3) || (type === 'future' && state.level < 6);

  if (locked) {
    $('zoneContent').innerHTML = '🔒 这个区域还没解锁。继续完成任务、升级和探索吧！';
    return;
  }

  const content = {
    home: `<b>🏠 我的家</b><br><br>这里是你的成长基地。你可以升级房间、查看宠物和摆放家具。
      <div class="action-row"><button class="btn green" data-switch="city">查看房间</button><button class="btn secondary" data-switch="quests">去赚金币</button></div>`,
    shop: `<b>🏪 商店区</b><br><br>这里可以买家具、宠物和房间升级。金币不够就先去完成任务。
      <div class="action-row"><button class="btn green" data-scroll-shop="1">打开奖励商店</button><button class="btn secondary" data-switch="quests">去做任务</button></div>`,
    school: `<b>🏫 学校</b><br><br>这里会出现学习、人际关系与选择事件。每天只能完成一个主要人生事件。
      <div class="action-row"><button class="btn" data-switch="story">开始人生事件</button><button class="btn secondary" data-switch="mentor">找 AI 导师</button></div>`,
    business: `<b>🏢 创业中心</b><br><br>你已经解锁创业系统！你可以开始接受赚钱挑战，学习经营自己的小事业。
      <div class="action-row"><button class="btn" data-switch="story">创业挑战</button></div>`,
    future: `<b>🚀 未来都市</b><br><br>这里是高等级区域。继续成长后，你会遇到更大的机会和更难的人生选择。
      <div class="action-row"><button class="btn" data-switch="parent">查看成长报告</button></div>`
  };

  $('zoneContent').innerHTML = content[type];
}

function triggerRandomEvent() {
  if (document.querySelector('.floating-event')) {
    return;
  }

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
    if (div.parentElement) {
      div.remove();
    }
  }, 12000);
}

function statLine(k, label) {
  const now = state.stats[k];
  const diff = now - 50;

  return `<div style="margin-bottom:12px"><div style="font-weight:900">${label} ${diff >= 0 ? '+' : ''}${diff}%</div><div class="bar"><div class="fill" style="width:${now}%"></div></div></div>`;
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
  $('sceneText').innerHTML = `✅ 今天的人生事件已经完成。<br><br>明天回来会解锁新的选择。你现在可以去完成反思、查看任务或升级 Koin City。`;

  $('choices').innerHTML = `
    <button class="choice" data-switch="mentor">
      <strong>🤖 去完成今日反思</strong>
      <small>复盘今天的选择，获得成长值。</small>
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

  $('petEmoji').textContent = petMap[Math.min(state.petStage, 3)];
  $('petView').textContent = petMap[Math.min(state.petStage, 3)];
  $('mainHouse').textContent = houseMap[Math.min(state.houseLevel, 3)];
  $('houseView').textContent = houseMap[Math.min(state.houseLevel, 3)];

  $('petDesc').textContent = state.petStage ? '你的宠物正在陪你成长。' : '购买宠物伙伴后，它会陪你一起成长。';

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

  $('lifeSummary').innerHTML = `${state.childName} 现在来到第 <b>${state.day}</b> 天。系统记录了 <b>${state.history.length}</b> 次人生选择。${hasDoneLifeEventToday() ? '今天的主要事件已经完成。' : '今天还有一个主要事件可以完成。'}`;

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

  const roomItems = state.inventory.filter(x => x !== 'house' && x !== 'pet').slice(0, 8);

  $('roomGrid').innerHTML = Array.from({ length: 8 }, (_, i) => {
    const item = shopItems.find(s => s.type === roomItems[i]);
    return `<div class="room-cell">${item ? item.emoji : ''}</div>`;
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

  $('growthReport').innerHTML = statLine('discipline', '自律') + statLine('saving', '储蓄稳定') + statLine('judgment', '判断力') + statLine('resilience', '抗挫力');

  $('parentAdvice').innerHTML = `<p>建议本周不要只看结果，可以多问：“你为什么这样选？”</p><p style="margin-top:8px">目前系统观察到：<b>${traits.join('、')}</b>。可以给玩家一个小任务：每天做一个选择前，先说出“我这样做的后果是什么”。</p>`;

  $('shareSummary').innerHTML = `${state.childName} 本月完成了 ${state.history.length} 次人生选择练习。自律 ${state.stats.discipline - 50 >= 0 ? '+' : ''}${state.stats.discipline - 50}%，储蓄稳定 ${state.stats.saving - 50 >= 0 ? '+' : ''}${state.stats.saving - 50}%，冲动消费倾向 ${state.stats.impulse - 50 >= 0 ? '+' : ''}${state.stats.impulse - 50}%。这不是成绩单，而是孩子真实的成长轨迹。`;

  $('childName').value = state.childName;
  $('childAge').value = state.childAge;
  $('theme').value = state.theme;
}
