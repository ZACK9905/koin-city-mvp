// Koin City V2 — NPC UI Fix Patch v1
// Upload as js/v2-npc-ui-fix.js
// Load AFTER js/app.js and after other v2 patch files.

(function () {
  function $safe(id) {
    return document.getElementById(id);
  }

  function injectNpcFixStyles() {
    const old = document.getElementById('koinNpcFixStyles');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'koinNpcFixStyles';
    style.textContent = `
      /* NPC horizontal row fix */
      #npcList,
      .npc-row{
        display:flex !important;
        gap:12px !important;
        overflow-x:auto !important;
        overflow-y:visible !important;
        padding:8px 16px 18px !important;
        scroll-snap-type:x mandatory !important;
        scrollbar-width:none !important;
        -webkit-overflow-scrolling:touch !important;
      }

      #npcList::-webkit-scrollbar,
      .npc-row::-webkit-scrollbar{
        display:none !important;
      }

      #npcList .npc-card,
      .npc-row .npc-card{
        flex:0 0 132px !important;
        width:132px !important;
        min-width:132px !important;
        max-width:132px !important;
        min-height:178px !important;
        padding:14px 10px !important;
        overflow:visible !important;
        white-space:normal !important;
        word-break:keep-all !important;
        scroll-snap-align:start !important;
        border-radius:22px !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:flex-start !important;
        gap:6px !important;
      }

      #npcList .npc-face,
      .npc-row .npc-face{
        width:58px !important;
        height:58px !important;
        min-width:58px !important;
        min-height:58px !important;
        border-radius:50% !important;
        font-size:34px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        margin:0 auto 4px !important;
        line-height:1 !important;
        flex-shrink:0 !important;
      }

      #npcList .npc-card strong,
      .npc-row .npc-card strong,
      #npcList .npc-name,
      .npc-row .npc-name{
        display:block !important;
        width:100% !important;
        text-align:center !important;
        font-size:13px !important;
        font-weight:900 !important;
        line-height:1.2 !important;
        white-space:normal !important;
        word-break:keep-all !important;
        overflow:visible !important;
        text-overflow:clip !important;
        min-height:16px !important;
      }

      #npcList .npc-card .muted,
      .npc-row .npc-card .muted,
      #npcList .npc-desc-short,
      .npc-row .npc-desc-short{
        display:block !important;
        width:100% !important;
        text-align:center !important;
        font-size:11px !important;
        line-height:1.35 !important;
        max-height:none !important;
        min-height:30px !important;
        overflow:visible !important;
        white-space:normal !important;
        word-break:normal !important;
        color:var(--muted,#756e83) !important;
        margin:0 !important;
      }

      #npcList .heartbar,
      .npc-row .heartbar{
        width:100% !important;
        height:8px !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.08) !important;
        overflow:hidden !important;
        margin-top:auto !important;
      }

      #npcList .heartfill,
      .npc-row .heartfill{
        height:100% !important;
        border-radius:999px !important;
        background:linear-gradient(90deg,#FF5C6E,#FFB347) !important;
      }

      .koin-npc-scroll-hint{
        margin:-6px 16px 10px !important;
        font-size:11px !important;
        color:var(--muted,#756e83) !important;
        text-align:center !important;
        font-weight:700 !important;
      }

      #npcEvent,
      #npcEventWrap{
        line-height:1.6 !important;
        overflow:visible !important;
        white-space:normal !important;
      }

      #page-npc .card,
      #page-npc .npc-scene-card{
        overflow:visible !important;
      }

      @media(max-width:380px){
        #npcList .npc-card,
        .npc-row .npc-card{
          flex-basis:124px !important;
          width:124px !important;
          min-width:124px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function addNpcHint() {
    const npcList = $safe('npcList');
    if (!npcList || $safe('koinNpcScrollHint')) return;

    const hint = document.createElement('div');
    hint.id = 'koinNpcScrollHint';
    hint.className = 'koin-npc-scroll-hint';
    hint.textContent = '← 左右滑动查看更多角色 →';

    npcList.parentNode.insertBefore(hint, npcList.nextSibling);
  }

  function patchNpcCards() {
    const npcList = $safe('npcList');
    if (!npcList) return;

    const cards = npcList.querySelectorAll('.npc-card');
    cards.forEach(card => {
      card.style.overflow = 'visible';
      card.style.whiteSpace = 'normal';
    });
  }

  const originalRender = window.render;
  if (typeof originalRender === 'function' && !window.__koinNpcFixPatchedV1) {
    window.__koinNpcFixPatchedV1 = true;

    window.render = function patchedRenderNpcFix() {
      originalRender();
      injectNpcFixStyles();
      addNpcHint();
      patchNpcCards();
    };
  }

  injectNpcFixStyles();
  addNpcHint();
  patchNpcCards();

  if (typeof render === 'function') render();

  console.log('[Koin City V2] NPC UI Fix Patch loaded');
})();
