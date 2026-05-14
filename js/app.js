function attachEvents() {
  $('mainNav').addEventListener('click', e => {
    const btn = e.target.closest('button[data-page]');

    if (btn) {
      switchPage(btn.dataset.page);
    }
  });

  document.body.addEventListener('click', e => {
    const tutorialBtn = e.target.closest('[data-tutorial-action]');

    if (tutorialBtn) {
      tutorialPrimaryAction();
      return;
    }

    const locationTask = e.target.closest('[data-location-task]');

    if (locationTask) {
      performLocationTask(locationTask.dataset.locationTask);
      return;
    }

    const choice = e.target.closest('[data-choice]');

    if (choice) {
      applyChoice(Number(choice.dataset.choice));
    }

    const quest = e.target.closest('[data-quest]');

    if (quest) {
      completeQuest(quest.dataset.quest, Number(quest.dataset.reward));
    }

    const buy = e.target.closest('[data-buy]');

    if (buy) {
      buyItem(buy.dataset.buy, Number(buy.dataset.cost));
    }

    const sw = e.target.closest('[data-switch]');

    if (sw) {
      switchPage(sw.dataset.switch);
    }

    const shopJump = e.target.closest('[data-scroll-shop]');

    if (shopJump) {
      const shopList = document.getElementById('shopList');

      if (shopList) {
        shopList.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const zone = e.target.closest('[data-zone]');

    if (zone) {
      openZone(zone.dataset.zone);
    }

    const npc = e.target.closest('[data-npc-action]');

    if (npc) {
      npcAction(npc.dataset.npcAction);
    }
  });

  $('reflectionBtn').addEventListener('click', saveReflection);
  $('saveSettingsBtn').addEventListener('click', saveSettings);
  $('resetBtn').addEventListener('click', resetGame);
  $('resetDailyBtn').addEventListener('click', resetDailyDemo);
}

dailySync();
attachEvents();
render();

setInterval(() => {
  if (state.day > 2 && Math.random() < 0.04) {
    triggerRandomEvent();
  }
}, 30000);
