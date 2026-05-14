// Koin City V2 — Location Growth Patch v2
// Load this file AFTER js/app.js in index.html.
// <script src="js/v2-location-growth.js"></script>

(function () {
  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function $safe(id) {
    return document.getElementById(id);
  }

  function safeToast(text) {
    if (typeof showToast === 'function') showToast(text);
    else console.log(text);
  }

  function safeBurst(text) {
    if (typeof createCoinBurst === 'function') createCoinBurst(text);
  }

  function safeSave() {
    if (typeof save === 'function') save();
  }

  function safeAddReward(coins, xp) {
    if (typeof addReward === 'function') {
      addReward(coins, xp);
      return;
    }

    state.coins = (state.coins || 0) + coins;
    state.xp = (state.xp || 0) + xp;
  }

  function ensureLocationState() {
    if (!window.state) return;

    if (!state.stats) state.stats = {};
    const defaults = {
      knowledge: 0,
      creativity: 0,
      fitness: 0,
      social: 0,
      business: 0,
      emotion: 0,
      discipline: 50,
      judgment: 50,
      resilience: 50,
      confidence: 50
    };

    Object.entries(defaults).forEach(([key, value]) => {
      if (typeof state.stats[key] !== 'number') state.stats[key] = value;
    });

    if (!state.locationHistory) state.locationHistory = [];
    if (typeof state.dailyLocationActions !== 'number') state.dailyLocationActions = 0;

    const today = todayKey();
    if (state.dailyLocationDate !== today) {
      state.dailyLocationDate = today;
      state.dailyLocationActions = 0;
    }

    if (typeof state.energy !== 'number') state.energy = 100;
  }

  function clamp(v) {
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  function statLabel(key) {
    const labels = {
      discipline: '自律',
      saving: '储蓄',
      judgment: '判断力',
      resilience: '抗挫力',
      impulse: '冲动',
      confidence: '自信',
      goal: '目标感',
      knowledge: '知识',
      creativity: '创意',
      fitness: '活力',
      social: '沟通',
      business: '商业',
      emotion: '情绪'
    };
    return labels[key] || key;
  }

  function injectLocationStyles() {
    if (document.getElementById('koinLocationPatchStyles')) return;

    const style = document.createElement('style');
    style.id = 'koinLocationPatchStyles';
    style.textContent = `
      .koin-location-grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
        margin-top:12px;
      }

      .koin-location-card{
        border:1.5px solid rgba(124,92,252,.16);
        background:linear-gradient(135deg,#fff,#fff8ef);
        border-radius:18px;
        padding:12px;
        text-align:left;
        cursor:pointer;
        box-shadow:0 4px 16px rgba(124,92,252,.08);
        color:var(--ink,#1A1034);
        transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        min-height:112px;
        width:100%;
      }

      .koin-location-card:hover{
        transform:translateY(-2px);
        box-shadow:0 8px 24px rgba(124,92,252,.16);
        border-color:rgba(124,92,252,.32);
      }

      .koin-location-card .top{
        display:flex;
        align-items:center;
        gap:8px;
        margin-bottom:6px;
      }

      .koin-location-card .emoji{
        font-size:28px;
        width:36px;
        height:36px;
        border-radius:12px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(124,92,252,.08);
        flex-shrink:0;
      }

      .koin-location-card .name{
        font-weight:900;
        font-size:14px;
        line-height:1.15;
        white-space:normal;
        word-break:keep-all;
      }

      .koin-location-card .desc{
        font-size:11px;
        color:var(--muted,#756e83);
        line-height:1.35;
        margin:6px 0 8px;
      }

      .koin-location-card .meta{
        display:flex;
        flex-wrap:wrap;
        gap:5px;
      }

      .koin-location-card .pill{
        font-size:10px;
        font-weight:800;
        border-radius:999px;
        padding:4px 7px;
        background:rgba(124,92,252,.10);
        color:var(--violet,#7C5CFC);
      }

      .koin-stat-panel{
        background:linear-gradient(135deg,rgba(124,92,252,.08),rgba(255,140,66,.08));
        border:1.5px solid rgba(124,92,252,.12);
        border-radius:20px;
        padding:14px;
        margin-top:12px;
      }

      .koin-stat-panel h3{
        font-size:15px;
        margin-bottom:10px;
      }

      .koin-stat-grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
      }

      .koin-stat-item{
        background:#fff;
        border-radius:14px;
        padding:9px 10px;
        border:1px solid rgba(124,92,252,.10);
      }

      .koin-stat-item .row{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        font-size:12px;
        font-weight:900;
        margin-bottom:6px;
      }

      .koin-stat-item .bar{
        height:6px;
        background:rgba(0,0,0,.08);
        border-radius:99px;
        overflow:hidden;
      }

      .koin-stat-item .fill{
        height:100%;
        background:linear-gradient(90deg,#7C5CFC,#FF8C42);
        border-radius:99px;
      }

      .koin-strip-item-active{
        outline:2px solid rgba(124,92,252,.25);
        transform:translateY(-1px);
      }

      @media(max-width:380px){
        .koin-location-grid{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  window.locationTasks = {
    school: {
      emoji: '🏫',
      name: '学校',
      title: '时间管理挑战',
      short: '知识 + 自律',
      desc: '安排功课、休息和兴趣活动。',
      energyCost: 8,
      coins: 18,
      xp: 14,
      effects: { knowledge: 6, discipline: 3 }
    },
    library: {
      emoji: '📚',
      name: '图书馆',
      title: '专注阅读挑战',
      short: '知识 + 判断',
      desc: '阅读 25 分钟，写下一个新想法。',
      energyCost: 7,
      coins: 15,
      xp: 16,
      effects: { knowledge: 5, judgment: 3 }
    },
    gym: {
      emoji: '🏋️',
      name: '健身房',
      title: '坚持运动挑战',
      short: '活力 + 自律',
      desc: '完成基础训练，管理身体。',
      energyCost: 10,
      coins: 12,
      xp: 15,
      effects: { fitness: 7, discipline: 2, resilience: 2 }
    },
    studio: {
      emoji: '🎨',
      name: '创作室',
      title: '创意表达挑战',
      short: '创意 + 自信',
      desc: '做出一个小作品，先表达想法。',
      energyCost: 8,
      coins: 16,
      xp: 16,
      effects: { creativity: 7, confidence: 2 }
    },
    business: {
      emoji: '💼',
      name: '创业中心',
      title: '成本与定价挑战',
      short: '商业 + 判断',
      desc: '学习成本、定价和利润。',
      energyCost: 12,
      coins: 28,
      xp: 18,
      effects: { business: 7, judgment: 3 }
    },
    park: {
      emoji: '🌳',
      name: '公园',
      title: '情绪恢复挑战',
      short: '情绪 + 恢复',
      desc: '散步整理心情，恢复能量。',
      energyCost: 0,
      energyGain: 18,
      coins: 8,
      xp: 10,
      effects: { emotion: 7, resilience: 2 }
    },
    social: {
      emoji: '🗣️',
      name: '社交区',
      title: '沟通练习挑战',
      short: '沟通 + 自信',
      desc: '练习表达，也学习听别人说完。',
      energyCost: 6,
      coins: 14,
      xp: 14,
      effects: { social: 7, confidence: 2 }
    }
  };

  window.careerPaths = [
    { emoji: '🏋️', name: '健身教练 / 运动员', requirements: { discipline: 80, fitness: 70 }, benefit: '解锁运动挑战与健康类收入' },
    { emoji: '🎮', name: '游戏设计师', requirements: { creativity: 80, judgment: 70 }, benefit: '解锁创作室高级任务' },
    { emoji: '🧑‍💼', name: '创业家', requirements: { business: 85, resilience: 80 }, benefit: '解锁创业中心高级收入' },
    { emoji: '🤖', name: 'AI 工程师', requirements: { knowledge: 90, discipline: 75 }, benefit: '解锁未来都市科技任务' },
    { emoji: '🏠', name: '房地产达人', requirements: { judgment: 90, social: 70 }, benefit: '解锁资产与租金事件' },
    { emoji: '🎬', name: '内容创作者', requirements: { creativity: 85, social: 75 }, benefit: '解锁社交区影响力任务' }
  ];

  window.getCareerProgress = function getCareerProgress(job) {
    ensureLocationState();

    const missing = [];
    let unlocked = true;

    Object.entries(job.requirements).forEach(([stat, req]) => {
      const current = state.stats[stat] || 0;
      if (current < req) {
        unlocked = false;
        missing.push({ stat, current, req, need: req - current });
      }
    });

    return { unlocked, missing };
  };

  function renderStatPanel() {
    ensureLocationState();

    const keys = ['knowledge', 'creativity', 'fitness', 'social', 'business', 'emotion', 'discipline', 'judgment'];
    return `
      <div class="koin-stat-panel">
        <h3>📊 目前成长数值</h3>
        <div class="koin-stat-grid">
          ${keys.map(key => {
            const value = state.stats[key] || 0;
            return `
              <div class="koin-stat-item">
                <div class="row">
                  <span>${statLabel(key)}</span>
                  <span>${value}</span>
                </div>
                <div class="bar"><div class="fill" style="width:${Math.min(100, Math.max(0, value))}%"></div></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderLocationButtons(keys) {
    ensureLocationState();

    return `<div class="koin-location-grid">
      ${keys.map(key => {
        const t = locationTasks[key];
        const effectText = Object.entries(t.effects)
          .map(([stat, amount]) => `${statLabel(stat)}+${amount}`)
          .join(' · ');

        return `
          <button class="koin-location-card" data-location-task="${key}">
            <div class="top">
              <div class="emoji">${t.emoji}</div>
              <div>
                <div class="name">${t.name}</div>
                <div style="font-size:10px;color:var(--muted,#756e83);font-weight:800">${t.short}</div>
              </div>
            </div>
            <div class="desc">${t.desc}</div>
            <div class="meta">
              <span class="pill">-${t.energyCost || 0}⚡</span>
              <span class="pill">+${t.coins}🪙</span>
              <span class="pill">+${t.xp}XP</span>
              <span class="pill">${effectText}</span>
            </div>
          </button>
        `;
      }).join('')}
    </div>`;
  }

  function renderCareerPreview() {
    ensureLocationState();

    return `<div style="display:grid;gap:10px;margin-top:12px">
      ${careerPaths.map(job => {
        const progress = getCareerProgress(job);
        const missingText = progress.unlocked
          ? '✅ 已达到条件'
          : progress.missing.map(m => `${statLabel(m.stat)} 还差 ${m.need}`).join(' · ');

        return `<div style="background:#fff;border-radius:14px;padding:12px;border:1px solid rgba(124,92,252,.14)">
          <strong>${job.emoji} ${job.name}</strong>
          <p class="muted" style="margin-top:4px">${job.benefit}</p>
          <div class="lock-note" style="margin-top:8px">${missingText}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function applyStatEffects(effects) {
    ensureLocationState();

    Object.entries(effects || {}).forEach(([key, value]) => {
      state.stats[key] = clamp((state.stats[key] || 0) + value);
    });
  }

  window.performLocationTask = function performLocationTask(locationKey) {
    ensureLocationState();

    const task = locationTasks[locationKey];
    if (!task) return;

    if (state.dailyLocationActions >= 2) {
      alert('今天的地点成长次数已经用完了。\n\n明天再去新的地点成长吧。');
      return;
    }

    if (state.energy < task.energyCost) {
      alert('能量不足，先休息或去公园恢复能量。');
      return;
    }

    state.energy = Math.max(0, state.energy - task.energyCost);

    if (task.energyGain) {
      state.energy = Math.min(100, state.energy + task.energyGain);
    }

    safeAddReward(task.coins, task.xp);
    applyStatEffects(task.effects);

    state.dailyLocationActions += 1;

    state.locationHistory.unshift({
      date: new Date().toLocaleDateString('zh-MY'),
      key: locationKey,
      name: task.name,
      title: task.title,
      desc: task.desc,
      effects: task.effects,
      reward: `+${task.coins} 金币 · +${task.xp} XP`
    });

    if (!state.questProgress) state.questProgress = {};
    if (locationKey === 'school' || locationKey === 'library') state.questProgress.storyPositive = true;
    if (locationKey === 'business') state.questProgress.savingChoice = true;

    safeBurst(`+${task.coins} 🪙`);
    safeToast(`${task.name}成长完成：${task.title}`);
    safeSave();

    if (typeof render === 'function') render();
  };

  function openGrowthZone(type) {
    ensureLocationState();

    const zoneContent = $safe('zoneContent');
    if (!zoneContent) return false;

    const remaining = Math.max(0, 2 - (state.dailyLocationActions || 0));

    const content = {
      home: `<b>🏠 我的家</b><br><br>这里是你的成长基地。你可以升级房间、查看宠物和摆放家具。
        <div class="lock-note">今日地点成长次数剩余：${remaining}/2</div>
        ${renderStatPanel()}
        ${renderLocationButtons(['park'])}
        <div class="action-row">
          <button class="btn green" data-switch="city">查看房间</button>
          <button class="btn secondary" data-switch="quests">去赚金币</button>
        </div>`,

      shop: `<b>🏪 商店区</b><br><br>这里可以买家具、宠物和房间升级。金币不够就先去完成任务。
        <div class="action-row">
          <button class="btn green" data-scroll-shop="1">打开奖励商店</button>
          <button class="btn secondary" data-switch="quests">去做任务</button>
        </div>`,

      school: `<b>🏫 成长学院</b><br><br>这里不只是学校。你可以去不同地点训练不同能力。今天还剩 <b>${remaining}/2</b> 次地点成长。
        ${renderStatPanel()}
        ${renderLocationButtons(['school','library','gym','studio','social'])}`,

      business: `<b>🏢 创业中心</b><br><br>这里可以训练商业能力，也可以查看未来职业路线。
        <div class="lock-note">今日地点成长次数剩余：${remaining}/2</div>
        ${renderStatPanel()}
        ${renderLocationButtons(['business'])}
        <h3 style="margin-top:16px">🚀 职业解锁预览</h3>
        ${renderCareerPreview()}`,

      future: `<b>🚀 未来都市</b><br><br>这里是高等级区域。继续成长后，你会遇到更大的机会和更难的人生选择。
        <div class="action-row"><button class="btn" data-switch="parent">查看成长报告</button></div>
        ${renderStatPanel()}
        <h3 style="margin-top:16px">职业路线</h3>
        ${renderCareerPreview()}`,

      bank: `<b>🏦 银行</b><br><br>银行系统还在建设中。未来这里会管理储蓄、房租、预算和月度账单。
        <div class="lock-note">即将开放：储蓄目标、月度房租、预算挑战</div>`
    };

    if (!content[type]) return false;

    zoneContent.innerHTML = content[type];
    return true;
  }

  const originalOpenZone = window.openZone;
  window.openZone = function patchedOpenZone(type) {
    ensureLocationState();

    if ((type === 'business' && state.level < 3) || (type === 'future' && state.level < 6)) {
      if (typeof originalOpenZone === 'function') return originalOpenZone(type);
      return;
    }

    if (openGrowthZone(type)) return;

    if (typeof originalOpenZone === 'function') return originalOpenZone(type);
  };

  function injectLocationHub() {
    ensureLocationState();
    injectLocationStyles();

    const pageCity = $safe('page-city');
    if (!pageCity || $safe('locationGrowthHub')) return;

    const guide = pageCity.querySelector('.guide-card') || pageCity.firstElementChild;

    const hub = document.createElement('div');
    hub.className = 'card';
    hub.id = 'locationGrowthHub';
    hub.innerHTML = `
      <h2>🌱 地点成长中心</h2>
      <p class="muted">每天可以选择 2 个地点成长。不同地点会增加不同能力，也会影响未来职业路线。</p>
      <div class="lock-note">今日剩余：${Math.max(0, 2 - (state.dailyLocationActions || 0))}/2 次</div>
      ${renderStatPanel()}
      ${renderLocationButtons(['school','library','gym','studio','park','social'])}
      <div style="margin-top:14px">
        <h3 style="font-size:15px;margin-bottom:8px">🚀 职业路线预览</h3>
        ${renderCareerPreview()}
      </div>
    `;

    if (guide && guide.parentNode) guide.parentNode.insertBefore(hub, guide.nextSibling);
    else pageCity.prepend(hub);
  }

  function refreshLocationHub() {
    const old = $safe('locationGrowthHub');
    if (old) old.remove();
    injectLocationHub();
  }

  function attachCityStripClicks() {
    const items = Array.from(document.querySelectorAll('.city-strip-item'));
    if (!items.length) return;

    items.forEach(item => {
      item.style.cursor = 'pointer';

      item.onclick = function () {
        const text = item.textContent || '';

        items.forEach(x => x.classList.remove('koin-strip-item-active'));
        item.classList.add('koin-strip-item-active');

        if (typeof switchPage === 'function') switchPage('city');

        setTimeout(() => {
          if (text.includes('我的家') || text.includes('宠物')) window.openZone('home');
          else if (text.includes('商店')) window.openZone('shop');
          else if (text.includes('学校') || text.includes('公园')) window.openZone('school');
          else if (text.includes('银行')) window.openZone('bank');
          else window.openZone('school');

          const zoneInfo = $safe('zoneInfo');
          if (zoneInfo) zoneInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
      };
    });
  }

  function patchReportText() {
    const lifeSummary = $safe('lifeSummary');
    if (lifeSummary && !lifeSummary.dataset.koinLocationAdded) {
      lifeSummary.dataset.koinLocationAdded = '1';

      const unlocked = careerPaths.filter(job => getCareerProgress(job).unlocked);
      const careerText = unlocked.length
        ? `已解锁职业方向：${unlocked.map(j => `${j.emoji}${j.name}`).join('、')}`
        : '继续提升知识、创意、活力、沟通和商业能力，就会逐步接近不同职业路线。';

      lifeSummary.innerHTML += `<br><br><b>今日地点成长：</b>${state.dailyLocationActions || 0}/2<br><b>职业方向：</b>${careerText}`;
    }

    const growthReport = $safe('growthReport');
    if (growthReport && !growthReport.dataset.koinLocationStatsAdded) {
      growthReport.dataset.koinLocationStatsAdded = '1';

      const extraStats = ['knowledge','creativity','fitness','social','business','emotion'];
      growthReport.innerHTML += extraStats.map(key => {
        const value = state.stats[key] || 0;
        return `<div style="margin-bottom:12px">
          <div style="font-weight:900">${statLabel(key)} +${value}</div>
          <div class="bar"><div class="fill" style="width:${Math.min(100, value)}%"></div></div>
        </div>`;
      }).join('');
    }
  }

  document.body.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-location-task]');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();
    window.performLocationTask(btn.dataset.locationTask);
  }, true);

  const originalRender = window.render;
  if (typeof originalRender === 'function' && !window.__koinLocationRenderPatchedV2) {
    window.__koinLocationRenderPatchedV2 = true;

    window.render = function patchedRender() {
      originalRender();
      ensureLocationState();
      refreshLocationHub();
      attachCityStripClicks();
      patchReportText();
    };
  }

  ensureLocationState();
  injectLocationStyles();
  injectLocationHub();
  attachCityStripClicks();
  patchReportText();
  safeSave();

  if (typeof render === 'function') render();

  console.log('[Koin City V2] Location Growth Patch v2 loaded');
})();
