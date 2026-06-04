// Koin City V2 — Work Center Patch v2
// New file: js/v2-work-center.js
// Load AFTER js/v2-career-unlock.js

(function () {

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  // ── Salary per career id ──────────────────────────────────────────────────
  // Keys match career ids in v2-career-unlock.js

  const DAILY_SALARY = {
    fitness_coach:   { amount: 220, emoji: '🏋️' },
    game_designer:   { amount: 260, emoji: '🎮' },
    entrepreneur:    { amount: 350, emoji: '🧑‍💼' },
    ai_engineer:     { amount: 320, emoji: '🤖' },
    property_expert: { amount: 330, emoji: '🏠' },
    content_creator: { amount: 280, emoji: '🎬' },
  };

  // ── 7-day streak bonus table ──────────────────────────────────────────────

  const STREAK_BONUSES = [
    { day: 1, bonus: 50,  label: 'Day 1', special: false },
    { day: 2, bonus: 80,  label: 'Day 2', special: false },
    { day: 3, bonus: 100, label: 'Day 3', special: false },
    { day: 4, bonus: 100, label: 'Day 4', special: false },
    { day: 5, bonus: 120, label: 'Day 5', special: false },
    { day: 6, bonus: 120, label: 'Day 6', special: false },
    { day: 7, bonus: 0,   label: 'Day 7', special: true  },
  ];

  const CHEST_REWARD = { coins: 300, xp: 50 };

  // ── State init ────────────────────────────────────────────────────────────

  function ensureWorkState() {
    if (!window.state) return false;

    if (!state.work) {
      state.work = {
        lastWorkDate: null,
        workStreak:   0,
        totalEarned:  0,
        chestClaimed: []
      };
    }

    if (typeof state.work.lastWorkDate === 'undefined') state.work.lastWorkDate = null;
    if (typeof state.work.workStreak   === 'undefined') state.work.workStreak   = 0;
    if (typeof state.work.totalEarned  === 'undefined') state.work.totalEarned  = 0;
    if (!Array.isArray(state.work.chestClaimed))        state.work.chestClaimed = [];

    return true;
  }

  // ── Career helpers ────────────────────────────────────────────────────────

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

  // ── Claim salary ──────────────────────────────────────────────────────────

  window.claimDailySalary = function () {
    if (!ensureWorkState()) return;

    const career = getSelectedCareer();

    if (!career) {
      safeToast('先去 Career Center 追踪一个职业，才可以上班！');
      return;
    }

    if (!isCareerUnlocked(career.id)) {
      safeToast(`${career.name} 还没解锁，继续提升能力吧！`);
      return;
    }

    const today = todayKey();
    if (state.work.lastWorkDate === today) {
      safeToast('今天已经上班了，明天再来！💼');
      return;
    }

    // Update streak
    if (state.work.lastWorkDate === yesterdayKey()) {
      state.work.workStreak += 1;
    } else {
      state.work.workStreak = 1;
    }
    state.work.lastWorkDate = today;

    // Salary
    const salDef      = DAILY_SALARY[career.id];
    const baseSalary  = salDef ? salDef.amount : 200;
    const streakPos   = (state.work.workStreak - 1) % 7;
    const streakEntry = STREAK_BONUSES[streakPos];
    const bonus       = streakEntry ? streakEntry.bonus : 0;
    const isChestDay  = streakEntry ? streakEntry.special : false;
    const cycleNum    = Math.floor((state.work.workStreak - 1) / 7);

    let totalCoins = baseSalary + bonus;
    let totalXp    = 20;
    let extraMsg   = '';

    if (isChestDay && !state.work.chestClaimed.includes(cycleNum)) {
      state.work.chestClaimed.push(cycleNum);
      totalCoins += CHEST_REWARD.coins;
      totalXp    += CHEST_REWARD.xp;
      extraMsg    = ` + 🎁 宝箱 +${CHEST_REWARD.coins}🪙`;
    }

    if (typeof addReward === 'function') {
      addReward(totalCoins, totalXp);
    } else {
      state.coins = (state.coins || 0) + totalCoins;
      state.xp    = (state.xp    || 0) + totalXp;
    }

    state.work.totalEarned = (state.work.totalEarned || 0) + totalCoins;

    safeBurst(`+${totalCoins} 🪙`);
    safeToast(
      `${career.emoji || '💼'} 薪资 +${baseSalary}` +
      (bonus ? ` · 连续奖励 +${bonus}` : '') +
      extraMsg
    );

    safeSave();
    if (typeof render === 'function') render();
  };

  window.selectCareerFromWork = function (careerId) {
    if (typeof selectCareer === 'function') selectCareer(careerId);
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  function injectWorkStyles() {
    if ($safe('koinWorkStyles')) return;

    const style = document.createElement('style');
    style.id = 'koinWorkStyles';
    style.textContent = `
      #workCenterHub { margin: 14px 16px; }

      .kwc-hero {
        background: linear-gradient(145deg, #0f2027, #203a43, #2c5364);
        border-radius: 26px 26px 0 0;
        padding: 20px;
        position: relative;
        overflow: hidden;
      }
      .kwc-hero::after {
        content: '';
        position: absolute;
        width: 160px; height: 160px;
        border-radius: 50%;
        background: rgba(255,255,255,.07);
        right: -50px; bottom: -60px;
      }
      .kwc-hero-row {
        display: flex; align-items: center; gap: 14px;
        position: relative; z-index: 1;
      }
      .kwc-hero-icon {
        width: 52px; height: 52px; border-radius: 18px;
        background: rgba(255,255,255,.13);
        border: 1.5px solid rgba(255,255,255,.22);
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; flex-shrink: 0;
      }
      .kwc-hero h2 { color: #fff; font-size: 17px; font-weight: 900; margin: 0 0 4px; }
      .kwc-hero p  { color: rgba(255,255,255,.72); font-size: 12px; line-height: 1.5; margin: 0; }

      .kwc-salary-strip {
        position: relative; z-index: 1;
        margin-top: 16px;
        background: rgba(255,255,255,.10);
        border: 1.5px solid rgba(255,255,255,.18);
        border-radius: 18px;
        padding: 12px 14px;
        display: flex; align-items: center;
        justify-content: space-between; gap: 12px;
      }
      .kwc-salary-meta  { flex: 1; min-width: 0; }
      .kwc-salary-amount {
        font-size: 26px; font-weight: 1000;
        color: #FFD23F; line-height: 1;
      }
      .kwc-salary-amount small {
        font-size: 13px; color: rgba(255,255,255,.55); font-weight: 700;
      }
      .kwc-salary-sub {
        font-size: 11px; color: rgba(255,255,255,.6);
        font-weight: 800; margin-top: 3px;
      }

      .kwc-claim-btn {
        all: unset; box-sizing: border-box;
        padding: 12px 20px; border-radius: 14px;
        background: linear-gradient(135deg, #FFD23F, #FF8C42);
        color: #fff; font-size: 14px; font-weight: 900;
        cursor: pointer; flex-shrink: 0; white-space: nowrap;
        box-shadow: 0 6px 18px rgba(255,140,66,.4);
        transition: transform .15s, box-shadow .15s;
        animation: kwcPulse 1.8s ease-in-out infinite;
      }
      .kwc-claim-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 26px rgba(255,140,66,.55);
      }
      .kwc-claim-btn.done {
        background: rgba(255,255,255,.18);
        color: rgba(255,255,255,.5);
        box-shadow: none; cursor: default;
        transform: none; animation: none;
      }
      @keyframes kwcPulse {
        0%,100% { box-shadow: 0 6px 18px rgba(255,140,66,.4); }
        50%      { box-shadow: 0 6px 28px rgba(255,140,66,.7); }
      }

      .kwc-body {
        background: #fff;
        border-radius: 0 0 26px 26px;
        border: 1.5px solid rgba(124,92,252,.12);
        border-top: none;
        padding: 16px;
        box-shadow: 0 8px 28px rgba(124,92,252,.08);
      }

      .kwc-done-note {
        background: rgba(114,225,40,.12);
        border-radius: 12px; padding: 8px 12px;
        font-size: 12px; font-weight: 800; color: #2d6a19;
        margin-bottom: 14px; display: none;
      }
      .kwc-done-note.visible { display: block; }

      .kwc-streak-label {
        font-size: 13px; font-weight: 900; margin-bottom: 10px;
        display: flex; align-items: center; gap: 8px;
      }
      .kwc-streak-label span { font-size: 11px; color: var(--muted,#756e83); font-weight: 700; }

      .kwc-streak-row { display: flex; gap: 5px; align-items: flex-end; }

      .kwc-streak-slot { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }

      .kwc-streak-bubble {
        width: 100%; aspect-ratio: 1;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 900;
        border: 2px solid rgba(124,92,252,.14);
        background: rgba(124,92,252,.05);
        color: var(--muted,#756e83);
        transition: all .2s;
      }
      .kwc-streak-bubble.done {
        background: linear-gradient(135deg,#7C5CFC,#FF8C42);
        color: #fff; border-color: transparent;
        box-shadow: 0 3px 10px rgba(124,92,252,.28);
      }
      .kwc-streak-bubble.today {
        background: linear-gradient(135deg,#72E128,#06C8A8);
        color: #fff; border-color: transparent;
        box-shadow: 0 3px 10px rgba(114,225,40,.32);
        animation: kwcSlotPulse 1.5s ease-in-out infinite;
      }
      .kwc-streak-bubble.chest { font-size: 16px; }
      @keyframes kwcSlotPulse {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.1); }
      }
      .kwc-streak-day-lbl {
        font-size: 8.5px; font-weight: 900;
        color: var(--muted,#756e83); text-align: center;
      }
      .kwc-streak-bonus-lbl {
        font-size: 8.5px; font-weight: 900;
        color: var(--violet,#7C5CFC); text-align: center;
      }

      .kwc-careers-label { font-size: 13px; font-weight: 900; margin: 14px 0 8px; }
      .kwc-career-list   { display: grid; gap: 8px; }
      .kwc-career-row {
        display: flex; align-items: center; gap: 10px;
        padding: 11px 12px; border-radius: 16px;
        border: 1.5px solid rgba(124,92,252,.12);
        background: linear-gradient(145deg,#fff,#f9f6ff);
        cursor: pointer;
        transition: border-color .15s, box-shadow .15s;
      }
      .kwc-career-row:hover { border-color: rgba(124,92,252,.3); box-shadow: 0 4px 14px rgba(124,92,252,.10); }
      .kwc-career-row.active { border-color: rgba(114,225,40,.45); background: linear-gradient(145deg,#fff,#f4fff0); }
      .kwc-career-emoji { font-size: 24px; width: 36px; text-align: center; flex-shrink: 0; }
      .kwc-career-info  { flex: 1; min-width: 0; }
      .kwc-career-name  { font-size: 13px; font-weight: 900; }
      .kwc-career-sal   { font-size: 11px; color: var(--violet,#7C5CFC); font-weight: 800; margin-top: 2px; }
      .kwc-career-badge {
        font-size: 10px; font-weight: 900;
        padding: 4px 9px; border-radius: 999px; flex-shrink: 0;
        background: rgba(124,92,252,.10); color: var(--violet,#7C5CFC);
      }
      .kwc-career-badge.active { background: rgba(114,225,40,.18); color: #2d6a19; }

      .kwc-empty {
        text-align: center; padding: 18px 12px;
        font-size: 13px; color: var(--muted,#756e83);
        font-weight: 700; line-height: 1.6;
      }

      .kwc-total {
        display: flex; align-items: center; justify-content: space-between;
        margin-top: 14px; padding: 10px 14px;
        border-radius: 14px; background: rgba(124,92,252,.06);
        font-size: 12px; font-weight: 900;
      }
      .kwc-total span { font-size: 15px; color: var(--violet,#7C5CFC); }
    `;
    document.head.appendChild(style);
  }

  // ── Build HTML ────────────────────────────────────────────────────────────

  function buildWorkHub() {
    if (!ensureWorkState()) return '';

    const today          = todayKey();
    const claimedToday   = state.work.lastWorkDate === today;
    const selectedCareer = getSelectedCareer();
    const unlockedList   = getUnlockedCareers();
    const streak         = state.work.workStreak || 0;

    // Salary strip
    let salaryHTML = '';
    if (!selectedCareer) {
      salaryHTML = `
        <div class="kwc-salary-strip">
          <div class="kwc-salary-meta">
            <div class="kwc-salary-amount">-- 🪙</div>
            <div class="kwc-salary-sub">先去 Career Center 追踪职业</div>
          </div>
          <button class="kwc-claim-btn done">🔒 未追踪</button>
        </div>`;
    } else if (!isCareerUnlocked(selectedCareer.id)) {
      salaryHTML = `
        <div class="kwc-salary-strip">
          <div class="kwc-salary-meta">
            <div class="kwc-salary-amount">${selectedCareer.emoji} 未解锁</div>
            <div class="kwc-salary-sub">继续提升能力，才能开始上班</div>
          </div>
          <button class="kwc-claim-btn done">🔒 未解锁</button>
        </div>`;
    } else {
      const salDef    = DAILY_SALARY[selectedCareer.id];
      const base      = salDef ? salDef.amount : 200;
      const sPos      = streak > 0 ? ((streak - 1) % 7) : 0;
      const nextEntry = !claimedToday ? STREAK_BONUSES[sPos] : null;
      const nextBonus = nextEntry ? nextEntry.bonus : 0;
      const nextChest = nextEntry ? nextEntry.special : false;

      salaryHTML = `
        <div class="kwc-salary-strip">
          <div class="kwc-salary-meta">
            <div class="kwc-salary-amount">
              +${base}${nextBonus ? `<small> +${nextBonus}</small>` : ''}${nextChest ? '<small> +🎁</small>' : ''} 🪙
            </div>
            <div class="kwc-salary-sub">
              ${selectedCareer.emoji} ${selectedCareer.name}
              ${nextBonus ? ' · 含连续奖励' : ''}${nextChest ? ' · 含宝箱' : ''}
            </div>
          </div>
          <button class="kwc-claim-btn ${claimedToday ? 'done' : ''}" data-work-claim="1">
            ${claimedToday ? '✅ 已上班' : '💼 上班'}
          </button>
        </div>`;
    }

    // Streak bubbles
    const streakDayInCycle = streak > 0 ? ((streak - 1) % 7) + 1 : 0;
    const streakBubbles = STREAK_BONUSES.map((s, i) => {
      const n       = i + 1;
      const isDone  = streak > 0 && n < streakDayInCycle;
      const isToday = streak > 0 && n === streakDayInCycle && claimedToday;
      let cls = 'kwc-streak-bubble' + (isDone ? ' done' : '') + (isToday ? ' today' : '') + (s.special ? ' chest' : '');
      return `
        <div class="kwc-streak-slot">
          <div class="${cls}">${s.special ? '🎁' : (isDone || isToday ? '✓' : n)}</div>
          <div class="kwc-streak-day-lbl">${s.label}</div>
          <div class="kwc-streak-bonus-lbl">${s.special ? '宝箱' : s.bonus ? `+${s.bonus}` : ''}</div>
        </div>`;
    }).join('');

    // Unlocked careers
    let careersHTML = '';
    if (unlockedList.length === 0) {
      careersHTML = `<div class="kwc-empty">
        还没有解锁任何职业。<br>去 Career Center 提升能力，达到条件自动解锁！
      </div>`;
    } else {
      const rows = unlockedList.map(c => {
        const sal      = (DAILY_SALARY[c.id] || {}).amount || 200;
        const isActive = selectedCareer && selectedCareer.id === c.id;
        return `
          <div class="kwc-career-row ${isActive ? 'active' : ''}" data-work-select="${c.id}">
            <div class="kwc-career-emoji">${c.emoji}</div>
            <div class="kwc-career-info">
              <div class="kwc-career-name">${c.name}</div>
              <div class="kwc-career-sal">每日薪资 +${sal} 🪙</div>
            </div>
            <div class="kwc-career-badge ${isActive ? 'active' : ''}">${isActive ? '✅ 工作中' : '切换'}</div>
          </div>`;
      }).join('');
      careersHTML = `
        <div class="kwc-careers-label">💼 已解锁职业</div>
        <div class="kwc-career-list">${rows}</div>`;
    }

    return `
      <div id="workCenterHub">
        <div class="kwc-hero">
          <div class="kwc-hero-row">
            <div class="kwc-hero-icon">💼</div>
            <div>
              <h2>工作中心</h2>
              <p>每天上班领薪资，连续 7 天解锁宝箱。职业等级越高，薪资越高！</p>
            </div>
          </div>
          ${salaryHTML}
        </div>
        <div class="kwc-body">
          ${claimedToday ? '<div class="kwc-done-note visible">✅ 今天已上班！明天记得回来继续连续奖励。</div>' : ''}
          <div class="kwc-streak-label">🔥 连续工作奖励 <span>已连续 ${streak} 天</span></div>
          <div class="kwc-streak-row">${streakBubbles}</div>
          ${careersHTML}
          <div class="kwc-total">
            <div>💰 累计薪资收入</div>
            <span>${(state.work.totalEarned || 0).toLocaleString()} 🪙</span>
          </div>
        </div>
      </div>`;
  }

  // ── Inject into city page ─────────────────────────────────────────────────

  function injectWorkHub() {
    if (!ensureWorkState()) return;
    injectWorkStyles();

    const pageCity = $safe('page-city');
    if (!pageCity) return;

    const existing = $safe('workCenterHub');
    if (existing) {
      const fresh = document.createElement('div');
      fresh.innerHTML = buildWorkHub();
      existing.replaceWith(fresh.firstElementChild);
      return;
    }

    const anchor = $safe('careerHub') || $safe('locationGrowthHub') || null;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildWorkHub();
    const hub = wrapper.firstElementChild;
    if (!hub) return;

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(hub, anchor.nextSibling);
    } else {
      pageCity.appendChild(hub);
    }
  }

  // ── Event delegation ──────────────────────────────────────────────────────

  document.body.addEventListener('click', function (e) {
    const claimBtn = e.target.closest('[data-work-claim]');
    if (claimBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.claimDailySalary();
      return;
    }
    const selectBtn = e.target.closest('[data-work-select]');
    if (selectBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.selectCareerFromWork(selectBtn.dataset.workSelect);
      return;
    }
  }, true);

  // ── Patch render() ────────────────────────────────────────────────────────

  const _origRender = window.render;
  if (typeof _origRender === 'function' && !window.__koinWorkRenderPatchedV2) {
    window.__koinWorkRenderPatchedV2 = true;
    window.render = function patchedRenderWorkV2() {
      _origRender();
      injectWorkStyles();
      injectWorkHub();
    };
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  ensureWorkState();
  injectWorkStyles();
  injectWorkHub();
  safeSave();

  console.log('[Koin City V2] Work Center Patch v2 loaded');

})();
