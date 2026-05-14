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
    school: `<b>🏫 学校</b><br><br>这里会触发学习、人际关系与选择事件。每次选择都会改变孩子的成长数据。
      <div class="action-row"><button class="btn" data-switch="story">开始人生事件</button><button class="btn secondary" data-switch="mentor">找 AI 导师</button></div>`,
    business: `<b>🏢 创业中心</b><br><br>你已经解锁创业系统！你可以开始接受赚钱挑战，学习经营自己的小事业。
      <div class="action-row"><button class="btn" data-switch="story">创业挑战</button></div>`,
    future: `<b>🚀 未来都市</b><br><br>这里是高等级区域。未来会开放 AI 公司、投资系统与大型人生选择。
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

  if (!state.questProgress.reflection) {
    return {
      title: '完成一次 AI 反思',
      text: '写下至少 20 个字，训练孩子表达与复盘能力。',
      buttons: [['去找导师', 'mentor', 'btn green']]
    };
  }

  if (state.completedQuests.length < 2) {
    return {
      title: '领取每日任务奖励',
      text: '你已经完成部分条件，可以去任务页看看哪些奖励可领取。',
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


function injectTutorialStyles() {
  if (document.getElementById('koinTutorialStyles')) return;

  const style = document.createElement('style');
  style.id = 'koinTutorialStyles';
  style.textContent = `
    .tutorial-overlay {
      position: fixed;
      inset: 0;
      background: rgba(26, 16, 52, 0.72);
      backdrop-filter: blur(8px);
      z-index: 5000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 18px;
    }

    .tutorial-card {
      width: min(440px, 100%);
      background: linear-gradient(160deg, #ffffff 0%, #fff8ef 100%);
      border-radius: 28px;
      padding: 22px;
      box-shadow: 0 24px 80px rgba(0,0,0,.25);
      border: 2px solid rgba(255,255,255,.8);
      animation: tutorialPop .28s ease-out;
    }

    @keyframes tutorialPop {
      from { opacity: 0; transform: translateY(30px) scale(.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .tutorial-koin {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
    }

    .tutorial-avatar {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      background: linear-gradient(135deg, #FFE4B8, #FFD6E0);
      box-shadow: 0 8px 20px rgba(255, 140, 66, .18);
    }

    .tutorial-name {
      font-weight: 900;
      font-size: 16px;
      color: #1A1034;
    }

    .tutorial-step {
      font-size: 12px;
      color: #8B82A7;
      font-weight: 800;
      margin-top: 2px;
    }

    .tutorial-card h2 {
      font-size: 22px;
      line-height: 1.25;
      margin-bottom: 10px;
      color: #1A1034;
    }

    .tutorial-card p {
      font-size: 14px;
      color: #3D3360;
      line-height: 1.75;
      margin-bottom: 14px;
    }

    .tutorial-rewards {
      background: rgba(124,92,252,.08);
      border: 1px solid rgba(124,92,252,.12);
      border-radius: 18px;
      padding: 12px;
      margin: 12px 0;
      display: grid;
      gap: 8px;
      font-size: 13px;
      font-weight: 800;
      color: #3D3360;
    }

    .tutorial-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .tutorial-actions button {
      flex: 1;
      min-width: 130px;
    }

    .tutorial-small {
      font-size: 12px;
      color: #8B82A7;
      margin-top: 10px;
    }
  `;
  document.head.appendChild(style);
}

function getTutorialContent() {
  const step = state.tutorial?.step || 0;

  const contents = [
    {
      title: '欢迎来到 Koin City 🌱',
      body: '这里不是考试游戏。这里是你的未来人生模拟器。你每一次选择，都会影响金钱观、判断力、自律、人际关系和未来机会。',
      rewards: [],
      actions: [['开始我的人生', 'start']]
    },
    {
      title: '领取你的第一桶金 🎁',
      body: '每个人的人生都会从第一笔资源开始。Koin 会给你一笔普通起始基金，但未来要靠你自己管理和成长。',
      rewards: ['🪙 RM500 起始成长基金', '📚 普通书桌', '🥚 普通宠物蛋'],
      actions: [['领取起始资源', 'claim-starter']]
    },
    {
      title: '第一步：去学校完成事件 🏫',
      body: '先去完成第一个人生事件。你的选择会影响能力、金币和未来路线。',
      rewards: ['✨ 完成后获得金币', '🧠 知识成长'],
      actions: [['去人生事件', 'go-story']]
    },
    {
      title: '第二步：领取任务奖励 📜',
      body: '刚才的选择可能已经完成了每日任务条件。去任务页领取你的第一个奖励。',
      rewards: ['🎁 第一次任务奖励', '⚡ 能量恢复'],
      actions: [['去任务页', 'go-quests']]
    },
    {
      title: '第三步：买第一个家具 🛋️',
      body: '钱不是只拿来看数字。你可以用钱布置房间、解锁加成、培养自己的生活空间。',
      rewards: ['🏠 房间开始有归属感'],
      actions: [['去商店买家具', 'go-shop']]
    },
    {
      title: '第四步：看看成长报告 📊',
      body: 'Koin 记录的不只是金币，而是成绩单以外的成长：自律、判断力、抗挫力和金钱习惯。',
      rewards: ['👨‍👩‍👧 看见自己的成长'],
      actions: [['查看成长报告', 'go-report']]
    },
    {
      title: '最后一步：孵化宠物蛋 🥚',
      body: '你的宠物会陪你一起成长。未来它会因为你的选择变开心、焦虑、懒散或更有活力。',
      rewards: ['🐹 第一只成长宠物'],
      actions: [['孵化宠物蛋', 'hatch-pet']]
    }
  ];

  return contents[Math.min(step, contents.length - 1)];
}

function renderTutorialOverlay() {
  injectTutorialStyles();

  const existing = document.getElementById('tutorialOverlay');
  if (existing) existing.remove();

  if (!state.tutorial || state.tutorial.completed) return;

  const content = getTutorialContent();
  const overlay = document.createElement('div');
  overlay.id = 'tutorialOverlay';
  overlay.className = 'tutorial-overlay';

  overlay.innerHTML = `
    <div class="tutorial-card">
      <div class="tutorial-koin">
        <div class="tutorial-avatar">🌱</div>
        <div>
          <div class="tutorial-name">Koin 导师</div>
          <div class="tutorial-step">新手引导 ${Math.min((state.tutorial.step || 0) + 1, 7)} / 7</div>
        </div>
      </div>

      <h2>${content.title}</h2>
      <p>${content.body}</p>

      ${content.rewards.length ? `
        <div class="tutorial-rewards">
          ${content.rewards.map(r => `<div>${r}</div>`).join('')}
        </div>
      ` : ''}

      <div class="tutorial-actions">
        ${content.actions.map(a => `<button class="btn green" data-tutorial-action="${a[1]}">${a[0]}</button>`).join('')}
      </div>

      <div class="tutorial-small">完成引导后，你就可以自由探索 Koin City。</div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function render() {
  setupMapDrag();
  renderNextAction();

  $('coinCount').textContent = state.coins;
  $('levelCount').textContent = state.level;
  $('streakCount').textContent = state.streak;
  $('energyCount').textContent = state.energy;
  $('levelText').textContent = state.level;
  $('xpFill').style.width = state.xp + '%';

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

  $('lifeSummary').innerHTML = `${state.childName} 现在来到第 <b>${state.day}</b> 天。系统记录了 <b>${state.history.length}</b> 次人生选择。最近路线：${state.history[0] ? state.history[0].tag : '还没有开始'}。`;

  $('welcomeTitle').textContent = `欢迎回来，${state.childName}！`;

  const scene = currentScene();

  $('sceneTitle').textContent = `Day ${state.day} · ${scene.title}`;
  $('sceneText').textContent = scene.text;

  $('choices').innerHTML = scene.choices
    .map((c, i) => `<button class="choice" data-choice="${i}"><div class="reward">+ XP + 金币</div><strong>${c.label}</strong><small>${c.desc}</small></button>`)
    .join('');

  $('timeline').innerHTML = state.history.length
    ? state.history.map(h => `<div class="event"><b>Day ${h.day} · ${h.title}</b><p class="muted">选择：${h.choice}</p><p>${h.result}</p><div style="margin-top:8px"><span class="tag">${h.tag}</span><span class="tag green">${h.reward}</span></div></div>`).join('')
    : '<p class="muted">还没有人生记录，先完成一个人生事件吧。</p>';

  $('questList').innerHTML = dailyQuests.map(q => {
    const done = state.completedQuests.includes(q.id);
    const ready = canClaimQuest(q);

    return `<div class="quest-card ${done ? 'done' : ''}"><div class="quest-badge">+${q.reward} 🪙</div><div style="font-size:42px">${q.emoji}</div><h3 style="margin:8px 0">${q.title}</h3><p class="muted">${q.requirement}</p><div class="lock-note">${done ? '✅ 已领取' : ready ? '🎁 已达成，可以领取' : '🔒 条件未完成'}</div><button class="btn" style="margin-top:12px;width:100%" ${done ? 'disabled' : ''} data-quest="${q.id}" data-reward="${q.reward}">${done ? '✅ 已完成' : ready ? '领取奖励' : '查看条件'}</button></div>`;
  }).join('');

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

  $('npcEvent').innerHTML = state.npcEventDone
    ? '✅ 今天的 NPC 事件已经完成。你已经做出选择，明天会有新的关系事件。'
    : '今天，好朋友希望你帮他一起完成一个挑战，但你其实已经很累了。你会怎么回应？';

  $('npcCooldownText').textContent = state.npcEventDone ? '今日已完成，不能重复刷奖励。' : '';

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

  renderTutorialOverlay();
}
