// Koin City V2 — Work Center Patch v1
// New file: js/v2-work-center.js
// Load AFTER js/v2-room-upgrade.js

(function () {

  // ── Helpers ──────────────────────────────────────────────────────────────

  function $safe(id) { return document.getElementById(id); }

  function safeToast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  function safeBurst(msg) {
    if (typeof createCoinBurst === 'function') createCoinBurst(msg);
  }

  function safeSave() {
    if (typeof save === 'function') save();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── Daily Salary Table ────────────────────────────────────────────────────
  // Keyed by career id from v2-career-unlock.js

  const DAILY_SALARY = {
    fitness_coach:    { amount: 220, label: '健身教练',   emoji: '🏋️' },
    game_designer:    { amount: 260, label: '游戏设计师', emoji: '🎮' },
    entrepreneur:     { amount: 350, label: '创业家',     emoji: '🧑‍💼' },
    ai_engineer:      { amount: 320, label: 'AI 工程师',  emoji: '🤖' },
    property_expert:  { amount: 330, label: '房地产达人', emoji: '🏠' },
    content_creator:  { amount: 280, label: '内容创作者', emoji: '🎬' }
  };

  // ── Streak Bonus Table ────────────────────────────────────────────────────

  const STREAK_BONUSES = [
    { day: 1,  bonus: 50,  label: '第1天',  special: false },
    { day: 2,  bonus: 80,  label: '第2天',  special: false },
    { day: 3,  bonus: 100, label: '第3天',  special: false },
    { day: 4,  bonus: 100, label: '第4天',  special: false },
    { day: 5,  bonus: 120, label: '第5天',  special: false },
    { day: 6,  bonus: 120, label: '第6天',  special: false },
    { day: 7,  bonus: 0,   label: '第7天',  special: true  }  // chest reward
  ];

  const STREAK_CHEST_REWARD = { coins: 300, xp: 50 };

  // ── State Init ────────────────────────────────────────────────────────────

  function ensureWorkState() {
    if (!window.state) return false;

    if (!state.work) {
      state.work = {
        lastWorkDate:   null,   // date string of last salary claim
        workStreak:     0,      // consecutive work days
        totalEarned:    0,      // lifetime salary coins
        chestClaimed:   []      // array of streak-cycle numbers that got chest
      };
    }

    // Safety: fill missing fields for older saves
    if (typeof state.work.lastWorkDate  === 'undefined') state.work.lastWorkDate  = null;
    if (typeof state.work.workStreak    === 'undefined') state.work.workStreak    = 0;
    if (typeof state.work.totalEarned   === 'undefined') state.work.totalEarned   = 0;
    if (!Array.isArray(state.work.chestClaimed))         state.work.chestClaimed  = [];

    return true;
  }

  // ── Career Helpers ────────────────────────────────────────────────────────
  // Read from v2-career-unlock.js safely

  function getSelectedCareer() {
    if (!window.state || !state.careers || !state.careers.selected) return null;
    if (typeof getCareers !== 'function') return null;

    return getCareers().find(c => c.id === state.careers.selected) || null;
  }

  function getUnlockedCareers() {
    if (!window.state || !state.careers) return [];
    if (typeof getCareers !== 'function') return [];
    if (!Array.isArray(state.careers.unlocked)) return [];

    return getCareers().filter(c => state.careers.unlocked.includes(c.id));
  }

  function isCareerUnlocked(careerId) {
    if (!window.state || !state.careers) return false;
    return Array.isArray(state.careers.unlocked) && state.careers.unlocked.includes(careerId);
  }

  // ── Work Actions ──────────────────────────────────────────────────────────

  window.claimDailySalary = function claimDailySalary() {
    if (!ensureWorkState()) return;

    const career = getSelectedCareer();
    if (!career) {
      alert('还没有选择追踪的职业。\n\n先去 Career Center 解锁并追踪一个职业方向，才可以上班领薪资。');
      return;
    }

    if (!isCareerUnlocked(career.id)) {
      alert(`${career.name} 还没有解锁。\n\n继续提升相关能力，达到条件后才能开始上班。`);
      return;
    }

    const today = todayKey();
    if (state.work.lastWorkDate === today) {
      safeToast('今天已经上班了。明天回来再领薪资！');
      return;
    }

    // Calculate streak
    const yesterday = yesterdayKey();
    if (state.work.lastWorkDate === yesterday) {
      state.work.workStreak += 1;
    } else if (state.work.lastWorkDate !== today) {
      // Streak broken (or first time)
      state.work.workStreak = 1;
    }

    state.work.lastWorkDate = today;

    // Base salary
    const salaryDef = DAILY_SALARY[career.id];
    const baseSalary = salaryDef ? salaryDef.amount : 200;

    // Streak bonus (1-indexed: streak day within current 7-day cycle)
    const streakDay    = ((state.work.workStreak - 1) % 7) + 1;
    const streakEntry  = STREAK_BONUSES[streakDay - 1];
    const streakBonus  = streakEntry ? streakEntry.bonus : 0;
    const isChestDay   = streakEntry ? streakEntry.special : false;

    // Current cycle number (how many full 7-day cycles completed)
    const cycleNum = Math.floor((state.work.workStreak - 1) / 7);

    let totalCoins = baseSalary + streakBonus;
    let totalXp    = 20;
    let chestMsg   = '';

    // Chest reward on day 7 of each cycle (if not already claimed this cycle)
    if (isChestDay && !state.work.chestClaimed.includes(cycleNum)) {
      state.work.chestClaimed.push(cycleNum);
      totalCoins += STREAK_CHEST_REWARD.coins;
      totalXp    += STREAK_CHEST_REWARD.xp;
      chestMsg    = ` + 🎁 连续7天宝箱 +${STREAK_CHEST_REWARD.coins}🪙！`;
    }

    // Apply reward
    if (typeof addReward === 'function') {
      addReward(totalCoins, totalXp);
    } else {
      state.coins = (state.coins || 0) + totalCoins;
      state.xp    = (state.xp    || 0) + totalXp;
    }

    state.work.totalEarned = (state.work.totalEarned || 0) + totalCoins;

    safeBurst(`+${totalCoins} 🪙`);
    safeToast(`${career.emoji || '💼'} 今日薪资 +${baseSalary}${streakBonus ? ` + 连续奖励 +${streakBonus}` : ''}${chestMsg}`);
    safeSave();

    if (typeof render === 'function') render();
  };

  window.selectCareerFromWork = function selectCareerFromWork(careerId) {
    if (typeof selectCareer === 'function') {
      selectCareer(careerId);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  function injectWorkStyles() {
    const old = document.getElementById('koinWorkCenterStyles');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'koinWorkCenterStyles';
    style.textContent = `
      /* ── Work Center Hub ── */
      #workCenterHub {
        margin: 0 16px 16px;
      }

      .koin-work-hero {
        background: linear-gradient(145deg, #0f2027, #203a43, #2c5364);
        border-radius: 26px 26px 0 0;
        padding: 20px;
        position: relative;
        overflow: hidden;
      }

      .koin-work-hero::after {
        content: '';
        position: absolute;
        width: 160px; height: 160px;
        border-radius: 50%;
        background: rgba(255,255,255,.06);
        right: -40px; bottom: -50px;
      }

      .koin-work-hero-row {
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        z-index: 1;
      }

      .koin-work-icon {
        width: 56px; height: 56px;
        border-radius: 18px;
        background: rgba(255,255,255,.13);
        border: 1.5px solid rgba(255,255,255,.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 30px;
        flex-shrink: 0;
      }

      .koin-work-hero h2 {
        color: #fff;
        font-size: 17px;
        font-weight: 900;
        margin: 0 0 4px;
      }

      .koin-work-hero p {
        color: rgba(255,255,255,.72);
        font-size: 12px;
        line-height: 1.5;
        margin: 0;
      }

      /* ── Salary card ── */
      .koin-work-body {
        background: #fff;
        border-radius: 0 0 26px 26px;
        border: 1.5px solid rgba(124,92,252,.12);
        border-top: none;
        padding: 16px;
        box-shadow: 0 8px 28px rgba(124,92,252,.08);
      }

      .koin-work-salary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .koin-work-salary-info {
        flex: 1;
        min-width: 0;
      }

      .koin-work-salary-amount {
        font-size: 28px;
        font-weight: 1000;
        color: var(--violet, #7C5CFC);
        line-height: 1;
      }

      .koin-work-salary-label {
        font-size: 11px;
        color: var(--muted, #756e83);
        font-weight: 800;
        margin-top: 3px;
      }

      .koin-work-claim-btn {
        all: unset;
        box-sizing: border-box;
        padding: 13px 20px;
        border-radius: 16px;
        background: linear-gradient(135deg, #7C5CFC, #FF8C42);
        color: #fff;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(124,92,252,.28);
        transition: transform .15s, box-shadow .15s;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .koin-work-claim-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 26px rgba(124,92,252,.38);
      }

      .koin-work-claim-btn.done {
        background: linear-gradient(135deg, #b0a8c8, #c9b99a);
        box-shadow: none;
        cursor: default;
        transform: none;
      }

      .koin-work-done-note {
        font-size: 12px;
        color: #2d6a19;
        font-weight: 800;
        background: rgba(114,225,40,.14);
        border-radius: 10px;
        padding: 7px 10px;
        margin-bottom: 14px;
        display: none;
      }

      .koin-work-done-note.visible { display: block; }

      /* ── Streak bar ── */
      .koin-work-streak-title {
        font-size: 13px;
        font-weight: 900;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .koin-work-streak-row {
        display: flex;
        gap: 6px;
        align-items: flex-end;
      }

      .koin-work-streak-day {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .koin-work-streak-bubble {
        width: 36px; height: 36px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px;
        font-weight: 900;
        border: 2px solid rgba(124,92,252,.15);
        background: rgba(124,92,252,.06);
        color: var(--muted, #756e83);
        transition: all .2s;
      }

      .koin-work-streak-bubble.done {
        background: linear-gradient(135deg, #7C5CFC, #FF8C42);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 3px 10px rgba(124,92,252,.28);
      }

      .koin-work-streak-bubble.today {
        background: linear-gradient(135deg, #72E128, #06C8A8);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 3px 10px rgba(114,225,40,.30);
        animation: koinWorkPulse 1.5s ease-in-out infinite;
      }

      .koin-work-streak-bubble.chest {
        font-size: 18px;
      }

      .koin-work-streak-label {
        font-size: 9px;
        font-weight: 900;
        color: var(--muted, #756e83);
        text-align: center;
      }

      .koin-work-streak-bonus {
        font-size: 9px;
        font-weight: 900;
        color: var(--violet, #7C5CFC);
        text-align: center;
      }

      @keyframes koinWorkPulse {
        0%, 100% { transform: scale(1); }
        50%       { transform: scale(1.08); }
      }

      /* ── Unlocked careers list ── */
      .koin-work-careers {
        margin-top: 14px;
        display: grid;
        gap: 8px;
      }

      .koin-work-career-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 12px;
        border-radius: 16px;
        border: 1.5px solid rgba(124,92,252,.12);
        background: linear-gradient(145deg, #fff, #f9f6ff);
        cursor: pointer;
        transition: border-color .15s, box-shadow .15s;
      }

      .koin-work-career-row:hover {
        border-color: rgba(124,92,252,.30);
        box-shadow: 0 4px 14px rgba(124,92,252,.10);
      }

      .koin-work-career-row.selected {
        border-color: rgba(114,225,40,.50);
        background: linear-gradient(145deg, #fff, #f4fff0);
      }

      .koin-work-career-emoji {
        font-size: 24px;
        width: 38px;
        text-align: center;
        flex-shrink: 0;
      }

      .koin-work-career-info {
        flex: 1;
        min-width: 0;
      }

      .koin-work-career-name {
        font-size: 13px;
        font-weight: 900;
        line-height: 1.2;
      }

      .koin-work-career-salary {
        font-size: 11px;
        color: var(--violet, #7C5CFC);
        font-weight: 800;
        margin-top: 2px;
      }

      .koin-work-career-badge {
        font-size: 10px;
        font-weight: 900;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(114,225,40,.18);
        color: #2d6a19;
        flex-shrink: 0;
      }

      .koin-work-career-badge.tracked {
        background: rgba(255,140,66,.18);
        color: #8a4000;
      }

      /* ── No career state ── */
      .koin-work-empty {
        text-align: center;
        padding: 20px 16px;
        color: var(--muted, #756e83);
        font-size: 13px;
        line-height: 1.6;
        font-weight: 700;
      }

      .koin-work-total-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-radius: 14px;
        background: rgba(124,92,252,.06);
        margin-top: 14px;
        font-size: 12px;
        font-weight: 900;
        color: var(--ink, #1A1034);
      }

      .koin-work-total-num {
        color: var(--violet, #7C5CFC);
        font-size: 15px;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function renderWorkCenter() {
    if (!ensureWorkState()) return '';

    const today         = todayKey();
    const claimedToday  = state.work.lastWorkDate === today;
    const selectedCareer = getSelectedCareer();
    const unlockedList  = getUnlockedCareers();

    // ── Salary section ──
    let salarySection = '';
    if (!selectedCareer) {
      salarySection = `<div class="koin-work-empty">
        还没有选择追踪的职业。<br>
        先去 Career Center 解锁职业，再回来开始上班领薪资。
      </div>`;
    } else if (!isCareerUnlocked(selectedCareer.id)) {
      salarySection = `<div class="koin-work-empty">
        ${selectedCareer.emoji || '💼'} <b>${selectedCareer.name}</b> 还没解锁。<br>
        继续提升相关能力，达到条件后才可以开始上班。
      </div>`;
    } else {
      const salaryDef  = DAILY_SALARY[selectedCareer.id];
      const baseSalary = salaryDef ? salaryDef.amount : 200;
      const streakDay  = ((state.work.workStreak - 1) % 7) + 1;
      const streakEntry = state.work.workStreak > 0 ? STREAK_BONUSES[streakDay - 1] : null;
      const nextBonus  = !claimedToday && streakEntry ? streakEntry.bonus : 0;

      salarySection = `
        ${claimedToday ? `<div class="koin-work-done-note visible">✅ 今天已经上班了，明天回来继续！</div>` : ''}
        <div class="koin-work-salary-row">
          <div class="koin-work-salary-info">
            <div class="koin-work-salary-amount">+${baseSalary}${nextBonus ? `<span style="font-size:14px;color:#FF8C42"> +${nextBonus}</span>` : ''} 🪙</div>
            <div class="koin-work-salary-label">${selectedCareer.emoji || '💼'} ${selectedCareer.name} · 每日薪资${nextBonus ? ' + 连续奖励' : ''}</div>
          </div>
          <button class="koin-work-claim-btn ${claimedToday ? 'done' : ''}" onclick="claimDailySalary()">
            ${claimedToday ? '✅ 已领取' : '💼 上班'}
          </button>
        </div>
      `;
    }

    // ── Streak row ──
    const currentStreak = state.work.workStreak || 0;
    const streakDayPos  = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : 0;

    const streakDots = STREAK_BONUSES.map((s, i) => {
      const dayNum   = i + 1;
      const isDone   = currentStreak > 0 && dayNum < streakDayPos;
      const isToday  = currentStreak > 0 && dayNum === streakDayPos && state.work.lastWorkDate === today;
      const isChest  = s.special;

      let cls = 'koin-work-streak-bubble';
      if (isDone)   cls += ' done';
      if (isToday)  cls += ' today';
      if (isChest)  cls += ' chest';

      const inner = isChest ? '🎁' : `+${s.bonus || '?'}`;

      return `
        <div class="koin-work-streak-day">
          <div class="${cls}">${inner}</div>
          <div class="koin-work-streak-label">${s.label}</div>
        </div>`;
    }).join('');

    // ── Unlocked careers list ──
    let careersList = '';
    if (unlockedList.length === 0) {
      careersList = `<div style="font-size:12px;color:var(--muted,#756e83);font-weight:700;margin-top:14px">
        还没有解锁任何职业。继续在地点成长中心提升能力！
      </div>`;
    } else {
      const rows = unlockedList.map(career => {
        const salaryDef = DAILY_SALARY[career.id];
        const salary    = salaryDef ? salaryDef.amount : 200;
        const isSelected = selectedCareer && selectedCareer.id === career.id;

        return `
          <div class="koin-work-career-row ${isSelected ? 'selected' : ''}"
               onclick="selectCareerFromWork('${career.id}')">
            <div class="koin-work-career-emoji">${career.emoji || '💼'}</div>
            <div class="koin-work-career-info">
              <div class="koin-work-career-name">${career.name}</div>
              <div class="koin-work-career-salary">每日薪资 +${salary} 🪙</div>
            </div>
            <div class="koin-work-career-badge ${isSelected ? 'tracked' : ''}">
              ${isSelected ? '✅ 工作中' : '切换'}
            </div>
          </div>`;
      }).join('');

      careersList = `
        <div style="font-size:13px;font-weight:900;margin-top:14px;margin-bottom:8px">💼 已解锁职业</div>
        <div class="koin-work-careers">${rows}</div>`;
    }

    return `
      <div id="workCenterHub">
        <div class="koin-work-hero">
          <div class="koin-work-hero-row">
            <div class="koin-work-icon">💼</div>
            <div>
              <h2>工作中心</h2>
              <p>解锁职业后，每天上班领取薪资。连续工作 7 天可以获得宝箱奖励。</p>
            </div>
          </div>
        </div>

        <div class="koin-work-body">
          ${salarySection}

          <div class="koin-work-streak-title">
            🔥 连续工作奖励
            <span style="font-size:11px;color:var(--muted,#756e83);font-weight:700">
              已连续 ${currentStreak} 天
            </span>
          </div>
          <div class="koin-work-streak-row">${streakDots}</div>

          ${careersList}

          <div class="koin-work-total-row">
            <span>💰 累计薪资收入</span>
            <span class="koin-work-total-num">${state.work.totalEarned || 0} 🪙</span>
          </div>
        </div>
      </div>
    `;
  }

  // ── Inject into City Page ─────────────────────────────────────────────────

  function injectWorkHub() {
    if (!ensureWorkState()) return;
    injectWorkStyles();

    const pageCity = $safe('page-city');
    if (!pageCity) return;

    const existing = $safe('workCenterHub');
    if (existing) existing.remove();

    // Insert after roomUpgradeHub if present, else after careerHub, else append
    const roomHub   = $safe('roomUpgradeHub');
    const careerHub = $safe('careerHub');
    const anchor    = roomHub || careerHub || pageCity.lastElementChild;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderWorkCenter();
    const hub = wrapper.firstElementChild;

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(hub, anchor.nextSibling);
    } else {
      pageCity.appendChild(hub);
    }
  }

  // ── Patch render() ────────────────────────────────────────────────────────

  const _originalRender = window.render;
  if (typeof _originalRender === 'function' && !window.__koinWorkRenderPatchedV1) {
    window.__koinWorkRenderPatchedV1 = true;

    window.render = function patchedRenderWork() {
      _originalRender();
      injectWorkStyles();
      injectWorkHub();
    };
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  ensureWorkState();
  injectWorkStyles();
  injectWorkHub();
  safeSave();

  if (typeof render === 'function') render();

  console.log('[Koin City V2] Work Center Patch v1 loaded');

})();
