// Koin City V2 — Work Center Patch v4
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

  // ── Career Level Perks ────────────────────────────────────────────────────
  // Each career has milestones at Lv3, Lv5, Lv10.
  // type: 'bonus_coins' = one-time extra coins on claim
  //       'weekly_quest' = weekly special task (flag stored in state)
  //       'salary_boost' = permanent extra % on top of level formula

  const CAREER_PERKS = {
    ai_engineer: [
      { level: 3,  type: 'bonus_coins',  amount: 50,   label: '🤖 AI Debug — 每次上班额外 +50 🪙' },
      { level: 5,  type: 'weekly_quest', amount: 400,  label: '🔬 深度研究任务 — 每周 +400 🪙',   questKey: 'ai_research' },
      { level: 10, type: 'salary_boost', amount: 0.5,  label: '🏆 AI 大师 — 薪资 +50%' }
    ],
    game_designer: [
      { level: 3,  type: 'bonus_coins',  amount: 50,   label: '🎮 创意加成 — 每次上班额外 +50 🪙' },
      { level: 5,  type: 'weekly_quest', amount: 350,  label: '🕹️ 游戏发布任务 — 每周 +350 🪙',   questKey: 'game_launch' },
      { level: 10, type: 'salary_boost', amount: 0.5,  label: '🏆 游戏大师 — 薪资 +50%' }
    ],
    entrepreneur: [
      { level: 3,  type: 'bonus_coins',  amount: 70,   label: '💼 客户加单 — 每次上班额外 +70 🪙' },
      { level: 5,  type: 'weekly_quest', amount: 500,  label: '📈 融资任务 — 每周 +500 🪙',        questKey: 'funding_round' },
      { level: 10, type: 'salary_boost', amount: 0.5,  label: '🏆 创业大师 — 薪资 +50%' }
    ],
    fitness_coach: [
      { level: 3,  type: 'bonus_coins',  amount: 40,   label: '🏋️ 训练营加成 — 每次上班额外 +40 🪙' },
      { level: 5,  type: 'weekly_quest', amount: 300,  label: '🥇 锦标赛任务 — 每周 +300 🪙',     questKey: 'tournament' },
      { level: 10, type: 'salary_boost', amount: 0.5,  label: '🏆 健身大师 — 薪资 +50%' }
    ],
    property_expert: [
      { level: 3,  type: 'bonus_coins',  amount: 60,   label: '🏠 房产估价 — 每次上班额外 +60 🪙' },
      { level: 5,  type: 'weekly_quest', amount: 800,  label: '🏢 房地产估价任务 — 每周 +800 🪙', questKey: 'property_valuation' },
      { level: 10, type: 'salary_boost', amount: 0.5,  label: '🏆 房产大师 — 薪资 +50%' }
    ],
    content_creator: [
      { level: 3,  type: 'bonus_coins',  amount: 45,   label: '🎬 流量加成 — 每次上班额外 +45 🪙' },
      { level: 5,  type: 'weekly_quest', amount: 400,  label: '🌟 爆款任务 — 每周 +400 🪙',       questKey: 'viral_content' },
      { level: 10, type: 'salary_boost', amount: 0.5,  label: '🏆 创作大师 — 薪资 +50%' }
    ]
  };

  // Returns all perks unlocked at or below current level for a career
  function getUnlockedPerks(careerId) {
    const perks = CAREER_PERKS[careerId] || [];
    const lv    = getCareerLevel(careerId);
    return perks.filter(p => p.level <= lv);
  }

  // Returns the perk definition for an exact level milestone (for unlock toast)
  function getCareerPerk(careerId, level) {
    const perks = CAREER_PERKS[careerId] || [];
    return perks.find(p => p.level === level) || null;
  }

  // Returns active bonus_coins amount from all unlocked perks
  function getPerkBonusCoins(careerId) {
    return getUnlockedPerks(careerId)
      .filter(p => p.type === 'bonus_coins')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  // Returns active salary_boost multiplier from unlocked perks (additive)
  function getPerkSalaryBoost(careerId) {
    return getUnlockedPerks(careerId)
      .filter(p => p.type === 'salary_boost')
      .reduce((sum, p) => sum + p.amount, 0);
  }


  // ── Random Work Events ───────────────────────────────────────────────────
  // Shown after claimDailySalary succeeds. ~40% chance each day.
  // choice A = positive outcome, choice B = neutral/miss

  const WORK_EVENTS = {
    ai_engineer: [
      { id: 'bug',     emoji: '🐛', title: '系统出现 Bug！',    desc: '客户反映系统崩溃，需要你紧急修复。',      choiceA: { label: '立刻修复', coins: 80,  msg: '漂亮修复！客户超满意。+80 🪙' },  choiceB: { label: '明天再说', coins: 0,   msg: '拖延了……客户有点不满。' } },
      { id: 'upgrade', emoji: '⚡', title: '客户要求系统升级！',  desc: '大客户希望你在本周内完成新功能。',          choiceA: { label: '接受挑战', coins: 120, msg: '加班完成！获得额外奖励。+120 🪙' }, choiceB: { label: '婉拒要求', coins: 0,   msg: '错过了这个机会。' } },
    ],
    game_designer: [
      { id: 'viral',   emoji: '🎮', title: '游戏突然爆红！',      desc: '你设计的小游戏在社群疯传，评价很好！',      choiceA: { label: '趁热打铁', coins: 150, msg: '迅速更新！粉丝大增。+150 🪙' },   choiceB: { label: '顺其自然', coins: 30,  msg: '获得了一些关注。+30 🪙' } },
      { id: 'bug2',    emoji: '🐞', title: '玩家报告严重 Bug！',  desc: '有玩家发现游戏里有严重的漏洞。',            choiceA: { label: '紧急修复', coins: 60,  msg: '快速处理！评价回升。+60 🪙' },   choiceB: { label: '暂时忽略', coins: 0,   msg: '投诉变多了，损失口碑。' } },
    ],
    entrepreneur: [
      { id: 'order',   emoji: '📦', title: '客户追加大订单！',    desc: '老客户临时追加了 3 倍的订单量。',          choiceA: { label: '全力完成', coins: 150, msg: '完美交货！客户续约了。+150 🪙' }, choiceB: { label: '部分接受', coins: 50,  msg: '只完成了一部分。+50 🪙' } },
      { id: 'pitch',   emoji: '🤝', title: '有人邀请你做演讲！',  desc: '一个商业论坛邀请你分享创业经验。',          choiceA: { label: '接受邀请', coins: 100, msg: '演讲很成功！建立了人脉。+100 🪙' },choiceB: { label: '婉拒邀请', coins: 0,   msg: '错过了曝光机会。' } },
    ],
    fitness_coach: [
      { id: 'camp',    emoji: '🏋️', title: '有人邀请开训练营！',  desc: '本地健身中心邀请你带一期集训营。',          choiceA: { label: '接受邀请', coins: 100, msg: '训练营大成功！+100 🪙' },         choiceB: { label: '婉拒邀请', coins: 20,  msg: '推荐了朋友，得到小报酬。+20 🪙' } },
      { id: 'injury',  emoji: '🩹', title: '学员受伤了！',        desc: '训练中有学员反映关节不舒服。',              choiceA: { label: '立刻处理', coins: 40,  msg: '及时处理，学员感谢你。+40 🪙' },  choiceB: { label: '继续训练', coins: 0,   msg: '学员不满意，退出了课程。' } },
    ],
    property_expert: [
      { id: 'valuation',emoji: '🏠',title: '客户要求紧急估价！', desc: '一位客户明天就要签合同，需要立刻估价。',    choiceA: { label: '加班完成', coins: 120, msg: '估价准确，客户成交！+120 🪙' },   choiceB: { label: '明天再说', coins: 0,   msg: '客户找了别人，失去机会。' } },
      { id: 'dispute',  emoji: '⚖️',title: '买卖双方有纠纷！',   desc: '两个客户对房价有争议，要你调解。',          choiceA: { label: '主动调解', coins: 80,  msg: '成功调解！两方都感谢你。+80 🪙' }, choiceB: { label: '置身事外', coins: 0,   msg: '纠纷恶化，影响你的口碑。' } },
    ],
    content_creator: [
      { id: 'collab',  emoji: '🎬', title: '大博主邀请合作！',    desc: '一个有 10 万粉丝的博主邀请你联名发布。',    choiceA: { label: '答应合作', coins: 130, msg: '联名成功！粉丝暴增。+130 🪙' },   choiceB: { label: '婉拒合作', coins: 0,   msg: '错过了曝光机会。' } },
      { id: 'trend',   emoji: '🌊', title: '热门话题出现了！',    desc: '今天有个话题正在爆红，你能蹭热度吗？',      choiceA: { label: '立刻发布', coins: 100, msg: '完美蹭热度！获得大量曝光。+100 🪙' },choiceB: { label: '等等再说', coins: 10,  msg: '热度消退了，只有少量流量。+10 🪙' } },
    ]
  };

  function triggerWorkEvent(career, onDone) {
    // 40% chance
    if (Math.random() > 0.4) { onDone(); return; }

    const pool = WORK_EVENTS[career.id];
    if (!pool || !pool.length) { onDone(); return; }

    const event = pool[Math.floor(Math.random() * pool.length)];

    // Build popup
    const overlay = document.createElement('div');
    overlay.id = 'workEventOverlay';
    overlay.innerHTML = `
      <div class="kwe-backdrop"></div>
      <div class="kwe-card">
        <div class="kwe-emoji">${event.emoji}</div>
        <div class="kwe-title">${event.title}</div>
        <div class="kwe-desc">${event.desc}</div>
        <div class="kwe-choices">
          <button class="kwe-btn kwe-btn-a" data-kwe="a">${event.choiceA.label}</button>
          <button class="kwe-btn kwe-btn-b" data-kwe="b">${event.choiceB.label}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    function handleChoice(choice) {
      const picked = choice === 'a' ? event.choiceA : event.choiceB;
      overlay.remove();

      if (picked.coins > 0) {
        if (typeof addReward === 'function') addReward(picked.coins, 5);
        else if (window.state) state.coins = (state.coins || 0) + picked.coins;
        if (window.state) state.work.totalEarned = (state.work.totalEarned || 0) + picked.coins;
        safeBurst(`+${picked.coins} 🪙`);
      }
      safeToast(picked.msg);
      onDone();
    }

    overlay.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-kwe]');
      if (btn) handleChoice(btn.dataset.kwe);
    });
  }

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
    if (!state.work.careerXP)                            state.work.careerXP      = {};
    if (!state.work.careerLevel)                         state.work.careerLevel   = {};

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

  // ── Career XP & Level System ─────────────────────────────────────────────

  function ensureCareerProgress(careerId) {
    if (!state.work.careerXP[careerId])    state.work.careerXP[careerId]    = 0;
    if (!state.work.careerLevel[careerId]) state.work.careerLevel[careerId] = 1;
  }

  function getXPNeeded(level) {
    // Exponential curve: Lv1=100, Lv2=135, Lv3=182, Lv5=332, Lv10=1489
    return Math.floor(100 * Math.pow(1.35, level - 1));
  }

  function getCareerLevel(careerId) {
    ensureCareerProgress(careerId);
    return state.work.careerLevel[careerId];
  }

  function getSalaryWithLevel(careerId) {
    const base       = (DAILY_SALARY[careerId] || {}).amount || 200;
    const level      = getCareerLevel(careerId);
    const levelMult  = 1 + (level - 1) * 0.2;          // +20% per level
    const perkBoost  = getPerkSalaryBoost(careerId);    // +50% at Lv10
    return Math.floor(base * (levelMult + perkBoost));
  }

  const MAX_CAREER_LEVEL = 10;

  function checkCareerLevelUp(careerId) {
    ensureCareerProgress(careerId);
    let level  = state.work.careerLevel[careerId];
    let xp     = state.work.careerXP[careerId];

    if (level >= MAX_CAREER_LEVEL) {
      // At max level — keep XP capped, show max badge once
      state.work.careerXP[careerId] = Math.min(xp, getXPNeeded(MAX_CAREER_LEVEL) - 1);
      return;
    }

    let needed = getXPNeeded(level);

    while (xp >= needed && level < MAX_CAREER_LEVEL) {
      xp    -= needed;
      level += 1;
      needed = getXPNeeded(level);

      const career = getCareers ? getCareers().find(c => c.id === careerId) : null;
      const name   = career ? career.name : careerId;

      safeToast(`🎉 职业升级！${name} 升到 Lv${level}${level === MAX_CAREER_LEVEL ? ' 🏆 满级！' : ''}`);
      safeBurst(`Lv${level} ⬆️`);

      // Check if level unlocks a milestone perk
      const perk = getCareerPerk(careerId, level);
      if (perk) {
        setTimeout(() => safeToast(`✨ 新技能解锁：${perk.label}`), 600);
      }
    }

    // If hit max, bank remaining XP at cap
    if (level >= MAX_CAREER_LEVEL) xp = 0;

    state.work.careerXP[careerId]    = xp;
    state.work.careerLevel[careerId] = level;
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

    // Base salary — scaled by career level
    const baseSalary = getSalaryWithLevel(career.id);

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

    // Career XP gain
    ensureCareerProgress(career.id);
    state.work.careerXP[career.id] += 25;
    checkCareerLevelUp(career.id);

    // Perk: bonus_coins from unlocked level milestones
    const perkCoins = getPerkBonusCoins(career.id);
    if (perkCoins > 0) {
      if (typeof addReward === 'function') addReward(perkCoins, 0);
      else state.coins = (state.coins || 0) + perkCoins;
      state.work.totalEarned = (state.work.totalEarned || 0) + perkCoins;
    }

    safeBurst(`+${totalCoins + perkCoins} 🪙`);
    const _perkCoinsForToast = getPerkBonusCoins(career.id);
    safeToast(
      `${career.emoji || '💼'} 今日薪资 +${baseSalary}` +
      (_perkCoinsForToast ? ` + 技能 +${_perkCoinsForToast}` : '') +
      (streakBonus ? ` + 连续 +${streakBonus}` : '') +
      chestMsg
    );
    safeSave();

    // Trigger random work event before re-rendering
    triggerWorkEvent(career, function() {
      if (typeof render === 'function') render();
    });
  };

  // ── Career XP from Location Activities ───────────────────────────────────
  // Called by v2-location-growth.js after performLocationTask completes.
  // Maps location keys to relevant career ids.

  const LOCATION_CAREER_XP = {
    library:  { ai_engineer: 5, game_designer: 5 },
    school:   { ai_engineer: 5 },
    business: { entrepreneur: 5, property_expert: 5 },
    social:   { content_creator: 5 },
    studio:   { game_designer: 5, content_creator: 5 },
    gym:      { fitness_coach: 5 },
    park:     { fitness_coach: 3 }
  };

  window.addCareerXPFromLocation = function addCareerXPFromLocation(locationKey) {
    if (!ensureWorkState()) return;
    if (!window.state) return;

    const xpMap = LOCATION_CAREER_XP[locationKey];
    if (!xpMap) return;

    // Only give XP to careers the player has unlocked
    Object.entries(xpMap).forEach(function(entry) {
      const careerId = entry[0];
      const amount   = entry[1];
      if (!isCareerUnlocked(careerId)) return;

      ensureCareerProgress(careerId);
      state.work.careerXP[careerId] += amount;
      checkCareerLevelUp(careerId);

      // Show small toast only for the selected/tracked career
      const sel = getSelectedCareer();
      if (sel && sel.id === careerId) {
        safeToast(`📚 ${locationKey} 活动：${sel.name} 职业经验 +${amount} XP`);
      }
    });

    safeSave();
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

      /* ── Career XP bar ── */
      .kwc-xp-box {
        margin-top: 12px;
        padding: 10px 12px;
        background: rgba(255,255,255,.10);
        border: 1.5px solid rgba(255,255,255,.15);
        border-radius: 14px;
        position: relative;
        z-index: 1;
      }

      .kwc-xp-top {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: rgba(255,255,255,.85);
        font-weight: 800;
        margin-bottom: 6px;
      }

      .kwc-xp-track {
        height: 8px;
        background: rgba(255,255,255,.15);
        border-radius: 999px;
        overflow: hidden;
      }

      .kwc-xp-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #72E128, #FFD23F);
        transition: width .4s ease;
      }

      /* ── Career Perks ── */
      .kwc-perks-list {
        margin-top: 10px;
        display: grid;
        gap: 5px;
      }

      .kwc-perk-item {
        font-size: 11px;
        font-weight: 800;
        padding: 6px 10px;
        border-radius: 10px;
        line-height: 1.4;
      }

      .kwc-perk-active {
        background: rgba(114,225,40,.15);
        color: #1e5c0a;
        border: 1px solid rgba(114,225,40,.25);
      }

      .kwc-perk-locked {
        background: rgba(255,255,255,.10);
        color: rgba(255,255,255,.55);
        border: 1px dashed rgba(255,255,255,.18);
      }

      /* ── Work Event Popup ── */
      #workEventOverlay {
        position: fixed; inset: 0; z-index: 3000;
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
      }
      .kwe-backdrop {
        position: absolute; inset: 0;
        background: rgba(15,32,39,.75);
        backdrop-filter: blur(6px);
      }
      .kwe-card {
        position: relative; z-index: 1;
        background: #fff;
        border-radius: 28px;
        padding: 28px 22px 22px;
        max-width: 340px; width: 100%;
        text-align: center;
        box-shadow: 0 24px 60px rgba(0,0,0,.28);
        animation: kwePopIn .4s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes kwePopIn {
        from { opacity:0; transform:scale(.7); }
        to   { opacity:1; transform:scale(1); }
      }
      .kwe-emoji { font-size: 52px; margin-bottom: 10px; }
      .kwe-title {
        font-size: 18px; font-weight: 900;
        color: var(--ink,#1A1034); margin-bottom: 8px;
      }
      .kwe-desc {
        font-size: 13px; color: var(--muted,#756e83);
        line-height: 1.55; margin-bottom: 20px; font-weight: 700;
      }
      .kwe-choices { display: grid; gap: 10px; }
      .kwe-btn {
        all: unset; box-sizing: border-box;
        padding: 13px 16px; border-radius: 16px;
        font-size: 14px; font-weight: 900; cursor: pointer;
        transition: transform .15s, box-shadow .15s;
        text-align: center;
      }
      .kwe-btn:hover { transform: translateY(-2px); }
      .kwe-btn-a {
        background: linear-gradient(135deg,#7C5CFC,#FF8C42);
        color: #fff;
        box-shadow: 0 6px 18px rgba(124,92,252,.30);
      }
      .kwe-btn-b {
        background: rgba(124,92,252,.08);
        color: var(--violet,#7C5CFC);
        border: 1.5px solid rgba(124,92,252,.18);
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
      const baseSalary = getSalaryWithLevel(selectedCareer.id);
      const streakDay  = ((state.work.workStreak - 1) % 7) + 1;
      const streakEntry = state.work.workStreak > 0 ? STREAK_BONUSES[streakDay - 1] : null;
      const nextBonus  = !claimedToday && streakEntry ? streakEntry.bonus : 0;

      salarySection = `
        ${claimedToday ? `<div class="koin-work-done-note visible">✅ 今天已经上班了，明天回来继续！</div>` : ''}
        <div class="koin-work-salary-row">
          <div class="koin-work-salary-info">
            <div class="koin-work-salary-amount">+${baseSalary}${nextBonus ? `<span style="font-size:14px;color:#FF8C42"> +${nextBonus}</span>` : ''} 🪙</div>
            <div class="koin-work-salary-label">${selectedCareer.emoji || '💼'} ${selectedCareer.name} · Lv${getCareerLevel(selectedCareer.id)} · 每日薪资${nextBonus ? ' + 连续奖励' : ''}</div>
          </div>
          <button class="koin-work-claim-btn ${claimedToday ? 'done' : ''}" onclick="claimDailySalary()">
            ${claimedToday ? '✅ 已领取' : '💼 上班'}
          </button>
        </div>

        ${(function() {
          const lvl        = getCareerLevel(selectedCareer.id);
          const xp         = state.work.careerXP[selectedCareer.id] || 0;
          const isMaxLevel = lvl >= MAX_CAREER_LEVEL;
          const needed     = isMaxLevel ? getXPNeeded(MAX_CAREER_LEVEL) : getXPNeeded(lvl);
          const progress   = isMaxLevel ? 100 : Math.min(100, Math.floor(xp / needed * 100));

          // Next perk milestone
          const allPerks   = CAREER_PERKS[selectedCareer.id] || [];
          const nextPerk   = allPerks.find(p => p.level > lvl);
          const unlockedP  = getUnlockedPerks(selectedCareer.id);

          const unlockedHtml = unlockedP.length
            ? unlockedP.map(p => `<div class="kwc-perk-item kwc-perk-active">✅ ${p.label}</div>`).join('')
            : '';

          const nextPerkHtml = nextPerk && !isMaxLevel
            ? `<div class="kwc-perk-item kwc-perk-locked">🔒 Lv${nextPerk.level} 解锁：${nextPerk.label}</div>`
            : '';

          const maxHtml = isMaxLevel
            ? `<div class="kwc-perk-item kwc-perk-active" style="color:#FFD23F">🏆 已达满级！薪资 +50% 永久生效</div>`
            : '';

          return `
            <div class="kwc-xp-box">
              <div class="kwc-xp-top">
                <span>职业等级 Lv${lvl}${isMaxLevel ? ' 🏆' : ''}</span>
                <span>${isMaxLevel ? '满级' : xp + ' / ' + needed + ' XP'}</span>
              </div>
              <div class="kwc-xp-track">
                <div class="kwc-xp-fill" style="width:${progress}%"></div>
              </div>
              ${unlockedHtml || nextPerkHtml || maxHtml
                ? `<div class="kwc-perks-list">${unlockedHtml}${nextPerkHtml}${maxHtml}</div>`
                : ''}
            </div>`;
        })()}
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
        const salary = getSalaryWithLevel(career.id);
        const lv     = getCareerLevel(career.id);
        const isSelected = selectedCareer && selectedCareer.id === career.id;

        return `
          <div class="koin-work-career-row ${isSelected ? 'selected' : ''}"
               onclick="selectCareerFromWork('${career.id}')">
            <div class="koin-work-career-emoji">${career.emoji || '💼'}</div>
            <div class="koin-work-career-info">
              <div class="koin-work-career-name">${career.name} <span style="font-size:10px;background:rgba(124,92,252,.10);color:#7C5CFC;border-radius:999px;padding:2px 7px;font-weight:900">Lv${lv}</span></div>
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
  if (typeof _originalRender === 'function' && !window.__koinWorkRenderPatchedV4) {
    window.__koinWorkRenderPatchedV4 = true;

    window.render = function patchedRenderWorkV4() {
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

  console.log('[Koin City V2] Work Center Patch v4 loaded');

})();
