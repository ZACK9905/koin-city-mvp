// Koin City V2 — Independent Shop + Collection System v1
// New file: js/v2-shop.js
// Load AFTER js/v2-room-decorator.js
// - Replaces the zone "shop" content with a full shop UI
// - Does NOT touch ui.js shopList (kept for tutorial compatibility)
// - Adds collection/图鉴 system with completion rewards

(function () {

  // ── Helpers ───────────────────────────────────────────────────────────────

  function $safe(id) { return document.getElementById(id); }
  function safeToast(m)  { if (typeof showToast      === 'function') showToast(m); }
  function safeBurst(m)  { if (typeof createCoinBurst=== 'function') createCoinBurst(m); }
  function safeSave()    { if (typeof save            === 'function') save(); }

  // ── Shop Catalogue ────────────────────────────────────────────────────────
  // Each item: { id, name, emoji, cost, desc, category, collectable }
  // category keys must match COLLECTIONS keys below

  const SHOP_ITEMS = [

    // ── Furniture (对接 room decorator) ──────────────────────────────────
    { id:'desk',       name:'书桌',       emoji:'🪑', cost:120, category:'furniture',
      desc:'每日知识 +2',     stat:'knowledge',  bonus:2 },
    { id:'bookshelf',  name:'书架',       emoji:'📚', cost:150, category:'furniture',
      desc:'每日判断力 +2',   stat:'judgment',   bonus:2 },
    { id:'computer',   name:'电脑',       emoji:'💻', cost:200, category:'furniture',
      desc:'每日创意 +2',     stat:'creativity', bonus:2 },
    { id:'treadmill',  name:'跑步机',     emoji:'🏃', cost:180, category:'furniture',
      desc:'每日活力 +2',     stat:'fitness',    bonus:2 },
    { id:'sofa',       name:'沙发',       emoji:'🛋️', cost:160, category:'furniture',
      desc:'每日抗挫力 +2',   stat:'resilience', bonus:2 },
    { id:'plant',      name:'绿植',       emoji:'🌿', cost:90,  category:'furniture',
      desc:'每日情绪 +2',     stat:'emotion',    bonus:2 },
    { id:'trophy',     name:'奖杯',       emoji:'🏆', cost:220, category:'furniture',
      desc:'每日自信 +2',     stat:'confidence', bonus:2 },
    { id:'whiteboard', name:'白板',       emoji:'📋', cost:140, category:'furniture',
      desc:'每日自律 +2',     stat:'discipline', bonus:2 },
    { id:'lamp',       name:'思考灯',     emoji:'💡', cost:100, category:'furniture',
      desc:'每日知识 +1',     stat:'knowledge',  bonus:1 },
    { id:'tree',       name:'成长树',     emoji:'🌳', cost:80,  category:'furniture',
      desc:'每日情绪 +1',     stat:'emotion',    bonus:1 },

    // ── Stationery 文具收藏 ───────────────────────────────────────────────
    { id:'sticker_pack',  name:'贴纸包',    emoji:'🌈', cost:60,  category:'stationery',
      desc:'可爱限定贴纸，收藏必备。',   collectable:true },
    { id:'pencil_case',   name:'笔盒',      emoji:'✏️', cost:80,  category:'stationery',
      desc:'装满彩色铅笔的文具盒。',     collectable:true },
    { id:'notebook',      name:'笔记本',    emoji:'📓', cost:70,  category:'stationery',
      desc:'记录想法和目标的好伙伴。',   collectable:true },
    { id:'backpack',      name:'背包',      emoji:'🎒', cost:150, category:'stationery',
      desc:'限量版印花背包。',           collectable:true },
    { id:'ruler_set',     name:'文具套装',  emoji:'📐', cost:90,  category:'stationery',
      desc:'全套测量工具，整整齐齐。',   collectable:true },
    { id:'washi_tape',    name:'和纸胶带',  emoji:'🎀', cost:55,  category:'stationery',
      desc:'日式限定和纸胶带。',         collectable:true },

    // ── Blind Box 盲盒 ───────────────────────────────────────────────────
    { id:'blindbox_city',    name:'城市系列盲盒', emoji:'📦', cost:120, category:'blindbox',
      desc:'打开后随机获得城市人物公仔。', collectable:true, isBlindBox:true,
      pool:['👮','👷','🧑‍🍳','🧑‍🎨','🧑‍🚀','🧑‍💻','🧑‍🏫','🧑‍⚕️'] },
    { id:'blindbox_animal',  name:'动物森林盲盒', emoji:'🎁', cost:100, category:'blindbox',
      desc:'打开后随机获得动物系列公仔。', collectable:true, isBlindBox:true,
      pool:['🐼','🦊','🐨','🐸','🦁','🐯','🐺','🦝'] },
    { id:'blindbox_space',   name:'宇宙系列盲盒', emoji:'🚀', cost:140, category:'blindbox',
      desc:'打开后随机获得宇宙探险公仔。', collectable:true, isBlindBox:true,
      pool:['👽','🤖','🚀','🌙','⭐','🪐','☄️','🌌'] },
    { id:'blindbox_food',    name:'美食系列盲盒', emoji:'🍱', cost:90,  category:'blindbox',
      desc:'打开后随机获得迷你食物公仔。', collectable:true, isBlindBox:true,
      pool:['🍣','🍔','🍕','🌮','🍜','🧋','🍩','🍦'] },

    // ── Plants 植物收藏 ───────────────────────────────────────────────────
    { id:'cactus',      name:'仙人掌',    emoji:'🌵', cost:65,  category:'plants',
      desc:'不用天天浇水的好朋友。',     collectable:true },
    { id:'succulent',   name:'多肉植物',  emoji:'🪴', cost:75,  category:'plants',
      desc:'圆滚滚的可爱多肉。',         collectable:true },
    { id:'sunflower',   name:'向日葵',    emoji:'🌻', cost:85,  category:'plants',
      desc:'永远朝向阳光的植物。',       collectable:true },
    { id:'bonsai',      name:'盆景',      emoji:'🌿', cost:110, category:'plants',
      desc:'精心修剪的迷你盆景。',       collectable:true },
    { id:'mushroom',    name:'蘑菇盆栽',  emoji:'🍄', cost:70,  category:'plants',
      desc:'神秘可爱的森林蘑菇。',       collectable:true },
    { id:'bamboo',      name:'竹子',      emoji:'🎋', cost:80,  category:'plants',
      desc:'节节高升，好意头。',         collectable:true },

    // ── Pet Shop 宠物用品 (解锁条件: state.pet.stage !== 'none') ────────
    { id:'pet_food',    name:'宠物粮',    emoji:'🍖', cost:50,  category:'pet',
      desc:'每日喂食，宠物心情 +10。',   collectable:false, petItem:true },
    { id:'pet_toy',     name:'宠物玩具',  emoji:'🎾', cost:80,  category:'pet',
      desc:'玩具让宠物更快乐。',         collectable:true,  petItem:true },
    { id:'pet_bed',     name:'宠物床',    emoji:'🛏️', cost:120, category:'pet',
      desc:'舒适小窝，宠物睡得好。',     collectable:true,  petItem:true },
    { id:'pet_bath',    name:'洗浴套装',  emoji:'🛁', cost:90,  category:'pet',
      desc:'让宠物保持干净卫生。',       collectable:true,  petItem:true },
    { id:'pet_hat',     name:'宠物帽子',  emoji:'🎩', cost:100, category:'pet',
      desc:'时髦的小帽子。',             collectable:true,  petItem:true },
    { id:'pet_collar',  name:'项圈',      emoji:'💎', cost:110, category:'pet',
      desc:'闪亮项圈，代表你们的羁绊。', collectable:true,  petItem:true },
  ];

  // ── Collection Definitions ────────────────────────────────────────────────
  // Each category: items that count toward completion, completion reward

  const COLLECTIONS = {
    furniture: {
      label: '🛋️ 家具收藏', emoji: '🛋️',
      ids: ['desk','bookshelf','computer','treadmill','sofa','plant','trophy','whiteboard','lamp','tree'],
      reward: { coins: 500, xp: 80,  title: '🏠 室内设计师' }
    },
    stationery: {
      label: '✏️ 文具图鉴', emoji: '✏️',
      ids: ['sticker_pack','pencil_case','notebook','backpack','ruler_set','washi_tape'],
      reward: { coins: 300, xp: 50,  title: '📚 文具收藏家' }
    },
    blindbox: {
      label: '📦 盲盒图鉴', emoji: '📦',
      ids: ['blindbox_city','blindbox_animal','blindbox_space','blindbox_food'],
      reward: { coins: 400, xp: 60,  title: '🎁 盲盒玩家' }
    },
    plants: {
      label: '🌱 植物图鉴', emoji: '🌱',
      ids: ['cactus','succulent','sunflower','bonsai','mushroom','bamboo'],
      reward: { coins: 250, xp: 40,  title: '🌿 植物达人' }
    },
    pet: {
      label: '🐾 宠物图鉴', emoji: '🐾',
      ids: ['pet_toy','pet_bed','pet_bath','pet_hat','pet_collar'],
      reward: { coins: 350, xp: 60,  title: '🐾 宠物达人' },
      requiresPet: true
    }
  };

  const CATEGORY_ORDER = ['furniture','stationery','blindbox','plants','pet'];

  // ── State Init ────────────────────────────────────────────────────────────

  function ensureShopState() {
    if (!window.state) return false;

    if (!state.shopV2) {
      state.shopV2 = {
        collectedItems:    {},   // { itemId: count }
        blindBoxResults:   {},   // { itemId: [emoji, emoji, ...] }
        collectionClaimed: {},   // { categoryId: true }
        activeTab:         'furniture'
      };
    }

    const s = state.shopV2;
    if (!s.collectedItems)    s.collectedItems    = {};
    if (!s.blindBoxResults)   s.blindBoxResults   = {};
    if (!s.collectionClaimed) s.collectionClaimed = {};
    if (!s.activeTab)         s.activeTab         = 'furniture';

    return true;
  }

  // ── Collection Helpers ────────────────────────────────────────────────────

  function getCollectedIds(categoryId) {
    if (!ensureShopState()) return [];
    const col  = COLLECTIONS[categoryId];
    const inv  = state.inventory || [];
    const coll = state.shopV2.collectedItems;

    return col.ids.filter(id => inv.includes(id) || (coll[id] && coll[id] > 0));
  }

  function isCategoryComplete(categoryId) {
    const col = COLLECTIONS[categoryId];
    return getCollectedIds(categoryId).length >= col.ids.length;
  }

  function claimCollectionReward(categoryId) {
    if (!ensureShopState()) return;
    if (state.shopV2.collectionClaimed[categoryId]) return;
    if (!isCategoryComplete(categoryId)) return;

    const col = COLLECTIONS[categoryId];
    state.shopV2.collectionClaimed[categoryId] = true;

    if (typeof addReward === 'function') {
      addReward(col.reward.coins, col.reward.xp);
    } else {
      state.coins = (state.coins || 0) + col.reward.coins;
      state.xp    = (state.xp    || 0) + col.reward.xp;
    }

    if (!state.titles) state.titles = [];
    if (!state.titles.includes(col.reward.title)) state.titles.push(col.reward.title);

    safeBurst(`+${col.reward.coins} 🪙`);
    safeToast(`🎉 图鉴完成！获得称号「${col.reward.title}」+${col.reward.coins}🪙`);
    safeSave();
    if (typeof render === 'function') render();
  }

  // ── Purchase Logic ────────────────────────────────────────────────────────

  window.shopBuyItem = function shopBuyItem(itemId) {
    if (!ensureShopState()) return;

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if ((state.coins || 0) < item.cost) {
      safeToast('金币不足！去完成任务和上班赚取金币吧。');
      return;
    }

    state.coins -= item.cost;

    // Blind box: pick random result
    if (item.isBlindBox) {
      const pool   = item.pool || ['🎁'];
      const result = pool[Math.floor(Math.random() * pool.length)];

      if (!state.shopV2.blindBoxResults[itemId]) state.shopV2.blindBoxResults[itemId] = [];
      state.shopV2.blindBoxResults[itemId].push(result);

      state.shopV2.collectedItems[itemId] = (state.shopV2.collectedItems[itemId] || 0) + 1;
      state.inventory.push(itemId);

      _showBlindBoxReveal(item, result);
    } else {
      // Regular item
      state.inventory.push(itemId);
      state.shopV2.collectedItems[itemId] = (state.shopV2.collectedItems[itemId] || 0) + 1;

      // Pet food: apply mood boost immediately
      if (itemId === 'pet_food' && state.pet) {
        state.pet.mood = Math.min(100, (state.pet.mood || 70) + 10);
        safeToast('🍖 宠物粮购买成功！宠物心情 +10');
      } else {
        safeToast(`${item.emoji} ${item.name} 购买成功！`);
      }

      safeBurst(`-${item.cost} 🪙`);
    }

    // Check collection completion
    Object.keys(COLLECTIONS).forEach(catId => {
      if (!state.shopV2.collectionClaimed[catId] && isCategoryComplete(catId)) {
        setTimeout(() => claimCollectionReward(catId), 800);
      }
    });

    // Call original buyItem for tutorial/stat hooks (lamp, tree)
    if (typeof buyItem === 'function' && ['lamp','tree','pet','house'].includes(itemId)) {
      const origCoins = state.coins;
      state.coins += item.cost; // temporarily restore so buyItem can deduct again
      buyItem(itemId, item.cost);
      state.coins = origCoins;  // correct: we already deducted above
    }

    safeSave();
    if (typeof render === 'function') render();
    renderShopInZone();
  };

  // ── Blind Box Reveal Popup ────────────────────────────────────────────────

  function _showBlindBoxReveal(item, result) {
    const existing = document.getElementById('blindBoxReveal');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'blindBoxReveal';
    el.innerHTML = `
      <div class="bbr-backdrop"></div>
      <div class="bbr-card">
        <div class="bbr-shine"></div>
        <div class="bbr-box-emoji">📦</div>
        <div class="bbr-arrow">▼</div>
        <div class="bbr-result">${result}</div>
        <div class="bbr-label">${item.name}</div>
        <div class="bbr-sub">恭喜你抽到这个！继续收集完整系列吧。</div>
        <button class="bbr-close" id="bbrCloseBtn">太棒了！</button>
      </div>`;

    document.body.appendChild(el);

    document.getElementById('bbrCloseBtn').addEventListener('click', () => {
      el.remove();
      renderShopInZone();
    });

    el.querySelector('.bbr-backdrop').addEventListener('click', () => {
      el.remove();
      renderShopInZone();
    });
  }

  // ── Render Shop in Zone ───────────────────────────────────────────────────

  function renderShopInZone() {
    if (!ensureShopState()) return;

    const zoneContent = $safe('zoneContent');
    if (!zoneContent) return;

    // Only inject if the zone is currently showing the shop
    if (!zoneContent.dataset.activeZone || zoneContent.dataset.activeZone !== 'shop') return;

    zoneContent.innerHTML = _buildShopHTML();
    _attachShopEvents(zoneContent);
  }

  function _buildShopHTML() {
    if (!ensureShopState()) return '';

    const activeTab = state.shopV2.activeTab;
    const coins     = state.coins || 0;

    // ── Tab bar ──
    const tabs = CATEGORY_ORDER.map(catId => {
      const col       = COLLECTIONS[catId];
      const isPetLock = col.requiresPet && (!state.pet || state.pet.stage === 'none');
      const done      = isCategoryComplete(catId);
      return `<button class="vs-tab${activeTab===catId?' active':''}"
        data-shop-tab="${catId}" ${isPetLock?'disabled':''}>
        ${col.emoji}${done?' ✅':''}
        ${isPetLock?' 🔒':''}
      </button>`;
    }).join('');

    // ── Collection progress bar ──
    const col       = COLLECTIONS[activeTab];
    const colItems  = getCollectedIds(activeTab);
    const colTotal  = col.ids.length;
    const colPct    = Math.round(colItems.length / colTotal * 100);
    const claimed   = state.shopV2.collectionClaimed[activeTab];
    const complete  = isCategoryComplete(activeTab);

    const collectionBar = `
      <div class="vs-col-bar">
        <div class="vs-col-bar-top">
          <span>${col.label}</span>
          <span>${colItems.length}/${colTotal}</span>
        </div>
        <div class="vs-col-track">
          <div class="vs-col-fill" style="width:${colPct}%"></div>
        </div>
        ${complete && !claimed
          ? `<button class="vs-col-claim-btn" data-claim-col="${activeTab}">
               🎁 领取图鉴奖励 +${col.reward.coins}🪙
             </button>`
          : complete && claimed
            ? `<div class="vs-col-done">✅ 已领取称号「${col.reward.title}」</div>`
            : `<div class="vs-col-hint">集齐全部可获得 🪙${col.reward.coins} + 称号「${col.reward.title}」</div>`}
      </div>`;

    // ── Item grid ──
    const items   = SHOP_ITEMS.filter(i => i.category === activeTab);
    const isPetLocked = col.requiresPet && (!state.pet || state.pet.stage === 'none');

    let grid = '';
    if (isPetLocked) {
      grid = `<div class="vs-pet-locked">
        🥚 孵化宠物后才能开启宠物商店！<br>
        <span style="font-size:12px;color:#999">去完成任务，等待宠物孵化吧。</span>
      </div>`;
    } else {
      grid = items.map(item => {
        const owned    = (state.inventory || []).filter(id => id === item.id).length;
        const canAfford = coins >= item.cost;
        const bbResults = (state.shopV2.blindBoxResults[item.id] || []);

        // Collection badge
        const inCol   = col.ids.includes(item.id);
        const hasIt   = owned > 0 || (state.shopV2.collectedItems[item.id] > 0);
        const colBadge = inCol
          ? `<span class="vs-col-badge ${hasIt?'owned':''}">${hasIt?'✅ 已收集':'◻️ 未收集'}</span>`
          : '';

        // Blind box previous results
        const bbHtml = item.isBlindBox && bbResults.length
          ? `<div class="vs-bb-results">${bbResults.slice(-5).join(' ')}</div>`
          : '';

        return `
          <div class="vs-item-card ${canAfford?'':'vs-cant-afford'}">
            <div class="vs-item-emoji">${item.emoji}</div>
            <div class="vs-item-info">
              <div class="vs-item-name">${item.name}</div>
              <div class="vs-item-desc">${item.desc}</div>
              ${colBadge}
              ${bbHtml}
              ${owned > 0 ? `<div class="vs-owned-badge">已拥有 ×${owned}</div>` : ''}
            </div>
            <div class="vs-item-right">
              <div class="vs-item-cost ${canAfford?'':'red'}">🪙 ${item.cost}</div>
              <button class="vs-buy-btn ${canAfford?'':'vs-cant'}"
                data-shop-buy="${item.id}" ${canAfford?'':'disabled'}>
                ${item.isBlindBox ? '抽！' : '购买'}
              </button>
            </div>
          </div>`;
      }).join('');
    }

    // ── Collection gallery strip ──
    const galleryItems = col.ids.map(id => {
      const def   = SHOP_ITEMS.find(i => i.id === id);
      const owned = (state.inventory || []).includes(id) || (state.shopV2.collectedItems[id] > 0);
      return `<div class="vs-gallery-item ${owned?'owned':'locked'}">${owned?(def?def.emoji:'?'):'❓'}</div>`;
    }).join('');

    const gallery = `<div class="vs-gallery">${galleryItems}</div>`;

    return `
      <div class="vs-wrap">
        <div class="vs-header">
          <div class="vs-header-inner">
            <div class="vs-header-icon">🏪</div>
            <div>
              <div class="vs-header-title">Koin 商店</div>
              <div class="vs-header-sub">💰 你有 ${coins} 金币</div>
            </div>
          </div>
        </div>

        <div class="vs-tabs">${tabs}</div>

        ${collectionBar}
        ${gallery}

        <div class="vs-items">${grid}</div>
      </div>`;
  }

  function _attachShopEvents(container) {
    // Tab switching
    container.querySelectorAll('[data-shop-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!ensureShopState()) return;
        state.shopV2.activeTab = btn.dataset.shopTab;
        renderShopInZone();
      });
    });

    // Buy buttons
    container.querySelectorAll('[data-shop-buy]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled || btn.classList.contains('vs-cant')) return;
        window.shopBuyItem(btn.dataset.shopBuy);
      });
    });

    // Collection reward claim
    container.querySelectorAll('[data-claim-col]').forEach(btn => {
      btn.addEventListener('click', () => {
        claimCollectionReward(btn.dataset.claimCol);
      });
    });
  }

  // ── Patch openZone to intercept 'shop' ────────────────────────────────────

  const _origOpenZone = window.openZone;
  window.openZone = function patchedOpenZoneShop(type) {
    if (type === 'shop') {
      ensureShopState();

      const zoneInfo = $safe('zoneInfo');
      if (zoneInfo) zoneInfo.style.display = 'block';

      const zoneContent = $safe('zoneContent');
      if (!zoneContent) return;

      zoneContent.dataset.activeZone = 'shop';
      zoneContent.innerHTML = _buildShopHTML();
      _attachShopEvents(zoneContent);

      zoneContent.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }

    // For all other zones, clear the activeZone marker and delegate
    const zoneContent = $safe('zoneContent');
    if (zoneContent) zoneContent.dataset.activeZone = type;

    if (typeof _origOpenZone === 'function') _origOpenZone(type);
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  function injectShopStyles() {
    if ($safe('koinShopV2Styles')) return;
    const s = document.createElement('style');
    s.id = 'koinShopV2Styles';
    s.textContent = `
      /* ── Wrapper ── */
      .vs-wrap { font-family: inherit; }

      /* ── Header ── */
      .vs-header {
        background: linear-gradient(145deg,#1A1034,#3B2A8A 55%,#FF8C42);
        border-radius: 20px 20px 0 0;
        padding: 18px 18px 14px;
      }
      .vs-header-inner {
        display: flex; align-items: center; gap: 12px;
      }
      .vs-header-icon {
        width: 48px; height: 48px; border-radius: 16px;
        background: rgba(255,255,255,.15);
        border: 1.5px solid rgba(255,255,255,.22);
        display: flex; align-items: center; justify-content: center;
        font-size: 26px; flex-shrink: 0;
      }
      .vs-header-title {
        font-size: 18px; font-weight: 900; color: #fff; line-height: 1.2;
      }
      .vs-header-sub {
        font-size: 12px; color: rgba(255,255,255,.75); font-weight: 800; margin-top: 2px;
      }

      /* ── Tab bar ── */
      .vs-tabs {
        display: flex; gap: 6px; padding: 12px 14px 0;
        background: #fff; overflow-x: auto; scrollbar-width: none;
      }
      .vs-tabs::-webkit-scrollbar { display: none; }
      .vs-tab {
        all: unset; box-sizing: border-box;
        padding: 7px 14px; border-radius: 999px; flex-shrink: 0;
        font-size: 16px; cursor: pointer; font-weight: 900;
        border: 1.5px solid rgba(124,92,252,.15);
        background: rgba(124,92,252,.05);
        transition: background .15s, border-color .15s;
      }
      .vs-tab.active {
        background: linear-gradient(135deg,#7C5CFC,#FF8C42);
        color: #fff; border-color: transparent;
        box-shadow: 0 4px 12px rgba(124,92,252,.28);
      }
      .vs-tab:disabled { opacity: .35; cursor: not-allowed; }

      /* ── Collection progress bar ── */
      .vs-col-bar {
        margin: 12px 14px 0; padding: 12px 14px;
        background: linear-gradient(145deg,rgba(124,92,252,.06),rgba(255,140,66,.04));
        border: 1.5px solid rgba(124,92,252,.12);
        border-radius: 16px;
      }
      .vs-col-bar-top {
        display: flex; justify-content: space-between;
        font-size: 12px; font-weight: 900; margin-bottom: 7px;
        color: var(--ink,#1A1034);
      }
      .vs-col-track {
        height: 8px; background: rgba(0,0,0,.08);
        border-radius: 999px; overflow: hidden; margin-bottom: 8px;
      }
      .vs-col-fill {
        height: 100%; border-radius: 999px;
        background: linear-gradient(90deg,#7C5CFC,#FF8C42);
        transition: width .4s ease;
      }
      .vs-col-hint { font-size: 11px; color: #756e83; font-weight: 700; }
      .vs-col-done { font-size: 11px; color: #2d6a19; font-weight: 800; }
      .vs-col-claim-btn {
        all: unset; box-sizing: border-box;
        display: block; width: 100%; text-align: center;
        padding: 9px; border-radius: 12px; margin-top: 4px;
        background: linear-gradient(135deg,#72E128,#06C8A8);
        color: #fff; font-size: 13px; font-weight: 900;
        cursor: pointer; box-shadow: 0 4px 14px rgba(114,225,40,.30);
        animation: vsClaimPulse 1.6s ease-in-out infinite;
      }
      @keyframes vsClaimPulse {
        0%,100% { box-shadow: 0 4px 14px rgba(114,225,40,.30); }
        50%      { box-shadow: 0 4px 22px rgba(114,225,40,.55); }
      }

      /* ── Gallery strip ── */
      .vs-gallery {
        display: flex; gap: 6px; padding: 10px 14px;
        overflow-x: auto; scrollbar-width: none;
        background: #fff;
      }
      .vs-gallery::-webkit-scrollbar { display: none; }
      .vs-gallery-item {
        flex-shrink: 0;
        width: 38px; height: 38px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        border: 1.5px solid rgba(124,92,252,.12);
        background: rgba(124,92,252,.05);
        transition: transform .15s;
      }
      .vs-gallery-item.owned {
        background: linear-gradient(135deg,#F0EDFF,#FFF0E8);
        border-color: rgba(124,92,252,.25);
        box-shadow: 0 2px 8px rgba(124,92,252,.12);
      }
      .vs-gallery-item.locked { opacity: .4; }

      /* ── Item cards ── */
      .vs-items { padding: 10px 14px 20px; display: grid; gap: 10px; }
      .vs-item-card {
        display: flex; align-items: center; gap: 12px;
        padding: 13px 14px; border-radius: 18px;
        background: #fff; border: 1.5px solid rgba(124,92,252,.10);
        box-shadow: 0 3px 12px rgba(0,0,0,.04);
        transition: border-color .15s, box-shadow .15s;
      }
      .vs-item-card:not(.vs-cant-afford):hover {
        border-color: rgba(124,92,252,.25);
        box-shadow: 0 6px 18px rgba(124,92,252,.10);
      }
      .vs-item-card.vs-cant-afford { opacity: .55; }
      .vs-item-emoji { font-size: 30px; flex-shrink: 0; width: 42px; text-align: center; }
      .vs-item-info  { flex: 1; min-width: 0; }
      .vs-item-name  { font-size: 14px; font-weight: 900; line-height: 1.2; }
      .vs-item-desc  { font-size: 11px; color: #756e83; font-weight: 700; margin-top: 2px; line-height: 1.4; }
      .vs-col-badge  {
        display: inline-block; margin-top: 4px;
        font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 999px;
        background: rgba(0,0,0,.06); color: #999;
      }
      .vs-col-badge.owned { background: rgba(114,225,40,.15); color: #2d6a19; }
      .vs-owned-badge {
        display: inline-block; margin-top: 3px;
        font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 999px;
        background: rgba(124,92,252,.10); color: #7C5CFC;
      }
      .vs-bb-results {
        font-size: 16px; margin-top: 4px; letter-spacing: 2px;
      }
      .vs-item-right {
        display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;
      }
      .vs-item-cost { font-size: 13px; font-weight: 900; color: var(--violet,#7C5CFC); }
      .vs-item-cost.red { color: #d44; }
      .vs-buy-btn {
        all: unset; box-sizing: border-box;
        padding: 8px 14px; border-radius: 12px;
        background: linear-gradient(135deg,#7C5CFC,#FF8C42);
        color: #fff; font-size: 13px; font-weight: 900;
        cursor: pointer; white-space: nowrap;
        box-shadow: 0 4px 12px rgba(124,92,252,.25);
        transition: transform .12s, box-shadow .12s;
      }
      .vs-buy-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124,92,252,.35); }
      .vs-buy-btn.vs-cant { background: #ddd; color: #aaa; box-shadow: none; cursor: not-allowed; }

      /* ── Pet locked ── */
      .vs-pet-locked {
        text-align: center; padding: 28px 16px;
        font-size: 14px; font-weight: 800; color: #756e83; line-height: 1.8;
      }

      /* ── Blind box reveal popup ── */
      #blindBoxReveal { position: fixed; inset: 0; z-index: 3100; display: flex; align-items: center; justify-content: center; padding: 24px; }
      .bbr-backdrop { position: absolute; inset: 0; background: rgba(15,0,40,.8); backdrop-filter: blur(8px); }
      .bbr-card {
        position: relative; z-index: 1;
        background: #fff; border-radius: 28px;
        padding: 32px 24px 24px; max-width: 300px; width: 100%;
        text-align: center;
        box-shadow: 0 24px 60px rgba(0,0,0,.35);
        animation: bbrPop .5s cubic-bezier(.34,1.56,.64,1);
        overflow: hidden;
      }
      @keyframes bbrPop { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
      .bbr-shine {
        position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
        width: 200px; height: 200px; border-radius: 50%;
        background: radial-gradient(circle, rgba(255,210,63,.4), transparent 70%);
        pointer-events: none;
      }
      .bbr-box-emoji { font-size: 48px; animation: bbrShake .5s ease; }
      @keyframes bbrShake {
        0%,100%{transform:rotate(0)} 20%{transform:rotate(-12deg)} 40%{transform:rotate(12deg)}
        60%{transform:rotate(-8deg)} 80%{transform:rotate(8deg)}
      }
      .bbr-arrow { font-size: 20px; color: #FFD23F; margin: 8px 0; animation: bbrBounce .5s .3s ease both; }
      @keyframes bbrBounce { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      .bbr-result { font-size: 72px; animation: bbrReveal .4s .5s cubic-bezier(.34,1.56,.64,1) both; }
      @keyframes bbrReveal { from{opacity:0;transform:scale(.3)} to{opacity:1;transform:scale(1)} }
      .bbr-label { font-size: 16px; font-weight: 900; margin-top: 8px; color: #1A1034; }
      .bbr-sub   { font-size: 12px; color: #756e83; font-weight: 700; margin-top: 4px; margin-bottom: 16px; }
      .bbr-close {
        all: unset; box-sizing: border-box; display: block; width: 100%;
        padding: 13px; border-radius: 16px; text-align: center;
        background: linear-gradient(135deg,#7C5CFC,#FF8C42);
        color: #fff; font-size: 15px; font-weight: 900; cursor: pointer;
        box-shadow: 0 6px 20px rgba(124,92,252,.30);
      }
    `;
    document.head.appendChild(s);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  ensureShopState();
  injectShopStyles();

  // Also patch data-scroll-shop button behavior: redirect to openZone('shop')
  document.body.addEventListener('click', function(e) {
    const scrollBtn = e.target.closest('[data-scroll-shop]');
    if (scrollBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.openZone('shop');
    }
  }, true);

  console.log('[Koin City V2] Shop + Collection System v1 loaded');

})();
