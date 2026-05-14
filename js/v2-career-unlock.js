// Koin City V2 — Career Unlock Patch v1
// Upload as js/v2-career-unlock.js
// Load AFTER js/v2-location-growth.js in index.html.

(function () {
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

  function clamp(v) {
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  function ensureCareerState() {
    if (!window.state) return;

    if (!state.stats) state.stats = {};
    const statDefaults = {
      discipline: 50,
      saving: 50,
      judgment: 50,
      resilience: 50,
      confidence: 50,
      knowledge: 0,
      creativity: 0,
      fitness: 0,
      social: 0,
      business: 0,
      emotion: 0
    };

    Object.entries(statDefaults).forEach(([key, value]) => {
      if (typeof state.stats[key] !== 'number') state.stats[key] = value;
    });

    if (!state.careers) {
      state.careers = {
        selected: null,
        unlocked: [],
        claimedRewards: []
      };
    }

    if (!Array.isArray(state.careers.unlocked)) state.careers.unlocked = [];
    if (!Array.isArray(state.careers.claimedRewards)) state.careers.claimedRewards = [];
  }

  function statLabel(key) {
    const labels = {
      discipline: '自律',
      saving: '储蓄',
      judgment: '判断力',
      resilience: '抗挫力',
      confidence: '自信',
      knowledge: '知识',
      creativity: '创意',
      fitness: '活力',
      social: '沟通',
      business: '商业',
      emotion: '情绪'
    };
    return labels[key] || key;
  }

  function injectCareerStyles() {
    const old = document.getElementById('koinCareerPatchStyles');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'koinCareerPatchStyles';
    style.textContent = `
      .koin-career-hub{
        margin:14px 16px;
      }

      .koin-career-hero{
        background:linear-gradient(145deg,#1A1034,#4F46E5 55%,#FF8C42);
        color:#fff;
        border-radius:26px;
        padding:18px;
        box-shadow:0 16px 42px rgba(79,70,229,.22);
        position:relative;
        overflow:hidden;
      }

      .koin-career-hero::after{
        content:"";
        position:absolute;
        width:180px;
        height:180px;
        right:-80px;
        top:-80px;
        background:rgba(255,255,255,.16);
        border-radius:50%;
      }

      .koin-career-hero h2{
        margin:0 0 8px;
        color:#fff;
        position:relative;
        z-index:1;
      }

      .koin-career-hero p{
        color:rgba(255,255,255,.86);
        font-size:13px;
        line-height:1.6;
        position:relative;
        z-index:1;
      }

      .koin-career-summary{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:8px;
        margin-top:14px;
        position:relative;
        z-index:1;
      }

      .koin-career-summary .box{
        background:rgba(255,255,255,.16);
        border:1px solid rgba(255,255,255,.24);
        border-radius:16px;
        padding:10px;
        text-align:center;
        backdrop-filter:blur(8px);
      }

      .koin-career-summary .num{
        display:block;
        font-size:20px;
        font-weight:1000;
        line-height:1;
      }

      .koin-career-summary .label{
        display:block;
        margin-top:4px;
        font-size:10px;
        color:rgba(255,255,255,.8);
        font-weight:800;
      }

      .koin-career-list{
        display:grid;
        grid-template-columns:1fr;
        gap:12px;
        margin-top:14px;
      }

      .koin-career-card{
        background:#fff;
        border-radius:22px;
        border:1.5px solid rgba(124,92,252,.14);
        box-shadow:0 8px 24px rgba(124,92,252,.10);
        padding:15px;
        overflow:hidden;
      }

      .koin-career-card.unlocked{
        border-color:rgba(114,225,40,.42);
        background:linear-gradient(145deg,#fff,#f4fff0);
      }

      .koin-career-card.selected{
        outline:3px solid rgba(255,140,66,.28);
      }

      .koin-career-head{
        display:flex;
        gap:12px;
        align-items:flex-start;
      }

      .koin-career-icon{
        width:50px;
        height:50px;
        border-radius:18px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(124,92,252,.10);
        font-size:28px;
        flex-shrink:0;
      }

      .koin-career-title{
        font-weight:1000;
        font-size:16px;
        margin-bottom:4px;
      }

      .koin-career-benefit{
        color:var(--muted,#756e83);
        font-size:12px;
        line-height:1.45;
      }

      .koin-career-progress{
        margin-top:12px;
        display:grid;
        gap:8px;
      }

      .koin-career-req{
        background:rgba(124,92,252,.05);
        border-radius:14px;
        padding:9px 10px;
        border:1px solid rgba(124,92,252,.08);
      }

      .koin-career-req-top{
        display:flex;
        justify-content:space-between;
        gap:8px;
        font-size:12px;
        font-weight:900;
        margin-bottom:6px;
      }

      .koin-career-track{
        height:8px;
        border-radius:999px;
        background:rgba(0,0,0,.08);
        overflow:hidden;
      }

      .koin-career-fill{
        height:100%;
        border-radius:999px;
        background:linear-gradient(90deg,#7C5CFC,#FF8C42);
      }

      .koin-career-card.unlocked .koin-career-fill{
        background:linear-gradient(90deg,#72E128,#06C8A8);
      }

      .koin-career-actions{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:12px;
      }

      .koin-career-status{
        margin-top:10px;
        border-radius:14px;
        padding:9px 10px;
        font-size:12px;
        font-weight:900;
        background:rgba(124,92,252,.08);
        color:#5d4ae8;
      }

      .koin-career-status.unlocked{
        background:rgba(114,225,40,.16);
        color:#2d6a19;
      }

      .koin-career-suggest{
        margin-top:10px;
        font-size:12px;
        color:var(--muted,#756e83);
        line-height:1.5;
      }

      .koin-career-panel{
        background:#fff;
        border-radius:22px;
        border:1.5px solid rgba(124,92,252,.12);
        padding:15px;
        box-shadow:0 8px 24px rgba(124,92,252,.08);
        margin-top:14px;
      }

      .koin-career-mini-link{
        margin-top:12px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        border-radius:18px;
        border:1.5px solid rgba(124,92,252,.14);
        background:linear-gradient(145deg,#fff,#f7f3ff);
        padding:12px 14px;
        cursor:pointer;
      }

      .koin-career-mini-link strong{
        font-size:14px;
      }

      .koin-career-mini-link span{
        font-size:12px;
        color:var(--muted,#756e83);
      }
    `;
    document.head.appendChild(style);
  }

  const defaultCareers = [
    {
      id: 'fitness_coach',
      emoji: '🏋️',
      name: '健身教练 / 运动员',
      requirements: { discipline: 80, fitness: 70 },
      benefit: '解锁运动挑战、健康类收入与活力加成。',
      income: 220,
      focus: ['gym', 'park'],
      suggested: '建议多去健身房提升活力，也要维持自律。'
    },
    {
      id: 'game_designer',
      emoji: '🎮',
      name: '游戏设计师',
      requirements: { creativity: 80, judgment: 70 },
      benefit: '解锁创作室高级任务，提升创意与判断力。',
      income: 260,
      focus: ['studio', 'library'],
      suggested: '建议多去创作室提升创意，再去图书馆提升判断力。'
    },
    {
      id: 'entrepreneur',
      emoji: '🧑‍💼',
      name: '创业家',
      requirements: { business: 85, resilience: 80 },
      benefit: '解锁创业中心高级收入与风险挑战。',
      income: 350,
      focus: ['business', 'school'],
      suggested: '建议多去创业中心提升商业能力，也要通过事件训练抗挫力。'
    },
    {
      id: 'ai_engineer',
      emoji: '🤖',
      name: 'AI 工程师',
      requirements: { knowledge: 90, discipline: 75 },
      benefit: '解锁未来都市科技任务与 AI 项目收入。',
      income: 320,
      focus: ['school', 'library'],
      suggested: '建议多去学校和图书馆提升知识，并维持自律。'
    },
    {
      id: 'property_expert',
      emoji: '🏠',
      name: '房地产达人',
      requirements: { judgment: 90, social: 70 },
      benefit: '解锁资产、租金、预算与谈判事件。',
      income: 330,
      focus: ['library', 'social'],
      suggested: '建议多去图书馆提升判断力，再去社交区提升沟通。'
    },
    {
      id: 'content_creator',
      emoji: '🎬',
      name: '内容创作者',
      requirements: { creativity: 85, social: 75 },
      benefit: '解锁影响力任务、粉丝事件与创意收入。',
      income: 280,
      focus: ['studio', 'social'],
      suggested: '建议多去创作室提升创意，也要去社交区练习表达。'
    }
  ];

  function getCareers() {
    if (Array.isArray(window.careerPaths) && window.careerPaths.length) {
      return window.careerPaths.map((career, index) => ({
        id: career.id || career.name.replace(/\s+/g, '_') || `career_${index}`,
        emoji: career.emoji || '💼',
        name: career.name,
        requirements: career.requirements || {},
        benefit: career.benefit || '解锁新的成长机会。',
        income: career.income || 200 + index * 30,
        focus: career.focus || [],
        suggested: career.suggested || '继续提升相关能力，就会越来越接近这个职业。'
      }));
    }

    return defaultCareers;
  }

  function getCareerProgress(career) {
    ensureCareerState();

    const missing = [];
    const reqEntries = Object.entries(career.requirements || {});
    let score = 0;

    reqEntries.forEach(([stat, req]) => {
      const current = state.stats[stat] || 0;
      const pct = Math.min(100, Math.round((current / req) * 100));
      score += pct;

      if (current < req) {
        missing.push({ stat, current, req, need: req - current, pct });
      }
    });

    const average = reqEntries.length ? Math.round(score / reqEntries.length) : 0;

    return {
      unlocked: missing.length === 0,
      missing,
      average
    };
  }

  window.getCareerProgress = getCareerProgress;

  function updateUnlockedCareers() {
    ensureCareerState();

    getCareers().forEach(career => {
      const progress = getCareerProgress(career);
      if (progress.unlocked && !state.careers.unlocked.includes(career.id)) {
        state.careers.unlocked.push(career.id);
        safeToast(`新职业方向解锁：${career.emoji} ${career.name}！`);
        safeBurst('职业解锁 ✨');
      }
    });

    safeSave();
  }

  function bestCareer() {
    const careers = getCareers();
    return careers
      .map(career => ({ career, progress: getCareerProgress(career) }))
      .sort((a, b) => b.progress.average - a.progress.average)[0];
  }

  function renderRequirementBar(stat, req) {
    const current = state.stats[stat] || 0;
    const pct = Math.min(100, Math.round((current / req) * 100));

    return `
      <div class="koin-career-req">
        <div class="koin-career-req-top">
          <span>${statLabel(stat)}</span>
          <span>${current}/${req}</span>
        </div>
        <div class="koin-career-track">
          <div class="koin-career-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }

  function selectCareer(careerId) {
    ensureCareerState();
    const career = getCareers().find(c => c.id === careerId);
    if (!career) return;

    state.careers.selected = careerId;
    safeSave();
    safeToast(`已追踪目标：${career.emoji} ${career.name}`);
    if (typeof render === 'function') render();
  }

  function claimCareerReward(careerId) {
    ensureCareerState();

    const career = getCareers().find(c => c.id === careerId);
    if (!career) return;

    const progress = getCareerProgress(career);
    if (!progress.unlocked) {
      alert('还没有达到这个职业的条件，继续成长吧！');
      return;
    }

    if (state.careers.claimedRewards.includes(careerId)) {
      safeToast('这个职业奖励已经领取过了 ✅');
      return;
    }

    state.careers.claimedRewards.push(careerId);
    state.coins = (state.coins || 0) + career.income;
    state.xp = (state.xp || 0) + 35;

    safeBurst(`+${career.income} 🪙`);
    safeToast(`领取 ${career.name} 解锁奖励！`);
    safeSave();

    if (typeof render === 'function') render();
  }

  window.selectCareer = selectCareer;
  window.claimCareerReward = claimCareerReward;

  function renderCareerCard(career) {
    const progress = getCareerProgress(career);
    const selected = state.careers.selected === career.id;
    const claimed = state.careers.claimedRewards.includes(career.id);

    const missingText = progress.unlocked
      ? '✅ 已达到职业条件'
      : progress.missing.map(m => `${statLabel(m.stat)} 还差 ${m.need}`).join(' · ');

    return `
      <div class="koin-career-card ${progress.unlocked ? 'unlocked' : ''} ${selected ? 'selected' : ''}">
        <div class="koin-career-head">
          <div class="koin-career-icon">${career.emoji}</div>
          <div style="flex:1;min-width:0">
            <div class="koin-career-title">${career.name}</div>
            <div class="koin-career-benefit">${career.benefit}</div>
          </div>
        </div>

        <div class="koin-career-status ${progress.unlocked ? 'unlocked' : ''}">
          ${progress.unlocked ? '🎉 职业方向已解锁' : `进度 ${progress.average}% · ${missingText}`}
        </div>

        <div class="koin-career-progress">
          ${Object.entries(career.requirements).map(([stat, req]) => renderRequirementBar(stat, req)).join('')}
        </div>

        <div class="koin-career-suggest">
          💡 ${career.suggested}
        </div>

        <div class="koin-career-actions">
          <button class="btn secondary" data-career-select="${career.id}">
            ${selected ? '✅ 正在追踪' : '追踪目标'}
          </button>
          <button class="btn green" data-career-claim="${career.id}" ${!progress.unlocked || claimed ? 'disabled' : ''}>
            ${claimed ? '已领取' : `领取 +${career.income}🪙`}
          </button>
        </div>
      </div>
    `;
  }

  function renderCareerHub() {
    ensureCareerState();
    updateUnlockedCareers();

    const careers = getCareers();
    const unlocked = careers.filter(c => getCareerProgress(c).unlocked);
    const tracked = careers.find(c => c.id === state.careers.selected);
    const best = bestCareer();

    return `
      <div class="koin-career-hub" id="careerHub">
        <div class="koin-career-hero">
          <h2>🚀 Career Center 职业中心</h2>
          <p>
            这里不是让你一开始就选职业，而是让你看见：
            你现在的能力，会带你走向什么人生路线。
          </p>

          <div class="koin-career-summary">
            <div class="box">
              <span class="num">${unlocked.length}</span>
              <span class="label">已解锁</span>
            </div>
            <div class="box">
              <span class="num">${tracked ? tracked.emoji : best.career.emoji}</span>
              <span class="label">${tracked ? '追踪中' : '最接近'}</span>
            </div>
            <div class="box">
              <span class="num">${best.progress.average}%</span>
              <span class="label">最高进度</span>
            </div>
          </div>
        </div>

        <div class="koin-career-panel">
          <strong>🎯 当前建议路线</strong>
          <p class="muted" style="margin-top:6px">
            ${tracked
              ? `你正在追踪：${tracked.emoji} ${tracked.name}。${tracked.suggested}`
              : `你目前最接近：${best.career.emoji} ${best.career.name}。${best.career.suggested}`}
          </p>
        </div>

        <div class="koin-career-list">
          ${careers.map(renderCareerCard).join('')}
        </div>
      </div>
    `;
  }

  function injectCareerHubIntoCity() {
    ensureCareerState();
    injectCareerStyles();

    const pageCity = $safe('page-city');
    if (!pageCity) return;

    const existing = $safe('careerHub');
    if (existing) existing.remove();

    const hubWrapper = document.createElement('div');
    hubWrapper.innerHTML = renderCareerHub();

    const locationHub = $safe('locationGrowthHub');
    if (locationHub && locationHub.parentNode) {
      locationHub.parentNode.insertBefore(hubWrapper.firstElementChild, locationHub.nextSibling);
    } else {
      pageCity.appendChild(hubWrapper.firstElementChild);
    }
  }

  function patchHomeCareerMini() {
    ensureCareerState();

    const lifeSummary = $safe('lifeSummary');
    if (!lifeSummary || lifeSummary.dataset.koinCareerMini === '1') return;

    lifeSummary.dataset.koinCareerMini = '1';
    const best = bestCareer();

    lifeSummary.innerHTML += `
      <div class="koin-career-mini-link" data-switch="city">
        <div>
          <strong>🚀 最接近职业：${best.career.emoji} ${best.career.name}</strong>
          <span>目前进度 ${best.progress.average}% · 点击去 Career Center</span>
        </div>
        <div>›</div>
      </div>
    `;
  }

  function patchParentCareerSummary() {
    const parentAdvice = $safe('parentAdvice');
    if (!parentAdvice || parentAdvice.dataset.koinCareerAdvice === '1') return;

    parentAdvice.dataset.koinCareerAdvice = '1';
    const best = bestCareer();

    parentAdvice.innerHTML += `
      <p style="margin-top:10px">
        <b>职业发展观察：</b>
        孩子目前最接近 <b>${best.career.emoji} ${best.career.name}</b>，
        进度约 <b>${best.progress.average}%</b>。
        ${best.career.suggested}
      </p>
    `;
  }

  document.body.addEventListener('click', function (e) {
    const selectBtn = e.target.closest('[data-career-select]');
    if (selectBtn) {
      e.preventDefault();
      e.stopPropagation();
      selectCareer(selectBtn.dataset.careerSelect);
      return;
    }

    const claimBtn = e.target.closest('[data-career-claim]');
    if (claimBtn) {
      e.preventDefault();
      e.stopPropagation();
      claimCareerReward(claimBtn.dataset.careerClaim);
    }
  }, true);

  const originalRender = window.render;
  if (typeof originalRender === 'function' && !window.__koinCareerRenderPatchedV1) {
    window.__koinCareerRenderPatchedV1 = true;

    window.render = function patchedRenderCareer() {
      originalRender();
      ensureCareerState();
      injectCareerStyles();
      injectCareerHubIntoCity();
      patchHomeCareerMini();
      patchParentCareerSummary();
    };
  }

  ensureCareerState();
  injectCareerStyles();
  injectCareerHubIntoCity();
  patchHomeCareerMini();
  patchParentCareerSummary();
  safeSave();

  if (typeof render === 'function') render();

  console.log('[Koin City V2] Career Unlock Patch v1 loaded');
})();
