const svg = document.getElementById('story-svg');
const canvas = document.getElementById('terrain-canvas');
const ctx = canvas.getContext('2d');

const daxingPoints = [
  [443, 154], [500, 132], [587, 142], [689, 153], [796, 189], [870, 251], [912, 336], [930, 431],
  [894, 520], [825, 610], [730, 690], [616, 721], [507, 690], [431, 620], [374, 531], [331, 430],
  [313, 328], [335, 232]
];

const riverPoints = [
  [356, 92], [349, 151], [346, 220], [352, 286], [374, 352], [401, 421], [433, 492], [464, 568], [490, 665], [520, 746]
];

const riverBranches = [
  [[418, 318], [493, 330], [567, 355], [641, 391], [718, 432]],
  [[430, 430], [508, 455], [574, 502], [650, 555], [742, 606]],
  [[405, 260], [492, 241], [590, 243], [692, 270], [792, 322]]
];

const chapters = [
  {
    id: 'ancient-river',
    year: '约一万年前',
    era: '远古冲积期',
    title: '永定河走出山口',
    text: '河水携带泥沙进入北京南部平原，水流摆动、漫溢、沉积，开始塑造今天大兴一带的地貌底盘。',
    focus: [386, 230],
    progress: 0.1,
    tags: ['河流摆动', '泥沙搬运', '冲积扇']
  },
  {
    id: 'plain-forming',
    year: '漫长沉积期',
    era: '平原形成',
    title: '平原一层层铺开',
    text: '洪水退去后，细颗粒泥沙留在低处，平缓肥沃的平原逐渐形成。大兴的农业和村落基础，来自这种长期沉积。',
    focus: [596, 433],
    progress: 0.28,
    tags: ['冲积平原', '肥沃土壤', '聚落基础']
  },
  {
    id: 'sand-belt',
    year: '风沙活跃期',
    era: '沙地生成',
    title: '河漫滩留下沙地',
    text: '河道迁移与风力再搬运，让部分河漫滩变成沙质地。沙地不是凭空出现，而是水沙过程和风共同留下的痕迹。',
    focus: [690, 268],
    progress: 0.42,
    tags: ['河漫滩', '风沙', '沙质地']
  },
  {
    id: 'spring',
    year: '泉眼出现',
    era: '湿地泉脉',
    title: '低洼处冒出泉眼',
    text: '地势低洼、水系汇聚，泉眼和湿地给南苑一带带来稳定水源。这个水源故事，后来与团河行宫联系在一起。',
    focus: [594, 382],
    progress: 0.55,
    tags: ['泉眼', '湿地', '低洼汇水']
  },
  {
    id: 'tuanhe',
    year: '清代乾隆时期',
    era: '团河行宫',
    title: '团河行宫依水而建',
    text: '清代皇家园林选择水源、湿地和开阔平原相结合的地点。课堂中可把它看作“自然水文条件影响人类选址”的例子。',
    focus: [630, 391],
    progress: 0.68,
    tags: ['皇家园林', '水源选址', '人地关系']
  },
  {
    id: 'airport-plain',
    year: '现代建设期',
    era: '大兴机场',
    title: '大片平原承载机场',
    text: '更晚近的时代，开阔平整的南部平原成为大型交通基础设施的空间条件之一。大兴机场的落位，可放进“地貌与城市功能”的讨论。',
    focus: [716, 622],
    progress: 0.84,
    tags: ['开阔平原', '交通枢纽', '现代城市']
  },
  {
    id: 'future',
    year: '今天与未来',
    era: '生态修复',
    title: '让河流重新成为生态轴',
    text: '从地貌形成到皇家园林，再到机场和新城，大兴的故事始终绕不开水。未来的关键，是让河道、湿地、城市与交通系统更好地共生。',
    focus: [533, 520],
    progress: 1,
    tags: ['生态修复', '城市韧性', '未来治理']
  }
];

const hotspots = [
  { id: 'ancient-river', x: 386, y: 230, label: '永定河出山', icon: '水' },
  { id: 'plain-forming', x: 596, y: 433, label: '平原铺展', icon: '原' },
  { id: 'sand-belt', x: 690, y: 268, label: '沙地留下', icon: '沙' },
  { id: 'spring', x: 594, y: 382, label: '泉眼冒出', icon: '泉' },
  { id: 'tuanhe', x: 630, y: 391, label: '团河行宫', icon: '宫' },
  { id: 'airport-plain', x: 716, y: 622, label: '大兴机场', icon: '机' },
  { id: 'future', x: 533, y: 520, label: '生态修复', icon: '绿' }
];

const state = {
  chapter: 0,
  playing: false,
  effects: true,
  labels: true,
  visited: new Set(),
  particles: [],
  ripples: [],
  cameraPulse: 0
};

const $ = (id) => document.getElementById(id);
const pathFromPoints = (points) => points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
const polygonPath = (points) => `${pathFromPoints(points)} Z`;

function makeEl(tag, attrs = {}, parent = svg) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  parent.appendChild(el);
  return el;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawTerrain();
}

function terrainPointToCanvas(x, y) {
  const rect = canvas.getBoundingClientRect();
  return [x / 1200 * rect.width, y / 760 * rect.height];
}

function drawBlob(points, color, alpha, jitter = 0) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    const [cx, cy] = terrainPointToCanvas(x + Math.sin(i * 2.7) * jitter, y + Math.cos(i * 2.1) * jitter);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTerrain() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const chapter = chapters[state.chapter];
  const p = chapter.progress;
  const bg = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bg.addColorStop(0, '#d9e8d3');
  bg.addColorStop(0.55, '#efe3c4');
  bg.addColorStop(1, '#b8d5d9');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, rect.width, rect.height);

  drawBlob(daxingPoints, '#d7edc8', 0.5 + p * 0.24);

  const plainAlpha = Math.min(0.82, Math.max(0, (p - 0.12) * 1.7));
  drawBlob([[360, 260], [520, 205], [750, 245], [870, 382], [820, 605], [650, 704], [454, 620], [338, 438]], '#b8d896', plainAlpha, 12);

  const sandAlpha = Math.min(0.7, Math.max(0, (p - 0.34) * 1.9));
  drawBlob([[608, 182], [787, 222], [843, 332], [756, 420], [591, 394], [542, 278]], '#dbc589', sandAlpha, 18);
  drawBlob([[470, 520], [622, 545], [730, 637], [642, 705], [492, 668]], '#d8c07d', sandAlpha * 0.62, 14);

  const wetAlpha = Math.min(0.78, Math.max(0, (p - 0.48) * 2));
  drawBlob([[550, 335], [635, 316], [694, 380], [668, 462], [566, 474], [515, 405]], '#75c7ad', wetAlpha, 10);

  const airportAlpha = Math.min(0.95, Math.max(0, (p - 0.78) * 4));
  if (airportAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = airportAlpha;
    const [x, y] = terrainPointToCanvas(716, 622);
    ctx.translate(x, y);
    ctx.rotate(-0.24);
    ctx.fillStyle = '#d9dde2';
    ctx.strokeStyle = '#697783';
    ctx.lineWidth = 2;
    ctx.fillRect(-92, -13, 184, 26);
    ctx.fillRect(-13, -92, 26, 184);
    ctx.strokeRect(-92, -13, 184, 26);
    ctx.strokeRect(-13, -92, 26, 184);
    ctx.restore();
  }
}

function seedParticles() {
  state.particles = Array.from({ length: 72 }, (_, i) => ({
    path: riverPoints,
    t: Math.random(),
    speed: 0.0015 + Math.random() * 0.0028,
    size: 2 + Math.random() * 4,
    hue: i % 3
  }));
}

function pointOnPolyline(points, t) {
  const segments = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segments.push({ a, b, len });
    total += len;
  }
  let dist = t * total;
  for (const seg of segments) {
    if (dist <= seg.len) {
      const k = dist / seg.len;
      return [seg.a[0] + (seg.b[0] - seg.a[0]) * k, seg.a[1] + (seg.b[1] - seg.a[1]) * k];
    }
    dist -= seg.len;
  }
  return points[points.length - 1];
}

function renderStaticSvg() {
  $('daxing-shape').setAttribute('d', polygonPath(daxingPoints));
  $('river-shadow').setAttribute('d', pathFromPoints(riverPoints));
  $('river-main').setAttribute('d', pathFromPoints(riverPoints));
  $('river-light').setAttribute('d', pathFromPoints(riverPoints));

  const plainLayer = $('plain-layer');
  const sandLayer = $('sand-layer');
  const wetlandLayer = $('wetland-layer');
  riverBranches.forEach((branch) => {
    makeEl('path', { d: pathFromPoints(branch), class: 'branch-flow' }, plainLayer);
  });
  makeEl('path', { d: 'M480 242 C598 205 727 225 828 318 C764 344 666 348 570 322 C519 308 489 278 480 242 Z', class: 'sand-patch' }, sandLayer);
  makeEl('path', { d: 'M528 366 C568 319 650 318 690 374 C670 451 592 483 531 428 C510 405 509 387 528 366 Z', class: 'wetland-patch' }, wetlandLayer);

  renderHotspots();
}

function renderHotspots() {
  const hotspotLayer = $('hotspot-layer');
  hotspotLayer.innerHTML = '';
  const labelLayer = $('label-layer');
  labelLayer.innerHTML = '';

  hotspots.forEach((spot) => {
    const group = makeEl('g', { class: `hotspot ${state.visited.has(spot.id) ? 'visited' : ''}`, tabindex: '0' }, hotspotLayer);
    group.dataset.id = spot.id;
    makeEl('circle', { cx: spot.x, cy: spot.y, r: 24, class: 'hotspot-ring' }, group);
    makeEl('circle', { cx: spot.x, cy: spot.y, r: 15, class: 'hotspot-core' }, group);
    const text = makeEl('text', { x: spot.x, y: spot.y + 5, class: 'hotspot-icon', 'text-anchor': 'middle' }, group);
    text.textContent = spot.icon;
    group.addEventListener('click', () => goToChapter(chapters.findIndex(ch => ch.id === spot.id), true));
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') goToChapter(chapters.findIndex(ch => ch.id === spot.id), true);
    });

    const label = makeEl('text', { x: spot.x + 28, y: spot.y - 18, class: 'map-label' }, labelLayer);
    label.textContent = spot.label;
  });
}

function updateParticles() {
  const layer = $('particle-layer');
  layer.innerHTML = '';
  if (state.effects) {
    state.particles.forEach((particle) => {
      particle.t = (particle.t + particle.speed) % 1;
      const [x, y] = pointOnPolyline(particle.path, particle.t);
      makeEl('circle', {
        cx: x,
        cy: y,
        r: particle.size,
        class: `water-particle particle-${particle.hue}`
      }, layer);
    });

    const chapter = chapters[state.chapter];
    if (chapter.id === 'spring' || chapter.id === 'tuanhe' || chapter.id === 'future') {
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * Math.PI * 2 + state.cameraPulse;
        makeEl('circle', {
          cx: 594 + Math.cos(angle) * (22 + i * 2),
          cy: 382 + Math.sin(angle) * (13 + i),
          r: 3,
          class: 'spring-particle'
        }, layer);
      }
    }
  }

  state.ripples = state.ripples.filter(ripple => state.cameraPulse - ripple.start < 1.8);
  state.ripples.forEach((ripple) => {
    const age = state.cameraPulse - ripple.start;
    makeEl('circle', {
      cx: ripple.x,
      cy: ripple.y,
      r: 10 + age * 42,
      class: 'free-ripple',
      opacity: Math.max(0, 0.72 - age * 0.38)
    }, layer);
  });
}

function updateStory() {
  const chapter = chapters[state.chapter];
  $('era-label').textContent = chapter.era;
  $('year-label').textContent = chapter.year;
  $('event-kicker').textContent = `第 ${state.chapter + 1} 章`;
  $('event-title').textContent = chapter.title;
  $('event-text').textContent = chapter.text;
  $('chapter-count').textContent = `${state.chapter + 1} / ${chapters.length}`;
  $('time-slider').value = state.chapter;
  $('event-tags').innerHTML = chapter.tags.map(tag => `<span>${tag}</span>`).join('');
  $('mission-text').textContent = state.visited.size === chapters.length
    ? '任务完成：你已经点亮完整故事链。现在可以让学生复述“水沙过程如何影响人类活动”。'
    : `任务：点亮全部 7 个事件。当前已点亮 ${state.visited.size} 个。`;

  document.body.style.setProperty('--focus-x', `${chapter.focus[0] / 12}%`);
  document.body.style.setProperty('--focus-y', `${chapter.focus[1] / 7.6}%`);
  document.body.dataset.chapter = chapter.id;
  drawTerrain();
  renderHotspots();
  renderTimeline();
  renderScore();
}

function renderTimeline() {
  $('timeline').innerHTML = chapters.map((chapter, index) => `
    <button class="${index === state.chapter ? 'active' : ''} ${state.visited.has(chapter.id) ? 'visited' : ''}" data-index="${index}">
      <span>${chapter.era}</span>
      <small>${chapter.year}</small>
    </button>
  `).join('');
  $('timeline').querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => goToChapter(Number(button.dataset.index), true));
  });
}

function renderScore() {
  $('score-row').innerHTML = chapters.map(chapter => `<i class="${state.visited.has(chapter.id) ? 'on' : ''}"></i>`).join('');
}

function goToChapter(index, markVisited = false) {
  state.chapter = Math.max(0, Math.min(chapters.length - 1, index));
  if (markVisited) state.visited.add(chapters[state.chapter].id);
  updateStory();
}

function nextChapter() {
  goToChapter((state.chapter + 1) % chapters.length, true);
}

function prevChapter() {
  goToChapter((state.chapter - 1 + chapters.length) % chapters.length, true);
}

function togglePlay() {
  state.playing = !state.playing;
  $('play-btn').textContent = state.playing ? '暂停' : '播放';
  $('play-btn').classList.toggle('active', state.playing);
}

function focusCurrent() {
  const chapter = chapters[state.chapter];
  state.visited.add(chapter.id);
  updateStory();
  const card = $('event-card');
  card.classList.remove('pop');
  void card.offsetWidth;
  card.classList.add('pop');
}

function bindEvents() {
  $('play-btn').addEventListener('click', togglePlay);
  $('prev-btn').addEventListener('click', prevChapter);
  $('next-btn').addEventListener('click', nextChapter);
  $('focus-btn').addEventListener('click', focusCurrent);
  $('effects-btn').addEventListener('click', () => {
    state.effects = !state.effects;
    $('effects-btn').classList.toggle('active', state.effects);
    $('effects-btn').textContent = state.effects ? '动画开' : '动画关';
  });
  $('labels-btn').addEventListener('click', () => {
    state.labels = !state.labels;
    $('labels-btn').classList.toggle('active', state.labels);
    document.body.classList.toggle('hide-labels', !state.labels);
    $('labels-btn').textContent = state.labels ? '标注开' : '标注关';
  });
  $('time-slider').addEventListener('input', (event) => goToChapter(Number(event.target.value), true));
  svg.addEventListener('click', handleStageClick);
  window.addEventListener('resize', resizeCanvas);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') nextChapter();
    if (event.key === 'ArrowLeft') prevChapter();
    if (event.key === ' ') {
      event.preventDefault();
      togglePlay();
    }
  });
}

function handleStageClick(event) {
  if (event.target.closest && event.target.closest('.hotspot')) return;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
  const nearest = hotspots
    .map(spot => ({ spot, distance: Math.hypot(spot.x - svgPoint.x, spot.y - svgPoint.y) }))
    .sort((a, b) => a.distance - b.distance)[0];
  state.ripples.push({ x: svgPoint.x, y: svgPoint.y, start: state.cameraPulse });
  if (nearest && nearest.distance < 82) {
    goToChapter(chapters.findIndex(ch => ch.id === nearest.spot.id), true);
    return;
  }
  describeFreeClick(svgPoint.x, svgPoint.y);
}

function describeFreeClick(x, y) {
  const westDistance = Math.abs(x - 385);
  let title = '这是一处大兴平原';
  let text = '这里可以解释为永定河长期冲积后的开阔地带。让学生判断：如果水流速度变慢，泥沙会更容易沉积在哪里？';
  let tags = ['自由探索', '冲积平原'];
  if (westDistance < 90) {
    title = '靠近永定河摆动带';
    text = '这里接近永定河主摆动方向，适合讲河道迁移、洪水漫溢和泥沙沉积。';
    tags = ['河道迁移', '洪泛沉积'];
  } else if (x > 610 && y < 350) {
    title = '沙质地貌观察点';
    text = '这一带可作为沙地示意区，讨论河漫滩沉积物如何被风再搬运。';
    tags = ['沙地', '风沙作用'];
  } else if (x > 520 && x < 705 && y > 320 && y < 480) {
    title = '泉眼与湿地观察点';
    text = '这里接近泉眼和湿地示意区，适合讲低洼汇水、地下水出露与园林选址。';
    tags = ['泉眼', '湿地'];
  } else if (x > 620 && y > 540) {
    title = '南部开阔平原观察点';
    text = '这里可联系大兴机场：大型交通设施为什么偏好开阔、连续、平整的空间？';
    tags = ['大兴机场', '开阔平原'];
  }
  $('event-kicker').textContent = '自由点击';
  $('event-title').textContent = title;
  $('event-text').textContent = text;
  $('event-tags').innerHTML = tags.map(tag => `<span>${tag}</span>`).join('');
}

function animate() {
  state.cameraPulse += 0.018;
  if (state.playing && Math.floor(state.cameraPulse * 100) % 170 === 0) nextChapter();
  updateParticles();
  requestAnimationFrame(animate);
}

function init() {
  renderStaticSvg();
  seedParticles();
  bindEvents();
  resizeCanvas();
  state.visited.add(chapters[0].id);
  updateStory();
  animate();
}

init();
