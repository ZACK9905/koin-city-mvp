// Koin City V2 — Room Upgrade & Furniture Bonus Patch v1
// New file: js/v2-room-upgrade.js
// Load AFTER js/v2-career-unlock.js and js/v2-npc-ui-fix.js

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

  function clampStat(v) {
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  // ── Room Definitions ─────────────────────────────────────────────────────

  const ROOM_LEVELS = [
    {
      level: 0,
      name: '木屋',
      emoji: '🏚️',
      desc: '简陋但温暖的起点。最多摆放 4 件家具。',
      slots: 4,
      upgradeCost: 300,
      upgradeLabel: '升级到公寓'
    },
    {
      level: 1,
      name: '公寓',
      emoji: '🏠',
      desc: '舒适的城市小公寓。最多摆放 8 件家具。',
      slots: 8,
      upgradeCost: 800,
      upgradeLabel: '升级到豪宅'
    },
    {
      level: 2,
      name: '豪宅',
      emoji: '🏡',
      desc: '宽敞豪华的大宅。最多摆放 12 件家具。',
      slots: 12,
      upgradeCost: null,
      upgradeLabel: '已达最高等级'
    }
  ];

  // ── Furniture Bonus Definitions ───────────────────────────────────────────
  // stat: which stat gets the bonus
  // bonus: flat points added each time the daily bonus is applied
  // category: for display grouping

  const FURNITURE_BONUSES = {
    desk:        { stat: 'knowledge',   bonus: 2, label: '书桌',     emoji: '🪑', desc: '每日知识 +2' },
    lamp:        { stat: 'knowledge',   bonus: 1, label: '台灯',     emoji: '💡', desc: '每日知识 +1' },
    treadmill:   { stat: 'fitness',     bonus: 2, label: '跑步机',   emoji: '🏃', desc: '每日活力 +2' },
    computer:    { stat: 'creativity',  bonus: 2, label: '电脑',     emoji: '💻', desc: '每日创意 +2' },
    bookshelf:   { stat: 'judgment',    bonus: 2, label: '书架',     emoji: '📚', desc: '每日判断力 +2' },
    plant:       { stat: 'emotion',     bonus: 2, label: '绿植',     emoji: '🌿', desc: '每日情绪 +2' },
    tree:        { stat: 'emotion',     bonus: 1, label: '盆栽',     emoji: '🌳', desc: '每日情绪 +1' },
    sofa:        { stat: 'resilience',  bonus: 2, label: '沙发',     emoji: '🛋️', desc: '每日抗挫力 +2' },
    trophy:      { stat: 'confidence',  bonus: 2, label: '奖杯',     emoji: '🏆', desc: '每日自信 +2' },
    whiteboard:  { stat: 'discipline',  bonus: 2, label: '白板',     emoji: '📋', desc: '每日自律 +2' },
    starterDesk: { stat: 'knowledge',   bonus: 1, label: '新手书桌', emoji: '📚', desc: '每日知识 +1' }
  };

  // ── State Initialisation ──────────────────────────────────────────────────

  function ensureRoomState() {
    if (!window.state) return false;

    if (typeof state.houseLevel !== 'number') state.houseLevel = 0;
    if (!Array.isArray(state.inventory))      state.inventory  = [];

    if (!state.roomUpgrade) {
      state.roomUpgrade = {
        furnitureBonusDate: null   // tracks last daily-bonus application
      };
    }

    return true;
  }

  // ── Daily Furniture Bonus ─────────────────────────────────────────────────
  // Called once per calendar day. Loops through inventory items that have
  // a defined bonus and applies +stat to state.stats.

  function applyDailyFurnitureBonus() {
    if (!ensureRoomState()) return;

    const today = (function () {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    if (state.roomUpgrade.furnitureBonusDate === today) return; // already applied today
    state.roomUpgrade.furnitureBonusDate = today;

    const roomDef  = ROOM_LEVELS[Math.min(state.houseLevel, ROOM_LEVELS.length - 1)];
    const slotLimit = roomDef.slots;

    // Only count furniture up to the current slot limit
    const activeFurniture = state.inventory
      .filter(type => FURNITURE_BONUSES[type])
      .slice(0, slotLimit);

    if (!activeFurniture.length) {
      safeSave();
      return;
    }

    // Aggregate bonuses (multiple of same item stack)
    const totals = {};
    activeFurniture.forEach(type => {
      const fb = FURNITURE_BONUSES[type];
      totals[fb.stat] = (totals[fb.stat] || 0) + fb.bonus;
    });

    if (!state.stats) state.stats = {};
    Object.entries(totals).forEach(([stat, amount]) => {
      state.stats[stat] = clampStat((state.stats[stat] || 0) + amount);
    });

    const summary = Object.entries(totals)
      .map(([s, v]) => `+${v} ${s}`)
      .join(' · ');

    safeToast(`🛋️ 家具加成已生效：${summary}`);
    safeSave();
  }

  // ── Room Upgrade Action ───────────────────────────────────────────────────

  window.upgradeRoom = function upgradeRoom() {
    if (!ensureRoomState()) return;

    const currentLevel = Math.min(state.houseLevel, ROOM_LEVELS.length - 1);
    const current      = ROOM_LEVELS[currentLevel];

    if (!current.upgradeCost) {
      safeToast('已经是最高级别的房间了！');
      return;
    }

    const next = ROOM_LEVELS[currentLevel + 1];
    if (!next) return;

    if (state.coins < current.upgradeCost) {
      alert(`金币不足！升级到${next.name}需要 ${current.upgradeCost} 金币。\n\n继续完成任务和地点成长来赚取金币吧。`);
      return;
    }

    state.coins    -= current.upgradeCost;
    state.houseLevel = currentLevel + 1;

    safeBurst(`🏠 升级！`);
    safeToast(`房间升级成功：${current.emoji} ${current.name} → ${next.emoji} ${next.name}！家具槽位增加到 ${next.slots} 个。`);
    safeSave();

    if (typeof render === 'function') render();
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  function injectRoomStyles() {
    const old = document.getElementById('koinRoomUpgradeStyles');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'koinRoomUpgradeStyles';
    style.textContent = `
      /* ── Room Upgrade Hub ── */
      .koin-room-hub {
        margin: 0 16px 16px;
        border-radius: 26px;
        overflow: hidden;
        border: 1.5px solid rgba(124,92,252,.14);
        box-shadow: 0 8px 28px rgba(124,92,252,.10);
      }

      .koin-room-hero {
        background: linear-gradient(145deg, #1A1034 0%, #3B2A8A 55%, #FF8C42 100%);
        padding: 20px 20px 16px;
        position: relative;
        overflow: hidden;
      }

      .koin-room-hero::before {
        content: '';
        position: absolute;
        width: 200px; height: 200px;
        border-radius: 50%;
        background: rgba(255,255,255,.07);
        right: -60px; top: -60px;
      }

      .koin-room-hero-row {
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        z-index: 1;
      }

      .koin-room-icon {
        width: 62px; height: 62px;
        border-radius: 20px;
        background: rgba(255,255,255,.15);
        display: flex; align-items: center; justify-content: center;
        font-size: 36px;
        flex-shrink: 0;
        border: 1.5px solid rgba(255,255,255,.22);
      }

      .koin-room-title {
        color: #fff;
        font-size: 18px;
        font-weight: 900;
        margin: 0 0 3px;
        line-height: 1.2;
      }

      .koin-room-subtitle {
        color: rgba(255,255,255,.75);
        font-size: 12px;
        line-height: 1.5;
      }

      .koin-room-slots-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        position: relative;
        z-index: 1;
      }

      .koin-room-slot-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        background: rgba(255,255,255,.3);
        transition: background .2s;
      }

      .koin-room-slot-dot.filled {
        background: #FF8C42;
      }

      .koin-room-slot-label {
        color: rgba(255,255,255,.7);
        font-size: 11px;
        font-weight: 800;
        margin-left: 4px;
      }

      /* ── Upgrade button ── */
      .koin-room-body {
        background: #fff;
        padding: 16px;
      }

      .koin-room-upgrade-btn {
        all: unset;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 14px 16px;
        border-radius: 18px;
        background: linear-gradient(135deg, #7C5CFC, #FF8C42);
        color: #fff;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(124,92,252,.30);
        transition: transform .15s, box-shadow .15s;
      }

      .koin-room-upgrade-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(124,92,252,.38);
      }

      .koin-room-upgrade-btn:disabled,
      .koin-room-upgrade-btn.maxed {
        background: linear-gradient(135deg,#b0a8c8,#c9b99a);
        box-shadow: none;
        cursor: default;
        transform: none;
      }

      .koin-room-upgrade-cost {
        font-size: 12px;
        opacity: .85;
        font-weight: 800;
      }

      /* ── Furniture Bonus Grid ── */
      .koin-furniture-section {
        margin: 14px 16px 0;
      }

      .koin-furniture-title {
        font-size: 15px;
        font-weight: 900;
        margin-bottom: 10px;
      }

      .koin-furniture-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 10px;
      }

      .koin-furniture-card {
        background: #fff;
        border-radius: 18px;
        padding: 12px;
        border: 1.5px solid rgba(124,92,252,.12);
        box-shadow: 0 4px 14px rgba(124,92,252,.07);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .koin-furniture-card.inactive {
        opacity: .45;
        border-style: dashed;
        box-shadow: none;
      }

      .koin-furniture-emoji {
        width: 38px; height: 38px;
        border-radius: 12px;
        background: rgba(124,92,252,.10);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }

      .koin-furniture-info {
        min-width: 0;
      }

      .koin-furniture-name {
        font-size: 13px;
        font-weight: 900;
        line-height: 1.2;
      }

      .koin-furniture-desc {
        font-size: 11px;
        color: var(--muted, #756e83);
        margin-top: 2px;
        font-weight: 700;
      }

      .koin-furniture-badge {
        display: inline-block;
        margin-top: 4px;
        padding: 2px 7px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 900;
        background: rgba(114,225,40,.18);
        color: #2d6a19;
      }

      .koin-furniture-badge.inactive-badge {
        background: rgba(0,0,0,.07);
        color: #999;
      }

      /* ── Slot overflow warning ── */
      .koin-slot-warning {
        margin: 10px 16px 0;
        padding: 10px 14px;
        border-radius: 14px;
        background: rgba(255,140,66,.10);
        border: 1px solid rgba(255,140,66,.25);
        font-size: 12px;
        font-weight: 800;
        color: #b05a00;
        display: none;
      }

      .koin-slot-warning.visible {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Render Room Hub ───────────────────────────────────────────────────────

  function renderRoomHub() {
    if (!ensureRoomState()) return;

    const levelIndex  = Math.min(state.houseLevel, ROOM_LEVELS.length - 1);
    const roomDef     = ROOM_LEVELS[levelIndex];
    const nextRoom    = ROOM_LEVELS[levelIndex + 1];

    // Count active furniture items (with bonuses) up to slot limit
    const furnitureItems = state.inventory.filter(t => FURNITURE_BONUSES[t]);
    const activeCount    = Math.min(furnitureItems.length, roomDef.slots);
    const hasOverflow    = furnitureItems.length > roomDef.slots;

    // Slot dots (max 12 shown, grouped)
    const dotCount = Math.min(roomDef.slots, 12);
    const dots = Array.from({ length: dotCount }, (_, i) =>
      `<div class="koin-room-slot-dot ${i < activeCount ? 'filled' : ''}"></div>`
    ).join('');

    // Upgrade button
    let upgradeBtn;
    if (!nextRoom) {
      upgradeBtn = `<button class="koin-room-upgrade-btn maxed" disabled>
        <span>🏆 已达最高等级</span>
        <span class="koin-room-upgrade-cost">${roomDef.slots} 个家具槽</span>
      </button>`;
    } else {
      const canAfford = state.coins >= roomDef.upgradeCost;
      upgradeBtn = `<button class="koin-room-upgrade-btn" id="koinRoomUpgradeBtn" onclick="upgradeRoom()">
        <span>🏠 ${roomDef.upgradeLabel}</span>
        <span class="koin-room-upgrade-cost">
          ${canAfford ? '✅' : '🪙'} ${roomDef.upgradeCost} 金币 → ${nextRoom.slots} 槽
        </span>
      </button>`;
    }

    // Furniture bonus cards — show owned items + empty slots
    const ownedBonusTypes = [...new Set(furnitureItems)]; // unique types
    const furnitureCards  = ownedBonusTypes.map((type, idx) => {
      const fb      = FURNITURE_BONUSES[type];
      const isActive = idx < roomDef.slots;
      return `
        <div class="koin-furniture-card ${isActive ? '' : 'inactive'}">
          <div class="koin-furniture-emoji">${fb.emoji}</div>
          <div class="koin-furniture-info">
            <div class="koin-furniture-name">${fb.label}</div>
            <div class="koin-furniture-desc">${fb.desc}</div>
            <span class="koin-furniture-badge ${isActive ? '' : 'inactive-badge'}">
              ${isActive ? '✅ 生效中' : '⚠️ 槽位已满'}
            </span>
          </div>
        </div>`;
    }).join('');

    const emptyMessage = ownedBonusTypes.length === 0
      ? `<div style="grid-column:span 2;text-align:center;padding:18px;color:var(--muted,#756e83);font-size:13px;font-weight:700">
           还没有家具。去奖励商店购买，家具会每天给你的成长加成。
         </div>`
      : '';

    return `
      <div class="koin-room-hub" id="roomUpgradeHub">
        <div class="koin-room-hero">
          <div class="koin-room-hero-row">
            <div class="koin-room-icon">${roomDef.emoji}</div>
            <div>
              <div class="koin-room-title">${roomDef.name}</div>
              <div class="koin-room-subtitle">${roomDef.desc}</div>
            </div>
          </div>
          <div class="koin-room-slots-row">
            ${dots}
            <span class="koin-room-slot-label">${activeCount}/${roomDef.slots} 家具槽</span>
          </div>
        </div>
        <div class="koin-room-body">
          ${upgradeBtn}
        </div>
      </div>

      ${hasOverflow ? `
        <div class="koin-slot-warning visible">
          ⚠️ 你有 ${furnitureItems.length - roomDef.slots} 件家具超出了当前槽位，不会生效。升级房间来解锁更多槽位！
        </div>` : ''}

      <div class="koin-furniture-section">
        <div class="koin-furniture-title">🛋️ 家具加成（每日自动生效）</div>
        <div class="koin-furniture-grid">
          ${furnitureCards}
          ${emptyMessage}
        </div>
      </div>
    `;
  }

  // ── Inject into City Page ─────────────────────────────────────────────────

  function injectRoomHub() {
    if (!ensureRoomState()) return;
    injectRoomStyles();

    const pageCity = $safe('page-city');
    if (!pageCity) return;

    // Remove existing hub if present (for re-renders)
    const existing = $safe('roomUpgradeHub');
    if (existing) {
      // Remove hub + its sibling warning/furniture section
      let el = existing.closest('.koin-room-hub');
      if (el) {
        // Also remove the warning and furniture section that follow
        const parent = el.parentNode;
        const hubIdx = Array.from(parent.children).indexOf(el);
        // Remove up to 2 following siblings that belong to this widget
        let toRemove = [el];
        let next = el.nextElementSibling;
        let count = 0;
        while (next && count < 2) {
          if (next.classList.contains('koin-slot-warning') ||
              next.classList.contains('koin-furniture-section')) {
            toRemove.push(next);
          }
          next = next.nextElementSibling;
          count++;
        }
        toRemove.forEach(n => n.parentNode && n.parentNode.removeChild(n));
      }
    }

    // Find insertion point: after locationGrowthHub if present, else after guide-card
    const locationHub = $safe('locationGrowthHub');
    const careerHub   = $safe('careerHub');
    const guideCard   = pageCity.querySelector('.guide-card');

    const anchor = careerHub || locationHub || guideCard || pageCity.firstElementChild;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderRoomHub();

    // Insert each child node after anchor
    let ref = anchor;
    while (wrapper.firstChild) {
      const child = wrapper.firstChild;
      wrapper.removeChild(child);
      if (ref && ref.parentNode) {
        ref.parentNode.insertBefore(child, ref.nextSibling);
        ref = child;
      } else {
        pageCity.appendChild(child);
        ref = child;
      }
    }
  }

  // ── Patch buyItem to trigger re-render ───────────────────────────────────
  // buyItem is defined in systems.js. We wrap it so that after any shop
  // purchase the room hub updates immediately without touching systems.js.

  const _originalBuyItem = window.buyItem;
  if (typeof _originalBuyItem === 'function' && !window.__koinRoomBuyPatchedV1) {
    window.__koinRoomBuyPatchedV1 = true;

    window.buyItem = function patchedBuyItem(type, cost) {
      _originalBuyItem(type, cost);
      // render() is already called inside originalBuyItem → our render patch
      // below will handle the hub refresh automatically.
    };
  }

  // ── Patch render() ───────────────────────────────────────────────────────

  const _originalRender = window.render;
  if (typeof _originalRender === 'function' && !window.__koinRoomRenderPatchedV1) {
    window.__koinRoomRenderPatchedV1 = true;

    window.render = function patchedRenderRoom() {
      _originalRender();
      injectRoomStyles();
      injectRoomHub();
    };
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  ensureRoomState();
  applyDailyFurnitureBonus();
  injectRoomStyles();
  injectRoomHub();
  safeSave();

  if (typeof render === 'function') render();

  console.log('[Koin City V2] Room Upgrade & Furniture Bonus Patch v1 loaded');

})();
