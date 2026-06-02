const DATA = {

  player:{
    name:'Omosile', nick:'Okomi',
    his:'Ife', hisTag:'Iyawomi',
    herCity:'Gillingham, UK', hisCity:'Lagos, Nigeria',
  },

  /* ── LOVE LETTER ─────────────────────────────────────── */
  letter:[
    { text:'Okomi.', cls:'story-para accent' },
    { text:'I\'ve been trying to figure out how to say this properly. I\'m not sure there\'s a proper way. So I\'ll just say it.', cls:'story-para' },
    { text:'From the first conversation — and I mean the very first one — something about you was different. You didn\'t try to be interesting. You just were. That\'s rarer than you think.', cls:'story-para' },
    { text:'You recommended things like you\'d been curating them for years. You argued your points like you actually believed them. You laughed like something was genuinely funny. <em>Real responses.</em> From a real person. I noticed.', cls:'story-para' },
    { text:'And then you kept showing up. Day after day. In the calls that had no agenda. The conversations that went nowhere and everywhere at the same time. The ones where you said "you do your thing, I do my thing" and we just... existed together. Those are my favourite kind.', cls:'story-para' },
    { text:'I want you to know something about the way you move through the world. You carry this quiet warmth that doesn\'t announce itself. It just shows up. In the way you talk about the things you care about. In the way you\'re honest even when it would be easier not to be. In the way you\'re soft and goofy and serious all at once — and none of it feels contradictory on you.', cls:'story-para' },
    { text:'<em>I don\'t take that lightly.</em>', cls:'story-para accent' },
    { text:'I built you something. It\'s not much in the grand scheme of things. But it\'s made entirely of attention — the kind I only give to things that actually matter to me.', cls:'story-para' },
    { text:'Take your time with all of it.', cls:'story-para' },
    { text:'Happy Birthday, Okomi. 🤍', cls:'story-para' },
    { text:'— Ife', cls:'story-para sig' },
  ],

  /* ── WRITE-UP ────────────────────────────────────────── */
  writeup:[
    { text:'Omosile.', cls:'writeup-para name' },
    { text:'Happy Birthday first. Nineteen. That deserves to be said properly before anything else.', cls:'writeup-para accent' },
    { text:'Now let me say the rest.', cls:'writeup-para' },
    { text:'When I first got to know you, something clicked. Not dramatically — quietly. The kind of thing that sneaks up on you before you\'ve had a chance to prepare for it.', cls:'writeup-para' },
    { text:'You talked to me like you\'d known me for a while already. Easy, real, no performance about it. And I found myself paying attention in a completely different way.', cls:'writeup-para' },
    { text:'Then I got to actually know you.', cls:'writeup-para' },
    { text:'The way your mind moves. The way you\'re funny without trying. The way you\'re soft and honest at the same time — not one instead of the other, genuinely both at once. That combination doesn\'t just happen. You built that.', cls:'writeup-para' },
    { text:'You became the person I think about when something good happens. And when something doesn\'t. You became the person I reach for first.', cls:'writeup-para' },
    { text:'I don\'t take that lightly.', cls:'writeup-para accent' },
    { text:'You love people fully. You carry yourself with this quiet confidence that doesn\'t need to announce itself. You\'re goofy in a way that only makes you better. You\'re honest without being cold. And you make whatever space you\'re in feel like it belongs there.', cls:'writeup-para' },
    { text:'I love you, Omosile. Not as a decision — as something I noticed. The way you notice a good song, or that the light has changed, or that someone you\'re with is someone you actually want to keep around.', cls:'writeup-para' },
    { text:'You\'re nineteen today. That looks incredible on you. But honestly, you could be any version of yourself and this would still be true.', cls:'writeup-para' },
    { text:'I hope today feels like something real. I hope this year gives you everything you\'ve been building toward. And I hope you feel — actually feel it — how much you\'re loved. How much you always have been.', cls:'writeup-para' },
    { text:'Happy Birthday, Okomi. This whole thing is for you.', cls:'writeup-para' },
    { text:'— Ife 🖤', cls:'writeup-para sig' },
  ],

  storyShort:'A young lad was minding his business on Snapchat. Came across an account called me😌❤️. She\'d posted a horror video. He commented. She replied. Two horror fans, two different cities, one instant click. That\'s how it started. Crazy innit.',

  /* ── SNAKE OPTIONS ───────────────────────────────────── */
  snakeColors:[
    { name:'Blue',   head:'#3b82f6', body:'#60a5fa' },
    { name:'Cyan',   head:'#22d3ee', body:'#67e8f9' },
    { name:'Green',  head:'#22c55e', body:'#86efac' },
    { name:'Purple', head:'#a855f7', body:'#d8b4fe' },
    { name:'Gold',   head:'#eab308', body:'#fde047' },
    { name:'Red',    head:'#ef4444', body:'#fca5a5' },
  ],
  snakeFoods:['🍎','🍊','🍇','🍓','⭐','💎','🌸','🍭'],
  snakeBgs:[
    { name:'Dark',   bg:'#020817', grid:'rgba(59,130,246,.07)' },
    { name:'Navy',   bg:'#0a1628', grid:'rgba(59,130,246,.12)' },
    { name:'Forest', bg:'#052e16', grid:'rgba(34,197,94,.1)' },
    { name:'Space',  bg:'#09090b', grid:'rgba(168,85,247,.1)' },
  ],

  /* ── RUNNER OPTIONS ──────────────────────────────────── */
  runnerChars:['🌸','🦊','🐱','⭐','🔥','💃','🦋','🐰'],
  runnerScenes:[
    { name:'Night City',  sky1:'#020817', sky2:'#0f172a', ground:'#1e293b', stars:true  },
    { name:'Space',       sky1:'#09090b', sky2:'#0c0c1d', ground:'#1a1a2e', stars:true  },
    { name:'Sunset',      sky1:'#431407', sky2:'#7c2d12', ground:'#3b1f1f', stars:false },
    { name:'Ocean',       sky1:'#0c4a6e', sky2:'#075985', ground:'#164e63', stars:false },
  ],

  /* ── BREAKER LEVELS ──────────────────────────────────── */
  // Brick types: 1=easy(1hit) 2=medium(2hit) 3=hard(3hit) 4=indestructible 5=bonus(1hit+points)
  breakerLevels:[
    { name:'Level 1', ballSpeed:4.0, layout:[
      [1,1,1,1,1,1],
      [0,1,1,1,1,0],
      [0,0,1,1,0,0],
    ]},
    { name:'Level 2', ballSpeed:4.4, layout:[
      [1,1,2,2,1,1],
      [1,2,2,2,2,1],
      [0,1,2,2,1,0],
      [0,0,1,1,0,0],
    ]},
    { name:'Level 3', ballSpeed:4.8, layout:[
      [2,2,3,3,2,2],
      [1,2,3,3,2,1],
      [1,1,2,2,1,1],
      [0,5,1,1,5,0],
    ]},
    { name:'Level 4', ballSpeed:5.3, layout:[
      [3,3,4,4,3,3],
      [2,3,3,3,3,2],
      [1,2,3,3,2,1],
      [5,1,2,2,1,5],
      [0,1,1,1,1,0],
    ]},
    { name:'Level 5', ballSpeed:5.8, boss:true, layout:[
      [3,4,3,3,4,3],
      [2,3,4,4,3,2],
      [2,2,3,3,2,2],
      [1,2,2,2,2,1],
      [5,1,2,2,1,5],
      // Boss row added programmatically
    ]},
  ],

  /* ── MEMORY EMOJIS ───────────────────────────────────── */
  memoryEmojis:['🌸','💫','⭐','🎵','🎨','🌙','🦋','🌹'],

  /* ── 2048 TILE COLORS ────────────────────────────────── */
  tileColors:{
    2:    { bg:'#1e3a5f', color:'#e2e8f0' },
    4:    { bg:'#1a4f7a', color:'#e2e8f0' },
    8:    { bg:'#1565a0', color:'#fff' },
    16:   { bg:'#0d7bc4', color:'#fff' },
    32:   { bg:'#0595e8', color:'#fff' },
    64:   { bg:'#00aaff', color:'#fff' },
    128:  { bg:'#38bfff', color:'#020817' },
    256:  { bg:'#60cfff', color:'#020817' },
    512:  { bg:'#88deff', color:'#020817' },
    1024: { bg:'#b0eeff', color:'#020817' },
    2048: { bg:'#dafbff', color:'#020817' },
  },
};
