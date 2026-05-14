// Data layer for Koin City MVP
// This file contains all data constants and data management

const scenes = [
  {
    title: '便利店里的诱惑',
    text: '放学后，你手上有 RM20。朋友说：“走啦，我们买饮料和零食，今天开心一下！” 你突然想起这个星期还有一个学习挑战任务。你会怎么做？',
    choices: [
      {
        label: '直接花完，开心最重要',
        desc: '立即得到快乐，但储蓄和自律下降。',
        effect: { saving: -8, discipline: -6, impulse: 10, judgment: -4 },
        tag: '冲动消费',
        result: '你买了零食，短时间很开心。但晚上看到存钱目标时，你开始有一点后悔。'
      },
      {
        label: '只花 RM5，剩下存起来',
        desc: '平衡快乐和目标。',
        effect: { saving: 7, discipline: 6, judgment: 6, impulse: -4 },
        tag: '平衡选择',
        result: '你买了一样小零食，也保留了大部分钱。你发现：不是不能花钱，而是要会安排。'
      },
      {
        label: '不买，把 RM20 用来报名学习活动',
        desc: '投资学习，长期回报更高。',
        effect: { saving: 4, discipline: 8, judgment: 10, goal: 8 },
        tag: '投资学习',
        result: '你选择投资自己。虽然当下少了一点快乐，但你获得了新的技能和成就感。'
      }
    ]
  },
  {
    title: '朋友向你借钱',
    text: '好朋友忘了带钱，他问你借 RM15，并说“明天一定还”。你知道他之前也常常忘记还别人钱。你会怎么回应？',
    choices: [
      {
        label: '马上借，因为怕朋友不开心',
        desc: '善良，但界限感不足。',
        effect: { resilience: -3, judgment: -7, confidence: -5 },
        tag: '怕拒绝',
        result: '朋友很开心，但你心里有点不舒服。你开始明白：帮人也需要界限。'
      },
      {
        label: '借 RM5，并说清楚明天要还',
        desc: '愿意帮忙，也设定界限。',
        effect: { judgment: 8, confidence: 5, resilience: 4 },
        tag: '有界限的善良',
        result: '你没有拒绝朋友，但也没有让自己承担太多风险。'
      },
      {
        label: '不借钱，但陪他想其他解决办法',
        desc: '训练解决问题能力。',
        effect: { judgment: 10, resilience: 6, goal: 4 },
        tag: '解决问题',
        result: '你们一起想到向老师说明情况。你发现：帮助不一定等于给钱。'
      }
    ]
  },
  {
    title: '第一次小生意',
    text: '学校有义卖会，你可以用 RM30 成本做小生意。你会卖什么？',
    choices: [
      {
        label: '买最流行的东西，大家买我也买',
        desc: '跟风快，但风险高。',
        effect: { judgment: -5, impulse: 6, resilience: 2 },
        tag: '跟风',
        result: '很多人卖一样的东西，竞争很大。你学到：热门不代表一定赚钱。'
      },
      {
        label: '先问同学想买什么，再决定',
        desc: '做市场调查。',
        effect: { judgment: 10, discipline: 5, goal: 5 },
        tag: '市场判断',
        result: '你发现大家想要便宜又特别的东西。你的选择更有方向。'
      },
      {
        label: '选择自己喜欢的，不管别人要不要',
        desc: '有热情，但缺少市场验证。',
        effect: { confidence: 6, judgment: -3, resilience: 4 },
        tag: '自我驱动',
        result: '你很投入，但销量普通。你学到：热情要配合市场需求。'
      }
    ]
  },
  {
    title: '失败后的选择',
    text: '你的挑战没有完成，目标差一点点。你觉得很失落。现在你会？',
    choices: [
      {
        label: '算了，我就是做不到',
        desc: '容易放弃。',
        effect: { resilience: -10, confidence: -8, goal: -6 },
        tag: '怕失败',
        result: '你暂时停止了挑战。Koin 提醒你：失败不是身份，只是数据。'
      },
      {
        label: '复盘哪里出问题，然后改一个小目标',
        desc: '成长型思维。',
        effect: { resilience: 12, discipline: 8, judgment: 8 },
        tag: '复盘能力',
        result: '你把目标拆小，重新开始。你发现自己不是失败，而是在升级。'
      },
      {
        label: '找朋友一起做，互相提醒',
        desc: '善用环境和支持系统。',
        effect: { discipline: 6, resilience: 7, confidence: 5 },
        tag: '寻找支持',
        result: '你找到了伙伴，挑战变得更容易坚持。'
      }
    ]
  }
];

const dailyQuests = [
  {
    id: 'q1',
    title: '今天忍住一次冲动消费',
    reward: 25,
    emoji: '🛑',
    requirement: '在「人生事件」选择一次不冲动/平衡/投资学习的选项',
    type: 'storyPositive'
  },
  {
    id: 'q2',
    title: '完成一次反思记录',
    reward: 30,
    emoji: '🧠',
    requirement: '到「AI导师」写下至少 20 个字的反思',
    type: 'reflection'
  },
  {
    id: 'q3',
    title: '帮助别人但保持界限',
    reward: 22,
    emoji: '🤝',
    requirement: '到「NPC」事件选择“保持界限”或“诚实沟通”',
    type: 'npcBoundary'
  },
  {
    id: 'q4',
    title: '存下 RM5',
    reward: 18,
    emoji: '💰',
    requirement: '在「人生事件」做出储蓄/平衡相关选择',
    type: 'savingChoice'
  }
];

const shopItems = [
  { type: 'tree', cost: 80, emoji: '🪴', name: '成长树', desc: '代表你愿意延迟满足。' },
  { type: 'lamp', cost: 100, emoji: '💡', name: '思考灯', desc: '让你的房间更有学习感。' },
  { type: 'pet', cost: 150, emoji: '🐹', name: '宠物伙伴', desc: '你的第一只成长伙伴。' },
  { type: 'house', cost: 220, emoji: '🏡', name: '房间升级', desc: '升级你的生活空间。' }
];

const npcList = [
  { key: 'dad', name: '爸爸', emoji: '👨', desc: '希望你学会责任感' },
  { key: 'friend', name: '好朋友', emoji: '🧑‍🤝‍🧑', desc: '经常找你一起冒险' },
  { key: 'mentor', name: '创业导师', emoji: '🧑‍💼', desc: '会给你赚钱挑战' },
  { key: 'merchant', name: '神秘商人', emoji: '🧙', desc: '偶尔出现特殊任务' }
];

const weatherTypes = ['☀️ Sunny Day', '🌧️ Rainy Day', '🌈 Lucky Day', '🌙 Chill Night'];

const randomEvents = [
  { title: '🎁 神秘礼物出现！', desc: '你在路上发现一个神秘宝箱。打开后可能获得奖励。', reward: 40 },
  { title: '🧍 陌生商人来了', desc: '一个神秘商人限时出现，愿意给你稀有家具。', reward: 55 },
  { title: '🌧️ 雨天事件', desc: '今天下雨了。你决定留在家里学习与整理目标。', reward: 28 }
];
