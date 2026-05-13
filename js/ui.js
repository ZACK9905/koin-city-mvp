function $(id) {
  return document.getElementById(id);
}

/* ─── PAGE SWITCHING ─────────────────────────── */
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $('page-' + page).classList.add('active');
  document.querySelectorAll('#mainNav button').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  render();
}

/* ─── COIN BURST ─────────────────────────────── */
function createCoinBurst(text) {
  const div = document.createElement('div');
  div.className = 'coin-pop';
  div.textContent = text;
  div.style.left = window.innerWidth / 2 - 55 + 'px';
  div.style.top = '55%';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 900);
}

/* ─── TOAST ──────────────────────────────────── */
function showToast(text) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = text;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2200);
}

/* ─── MAP DRAG ───────────────────────────────── */
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
  window.addEventListener('mouseup', () => { mapDrag.dragging = false; });
  window.addEventListener('mousemove', e => {
    if (!mapDrag.dragging) return;
    mapDrag.x = e.clientX - mapDrag.startX;
    mapDrag.y = e.clientY - mapDrag.startY;
    map.style.transform = `translate(${mapDrag.x}px,${mapDrag.y}px)`;
  });

  // Touch drag
  wrap.addEventListener('touchstart', e => {
    mapDrag.dragging = true;
    mapDrag.startX = e.touches[0].clientX - mapDrag.x;
    mapDrag.startY = e.touches[0].clientY - mapDrag.y;
  }, { passive: true });
  wrap.addEventListener('touchend', () => { mapDrag.dragging = false; });
  wrap.addEventListener('touchmove', e => {
    if (!mapDrag.dragging) return;
    mapDrag.x = e.touches[0].clientX - mapDrag.startX;
    mapDrag.y = e.touches[0].clientY - mapDrag.startY;
    map.style.transform = `translate(${mapDrag.x}px,${mapDrag.y}px)`;
  }, { passive: true });
}

/* ─── ZONE INFO ──────────────────────────────── */
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
    school: `<b>🏫 学校</b><br><br>这里会触发学习、人际关系与选择事件。每次选择都会改变孩子的成长数据。
      <div class="action-row"><button class="btn" data-switch="story">开始人生事件</button><button class="btn secondary" data-switch="mentor">找 AI 导师</button></div>`,
    business: `<b>🏢 创业中心</b><br><br>你已经解锁创业系统！你可以开始接受赚钱挑战，学习经营自己的小事业。
      <div class="action-row"><button class="btn" data-switch="story">创业挑战</button></div>`,
    future: `<b>🚀 未来都市</b><br><br>这里是高等级区域。未来会开放 AI 公司、投资系统与大型人生选择。
      <div class="action-row"><button class="btn" data-switch="parent">查看成长报告</button></div>`
  };
  $('zoneContent').innerHTML = content[type];
}

/* ─── RANDOM EVENT POPUP ─────────────────────── */
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
  setTimeout(() => { if (div.parentElement) div.remove(); }, 12000);
}

/* ─── STAT LINE (parent report) ─────────────── */
function statLine(k, label) {
  const now = state.stats[k];
  const diff = now - 50;
  return `<div style="margin-bottom:12px"><div style="font-weight:900">${label} ${diff >= 0 ? '+' : ''}${diff}%</div><div class="bar"><div class="fill" style="width:${now}%"></div></div></div>`;
}

/* ─── NEXT ACTION HINT ───────────────────────── */
function getNextAction() {
  if (state.history.length === 0) return {
    title: '先完成第一个人生事件',
    text: '去「人生事件」做一个选择，看看你的城市会怎样改变。',
    buttons: [['开始事件', 'story', 'btn']]
  };
  if (!state.questProgress.reflection) return {
    title: '完成一次 AI 反思',
    text: '写下至少 20 个字，训练孩子表达与复盘能力。',
    buttons: [['去找导师', 'mentor', 'btn green']]
  };
  if (state.completedQuests.length < 2) return {
    title: '领取每日任务奖励',
    text: '你已经完成部分条件，可以去任务页看看哪些奖励可领取。',
    buttons: [['查看任务', 'quests', 'btn']]
  };
  if (state.inventory.length === 0) return {
    title: '去商店买第一个物品',
    text: '用金币买一个家具或宠物，让 Koin City 有成长感。',
    buttons: [['打开城市', 'city', 'btn green']]
  };
  return {
    title: '继续升级你的 Koin City',
    text: '完成更多事件，解锁创业中心和未来都市。',
    buttons: [['探索地图', 'city', 'btn'], ['做新事件', 'story', 'btn secondary']]
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

/* ─── QUEST PROGRESS RING ────────────────────── */
function renderQuestProgressRing(done, total) {
  const fill = $('questRingFill');
  const circumference = 2 * Math.PI * 26; // r=26 → ~163.4
  const offset = circumference - (done / total) * circumference;
  if (fill) fill.style.strokeDashoffset = offset;
  if ($('questDoneCount')) $('questDoneCount').textContent = done;
  if ($('questTotalCount')) $('questTotalCount').textContent = total;
  if ($('questStreakNum')) $('questStreakNum').textContent = state.streak;
}

/* ─── RENDER QUEST CARDS ─────────────────────── */
function renderQuestList() {
  const el = $('questList');
  if (!el) return;

  const done  = state.completedQuests.length;
  const total = dailyQuests.length;
  renderQuestProgressRing(done, total);

  el.innerHTML = dailyQuests.map(q => {
    const isDone  = state.completedQuests.includes(q.id);
    const isReady = !isDone && canClaimQuest(q);
    const stateClass = isDone ? 'done' : isReady ? 'ready' : '';

    const statusIcon  = isDone ? '✅' : isReady ? '🎁' : '🔒';
    const statusLabel = isDone ? '已领取' : isReady ? '可以领取！' : '条件未完成';
    const statusClass = isDone ? 'done' : isReady ? 'ready' : 'locked';

    const ctaLabel = isDone ? '✅ 已完成' : isReady ? '🎁 领取奖励' : '查看条件';
    const ctaClass = isDone ? 'done-cta' : isReady ? 'ready-cta' : 'locked-cta';

    const progressPct = isDone ? 100 : isReady ? 75 : 20;

    return `
    <div class="quest-card ${stateClass}" id="qcard-${q.id}">
      <div class="quest-inner">
        <div class="quest-icon-wrap">
          <span style="font-size:26px">${q.emoji}</span>
          ${isDone ? '<div class="quest-done-badge">✓</div>' : ''}
        </div>
        <div class="quest-text">
          <div class="quest-title">${q.title}</div>
          <div class="quest-req">${q.requirement}</div>
          <div class="quest-mini-bar">
            <div class="quest-mini-fill" style="width:${progressPct}%"></div>
          </div>
        </div>
        <div class="quest-reward-pill">
          <span class="coins">+${q.reward}</span>
          <span class="label">🪙 金币</span>
        </div>
      </div>
      <div class="quest-footer">
        <div class="quest-status ${statusClass}">${statusIcon} ${statusLabel}</div>
        <button class="quest-cta ${ctaClass}" ${isDone ? 'disabled' : ''}
          data-quest="${q.id}" data-reward="${q.reward}">
          ${ctaLabel}
        </button>
      </div>
      <div class="quest-burst" id="qburst-${q.id}">
        <div class="quest-burst-text">+${q.reward} 🪙 领取！</div>
      </div>
    </div>`;
  }).join('');
}

/* Quest card reward burst animation */
function triggerQuestBurst(id) {
  const burst = $('qburst-' + id);
  if (!burst) return;
  burst.classList.add('pop');
  setTimeout(() => burst.classList.remove('pop'), 700);
}

/* ─── NPC RELATIONSHIP HELPERS ───────────────── */
function getNpcRelTag(hearts) {
  if (hearts >= 80) return { cls: 'trusted', label: '💚 挚友' };
  if (hearts >= 60) return { cls: 'close',   label: '💛 亲近' };
  if (hearts >= 40) return { cls: 'warm',    label: '🧡 熟识' };
  return { cls: 'cold', label: '🩶 认识中' };
}

function getNpcHeartsHtml(hearts) {
  const filled = Math.round(hearts / 20); // 0–5 hearts out of 5
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="npc-heart ${i < filled ? 'filled' : 'empty'}">♥</span>`
  ).join('');
}

function getNpcDotStatus(key) {
  if (state.npcEventDone) return 'busy';
  if (key === 'friend') return 'active';
  return 'online';
}

function getTotalBond() {
  return Object.values(state.npcHearts).reduce((a, b) => a + b, 0);
}
function getMaxBond() {
  return Object.keys(state.npcHearts).length * 100;
}

/* ─── RENDER NPC LIST ────────────────────────── */
function renderNpcList() {
  const el = $('npcList');
  if (!el) return;

  el.innerHTML = npcList.map(n => {
    const hearts = state.npcHearts[n.key];
    const rel = getNpcRelTag(hearts);
    const dot = getNpcDotStatus(n.key);
    return `
    <div class="npc-card" data-npc-key="${n.key}">
      <div class="npc-level-badge">${rel.label.split(' ')[0]}</div>
      <div class="npc-avatar-ring">
        <span class="npc-face">${n.emoji}</span>
        <div class="npc-dot ${dot}"></div>
      </div>
      <div class="npc-name">${n.name}</div>
      <div class="npc-desc-short">${n.desc}</div>
      <div class="npc-hearts">${getNpcHeartsHtml(hearts)}</div>
      <span class="npc-rel-tag ${rel.cls}" style="margin-top:2px;font-size:10px">${rel.label}</span>
    </div>`;
  }).join('');

  // Bond bar
  const total = getTotalBond();
  const max   = getMaxBond();
  const pct   = Math.round(total / max * 100);
  if ($('totalBondFill'))  $('totalBondFill').style.width = pct + '%';
  if ($('totalBondScore')) $('totalBondScore').textContent = total + ' / ' + max;
}

/* ─── RENDER NPC SCENE ───────────────────────── */
function renderNpcScene() {
  // Update scene top with the "friend" NPC (the event NPC)
  const eventNpc = npcList.find(n => n.key === 'friend') || npcList[0];
  const hearts = state.npcHearts[eventNpc.key];
  const rel = getNpcRelTag(hearts);

  if ($('npcSceneAvatar')) $('npcSceneAvatar').textContent = eventNpc.emoji;
  if ($('npcSceneName'))   $('npcSceneName').textContent   = eventNpc.name;

  const moods = ['😴 今天有点累', '😊 今天心情不错', '🌟 精力满满！', '🤔 在想事情'];
  const moodText = moods[state.day % moods.length];
  if ($('npcSceneMood')) $('npcSceneMood').textContent = moodText;

  if (state.npcEventDone) {
    $('npcEventWrap').innerHTML = `
      <div class="npc-done-bubble">
        ✅ 今天的关系事件已完成！你的选择留下了影响。明天会有新的事件。
      </div>`;
    $('npcActionArea').style.display = 'none';
    $('npcCooldownText').textContent = '今日已完成，不能重复刷奖励。';
  } else {
    $('npcEventWrap').innerHTML = `
      <div class="npc-speech" id="npcEvent">
        今天，好朋友希望你帮他一起完成一个挑战，但你其实已经很累了。你会怎么回应？
      </div>`;
    $('npcActionArea').style.display = 'grid';
    $('npcCooldownText').textContent = '';
  }
}

/* ─── NPC REACTION POPUP ─────────────────────── */
function showNpcReaction(type) {
  const reactions = {
    kind:     { emoji: '🤝', title: '帮助了对方！', sub: '关系值 +5 · 信任感提升', color: '#FF8C42' },
    boundary: { emoji: '🛡️', title: '保持了界限！', sub: '自信心 +5 · 判断力成长', color: '#7C5CFC' },
    honest:   { emoji: '💬', title: '诚实沟通！',   sub: '爸爸关系 +4 · 抗挫力 +3', color: '#06C8A8' }
  };
  const r = reactions[type] || reactions.kind;

  const overlay = document.createElement('div');
  overlay.className = 'npc-reaction-overlay';

  const box = document.createElement('div');
  box.className = 'npc-reaction';
  box.style.borderColor = r.color + '44';
  box.innerHTML = `
    <div class="big-emoji">${r.emoji}</div>
    <div class="reaction-title" style="color:${r.color}">${r.title}</div>
    <div class="reaction-sub">${r.sub}</div>`;

  document.body.appendChild(overlay);
  document.body.appendChild(box);

  setTimeout(() => {
    overlay.remove();
    box.remove();
    render();
  }, 1600);
}

/* ─── MAIN RENDER ────────────────────────────── */
function render() {
  setupMapDrag();
  renderNextAction();

  /* ── header stats ── */
  $('coinCount').textContent  = state.coins;
  $('levelCount').textContent = state.level;
  $('streakCount').textContent = state.streak;
  $('energyCount').textContent = state.energy;
  $('levelText').textContent  = state.level;
  $('xpFill').style.width     = state.xp + '%';

  // heroDay is only in home page
  const heroDay = $('heroDay');
  if (heroDay) heroDay.textContent = state.day;

  /* ── pet & house ── */
  const petMap   = ['🥚', '🐹', '🐼', '🐲'];
  const houseMap = ['🏚️', '🏠', '🏡', '🏰'];

  $('petEmoji').textContent  = petMap[Math.min(state.petStage, 3)];
  $('petView').textContent   = petMap[Math.min(state.petStage, 3)];
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

  /* ── map zones ── */
  $('bizZone').classList.toggle('locked', state.level < 3);
  $('bizZone').classList.toggle('active', state.level >= 3);
  $('futureZone').classList.toggle('locked', state.level < 6);
  $('futureZone').classList.toggle('active', state.level >= 6);

  /* ── stats bars ── */
  ['discipline', 'saving', 'judgment', 'resilience'].forEach(k => {
    $('m-' + k).textContent    = state.stats[k] + '%';
    $('b-' + k).style.width    = state.stats[k] + '%';
    // mini-stat on home
    const mini = $('m-' + k + '-mini');
    if (mini) mini.textContent = state.stats[k];
  });

  /* ── personality analysis ── */
  const traits = analyzeTraits();
  $('personalityTags').innerHTML = traits
    .map(x => `<span class="tag ${x.includes('提升') || x.includes('稳定') ? 'green' : x.includes('冲动') || x.includes('失败') ? 'red' : 'purple'}">${x}</span>`)
    .join('');
  $('personalityText').textContent = `Koin 会根据 ${state.childName} 的选择，调整任务和导师提问。现在最值得训练的是：${traits[0]}。`;

  /* ── life summary ── */
  $('lifeSummary').innerHTML = `${state.childName} 现在来到第 <b>${state.day}</b> 天。系统记录了 <b>${state.history.length}</b> 次人生选择。最近路线：${state.history[0] ? state.history[0].tag : '还没有开始'}。`;

  $('welcomeTitle').textContent = `欢迎回来，${state.childName}！`;

  /* ── story scene ── */
  const scene = currentScene();
  $('sceneTitle').textContent = `Day ${state.day} · ${scene.title}`;
  $('sceneText').textContent  = scene.text;
  $('choices').innerHTML = scene.choices
    .map((c, i) => `<button class="choice" data-choice="${i}"><div class="reward">+ XP + 金币</div><strong>${c.label}</strong><small>${c.desc}</small></button>`)
    .join('');

  /* ── timeline ── */
  $('timeline').innerHTML = state.history.length
    ? state.history.map(h => `<div class="event"><b>Day ${h.day} · ${h.title}</b><p class="muted">选择：${h.choice}</p><p>${h.result}</p><div style="margin-top:8px"><span class="tag">${h.tag}</span><span class="tag green">${h.reward}</span></div></div>`).join('')
    : '<p class="muted">还没有人生记录，先完成一个人生事件吧。</p>';

  /* ── QUESTS ── */
  renderQuestList();

  /* ── shop ── */
  $('shopList').innerHTML = shopItems
    .map(item => `<div class="shop-item"><div class="emoji">${item.emoji}</div><strong>${item.name}</strong><p class="muted">${item.desc}</p><button class="btn green" data-buy="${item.type}" data-cost="${item.cost}">${item.cost} 金币购买</button></div>`)
    .join('');

  /* ── room grid ── */
  const roomItems = state.inventory.filter(x => x !== 'house' && x !== 'pet').slice(0, 8);
  $('roomGrid').innerHTML = Array.from({ length: 8 }, (_, i) => {
    const item = shopItems.find(s => s.type === roomItems[i]);
    return `<div class="room-cell">${item ? item.emoji : ''}</div>`;
  }).join('');

  /* ── NPC ── */
  renderNpcList();
  renderNpcScene();

  /* ── mentor ── */
  $('mentorQuestion').textContent = mentorQuestion();
  $('reflections').innerHTML = state.reflections.length
    ? state.reflections.map(r => `<div class="event"><b>${r.date}</b><p class="muted">${r.question}</p><p>${r.text}</p></div>`).join('')
    : '<p class="muted">还没有反思记录。</p>';

  /* ── parent report ── */
  $('growthReport').innerHTML = statLine('discipline', '自律') + statLine('saving', '储蓄稳定') + statLine('judgment', '判断力') + statLine('resilience', '抗挫力');
  $('parentAdvice').innerHTML = `<p>建议本周不要只看结果，可以多问："你为什么这样选？"</p><p style="margin-top:8px">目前系统观察到：<b>${traits.join('、')}</b>。可以给玩家一个小任务：每天做一个选择前，先说出"我这样做的后果是什么"。</p>`;
  $('shareSummary').innerHTML = `${state.childName} 本月完成了 ${state.history.length} 次人生选择练习。自律 ${state.stats.discipline - 50 >= 0 ? '+' : ''}${state.stats.discipline - 50}%，储蓄稳定 ${state.stats.saving - 50 >= 0 ? '+' : ''}${state.stats.saving - 50}%，冲动消费倾向 ${state.stats.impulse - 50 >= 0 ? '+' : ''}${state.stats.impulse - 50}%。这不是成绩单，而是孩子真实的成长轨迹。`;

  /* ── settings ── */
  $('childName').value = state.childName;
  $('childAge').value  = state.childAge;
  $('theme').value     = state.theme;
}

/* ─── ENHANCED NPC ACTION (wraps systems.js npcAction) ── */
function handleNpcAction(type) {
  if (state.npcEventDone) {
    showToast('今日已完成，明天再来吧！');
    return;
  }
  npcAction(type);
  showNpcReaction(type);
}

/* ─── GLOBAL CLICK DELEGATION PATCH ─────────────── */
document.addEventListener('click', function(e) {
  // Quest CTA
  const questBtn = e.target.closest('[data-quest]');
  if (questBtn && !questBtn.disabled) {
    const id     = questBtn.dataset.quest;
    const reward = parseInt(questBtn.dataset.reward, 10);
    const prevDone = state.completedQuests.includes(id);
    completeQuest(id, reward);
    if (!prevDone && state.completedQuests.includes(id)) {
      setTimeout(() => triggerQuestBurst(id), 60);
    }
    return;
  }

  // NPC action buttons
  const npcBtn = e.target.closest('[data-npc-action]');
  if (npcBtn) {
    e.stopImmediatePropagation();
    handleNpcAction(npcBtn.dataset.npcAction);
    return;
  }

  // data-switch nav shortcuts
  const sw = e.target.closest('[data-switch]');
  if (sw) {
    switchPage(sw.dataset.switch);
    return;
  }
}, true);