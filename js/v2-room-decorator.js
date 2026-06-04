// Koin City V2 — Room Decorator Patch (架构优化版)
// File: js/v2-room-decorator.js
// 加载顺序: v2-room-upgrade.js → v2-room-decorator.js
// 不修改 systems.js / data.js / state.js / app.js

(function () {

  // ─── SVG 尺寸常量（单一真相来源）─────────────────────────────────────────
  // 修复1: ORIGIN_X/Y 从 SVG 尺寸动态计算，不再写死

  const SVG_W    = 800;
  const SVG_H    = 385;
  const ORIGIN_X = SVG_W / 2;   // 300 — 但现在改 SVG_W 就够了
  const ORIGIN_Y = SVG_H * 0.16; // ~62，比例而非像素

  const GRID_COLS = 6;
  const GRID_ROWS = 5;
  const ISO_X     = 64;
  const ISO_Y     = 32;

  const PAGE_ID = 'page-city';

  const ROOM_DEFS = [
    { level:0, name:'木屋', emoji:'🏚️', slots:4,  wallA:'#C8A55A', wallB:'#8B6914', floorA:'#D4B896', floorB:'#B89A7A' },
    { level:1, name:'公寓', emoji:'🏠', slots:8,  wallA:'#A8C4E0', wallB:'#5A7FA8', floorA:'#C8D8E8', floorB:'#A8BDD0' },
    { level:2, name:'豪宅', emoji:'🏡', slots:12, wallA:'#C4B8E0', wallB:'#7B6FA0', floorA:'#E0D8F0', floorB:'#C8BCE0' },
  ];

  const FURNITURE_CATALOG = [
    { type:'tree',       emoji:'🌳', label:'成长树',  stat:'emotion',    bonus:1, cost:80,  desc:'每日情绪 +1',   inOriginalShop:true  },
    { type:'lamp',       emoji:'💡', label:'思考灯',  stat:'knowledge',  bonus:1, cost:100, desc:'每日知识 +1',   inOriginalShop:true  },
    { type:'desk',       emoji:'🪑', label:'书桌',    stat:'knowledge',  bonus:2, cost:120, desc:'每日知识 +2',   inOriginalShop:false },
    { type:'bookshelf',  emoji:'📚', label:'书架',    stat:'judgment',   bonus:2, cost:150, desc:'每日判断力 +2', inOriginalShop:false },
    { type:'computer',   emoji:'💻', label:'电脑',    stat:'creativity', bonus:2, cost:200, desc:'每日创意 +2',   inOriginalShop:false },
    { type:'treadmill',  emoji:'🏃', label:'跑步机',  stat:'fitness',    bonus:2, cost:180, desc:'每日活力 +2',   inOriginalShop:false },
    { type:'sofa',       emoji:'🛋️', label:'沙发',    stat:'resilience', bonus:2, cost:160, desc:'每日抗挫力 +2', inOriginalShop:false },
    { type:'plant',      emoji:'🌿', label:'绿植',    stat:'emotion',    bonus:2, cost:90,  desc:'每日情绪 +2',   inOriginalShop:false },
    { type:'trophy',     emoji:'🏆', label:'奖杯',    stat:'confidence', bonus:2, cost:220, desc:'每日自信 +2',   inOriginalShop:false },
    { type:'whiteboard', emoji:'📋', label:'白板',    stat:'discipline', bonus:2, cost:140, desc:'每日自律 +2',   inOriginalShop:false },
  ];

  const FURNITURE_MAP = Object.fromEntries(FURNITURE_CATALOG.map(f => [f.type, f]));

  // ─── State helpers ─────────────────────────────────────────────────────────

  function getPlacement() {
    if (!window.state.roomPlacement) window.state.roomPlacement = {};
    return window.state.roomPlacement;
  }

  function getRoomDef() {
    return ROOM_DEFS[Math.min(window.state.houseLevel || 0, ROOM_DEFS.length - 1)];
  }

  function getOwnedCounts() {
    const counts = {};
    (window.state.inventory || []).forEach(t => {
      if (FURNITURE_MAP[t]) counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }

  function safeSave()        { if (typeof save         === 'function') save(); }
  function safeToast(msg)    { if (typeof showToast    === 'function') showToast(msg); }
  function safeBurst(msg)    { if (typeof createCoinBurst === 'function') createCoinBurst(msg); }

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ─── Daily bonus (真正写入 state.stats) ───────────────────────────────────

  function applyDailyDecoratorBonus() {
    if (!window.state) return;
    const today = getTodayStr();
    if (!window.state.decoratorBonusDate) window.state.decoratorBonusDate = null;
    if (window.state.decoratorBonusDate === today) return;

    const placement   = getPlacement();
    const rd          = getRoomDef();
    const activeKeys  = Object.keys(placement).slice(0, rd.slots);
    if (!activeKeys.length) { window.state.decoratorBonusDate = today; safeSave(); return; }

    const totals = {};
    activeKeys.forEach(key => {
      const fb = FURNITURE_MAP[placement[key]];
      if (fb) totals[fb.stat] = (totals[fb.stat] || 0) + fb.bonus;
    });

    if (!window.state.stats) window.state.stats = {};
    Object.entries(totals).forEach(([stat, amount]) => {
      const def = ['knowledge','creativity','fitness','social','business','emotion'].includes(stat) ? 0 : 50;
      window.state.stats[stat] = Math.max(0, Math.min(100,
        Math.round((window.state.stats[stat] ?? def) + amount)
      ));
    });

    window.state.decoratorBonusDate = today;
    safeSave();
    safeToast(`🛋️ 家具加成：${Object.entries(totals).map(([s,v])=>`+${v} ${s}`).join(' · ')}`);
    safeBurst('🛋️');
  }

  // ─── ISO helpers ───────────────────────────────────────────────────────────

  function isoProject(col, row) {
    return {
      x: (col - row) * ISO_X / 2 + ORIGIN_X,
      y: (col + row) * ISO_Y / 2 + ORIGIN_Y,
    };
  }

  function nearestCell(svgX, svgY) {
    let best = null, bestD = Infinity;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const p  = isoProject(c, r);
        const cx = p.x, cy = p.y + ISO_Y / 2;
        const d  = (svgX - cx) ** 2 + (svgY - cy) ** 2;
        if (d < bestD) { bestD = d; best = { c, r }; }
      }
    }
    return best;
  }

  function svgCoordsFromEvent(e, svgEl) {
    const rect   = svgEl.getBoundingClientRect();
    const client = e.touches ? e.touches[0] : e;
    return {
      x: (client.clientX - rect.left) * (SVG_W / rect.width),
      y: (client.clientY - rect.top)  * (SVG_H / rect.height),
    };
  }

  // ─── UI state ──────────────────────────────────────────────────────────────

  let _selectedType  = null;
  let _hoverCell     = null;
  let _isDragging    = false;
  let _activeTab     = 'room';
  let _lastPlacedKey = null;

  // ─── 修复3: 分层渲染 ───────────────────────────────────────────────────────
  // 把 DOM 分成三层，各自独立更新，不每次重建整棵树：
  //   Layer A — Shell      (header + tabs)          → 只在 tab/houseLevel 变化时重建
  //   Layer B — SVG Room   (#koinRoomSVG)            → 只在 placement/hover/selected 变化时重建
  //   Layer C — Tab body   (.koin-dec-body)          → 只在 tab 内容数据变化时重建
  //
  // 用"脏标记"控制哪一层需要更新，避免无谓的全量重渲。

  const dirty = { shell: true, svg: true, body: true };

  function markDirty(...layers) { layers.forEach(l => dirty[l] = true); }

  // 入口：外部统一调用这个
  function renderDecorator() {
    if (!window.state) return;
    injectStyles();

    const page = document.getElementById(PAGE_ID);
    if (!page) return;

    // ── Layer A: Shell ──
    let wrap = document.getElementById('koinDecoratorWidget');
    if (!wrap || dirty.shell) {
      if (wrap) wrap.remove();
      wrap = _buildShell();

      const upgradeHub = document.getElementById('roomUpgradeHub');
      const anchor     = upgradeHub
        ? (upgradeHub.closest('.koin-room-hub') || upgradeHub)
        : page.firstElementChild;

      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
      else page.prepend(wrap);

      _attachShellEvents(wrap);
      dirty.shell = false;
      dirty.svg   = true; // shell 重建后子层都需要刷新
      dirty.body  = true;
    }

    // ── Layer B: SVG ──
    if (_activeTab === 'room' && dirty.svg) {
      _patchSVG(wrap);
      dirty.svg = false;
    }

    // ── Layer C: Tab body ──
    if (dirty.body) {
      _patchBody(wrap);
      dirty.body = false;
    }

    // 放置动画（在 patch 之后，节点已存在）
    if (_lastPlacedKey) {
      const piece = wrap.querySelector(`[data-placed-key="${_lastPlacedKey}"]`);
      if (piece) {
        piece.classList.add('just-placed');
        piece.addEventListener('animationend', () => piece.classList.remove('just-placed'), { once: true });
      }
      _lastPlacedKey = null;
    }
  }

  // ── Layer A: Shell (header + tabs 骨架) ──────────────────────────────────

  function _buildShell() {
    const rd    = getRoomDef();
    const placed = Object.keys(getPlacement()).length;
    const el    = document.createElement('div');
    el.id        = 'koinDecoratorWidget';
    el.className = 'koin-decorator-wrap';
    el.innerHTML = `
      <div class="koin-dec-header">
        <span class="koin-dec-title">${rd.emoji} ${rd.name} · 我的房间</span>
        <span class="koin-dec-slots" id="koinDecSlots">${placed}/${rd.slots} 家具槽</span>
      </div>
      <div class="koin-dec-tabs">
        <button class="koin-dec-tab${_activeTab==='room'  ?' active':''}" data-tab="room">🛋️ 布置</button>
        <button class="koin-dec-tab${_activeTab==='bonus' ?' active':''}" data-tab="bonus">📊 加成</button>
        <button class="koin-dec-tab${_activeTab==='shop'  ?' active':''}" data-tab="shop">🛍️ 商店</button>
      </div>
      <div class="koin-dec-body"></div>`;
    return el;
  }

  function _attachShellEvents(wrap) {
    wrap.querySelectorAll('.koin-dec-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (_activeTab === btn.dataset.tab) return;
        _activeTab    = btn.dataset.tab;
        _selectedType = null;
        wrap.querySelectorAll('.koin-dec-tab').forEach(b => b.classList.toggle('active', b === btn));
        markDirty('body', 'svg');
        renderDecorator();
      });
    });
  }

  // ── Layer B: SVG patch (只替换 SVG 元素本身) ─────────────────────────────

  function _patchSVG(wrap) {
    const container = wrap.querySelector('.koin-dec-canvas');
    if (!container) return;

    const rd        = getRoomDef();
    const placement = getPlacement();
    const existing  = container.querySelector('#koinRoomSVG');

    // 如果 SVG 已存在，做细粒度 DOM diff 而非整体替换
    if (existing) {
      _diffSVG(existing, rd, placement);
    } else {
      existing && existing.remove();
      const tmp = document.createElement('div');
      tmp.innerHTML = _buildSVGString(rd, placement);
      const newSvg = tmp.firstElementChild;
      container.appendChild(newSvg);
      _attachSVGEvents(newSvg);
    }

    // 更新槽位数字（header 里的小 badge）
    const badge = wrap.querySelector('#koinDecSlots');
    if (badge) badge.textContent = `${Object.keys(placement).length}/${rd.slots} 家具槽`;
  }

  // SVG diff: 只更新家具层和 hint，不重建 tiles/walls
  function _diffSVG(svg, rd, placement) {

  // 1. 更新 hover（保留你的逻辑）
  svg.querySelectorAll('polygon[data-cell]').forEach(p => {
    const [c, r] = p.dataset.cell.split(',').map(Number);

    const isHover =
      _hoverCell &&
      _hoverCell.c === c &&
      _hoverCell.r === r;

    const fill =
      isHover
        ? 'rgba(124,92,252,0.40)'
        : ((c + r) % 2 === 0 ? rd.floorA : rd.floorB);

    if (p.getAttribute('fill') !== fill) {
      p.setAttribute('fill', fill);
    }
  });

  // 2. ⭐家具层：直接重建（最简单版本）
  const layer = svg.querySelector('#furnitureLayer');
  if (!layer) return;

  layer.innerHTML = '';

  const sortedEntries = Object.entries(placement).sort(([a], [b]) => {
    const [ac, ar] = a.split(',').map(Number);
    const [bc, br] = b.split(',').map(Number);
    return (ac + ar) - (bc + br);
  });

  sortedEntries.forEach(([key, type]) => {
    const [c, r] = key.split(',').map(Number);

    const piece = _buildPieceSVGEl(key, type, c, r);
    if (!piece) return;

    layer.appendChild(piece);
    _attachPieceEvent(piece);
  });

  // 3. hint（保留你原逻辑）
  const hint = svg.querySelector('.koin-dec-hint');
  if (hint) {
    hint.textContent = _selectedType
      ? `已选：${FURNITURE_MAP[_selectedType]?.emoji} ${FURNITURE_MAP[_selectedType]?.label}｜点击地板放置`
      : '从下方选择家具，拖或点击地板放置';

    hint.setAttribute('fill', _selectedType ? '#7C5CFC' : 'rgba(0,0,0,0.35)');
  }
}

  function _buildPieceSVGEl(key, type, c, r) {
    const fb = FURNITURE_MAP[type];
    if (!fb) return null;
    const p  = isoProject(c, r);
    const bx = p.x - 28, by = p.y - 18;
    const ns = 'http://www.w3.org/2000/svg';
    const g  = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'koin-dec-piece');
    g.dataset.placedKey = key;
    g.dataset.type      = type;
    g.style.cursor = 'pointer';
    g.innerHTML = `
      <rect x="${bx}" y="${by+10}" width="56" height="28" rx="8"
        fill="${darkenColor(type)}" opacity="0.65"/>
      <rect x="${bx}" y="${by}" width="56" height="28" rx="8"
        fill="${baseColor(type)}" opacity="0.92"/>
      <text x="${p.x}" y="${by+16}" text-anchor="middle"
        dominant-baseline="middle" font-size="20">${fb.emoji}</text>`;
    return g;
  }

  function _buildSVGString(rd, placement) {
    const wallH  = 90;
    const back   = isoProject(0, 0);
    const backR  = isoProject(GRID_COLS, 0);
    const frontL = isoProject(0, GRID_ROWS);

    let tiles = '';
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const p   = isoProject(c, r);
        const pts = `${p.x},${p.y} ${p.x+ISO_X/2},${p.y+ISO_Y/2} ${p.x},${p.y+ISO_Y} ${p.x-ISO_X/2},${p.y+ISO_Y/2}`;
        tiles += `<polygon data-cell="${c},${r}" points="${pts}"
          fill="${(c+r)%2===0 ? rd.floorA : rd.floorB}"
          stroke="rgba(0,0,0,0.07)" stroke-width="0.5"/>`;
      }
    }

    const walls = `
      <polygon points="${back.x},${back.y} ${backR.x},${backR.y} ${backR.x},${backR.y-wallH} ${back.x},${back.y-wallH}"
        fill="${rd.wallA}" stroke="rgba(0,0,0,0.08)" stroke-width="0.5"/>
      <polygon points="${back.x},${back.y} ${frontL.x},${frontL.y} ${frontL.x},${frontL.y-wallH} ${back.x},${back.y-wallH}"
        fill="${rd.wallB}" stroke="rgba(0,0,0,0.08)" stroke-width="0.5"/>`;

    return `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" width="100%" id="koinRoomSVG"
      style="display:block;cursor:default;touch-action:none">
      ${walls}${tiles}

      <g id="furnitureLayer"></g>
      
      <rect x="0" y="${SVG_H-17}" width="${SVG_W}" height="17" fill="rgba(0,0,0,0.03)"/>
      <text class="koin-dec-hint" x="${SVG_W/2}" y="${SVG_H-6}"
        text-anchor="middle" font-size="11" fill="rgba(0,0,0,0.35)">
        从下方选择家具，拖或点击地板放置</text>
    </svg>`;
  }

  function _attachSVGEvents(svg) {
    // Desktop drag
    svg.addEventListener('dragover', e => {
      e.preventDefault();
      const cell = nearestCell(...Object.values(svgCoordsFromEvent(e, svg)));
      if (!cell || (_hoverCell && _hoverCell.c===cell.c && _hoverCell.r===cell.r)) return;
      _hoverCell = cell;
      markDirty('svg');
      renderDecorator();
    });
    svg.addEventListener('dragleave', () => {
      _hoverCell = null; markDirty('svg'); renderDecorator();
    });
    svg.addEventListener('drop', e => {
        e.preventDefault();
      const type =
    e.dataTransfer.getData('text/plain')
    || _selectedType;
  if (type && _hoverCell) {
    const cell = _hoverCell;

    _hoverCell  = null;
    _isDragging = false;

    placeFurniture(
      type,
      cell.c,
      cell.r
    );

    return;
  }

  _hoverCell  = null;
  _isDragging = false;

  markDirty('svg');
  renderDecorator();
});

    // Click to place
    svg.addEventListener('click', e => {
      if (_isDragging || !_selectedType) return;
      const coords = svgCoordsFromEvent(e, svg);
      const cell   = nearestCell(coords.x, coords.y);
      if (!cell) return;
      const key = `${cell.c},${cell.r}`;
      if (getPlacement()[key]) {
        delete getPlacement()[key]; safeSave(); markDirty('svg','body'); renderDecorator(); return;
      }
      placeFurniture(_selectedType, cell.c, cell.r);
    });

    // Touch
    svg.addEventListener('touchmove', e => {
      e.preventDefault();
      const { x, y } = svgCoordsFromEvent(e, svg);
      const cell = nearestCell(x, y);
      if (!cell || (_hoverCell && _hoverCell.c===cell.c && _hoverCell.r===cell.r)) return;
      _hoverCell = cell; markDirty('svg'); renderDecorator();
    }, { passive: false });

    svg.addEventListener('touchend', () => {

  let placed = false;

  if (
    _isDragging &&
    _selectedType &&
    _hoverCell
  ) {

    const cell = _hoverCell;

    _isDragging = false;
    _hoverCell  = null;

    placeFurniture(
      _selectedType,
      cell.c,
      cell.r
    );

    placed = true;
  }

  if (!placed) {

    _isDragging = false;
    _hoverCell  = null;

    markDirty('svg');

    renderDecorator();
  }

});

}

  function _attachPieceEvent(piece) {
    piece.addEventListener('click', e => {
      e.stopPropagation();
      const key = piece.dataset.placedKey;
      if (!key) return;
      delete getPlacement()[key];
      safeSave();
      markDirty('svg', 'body');
      renderDecorator();
    });
  }

  // ── Layer C: Tab body patch ───────────────────────────────────────────────

  function _patchBody(wrap) {
    const body = wrap.querySelector('.koin-dec-body');
    if (!body) return;
    body.innerHTML = _buildBodyHTML();
    _attachBodyEvents(body);
  }

  function _buildBodyHTML() {
    if (_activeTab === 'room')  return _buildRoomBodyHTML();
    if (_activeTab === 'bonus') return _buildBonusHTML();
    if (_activeTab === 'shop')  return _buildShopHTML();
    return '';
  }

  function _buildRoomBodyHTML() {
    const owned     = getOwnedCounts();
    const placement = getPlacement();
    let pickerHtml  = '';

    FURNITURE_CATALOG.forEach(fb => {
      const count  = owned[fb.type] || 0;
      if (!count) return;
      const inRoom = Object.values(placement).filter(t => t === fb.type).length;
      // 修复2: Math.max(0, ...) 防止负数
      const avail  = Math.max(0, count - inRoom);
      const isSel  = _selectedType === fb.type;
      pickerHtml  += `
        <div class="koin-dec-item${isSel?' selected':''}"
          data-pick="${fb.type}" draggable="true" title="${fb.desc}">
          <div class="koin-dec-item-emoji">${fb.emoji}</div>
          <div class="koin-dec-item-name">${fb.label}</div>
          <div class="koin-dec-item-count">${avail > 0 ? `×${avail}` : '已摆满'}</div>
        </div>`;
    });

    if (!pickerHtml) pickerHtml = `
      <div style="padding:16px;font-size:12px;color:#aaa;font-weight:700;width:100%;text-align:center">
        还没有家具，去「商店」购买吧</div>`;

    return `
      <div class="koin-dec-canvas" id="koinDecCanvas"></div>
      <div class="koin-dec-picker">
        <div class="koin-dec-picker-label">我的家具</div>
        <div class="koin-dec-picker-scroll">${pickerHtml}</div>
      </div>`;
  }

  function _buildBonusHTML() {
    const placement = getPlacement();
    const rd = getRoomDef();
    const bonuses = {};
    Object.entries(placement)
      .slice(0, rd.slots)
      .forEach(([, type]) => {
        const fb = FURNITURE_MAP[type];
        if (!fb) return;
        bonuses[fb.stat] =
          (bonuses[fb.stat] || 0) + fb.bonus;
});

    if (!Object.keys(bonuses).length) return `
      <div class="koin-dec-bonus">
        <div class="koin-dec-empty">摆放家具后，这里显示每日成长加成（会真正写入你的成长数值）。</div>
      </div>`;

    const total       = Object.values(bonuses).reduce((a,b)=>a+b,0);
    const claimed     = window.state.decoratorBonusDate === getTodayStr();
    const rows        = Object.entries(bonuses).map(([stat, val]) => `
      <div class="koin-dec-bonus-row">
        <span class="koin-dec-bonus-label">${stat}</span>
        <span class="koin-dec-bonus-val">+${val} / 天</span>
      </div>`).join('');

    return `<div class="koin-dec-bonus">${rows}
      ${claimed
        ? `<div class="koin-dec-bonus-total">✅ 今日加成已发放，合计 +${total} 成长值</div>`
        : `<div class="koin-dec-bonus-next">⏳ 明日登录自动发放 +${total} 成长加成</div>`}
    </div>`;
  }

  function _buildShopHTML() {
    const coins = window.state.coins || 0;
    const cards = FURNITURE_CATALOG.filter(fb => !fb.inOriginalShop).map(fb => {
      const can = coins >= fb.cost;
      return `
        <div class="koin-dec-shop-card">
          <div class="koin-dec-shop-top">
            <span class="koin-dec-shop-emoji">${fb.emoji}</span>
            <div>
              <div class="koin-dec-shop-name">${fb.label}</div>
              <div class="koin-dec-shop-desc">${fb.desc}</div>
            </div>
          </div>
          <button class="koin-dec-buy-btn${can?'':' cant'}"
            data-buy="${fb.type}" data-cost="${fb.cost}" ${can?'':'disabled'}>
            🪙 ${fb.cost} 金币
          </button>
        </div>`;
    }).join('');

    return `<div class="koin-dec-shop"><div class="koin-dec-shop-grid">${cards}</div></div>`;
  }

  function _attachBodyEvents(body) {
    // SVG canvas slot (room tab only)
    const canvas = body.querySelector('#koinDecCanvas');
    if (canvas) {
      const rd  = getRoomDef();
      const pl  = getPlacement();
      const tmp = document.createElement('div');
      tmp.innerHTML = _buildSVGString(rd, pl);
      const svg = tmp.firstElementChild;
      canvas.appendChild(svg);
      _attachSVGEvents(svg);
      // nothing — furniture is handled by _diffSVG

    // Picker item events
    body.querySelectorAll('.koin-dec-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.pick;
        _selectedType = _selectedType === type ? null : type;
        markDirty('svg', 'body');
        renderDecorator();
      });
      item.addEventListener('dragstart', e => {
        _selectedType = item.dataset.pick;
        _isDragging   = true;
        e.dataTransfer.setData('text/plain', item.dataset.pick);
        item.style.opacity = '0.45';
      });
      item.addEventListener('dragend', () => {
        _isDragging = false; _hoverCell = null;
        item.style.opacity = '';
        markDirty('svg'); renderDecorator();
      });
      item.addEventListener('touchstart', () => {
        _selectedType = item.dataset.pick; _isDragging = true;
      }, { passive: true });
    });

    // Shop buy buttons
    body.querySelectorAll('.koin-dec-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled || btn.classList.contains('cant')) return;
        _activeTab = 'shop';
        if (typeof buyItem === 'function') buyItem(btn.dataset.buy, Number(btn.dataset.cost));
      });
    });
  }

  // ─── Place furniture ────────────────────────────────────────────────────────

  function placeFurniture(type, c, r) {
    const rd        = getRoomDef();
    const placement = getPlacement();
    const key       = `${c},${r}`;

    if (placement[key] && placement[key] !== type) delete placement[key];

    if (!placement[key] && Object.keys(placement).length >= rd.slots) {
      safeToast(`⚠️ 家具槽已满（${rd.slots}/${rd.slots}），升级房间解锁更多！`);
      _selectedType = null; markDirty('svg','body'); renderDecorator(); return;
    }

    const ownedCount  = (window.state.inventory || []).filter(t => t === type).length;
    const placedCount = Object.values(placement).filter(t => t === type).length;
    if (placedCount >= ownedCount) {
      const fb = FURNITURE_MAP[type];
      safeToast(`${fb?.label || type} 已全部摆在房间里了，去商店再买一件吧。`);
      _selectedType = null; markDirty('svg','body'); renderDecorator(); return;
    }

    placement[key]  = type;
    safeSave();
    _lastPlacedKey  = key;
    _selectedType   = null;
    markDirty('svg', 'body');
    renderDecorator();
    safeToast(`${FURNITURE_MAP[type]?.emoji} ${FURNITURE_MAP[type]?.label} 已摆放！`);
  }

  // ─── Color helpers ─────────────────────────────────────────────────────────

  function baseColor(type) {
    return ({ desk:'#A0785A',bookshelf:'#6B4423',computer:'#4A4A7A',treadmill:'#3A7A5F',
      sofa:'#A05438',plant:'#3A7A5F',trophy:'#C8960B',whiteboard:'#5A9FE0',
      lamp:'#E0B030',tree:'#3A9B3A',starterDesk:'#A0785A' })[type] || '#888';
  }

  function darkenColor(type) {
    return ({ desk:'#7A5A3A',bookshelf:'#4A2E10',computer:'#2A2A5A',treadmill:'#1A5A3F',
      sofa:'#7A3A20',plant:'#1A5A3F',trophy:'#A07808',whiteboard:'#3A7FC0',
      lamp:'#C09010',tree:'#1A7B1A',starterDesk:'#7A5A3A' })[type] || '#555';
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('koinDecoratorStyles')) return;
    const s = document.createElement('style');
    s.id = 'koinDecoratorStyles';
    s.textContent = `
      .koin-decorator-wrap{margin:0 16px 20px;border-radius:24px;overflow:hidden;
        border:1.5px solid rgba(124,92,252,.14);box-shadow:0 8px 28px rgba(124,92,252,.10);background:#fff}
      .koin-dec-header{background:linear-gradient(145deg,#1A1034,#3B2A8A 55%,#FF8C42);
        padding:14px 18px;display:flex;align-items:center;justify-content:space-between}
      .koin-dec-title{color:#fff;font-size:16px;font-weight:900}
      .koin-dec-slots{font-size:12px;color:rgba(255,255,255,.85);background:rgba(255,255,255,.18);
        padding:4px 10px;border-radius:999px;font-weight:800}
      .koin-dec-tabs{display:flex;border-bottom:1px solid rgba(0,0,0,.07)}
      .koin-dec-tab{flex:1;padding:10px;font-size:13px;font-weight:700;background:transparent;
        border:none;border-bottom:2px solid transparent;cursor:pointer;color:#999;
        transition:color .15s,border-color .15s}
      .koin-dec-tab.active{color:#7C5CFC;border-bottom-color:#7C5CFC}
      .koin-dec-canvas{background:#F7F5FF}
      .koin-dec-picker{padding:12px;background:#fff}
      .koin-dec-picker-label{font-size:12px;color:#888;font-weight:800;margin:0 0 8px;
        text-transform:uppercase;letter-spacing:.5px}
      .koin-dec-picker-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
      .koin-dec-picker-scroll::-webkit-scrollbar{display:none}
      .koin-dec-item{flex-shrink:0;width:72px;padding:8px 6px;border-radius:16px;
        border:1.5px solid rgba(124,92,252,.12);background:#fff;cursor:grab;text-align:center;
        transition:transform .15s,border-color .15s,box-shadow .15s;
        user-select:none;-webkit-user-select:none;touch-action:none}
      .koin-dec-item:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(124,92,252,.18);
        border-color:rgba(124,92,252,.35)}
      .koin-dec-item.selected{border-color:#7C5CFC;background:rgba(124,92,252,.08);
        box-shadow:0 4px 14px rgba(124,92,252,.22)}
      .koin-dec-item-emoji{font-size:24px;line-height:1}
      .koin-dec-item-name{font-size:10px;font-weight:800;color:#555;margin-top:4px}
      .koin-dec-item-count{font-size:10px;color:#7C5CFC;font-weight:900;margin-top:2px}
      .koin-dec-bonus{padding:12px}
      .koin-dec-bonus-row{display:flex;align-items:center;justify-content:space-between;
        padding:10px 14px;margin-bottom:8px;background:#F7F5FF;border-radius:14px;
        border:1px solid rgba(124,92,252,.10)}
      .koin-dec-bonus-label{font-size:13px;font-weight:800;color:#333}
      .koin-dec-bonus-val{font-size:13px;font-weight:900;color:#2D9144;
        background:rgba(45,145,68,.12);padding:3px 10px;border-radius:999px}
      .koin-dec-bonus-next{margin-top:4px;padding:9px 14px;background:rgba(255,140,66,.10);
        border-radius:12px;font-size:11px;font-weight:800;color:#b05a00;text-align:center}
      .koin-dec-bonus-total{margin-top:8px;padding:10px 14px;background:rgba(45,145,68,.10);
        border-radius:14px;font-size:12px;font-weight:800;color:#1A6B30;text-align:center}
      .koin-dec-empty{text-align:center;padding:24px;color:#aaa;font-size:13px;font-weight:700}
      .koin-dec-shop{padding:12px}
      .koin-dec-shop-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .koin-dec-shop-card{padding:12px;border-radius:16px;border:1.5px solid rgba(124,92,252,.12);
        background:#fff;display:flex;flex-direction:column;gap:4px}
      .koin-dec-shop-top{display:flex;align-items:center;gap:8px}
      .koin-dec-shop-emoji{font-size:24px}
      .koin-dec-shop-name{font-size:13px;font-weight:800;color:#333}
      .koin-dec-shop-desc{font-size:11px;color:#888;font-weight:700}
      .koin-dec-buy-btn{all:unset;margin-top:6px;display:flex;align-items:center;
        justify-content:center;padding:7px;border-radius:12px;
        background:linear-gradient(135deg,#7C5CFC,#FF8C42);color:#fff;
        font-size:12px;font-weight:900;cursor:pointer;text-align:center;
        transition:transform .12s,opacity .12s}
      .koin-dec-buy-btn:hover{transform:translateY(-1px)}
      .koin-dec-buy-btn.cant{opacity:.45;cursor:not-allowed;transform:none}
      @keyframes koinBounce{
        0%{transform:scale(0.3) translateY(-24px);opacity:0}
        60%{transform:scale(1.18) translateY(0);opacity:1}
        80%{transform:scale(0.93)}100%{transform:scale(1);opacity:1}}
      @keyframes koinGlow{
        0%,100%{filter:drop-shadow(0 0 0px rgba(255,210,0,0))}
        50%{filter:drop-shadow(0 0 9px rgba(255,210,0,.9))}}
      .koin-dec-piece.just-placed{
        animation:koinBounce .45s cubic-bezier(.22,.61,.36,1) both,
                  koinGlow .7s ease .08s both}
    `;
    document.head.appendChild(s);
  }

  // ─── Hook render() ─────────────────────────────────────────────────────────

  function hookRender() {
    if (window.__koinDecoratorRenderPatched) return;
    if (typeof render !== 'function') { setTimeout(hookRender, 50); return; }
    window.__koinDecoratorRenderPatched = true;
    const _orig = window.render;
    window.render = function patchedRenderDecorator() {
      _orig();
      applyDailyDecoratorBonus();
      markDirty('shell', 'svg', 'body'); // 外部 render 触发时全量刷新
      renderDecorator();
    };
  }

  // ─── Boot ──────────────────────────────────────────────────────────────────

  injectStyles();
  applyDailyDecoratorBonus();
  renderDecorator();
  hookRender();

  console.log('[Koin City V2] Room Decorator Patch (架构优化版) loaded');

})();
