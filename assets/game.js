// ===== محرك الألعاب (بدون مؤقت) =====
const params = new URLSearchParams(location.search);
const lessonId = LESSONS[params.get('l')] ? params.get('l') : Object.keys(LESSONS)[0];
const meta = LESSONS[lessonId];
let D = null;

document.getElementById('grade-text').innerText = TEACHER.grade;
document.getElementById('teacher-name').innerText = TEACHER.name;
document.getElementById('teacher-en').innerText = TEACHER.nameEn;
document.getElementById('hdr-teacher').innerText = 'أ. ' + TEACHER.name;
document.getElementById('lesson-order').innerText = meta.order;
document.getElementById('lesson-title').innerText = meta.title;
document.getElementById('hdr-lesson').innerText = meta.title;
document.getElementById('tips-list').innerHTML = meta.tips.map(t => '<li>' + fmt(t) + '</li>').join('');
document.title = meta.order + ' : ' + meta.title + ' | أ. ' + TEACHER.name;
document.getElementById('games-grid').innerHTML = meta.games.map(g => {
    const G = GAME_DEFS[g];
    return `<button onclick="startGame('${g}')" class="btn-bounce bg-gradient-to-r ${G.color} text-white p-4 rounded-xl shadow-md flex items-center justify-between">
        <div class="text-right"><h4 class="font-bold text-lg">${G.title}</h4><p class="text-xs text-white/80">${G.sub}</p></div>
        <i class="fa-solid ${G.icon} text-3xl opacity-80"></i></button>`;
}).join('');

(function loadData() {
    const sc = document.createElement('script');
    sc.src = 'data/' + lessonId + '.js';
    sc.onload = () => { D = window.LESSON_DATA; };
    sc.onerror = () => { document.getElementById('lesson-title').innerText = 'تعذر تحميل بيانات الدرس'; };
    document.head.appendChild(sc);
})();

function shuffleArray(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// الرسومات: شكل هندسي (fig) أو صورة من الكتاب (img) أو مستطيلات (bar)
function imgHtml(q, cls) {
    if (!q) return '';
    if (q.fig) return `<div class="q-fig ${cls ? 'q-fig-sm' : ''}">${figSvg(q.fig)}</div>`;
    if (q.img) return `<div class="q-fig ${cls ? 'q-fig-sm' : ''}"><img src="${q.img}" alt="شكل السؤال"></div>`;
    const bar = q.bar;
    if (!bar) return '';
    const sum = bar.segs.reduce((t, g) => t + g.w, 0);
    const segs = bar.segs.map(g => `<div class="bar-seg bar-${g.c}" style="flex:${g.w / sum}"><span class="bar-lbl">${fmt(g.t)}</span></div>`).join('');
    return `<div class="bar-fig ${cls ? 'bar-sm' : ''}"><div class="bar-row">${segs}</div><div class="bar-total"><span>${fmt(bar.total)}</span></div></div>`;
}

let gameState = { currentScreen: 'home', activeGame: null, score: 0, questionIndex: 0, subLevel: 0, tempData: null, onFeedbackClose: null, total: 15 };
const titles = Object.fromEntries(Object.entries(GAME_DEFS).map(([k, v]) => [k, v.title]));
let matchSelectedA = null, matchSelectedB = null;

function pauseAnimations() { document.querySelectorAll('.game-anim-element').forEach(t => t.style.animationPlayState = 'paused'); }

function showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(el => el.classList.add('hidden'));
    if (screenId === 'home') {
        document.getElementById('screen-home').classList.remove('hidden');
        document.getElementById('game-header').classList.add('hidden');
    } else {
        document.getElementById('screen-home').classList.add('hidden');
        document.getElementById('game-header').classList.remove('hidden');
        document.getElementById('screen-' + screenId).classList.remove('hidden');
        document.getElementById('current-game-title').innerText = titles[gameState.activeGame];
        updateScoreDisplay();
    }
    gameState.currentScreen = screenId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
    pauseAnimations();
    document.getElementById('feedback-modal').classList.add('hidden');
    document.getElementById('endgame-modal').classList.add('hidden');
    gameState.onFeedbackClose = null; gameState.activeGame = null;
    showScreen('home');
}

function startGame(type) {
    if (!D) { alert('جارٍ تحميل الأسئلة... حاول مرة أخرى'); return; }
    document.getElementById('endgame-modal').classList.add('hidden');
    gameState.activeGame = type; gameState.score = 0; gameState.questionIndex = 0; gameState.subLevel = 0;
    const src = D[type] || [];
    gameState.tempData = type === 'millionaire' ? src.slice() // المليون: الأسئلة متدرجة الصعوبة
        : type === 'match' ? shuffleArray([0, 1, 2].map(r => src.slice(r * 5, r * 5 + 5))).flatMap(ch => shuffleArray(ch)) // التوصيل: كل جولة من نفس المجموعة
        : shuffleArray(src);
    gameState.total = src.length;
    document.querySelectorAll('.total-count').forEach(e => e.innerText = gameState.total);
    showScreen(type);
    if (type === 'mcq') loadMCQ();
    else if (type === 'match') loadMatchRound();
    else if (type === 'tf') loadTF();
    else if (type === 'fill') loadFill();
    else if (type === 'bubbles') loadBubbles();
    else if (type === 'shoot') loadShoot();
    else if (type === 'tug') { gameState.tugPos = 0; moveRope(); loadTug(); }
    else if (type === 'goal') loadGoal();
    else if (type === 'millionaire') { gameState.ll = { '5050': true, phone: true, aud: true }; gameState.milLost = false; loadMil(); }
}

function updateScoreDisplay() { document.getElementById('current-score').innerText = gameState.score; }
function setProgress(id) { document.getElementById(id).style.width = `${(gameState.questionIndex / gameState.total) * 100}%`; }

function endGame() {
    document.getElementById('endgame-score').innerText = gameState.score;
    const r = gameState.score / gameState.total;
    document.getElementById('endgame-msg').innerText = r === 1 ? 'بطل حقيقي! درجة نهائية 🌟' : r >= 0.8 ? 'ممتاز! أداء رائع 👏' : r >= 0.5 ? 'جيد، راجع الدرس وحاول مرة أخرى 💪' : 'لا تيأس! راجع الدرس ثم أعد المحاولة 📘';
    if (gameState.activeGame === 'tug') {
        const p = gameState.tugPos;
        document.getElementById('endgame-msg').innerText = p > 0 ? 'فاز فريقك في شد الحبل! 🏆' : p < 0 ? 'فاز المنافس هذه المرة .. أعد المحاولة 💪' : 'تعادل! الحبل في المنتصف 🤝';
    } else if (gameState.activeGame === 'millionaire') {
        document.getElementById('endgame-msg').innerText = gameState.score === gameState.total ? '🎉 مبروك! أنت مليونير الرياضيات 🏆'
            : (gameState.score ? 'انتهت المسابقة عند السؤال ' + toAr(gameState.score + 1) + ' .. رصيدك النهائي ' + milFmt(milPrize()) + ' نقطة 💰' : 'انتهت المسابقة من السؤال الأول .. حاول مرة أخرى 💪');
    } else if (gameState.activeGame === 'goal') {
        document.getElementById('endgame-msg').innerText = 'سجّلت ' + toAr(gameState.score) + ' أهداف ⚽ ' + document.getElementById('endgame-msg').innerText;
    }
    document.querySelector('#endgame-modal h2').innerText = (gameState.activeGame === 'millionaire' && gameState.milLost) ? 'انتهت المسابقة!' : 'اكتملت اللعبة!';
    if (gameState.activeGame === 'millionaire' && gameState.milLost) { if (gameState.score >= 5) SFX.fanfare(); }
    else (gameState.score / gameState.total >= 0.5) ? SFX.fanfare() : SFX.wrong();
    document.getElementById('endgame-modal').classList.remove('hidden');
}

function showFeedback(isCorrect, messageHtml, callback) {
    const modal = document.getElementById('feedback-modal'), content = document.getElementById('feedback-content');
    const icon = document.getElementById('feedback-icon'), title = document.getElementById('feedback-title');
    gameState.onFeedbackClose = callback;
    if (!['tug', 'goal', 'millionaire'].includes(gameState.activeGame)) isCorrect ? SFX.correct() : SFX.wrong();
    if (isCorrect) {
        icon.innerHTML = '<i class="fa-solid fa-circle-check text-green-500 popup-anim"></i>';
        title.innerText = "إجابة صحيحة!"; title.className = "text-2xl font-bold mb-2 text-green-600";
    } else {
        icon.innerHTML = '<i class="fa-solid fa-circle-xmark text-red-500 popup-anim"></i>';
        title.innerText = "إجابة خاطئة"; title.className = "text-2xl font-bold mb-2 text-red-600";
    }
    document.getElementById('feedback-msg').innerHTML = messageHtml || "";
    modal.classList.remove('hidden');
    setTimeout(() => { content.classList.remove('scale-50', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);
}
function closeFeedback() {
    const modal = document.getElementById('feedback-modal'), content = document.getElementById('feedback-content');
    content.classList.remove('scale-100', 'opacity-100'); content.classList.add('scale-50', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        if (gameState.onFeedbackClose) { const cb = gameState.onFeedbackClose; gameState.onFeedbackClose = null; cb(); }
    }, 300);
}
function explain(q) { return q.exp ? `<br><span class="text-sm text-blue-700">${fmt(q.exp)}</span>` : ''; }

// ---- 1. MCQ ----
function loadMCQ() {
    if (gameState.questionIndex >= gameState.total) return endGame();
    const q = gameState.tempData[gameState.questionIndex];
    document.getElementById('mcq-img').innerHTML = imgHtml(q);
    document.getElementById('mcq-question').innerHTML = toAr(gameState.questionIndex + 1) + " - " + fmt(q.q);
    setProgress('mcq-progress');
    const box = document.getElementById('mcq-options'); box.innerHTML = '';
    shuffleArray(q.options).forEach(opt => {
        const b = document.createElement('button');
        b.className = "btn-bounce w-full bg-white border-2 border-blue-200 hover:bg-blue-50 text-blue-900 font-bold py-4 px-6 rounded-xl text-center shadow-sm text-lg transition-colors";
        b.innerHTML = fmt(opt);
        b.onclick = () => checkMCQ(opt, q);
        box.appendChild(b);
    });
}
function checkMCQ(sel, q) {
    const ok = sel === q.ans; if (ok) gameState.score++; updateScoreDisplay();
    showFeedback(ok, ok ? "أحسنت!" + explain(q) : `الإجابة الصحيحة هي: ${fmt(q.ans)}` + explain(q), () => { gameState.questionIndex++; loadMCQ(); });
}

// ---- 2. Bubbles ----
function loadBubbles() {
    if (gameState.questionIndex >= gameState.total) return endGame();
    const q = gameState.tempData[gameState.questionIndex];
    document.getElementById('bubbles-question').innerHTML = toAr(gameState.questionIndex + 1) + " - " + fmt(q.q);
    document.getElementById('bubbles-img').innerHTML = imgHtml(q, 'q-img-sm');
    setProgress('bubbles-progress');
    const area = document.getElementById('bubbles-game-area'); area.innerHTML = '';
    const xs = [2, 27, 52, 77]; const delays = shuffleArray([0, -3, -6, -9]);
    shuffleArray(q.options).forEach((opt, i) => {
        const el = document.createElement('div');
        const long = String(opt).length > 14;
        el.className = `game-anim-element anim-fall game-bubble absolute flex items-center justify-center p-2 ${long ? 'w-24 h-24 sm:w-32 sm:h-32 text-[10px] sm:text-xs' : 'w-20 h-20 sm:w-28 sm:h-28 text-xs sm:text-base'} font-bold text-center cursor-pointer z-10`;
        el.style.left = xs[i] + '%'; el.style.animationDelay = delays[i] + 's';
        el.innerHTML = '<span>' + fmt(opt) + '</span>';
        el.onclick = () => processAnim(opt, q, 'bubbles');
        area.appendChild(el);
    });
}

// ---- 3. Shoot ----
function loadShoot() {
    if (gameState.questionIndex >= gameState.total) return endGame();
    const q = gameState.tempData[gameState.questionIndex];
    document.getElementById('shoot-question').innerHTML = toAr(gameState.questionIndex + 1) + " - " + fmt(q.q);
    document.getElementById('shoot-img').innerHTML = imgHtml(q, 'q-img-sm');
    setProgress('shoot-progress');
    const area = document.getElementById('shoot-game-area'); area.innerHTML = '';
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'], ys = [4, 28, 52, 76], dirs = [1, -1, 1, -1];
    const delays = shuffleArray([0, -3, -6, -9]);
    shuffleArray(q.options).forEach((opt, i) => {
        const el = document.createElement('div');
        const long = String(opt).length > 14;
        el.className = `game-anim-element ${dirs[i] === 1 ? 'anim-right' : 'anim-left'} horizontal-target absolute text-gray-800 p-1 rounded-full text-center font-bold flex flex-col items-center justify-center ${long ? 'w-28 h-28 sm:w-36 sm:h-36 text-[10px] sm:text-xs' : 'w-24 h-24 sm:w-28 sm:h-28 text-xs sm:text-sm'} cursor-pointer z-10`;
        el.style.borderColor = colors[i]; el.style.top = ys[i] + '%'; el.style.animationDelay = delays[i] + 's';
        el.innerHTML = `<i class="fa-solid fa-bullseye text-xl sm:text-2xl mb-1" style="color:${colors[i]}"></i><span>${fmt(opt)}</span>`;
        el.onclick = () => processAnim(opt, q, 'shoot');
        area.appendChild(el);
    });
}
function processAnim(sel, q, type) {
    pauseAnimations();
    const ok = sel === q.ans; if (ok) gameState.score++; updateScoreDisplay();
    showFeedback(ok, ok ? "إصابة دقيقة وممتازة!" + explain(q) : `للأسف أخطأت الهدف! الإجابة هي: ${fmt(q.ans)}` + explain(q), () => {
        gameState.questionIndex++; type === 'bubbles' ? loadBubbles() : loadShoot();
    });
}

// ---- 4. True / False ----
function loadTF() {
    if (gameState.questionIndex >= gameState.total) return endGame();
    const q = gameState.tempData[gameState.questionIndex];
    setProgress('tf-progress');
    document.getElementById('tf-img').innerHTML = imgHtml(q);
    const st = document.getElementById('tf-statement'); st.innerHTML = '<span>' + fmt(q.text) + '</span>';
    st.classList.remove('popup-anim'); void st.offsetWidth; st.classList.add('popup-anim');
}
function checkTF(ans) {
    const q = gameState.tempData[gameState.questionIndex];
    const ok = q.isCorrect === ans; if (ok) gameState.score++; updateScoreDisplay();
    showFeedback(ok, (ok ? "إجابة صحيحة وممتازة!" : `العبارة ${q.isCorrect ? "صحيحة" : "خاطئة"}.`) + explain(q), () => { gameState.questionIndex++; loadTF(); });
}

// ---- 5. Matching (3 جولات × 5) ----
function loadMatchRound() {
    const rounds = Math.ceil(gameState.total / 5);
    if (gameState.subLevel >= rounds) return endGame();
    const items = gameState.tempData.slice(gameState.subLevel * 5, gameState.subLevel * 5 + 5);
    setProgress('match-progress');
    renderMatchList('match-list-a', shuffleArray(items.map((it, k) => ({ id: gameState.subLevel + '-' + it.a, html: fmt(it.a), type: 'A' }))));
    renderMatchList('match-list-b', shuffleArray(items.map((it, k) => ({ id: gameState.subLevel + '-' + it.a, html: fmt(it.b), type: 'B' }))));
    matchSelectedA = null; matchSelectedB = null;
}
function renderMatchList(cid, items) {
    const c = document.getElementById(cid); c.innerHTML = '';
    items.forEach(it => {
        const b = document.createElement('button');
        b.className = "match-item bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 px-2 rounded-lg shadow-sm text-xs sm:text-sm text-center min-h-[60px] flex items-center justify-center";
        b.innerHTML = '<span>' + it.html + '</span>'; b.dataset.id = it.id; b.dataset.type = it.type;
        b.onclick = () => handleMatchClick(b); c.appendChild(b);
    });
}
function handleMatchClick(btn) {
    if (btn.classList.contains('matched')) return;
    const type = btn.dataset.type;
    document.querySelectorAll(`#match-list-${type.toLowerCase()} .match-item`).forEach(el => { if (!el.classList.contains('matched')) el.classList.remove('selected'); });
    btn.classList.add('selected');
    if (type === 'A') matchSelectedA = btn; else matchSelectedB = btn;
    if (matchSelectedA && matchSelectedB) {
        const a = matchSelectedA, b = matchSelectedB;
        if (a.dataset.id === b.dataset.id) {
            a.classList.remove('selected'); a.classList.add('matched');
            b.classList.remove('selected'); b.classList.add('matched');
            if (!a.dataset.missed) gameState.score++;
            SFX.correct();
            gameState.questionIndex++; updateScoreDisplay(); setProgress('match-progress');
            const done = document.querySelectorAll('#match-list-a .matched').length;
            const inRound = document.querySelectorAll('#match-list-a .match-item').length;
            if (done === inRound) setTimeout(() => { gameState.subLevel++; loadMatchRound(); }, 900);
        } else {
            SFX.wrong();
            a.dataset.missed = '1'; // المحاولة الخاطئة تُفقد نقطة هذا العنصر
            a.classList.add('error'); b.classList.add('error');
            setTimeout(() => { a.classList.remove('selected', 'error'); b.classList.remove('selected', 'error'); }, 500);
        }
        matchSelectedA = null; matchSelectedB = null;
    }
}

// ---- 6. Fill ----
function loadFill() {
    if (gameState.questionIndex >= gameState.total) return endGame();
    const q = gameState.tempData[gameState.questionIndex];
    setProgress('fill-progress');
    document.getElementById('fill-img').innerHTML = imgHtml(q);
    const blank = '<span id="fill-blank" class="inline-block border-b-4 border-dashed border-purple-400 min-w-[70px] md:min-w-[100px] text-center text-purple-600 px-1 md:px-2 pb-1 mx-1 md:mx-2">؟</span>';
    const el = document.getElementById('fill-sentence');
    el.innerHTML = fmt(q.text).replace('...', blank);
    el.classList.remove('popup-anim'); void el.offsetWidth; el.classList.add('popup-anim');
    const box = document.getElementById('fill-options'); box.innerHTML = '';
    shuffleArray(q.options).forEach(opt => {
        const b = document.createElement('button');
        b.className = "btn-bounce bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-800 font-bold py-3 md:py-4 px-3 md:px-6 rounded-xl shadow-sm text-base md:text-lg transition-colors";
        b.innerHTML = fmt(opt); b.onclick = () => checkFill(opt, q); box.appendChild(b);
    });
}
function checkFill(sel, q) {
    const ok = sel === q.blank; if (ok) gameState.score++; updateScoreDisplay();
    const bl = document.getElementById('fill-blank');
    if (bl) { bl.innerHTML = fmt(sel); bl.className = 'inline-block border-b-4 border-solid px-2 mx-1 ' + (ok ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600 line-through'); }
    showFeedback(ok, (ok ? "ممتاز! إجابة في مكانها الصحيح." : `الإجابة الصحيحة هي: ${fmt(q.blank)}`) + explain(q), () => { gameState.questionIndex++; loadFill(); });
}


// ---- 7. شد الحبل ----
function moveRope() {
    const p = Math.max(-6, Math.min(6, gameState.tugPos || 0));
    document.getElementById('tug-rope').style.transform = `translateX(${p * 6}%)`; // موجب = نحو فريقك (اليمين)
}
function pullAnim(side) {
    const el = document.querySelector(side === 'me' ? '.tug-me' : '.tug-op');
    el.classList.remove('pulling'); void el.offsetWidth; el.classList.add('pulling');
}
function loadTug() {
    if (gameState.questionIndex >= gameState.total) return endGame();
    gameState.locked = false;
    const q = gameState.tempData[gameState.questionIndex];
    document.getElementById('tug-question').innerHTML = toAr(gameState.questionIndex + 1) + " - " + fmt(q.q);
    document.getElementById('tug-img').innerHTML = imgHtml(q, 'q-img-sm');
    setProgress('tug-progress');
    const box = document.getElementById('tug-options'); box.innerHTML = '';
    shuffleArray(q.options).forEach(opt => {
        const b = document.createElement('button');
        b.className = "btn-bounce w-full bg-white border-2 border-amber-300 hover:bg-amber-50 text-amber-900 font-bold py-3 px-3 rounded-xl shadow-sm text-base md:text-lg";
        b.innerHTML = fmt(opt);
        b.onclick = () => checkTug(opt, q, b);
        box.appendChild(b);
    });
}
function checkTug(sel, q, btn) {
    if (gameState.locked) return; gameState.locked = true;
    const ok = sel === q.ans;
    if (ok) gameState.score++;
    ok ? SFX.correct() : SFX.wrong();
    gameState.tugPos = Math.max(-6, Math.min(6, gameState.tugPos + (ok ? 1 : -1))); moveRope(); pullAnim(ok ? 'me' : 'op');
    btn.classList.add(ok ? 'opt-right' : 'opt-wrong');
    updateScoreDisplay();
    setTimeout(() => showFeedback(ok, (ok ? "سحبة قوية! الحبل يقترب من فريقك 💪" : `سحبة للمنافس! الإجابة الصحيحة: ${fmt(q.ans)}`) + explain(q),
        () => { gameState.questionIndex++; loadTug(); }), 650);
}

// ---- 8. تسجيل الأهداف ----
const GOAL_SPOTS = [{ x: 27, y: 20 }, { x: 73, y: 20 }, { x: 27, y: 46 }, { x: 73, y: 46 }];
function placeEl(el, p, anim) {
    el.style.transition = anim ? 'left .6s ease-out, top .6s ease-out, transform .6s ease-out' : 'none';
    el.style.left = p.x + '%'; el.style.top = p.y + '%';
}
function loadGoal() {
    if (gameState.questionIndex >= gameState.total) return endGame();
    gameState.locked = false;
    const q = gameState.tempData[gameState.questionIndex];
    document.getElementById('goal-question').innerHTML = toAr(gameState.questionIndex + 1) + " - " + fmt(q.q);
    document.getElementById('goal-img').innerHTML = imgHtml(q, 'q-img-sm');
    setProgress('goal-progress');
    const ball = document.getElementById('goal-ball'), keeper = document.getElementById('goal-keeper');
    placeEl(ball, { x: 50, y: 86 }); ball.style.transform = 'translate(-50%,-50%) scale(1)';
    placeEl(keeper, { x: 50, y: 36 }); keeper.style.transform = 'translate(-50%,-50%) rotate(0deg)';
    document.getElementById('goal-flash').className = 'goal-flash';
    const box = document.getElementById('goal-targets'); box.innerHTML = '';
    shuffleArray(q.options).forEach((opt, i) => {
        const t = document.createElement('button');
        t.className = 'goal-target' + (String(opt).replace(/[$\s{}]/g, '').length > 12 ? ' long' : '');
        t.style.left = GOAL_SPOTS[i].x + '%'; t.style.top = GOAL_SPOTS[i].y + '%';
        t.innerHTML = '<span>' + fmt(opt) + '</span>';
        t.onclick = () => shootGoal(opt, q, i, t);
        box.appendChild(t);
    });
}
function shootGoal(sel, q, idx, target) {
    if (gameState.locked) return; gameState.locked = true;
    const ok = sel === q.ans;
    const ball = document.getElementById('goal-ball'), keeper = document.getElementById('goal-keeper');
    const others = [0, 1, 2, 3].filter(k => k !== idx);
    const kSpot = ok ? GOAL_SPOTS[others[Math.floor(Math.random() * others.length)]] : GOAL_SPOTS[idx];
    placeEl(ball, GOAL_SPOTS[idx], true); ball.style.transform = 'translate(-50%,-50%) scale(.6) rotate(540deg)';
    placeEl(keeper, { x: 50 + (kSpot.x - 50) * 0.8, y: kSpot.y + 6 }, true);
    keeper.style.transform = `translate(-50%,-50%) rotate(${kSpot.x < 50 ? -35 : 35}deg)`;
    target.classList.add(ok ? 'hit' : 'miss');
    if (ok) gameState.score++;
    updateScoreDisplay();
    setTimeout(() => {
        const f = document.getElementById('goal-flash');
        f.innerText = ok ? 'جووووول! ⚽' : 'تصدّى الحارس! 🧤';
        f.className = 'goal-flash show ' + (ok ? 'ok' : 'no');
        ok ? SFX.correct(true) : SFX.wrong();
    }, 600);
    setTimeout(() => showFeedback(ok, (ok ? "هدف رائع في الزاوية الصحيحة!" : `ضاعت الفرصة! الإجابة الصحيحة: ${fmt(q.ans)}`) + explain(q),
        () => { gameState.questionIndex++; loadGoal(); }), 1400);
}

// ---- زر الصوت ----
function refreshSoundBtn() {
    const b = document.getElementById('sound-btn'); if (!b) return;
    b.innerHTML = SFX.isMuted() ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
    b.title = SFX.isMuted() ? 'تشغيل الصوت' : 'كتم الصوت';
}
function toggleSound() { SFX.setMuted(!SFX.isMuted()); refreshSoundBtn(); if (!SFX.isMuted()) SFX.small(true); }
refreshSoundBtn();
document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });

// ---- 9. من سيربح المليون ----
const MIL_LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
const MIL_LETTERS = ['أ', 'ب', 'ج', 'د'];
function milFmt(n) { return toAr(n.toLocaleString('en-US')); }
function milPrize() { return gameState.score ? MIL_LADDER[Math.min(gameState.score, MIL_LADDER.length) - 1] : 0; }
function milRenderTop() {
    const lad = document.getElementById('mil-ladder');
    lad.innerHTML = MIL_LADDER.slice(0, gameState.total).map((p, i) => {
        const cls = i < gameState.score ? 'won' : (i === gameState.score ? 'next' : '');
        return `<div class="mil-step ${cls} "><b>${toAr(i + 1)}</b><span>${milFmt(p)}</span></div>`;
    }).join('');
    const cur = lad.querySelector('.next') || lad.lastElementChild;
    if (cur) lad.scrollLeft = cur.offsetLeft - lad.clientWidth / 2 + cur.clientWidth / 2;
    document.getElementById('mil-qnum').innerText = 'السؤال ' + toAr(Math.min(gameState.questionIndex + 1, gameState.total)) + ' من ' + toAr(gameState.total);
    document.getElementById('mil-prize').innerText = milFmt(milPrize()) + ' نقطة';
    ['5050', 'phone', 'aud'].forEach(k => document.getElementById('ll-' + (k === '5050' ? '5050' : k)).classList.toggle('used', !gameState.ll[k]));
}
function loadMil() {
    if (gameState.questionIndex >= gameState.total) return endGame();
    gameState.locked = false;
    const q = gameState.tempData[gameState.questionIndex];
    milRenderTop();
    const help = document.getElementById('mil-help'); help.classList.add('hidden'); help.innerHTML = '';
    const qb = document.getElementById('mil-question'); qb.innerHTML = imgHtml(q, 'sm') + '<div>' + fmt(q.q) + '</div>';
    qb.classList.remove('popup-anim'); void qb.offsetWidth; qb.classList.add('popup-anim');
    const box = document.getElementById('mil-options'); box.innerHTML = '';
    gameState.milOpts = shuffleArray(q.options);
    gameState.milOpts.forEach((opt, i) => {
        const b = document.createElement('button');
        b.className = 'mil-opt'; b.dataset.opt = opt;
        b.innerHTML = `<span class="mil-letter">${MIL_LETTERS[i]}</span><span class="mil-txt">${fmt(opt)}</span>`;
        b.onclick = () => pickMil(opt, q, b);
        box.appendChild(b);
    });
}
function pickMil(sel, q, btn) {
    if (gameState.locked) return; gameState.locked = true;
    btn.classList.add('final');
    const ok = sel === q.ans;
    setTimeout(() => {
        document.querySelectorAll('.mil-opt').forEach(b => { if (b.dataset.opt === q.ans) b.classList.add('right'); });
        if (!ok) btn.classList.add('wrong');
        btn.classList.remove('final');
        ok ? SFX.correct(true) : SFX.wrong();
        if (ok) gameState.score++;
        updateScoreDisplay(); milRenderTop();
        if (!ok) gameState.milLost = true;
        setTimeout(() => showFeedback(ok, (ok ? `إجابة نهائية صحيحة! رصيدك الآن ${milFmt(milPrize())} نقطة 💰`
                : `الإجابة الصحيحة: ${fmt(q.ans)}` + explain(q) + `<br><b class="text-red-600">انتهت المسابقة .. رصيدك النهائي ${milFmt(milPrize())} نقطة</b>`) + (ok ? explain(q) : ''),
            () => { if (!ok) return endGame(); gameState.questionIndex++; loadMil(); }), 1100);
    }, 1300);
}
function useLifeline(kind) {
    if (gameState.locked || !gameState.ll || !gameState.ll[kind]) return;
    gameState.ll[kind] = false; milRenderTop(); SFX.small(true);
    const q = gameState.tempData[gameState.questionIndex];
    const btns = [...document.querySelectorAll('.mil-opt')];
    const visible = btns.filter(b => !b.classList.contains('gone'));
    const help = document.getElementById('mil-help');
    if (kind === '5050') {
        shuffleArray(visible.filter(b => b.dataset.opt !== q.ans)).slice(0, 2).forEach(b => { b.classList.add('gone'); b.disabled = true; });
        return;
    }
    const letterOf = b => b.querySelector('.mil-letter').innerText;
    const right = btns.find(b => b.dataset.opt === q.ans);
    if (kind === 'phone') {
        const sure = Math.random() < 0.85;
        const pick = sure ? right : shuffleArray(visible.filter(b => b !== right))[0] || right;
        help.innerHTML = `<i class="fa-solid fa-phone"></i> صديقك يقول: «${sure ? 'أنا متأكد تقريبًا' : 'مش متأكد .. لكن أعتقد'} إن الإجابة هي <b>(${letterOf(pick)})</b>»`;
    } else {
        let left = 100; const shares = {};
        const rp = 45 + Math.floor(Math.random() * 30); shares[right.dataset.opt] = rp; left -= rp;
        const others = visible.filter(b => b !== right);
        others.forEach((b, i) => { const v = i === others.length - 1 ? left : Math.floor(Math.random() * (left + 1)); shares[b.dataset.opt] = v; left -= v; });
        help.innerHTML = '<div class="mil-aud">' + btns.map(b => {
            const v = shares[b.dataset.opt] || 0;
            return `<div class="mil-aud-col"><span>${toAr(v)}٪</span><div class="mil-aud-bar"><i style="height:${v}%"></i></div><b>${letterOf(b)}</b></div>`;
        }).join('') + '</div>';
    }
    help.classList.remove('hidden');
}
