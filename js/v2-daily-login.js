// Koin City V2 — Daily Login Reward Patch v1
// New file: js/v2-daily-login.js
// Load AFTER js/app.js

(function () {

  // ── Helpers ───────────────────────────────────────────────────────────────

  function safeSave() {
    if (typeof save === 'function') save();
  }

  function safeRender() {
    if (typeof render === 'function') render();
  }

  function safeAddReward(coins, xp) {
    if (typeof addReward === 'function') {
      addReward(coins, xp);
    } else {
      if (window.state) {
        state.coins = (state.coins || 0) + coins;
        state.xp    = (state.xp    || 0) + xp;
      }
    }
  }

  function safeBurst(msg) {
    if (typeof createCoinBurst === 'function') createCoinBurst(msg);
  }

  function safeToast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  // ── Reward Table ──────────────────────────────────────────────────────────

  const LOGIN_REWARDS = [
    { day: 1, coins: 50,  xp: 5,  emoji: '🌟', label: '第1天', special: null },
    { day: 2, coins: 80,  xp: 8,  emoji: '💫', label: '第2天', special: null },
    { day: 3, coins: 100, xp: 12, emoji: '⚡', label: '第3天', special: null },
    { day: 4, coins: 100, xp: 12, emoji: '🔥', label: '第4天', special: null },
    { day: 5, coins: 120, xp: 15, emoji: '💎', label: '第5天', special: null },
    { day: 6, coins: 120, xp: 15, emoji: '🏆', label: '第6天', special: null },
    { day: 7, coins: 200, xp: 30, emoji: '📦', label: '第7天', special: '宝箱！双倍奖励' },
  ];

  // ── State Init ────────────────────────────────────────────────────────────

  function ensureLoginState() {
    if (!window.state) return false;

    if (!state.login) {
      state.login = {
        lastLoginDate: '',
        loginStreak:   0,
        totalLogins:   0,
      };
      safeSave();
    }

    if (typeof state.login.lastLoginDate === 'undefined') state.login.lastLoginDate = '';
    if (typeof state.login.loginStreak   === 'undefined') state.login.loginStreak   = 0;
    if (typeof state.login.totalLogins   === 'undefined') state.login.totalLogins   = 0;

    return true;
  }

  // ── Logic ─────────────────────────────────────────────────────────────────

  function hasClaimedToday() {
    if (!ensureLoginState()) return true; // block if state not ready
    return state.login.lastLoginDate === todayStr();
  }

  function getCurrentReward() {
    if (!ensureLoginState()) return LOGIN_REWARDS[0];
    const idx = (state.login.loginStreak) % 7; // 0-based index into 7-day cycle
    return LOGIN_REWARDS[idx] || LOGIN_REWARDS[0];
  }

  // ── Claim Action ──────────────────────────────────────────────────────────

  window.claimLoginReward = function claimLoginReward() {
    if (!ensureLoginState()) return;
    if (hasClaimedToday()) return;

    const reward = getCurrentReward();

    // Update streak
    if (state.login.lastLoginDate === yesterdayStr()) {
      state.login.loginStreak += 1;
    } else {
      state.login.loginStreak = 1; // reset (first time or broken streak)
    }

    state.login.lastLoginDate = todayStr();
    state.login.totalLogins  += 1;

    // Double reward on Day 7
    const multiplier = reward.special ? 2 : 1;
    const coins      = reward.coins * multiplier;
    const xp         = reward.xp    * multiplier;

    safeAddReward(coins, xp);
    safeSave();
    safeRender();

    // Close popup
    const popup = document.getElementById('loginPopup');
    if (popup) popup.remove();

    safeBurst(`+${coins} 🪙`);
    safeToast(`🎁 签到奖励已领取！连续 ${state.login.loginStreak} 天`);
  };

  // ── Render Popup ──────────────────────────────────────────────────────────

  function showLoginPopup() {
    if (hasClaimedToday()) return;
    if (document.getElementById('loginPopup')) return;
    if (!ensureLoginState()) return;

    const streak     = state.login.loginStreak;
    const reward     = getCurrentReward();
    const multiplier = reward.special ? 2 : 1;
    const daysToChest = 7 - (streak % 7);

    // 7-slot strip
    const slots = LOGIN_REWARDS.map((r, i) => {
      const claimed   = i < (streak % 7);
      const isCurrent = i === (streak % 7);
      return `
        <div class="lp-slot ${claimed ? 'claimed' : ''} ${isCurrent ? 'current' : ''}">
          <div class="lp-slot-emoji">${claimed ? '✅' : r.emoji}</div>
          <div class="lp-slot-label">${r.label}</div>
          <div class="lp-slot-coins">${r.special ? r.special : '+' + r.coins}</div>
        </div>`;
    }).join('');

    const popup = document.createElement('div');
    popup.id = 'loginPopup';
    popup.innerHTML = `
      <div class="lp-overlay" id="lpOverlay"></div>
      <div class="lp-card">

        <div class="lp-header">
          <div class="lp-header-emoji">${reward.emoji}</div>
          <div class="lp-header-title">每日登录礼包</div>
          <div class="lp-streak-pill">🔥 连续 ${Math.max(streak, 0)} 天</div>
        </div>

        <div class="lp-slots">${slots}</div>

        <div class="lp-today-box">
          <div class="lp-today-label">今日奖励</div>
          <div class="lp-today-reward">
            <span class="lp-today-emoji">${reward.emoji}</span>
            <span class="lp-today-coins">
              ${reward.special ? '🎁 ' + reward.special : '+' + (reward.coins * multiplier) + ' 🪙'}
            </span>
            <span class="lp-today-xp">+${reward.xp * multiplier} XP</span>
          </div>
          ${!reward.special
            ? `<div class="lp-chest-hint">再签到 <b>${daysToChest}</b> 天可以领宝箱 📦</div>`
            : ''}
        </div>

        <button class="lp-claim-btn" id="lpClaimBtn">🎁 领取今日奖励</button>
        <div class="lp-skip" id="lpSkip">稍后再领</div>

      </div>
    `;

    document.body.appendChild(popup);

    // Events via JS (no inline onclick)
    document.getElementById('lpClaimBtn').addEventListener('click', function () {
      window.claimLoginReward();
    });

    document.getElementById('lpSkip').addEventListener('click', function () {
      const p = document.getElementById('loginPopup');
      if (p) p.remove();
    });

    document.getElementById('lpOverlay').addEventListener('click', function () {
      const p = document.getElementById('loginPopup');
      if (p) p.remove();
    });
  }

  // ── Boot: show popup on load ──────────────────────────────────────────────

  function boot() {
    ensureLoginState();
    setTimeout(showLoginPopup, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  console.log('[Koin City V2] Daily Login Reward Patch v1 loaded');

})();
