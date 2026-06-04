/* ═══════════════════════════════════════════════════════════
   v2-daily-login.js
   🎁 每日登录礼包 + 连续签到奖励系统
   - 每次打开 app 自动弹出（每天一次）
   - Day 1→2→3→7 递增奖励，Day7 = 宝箱
   - streak 断了：温柔提醒 + 重置，不惩罚
   依赖: state.js / systems.js / ui.js 已加载
   ═══════════════════════════════════════════════════════════ */

/* ── 签到奖励定义 ─────────────────────────────────────────── */
const loginRewards = [
  { day: 1,  coins: 50,  xp: 5,  emoji: '🌟', label: '第1天',  special: null },
  { day: 2,  coins: 80,  xp: 8,  emoji: '💫', label: '第2天',  special: null },
  { day: 3,  coins: 100, xp: 12, emoji: '⚡', label: '第3天',  special: null },
  { day: 4,  coins: 100, xp: 12, emoji: '🔥', label: '第4天',  special: null },
  { day: 5,  coins: 120, xp: 15, emoji: '💎', label: '第5天',  special: null },
  { day: 6,  coins: 120, xp: 15, emoji: '🏆', label: '第6天',  special: null },
  { day: 7,  coins: 200, xp: 30, emoji: '📦', label: '第7天',  special: '宝箱！双倍奖励' },
];

/* ── 扩展 state ───────────────────────────────────────────── */
function ensureLoginState() {
  if (!state.login) {
    state.login = {
      lastLoginDate: '',   // 'YYYY-MM-DD' 格式
      loginStreak:   0,    // 连续登录天数
      totalLogins:   0,    // 历史总登录
    };
    save();
  }
}

/* ── 今日日期字符串 ───────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* ── 今天是否已经签到 ─────────────────────────────────────── */
function hasClaimedToday() {
  ensureLoginState();
  return state.login.lastLoginDate === todayStr();
}

/* ── 当前连续天数对应的奖励 (循环 7 天) ────────────────────── */
function getCurrentLoginReward() {
  ensureLoginState();
  const idx = ((state.login.loginStreak) % 7); // 0-based → 第 1-7 天
  return loginRewards[idx] || loginRewards[0];
}

/* ── 领取今日签到奖励 ─────────────────────────────────────── */
function claimLoginReward() {
  ensureLoginState();
  const reward = getCurrentLoginReward();

  // 更新 streak
  const last = state.login.lastLoginDate;
  if (last === yesterdayStr()) {
    state.login.loginStreak += 1;           // 连续
  } else if (last !== todayStr()) {
    state.login.loginStreak = 1;            // 断掉或首次，重新开始
  }

  state.login.lastLoginDate = todayStr();
  state.login.totalLogins  += 1;

  // 发放奖励（宝箱双倍）
  const multiplier = reward.special ? 2 : 1;
  addReward(reward.coins * multiplier, reward.xp * multiplier);

  save();
  render();

  // 关闭弹窗
  const popup = document.getElementById('loginPopup');
  if (popup) popup.remove();

  createCoinBurst(`+${reward.coins * multiplier} 🪙`);
  showToast(`🎁 签到奖励已领取！连续 ${state.login.loginStreak} 天`);
}

/* ── 渲染签到弹窗 ─────────────────────────────────────────── */
function showLoginPopup() {
  if (hasClaimedToday()) return;             // 今天已领，不弹
  if (document.getElementById('loginPopup')) return; // 已经存在

  ensureLoginState();
  const streak  = state.login.loginStreak;
  const reward  = getCurrentLoginReward();
  const multiplier = reward.special ? 2 : 1;

  // 算下一个特殊奖励还差几天
  const daysToChest = 7 - (streak % 7);

  // 7格进度格子
  const slots = loginRewards.map((r, i) => {
    const dayNum    = i + 1;
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
    <div class="lp-overlay" onclick="document.getElementById('loginPopup').remove()"></div>
    <div class="lp-card">

      <!-- Top glow header -->
      <div class="lp-header">
        <div class="lp-header-emoji">${reward.emoji}</div>
        <div class="lp-header-title">每日登录礼包</div>
        <div class="lp-streak-pill">🔥 连续 ${Math.max(streak, 0)} 天</div>
      </div>

      <!-- 7-slot progress strip -->
      <div class="lp-slots">${slots}</div>

      <!-- Today's reward highlight -->
      <div class="lp-today-box">
        <div class="lp-today-label">今日奖励</div>
        <div class="lp-today-reward">
          <span class="lp-today-emoji">${reward.emoji}</span>
          <span class="lp-today-coins">${reward.special ? '🎁 ' + reward.special : '+' + (reward.coins * multiplier) + ' 🪙'}</span>
          <span class="lp-today-xp">+${reward.xp * multiplier} XP</span>
        </div>
        ${daysToChest <= 7 && !reward.special
          ? `<div class="lp-chest-hint">再签到 <b>${daysToChest}</b> 天可以领宝箱 📦</div>`
          : ''}
      </div>

      <!-- CTA -->
      <button class="lp-claim-btn" onclick="claimLoginReward()">
        🎁 领取今日奖励
      </button>

      <div class="lp-skip" onclick="document.getElementById('loginPopup').remove()">
        稍后再领
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

/* ── App 启动时自动触发 ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  ensureLoginState();
  // 延迟 800ms，等页面渲染完
  setTimeout(showLoginPopup, 800);
});
