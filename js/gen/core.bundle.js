/* 자동 생성 — tools/build.js 묶음. 고치려면 원본(24개)을 고치고 다시 빌드 */

/* ==== js/core/kp.js ==== */
/* =====================================================================
   아이 놀이터 — 공용 네임스페이스와 유틸리티
   모든 코어/게임 파일은 window.KP 하나만 공유한다.
===================================================================== */
"use strict";
window.KP = window.KP || {};
(function (KP) {
  const U = (KP.u = {});

  U.$ = (s, p = document) => p.querySelector(s);
  U.$$ = (s, p = document) => [...p.querySelectorAll(s)];
  U.rand = (n) => Math.floor(Math.random() * n);
  U.randf = (a, b) => a + Math.random() * (b - a);
  U.pick = (a) => a[Math.floor(Math.random() * a.length)];
  U.shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  /** 배열에서 겹치지 않게 n개 뽑기 */
  U.sample = (a, n) => U.shuffle([...a]).slice(0, n);
  U.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  /** 요소 생성: el("div","cls","<b>html</b>") */
  U.el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  /** 버튼 생성 (모양은 CSS .btn 계열) */
  U.btn = (html, cls = "btn") => {
    const b = U.el("button", cls, html);
    b.type = "button";
    return b;
  };
  /** CSS 애니메이션을 처음부터 다시 재생 */
  U.replay = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };
  /** 요소 중심 좌표(화면 기준) */
  U.center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
  };
  /** 요소 크기 {w,h (offsetWidth/Height), cw,ch (clientWidth/Height)} — 크기가 바뀔 때만 알려 받아 둠
   *  (매 장면 offsetWidth 를 읽으면 배치를 억지로 다시 계산해 버벅임)
   *  같은 객체를 돌려주므로 매 장면 sizeOf(el).w 로 읽으면 됨. ResizeObserver 가 없으면 그때그때 잼 */
  const measure = (el, sz) => {
    sz.w = el.offsetWidth;
    sz.h = el.offsetHeight;
    sz.cw = el.clientWidth;
    sz.ch = el.clientHeight;
    return sz;
  };
  U.sizeOf = (el) => {
    if (!window.ResizeObserver) return measure(el, {});
    if (el._kpSize) return el._kpSize;
    const sz = (el._kpSize = measure(el, {}));
    new ResizeObserver(() => measure(el, sz)).observe(el); // 크기가 바뀐 직후(배치가 끝난 뒤)라 여기서 재는 건 가벼움
    return sz;
  };
  /** 한국어 조사 자동 선택: josa("사과","을/를") → "사과를" */
  U.josa = (word, pair) => {
    const [a, b] = pair.split("/");
    const ch = word.charCodeAt(word.length - 1);
    if (ch < 0xac00 || ch > 0xd7a3) return word + b;
    const has = (ch - 0xac00) % 28 !== 0;
    if (pair === "으로/로") return word + (has && (ch - 0xac00) % 28 !== 8 ? "으로" : "로");
    return word + (has ? a : b);
  };
  /** 앱(홈 화면 설치)으로 실행 중인지 */
  U.isApp = () =>
    !!(
      (window.matchMedia &&
        (matchMedia("(display-mode: standalone)").matches ||
          matchMedia("(display-mode: fullscreen)").matches)) ||
      navigator.standalone
    );
  /** 한국어 숫자(고유어) */
  U.NAT = ["영", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
  /** 1~100 읽기 — 한자어: 23 → "이십삼", 고유어: 23 → "스물셋" (100은 둘 다 "백") */
  const SINO = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  U.numSino = (n) => {
    if (n === 0) return "영";
    if (n === 100) return "백";
    const t = Math.floor(n / 10),
      o = n % 10;
    return (t ? (t > 1 ? SINO[t] : "") + "십" : "") + SINO[o];
  };
  const NT = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];
  const NO = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
  U.numNative = (n) => {
    if (n === 0) return "영";
    if (n === 100) return "백";
    return NT[Math.floor(n / 10)] + NO[n % 10];
  };
  /** 개수 세는 말(관형): 3 → "세" ("세 개", "세 번") — 1~10, 그 밖은 숫자 그대로 */
  const CNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
  U.cntWord = (n) => CNT[n] || String(n);
  /** 차례 말: 1 → "첫 번째", 2 → "두 번째" (1~10) */
  U.ordWord = (n) => (n === 1 ? "첫" : CNT[n] || n) + " 번째";
  /** 게임 전용 CSS 넣기 (같은 id 는 한 번만) */
  KP.css = (id, text) => {
    if (document.getElementById("css-" + id)) return;
    const st = document.createElement("style");
    st.id = "css-" + id;
    st.textContent = text;
    document.head.appendChild(st);
  };
  /** 이벤트 한 번만 */
  U.once = (el, ev, fn) => el.addEventListener(ev, fn, { once: true });
})(window.KP);

;

/* ==== js/gen/emoji-map.js ==== */
/* 자동 생성 — tools/build.js */
KP.EMAP={"1️⃣":"keycap-1","1⃣":"keycap-1","2️⃣":"keycap-2","2⃣":"keycap-2","3️⃣":"keycap-3","3⃣":"keycap-3","4️⃣":"keycap-4","4⃣":"keycap-4","5️⃣":"keycap-5","5⃣":"keycap-5","↔":"left-right-arrow","↩️":"right-arrow-curving-left","↩":"right-arrow-curving-left","⌚":"watch","⏰":"alarm-clock","⏳":"hourglass-not-done","⏹️":"stop-button","⏹":"stop-button","▶":"play-button","▶️":"play-button","☀️":"sun","☀":"sun","☁️":"cloud","☁":"cloud","☂️":"umbrella","☂":"umbrella","☕":"hot-beverage","☝️":"index-pointing-up","☝":"index-pointing-up","⚖️":"balance-scale","⚖":"balance-scale","⚙️":"gear","⚙":"gear","⚡":"high-voltage","⚪":"white-circle","⚽":"soccer-ball","⚾":"baseball","⛄":"snowman-without-snow","⛈️":"cloud-with-lightning-and-rain","⛈":"cloud-with-lightning-and-rain","⛰️":"mountain","⛰":"mountain","⛱️":"umbrella-on-ground","⛱":"umbrella-on-ground","⛵":"sailboat","⛺":"tent","⛽":"fuel-pump","✂️":"scissors","✂":"scissors","✅":"check-mark-button","✈️":"airplane","✈":"airplane","✊":"raised-fist","✋":"raised-hand","✌️":"victory-hand","✌":"victory-hand","✍️":"writing-hand","✍":"writing-hand","✏️":"pencil","✏":"pencil","✔":"check-mark","✔️":"check-mark","✖":"multiply","✖️":"multiply","✨":"sparkles","❄️":"snowflake","❄":"snowflake","❓":"red-question-mark","❗":"red-exclamation-mark","❤️":"red-heart","❤":"red-heart","➕":"plus","➖":"minus","➡️":"right-arrow","➡":"right-arrow","⬆️":"up-arrow","⬆":"up-arrow","⬇️":"down-arrow","⬇":"down-arrow","⬛":"black-large-square","⭐":"star","⭕":"hollow-red-circle","〰️":"wavy-dash","〰":"wavy-dash","🃏":"joker","🌀":"cyclone","🌃":"night-with-stars","🌈":"rainbow","🌊":"water-wave","🌋":"volcano","🌍":"globe-showing-europe-africa","🌐":"globe-with-meridians","🌓":"first-quarter-moon","🌕":"full-moon","🌙":"crescent-moon","🌛":"first-quarter-moon-face","🌞":"sun-with-face","🌟":"glowing-star","🌧️":"cloud-with-rain","🌧":"cloud-with-rain","🌰":"chestnut","🌱":"seedling","🌲":"evergreen-tree","🌳":"deciduous-tree","🌴":"palm-tree","🌶️":"hot-pepper","🌶":"hot-pepper","🌷":"tulip","🌸":"cherry-blossom","🌹":"rose","🌺":"hibiscus","🌻":"sunflower","🌼":"blossom","🌽":"ear-of-corn","🌾":"sheaf-of-rice","🌿":"herb","🍁":"maple-leaf","🍂":"fallen-leaf","🍃":"leaf-fluttering-in-wind","🍄":"mushroom","🍅":"tomato","🍆":"eggplant","🍇":"grapes","🍉":"watermelon","🍊":"tangerine","🍋":"lemon","🍌":"banana","🍍":"pineapple","🍎":"red-apple","🍏":"green-apple","🍐":"pear","🍑":"peach","🍒":"cherries","🍓":"strawberry","🍔":"hamburger","🍕":"pizza","🍖":"meat-on-bone","🍙":"rice-ball","🍚":"cooked-rice","🍛":"curry-rice","🍜":"steaming-bowl","🍞":"bread","🍠":"roasted-sweet-potato","🍢":"oden","🍦":"soft-ice-cream","🍩":"doughnut","🍪":"cookie","🍫":"chocolate-bar","🍬":"candy","🍭":"lollipop","🍯":"honey-pot","🍰":"shortcake","🍲":"pot-of-food","🍳":"cooking","🍴":"fork-and-knife","🍽️":"fork-and-knife-with-plate","🍽":"fork-and-knife-with-plate","🎀":"ribbon","🎁":"wrapped-gift","🎂":"birthday-cake","🎃":"jack-o-lantern","🎆":"fireworks","🎈":"balloon","🎉":"party-popper","🎋":"tanabata-tree","🎐":"wind-chime","🎒":"backpack","🎞️":"film-frames","🎞":"film-frames","🎤":"microphone","🎧":"headphone","🎨":"artist-palette","🎩":"top-hat","🎪":"circus-tent","🎮":"video-game","🎯":"bullseye","🎲":"game-die","🎵":"musical-note","🎶":"musical-notes","🎸":"guitar","🎹":"musical-keyboard","🎺":"trumpet","🎻":"violin","🎼":"musical-score","🏀":"basketball","🏁":"chequered-flag","🏃":"person-running","🏅":"sports-medal","🏆":"trophy","🏎️":"racing-car","🏎":"racing-car","🏖️":"beach-with-umbrella","🏖":"beach-with-umbrella","🏜️":"desert","🏜":"desert","🏝️":"desert-island","🏝":"desert-island","🏞️":"national-park","🏞":"national-park","🏠":"house","🏡":"house-with-garden","🏥":"hospital","🏫":"school","🏰":"castle","🐄":"cow","🐇":"rabbit","🐈":"cat","🐉":"dragon","🐊":"crocodile","🐌":"snail","🐍":"snake","🐑":"ewe","🐒":"monkey","🐓":"rooster","🐔":"chicken","🐕":"dog","🐘":"elephant","🐙":"octopus","🐚":"spiral-shell","🐛":"bug","🐜":"ant","🐝":"honeybee","🐞":"lady-beetle","🐟":"fish","🐠":"tropical-fish","🐡":"blowfish","🐢":"turtle","🐣":"hatching-chick","🐤":"baby-chick","🐥":"front-facing-baby-chick","🐦":"bird","🐧":"penguin","🐨":"koala","🐫":"two-hump-camel","🐬":"dolphin","🐭":"mouse-face","🐮":"cow-face","🐯":"tiger-face","🐰":"rabbit-face","🐱":"cat-face","🐳":"spouting-whale","🐴":"horse-face","🐵":"monkey-face","🐶":"dog-face","🐷":"pig-face","🐸":"frog","🐹":"hamster","🐺":"wolf","🐻":"bear","🐼":"panda","🐾":"paw-prints","🐿️":"chipmunk","🐿":"chipmunk","👀":"eyes","👂":"ear","👃":"nose","👄":"mouth","👆":"backhand-index-pointing-up","👇":"backhand-index-pointing-down","👈":"backhand-index-pointing-left","👋":"waving-hand","👍":"thumbs-up","👏":"clapping-hands","👐":"open-hands","👑":"crown","👓":"glasses","👕":"t-shirt","👖":"jeans","👗":"dress","👙":"bikini","👜":"handbag","👟":"running-shoe","👦":"boy","👧":"girl","👨":"man","👩":"woman","👩‍⚕️":"woman-health-worker","👩‍⚕":"woman-health-worker","👴":"old-man","👵":"old-woman","👶":"baby","👸":"princess","👻":"ghost","💇":"person-getting-haircut","💊":"pill","💎":"gem-stone","💓":"beating-heart","💕":"two-hearts","💖":"sparkling-heart","💗":"growing-heart","💙":"blue-heart","💚":"green-heart","💛":"yellow-heart","💜":"purple-heart","💝":"heart-with-ribbon","💡":"light-bulb","💢":"anger-symbol","💤":"zzz","💥":"collision","💦":"sweat-droplets","💧":"droplet","💨":"dashing-away","💪":"flexed-biceps","💫":"dizzy","💮":"white-flower","💯":"hundred-points","💰":"money-bag","💾":"floppy-disk","📂":"open-file-folder","📄":"page-facing-up","📈":"chart-increasing","📊":"bar-chart","📋":"clipboard","📌":"pushpin","📍":"round-pushpin","📒":"ledger","📓":"notebook","📕":"closed-book","📖":"open-book","📗":"green-book","📘":"blue-book","📙":"orange-book","📚":"books","📝":"memo","📣":"megaphone","📦":"package","📴":"mobile-phone-off","📷":"camera","📸":"camera-with-flash","📺":"television","📻":"radio","🔁":"repeat-button","🔄":"counterclockwise-arrows-button","🔊":"speaker-high-volume","🔍":"magnifying-glass-tilted-left","🔐":"locked-with-key","🔑":"key","🔒":"locked","🔓":"unlocked","🔔":"bell","🔗":"link","🔟":"keycap-10","🔢":"input-numbers","🔤":"input-latin-letters","🔥":"fire","🔦":"flashlight","🔨":"hammer","🔴":"red-circle","🔵":"blue-circle","🔶":"large-orange-diamond","🔷":"large-blue-diamond","🔺":"red-triangle","🕊️":"dove","🕊":"dove","🕯️":"candle","🕯":"candle","🕶️":"sunglasses","🕶":"sunglasses","🕷️":"spider","🕷":"spider","🖊️":"pen","🖊":"pen","🖌️":"paintbrush","🖌":"paintbrush","🖍️":"crayon","🖍":"crayon","🖤":"black-heart","🖨️":"printer","🖨":"printer","🖼️":"framed-picture","🖼":"framed-picture","🗂️":"card-index-dividers","🗂":"card-index-dividers","🗑️":"wastebasket","🗑":"wastebasket","🗺️":"world-map","🗺":"world-map","🗽":"statue-of-liberty","😀":"grinning-face","😄":"grinning-face-with-smiling-eyes","😆":"grinning-squinting-face","😊":"smiling-face-with-smiling-eyes","😋":"face-savoring-food","😎":"smiling-face-with-sunglasses","😖":"confounded-face","😠":"angry-face","😢":"crying-face","😣":"persevering-face","😨":"fearful-face","😮":"face-with-open-mouth","😲":"astonished-face","😳":"flushed-face","😴":"sleeping-face","😷":"face-with-medical-mask","🙂":"slightly-smiling-face","🙈":"see-no-evil-monkey","🙋":"person-raising-hand","🙌":"raising-hands","🚀":"rocket","🚁":"helicopter","🚂":"locomotive","🚌":"bus","🚎":"trolleybus","🚑":"ambulance","🚒":"fire-engine","🚓":"police-car","🚗":"automobile","🚙":"sport-utility-vehicle","🚛":"articulated-lorry","🚜":"tractor","🚦":"vertical-traffic-light","🚧":"construction","🚩":"triangular-flag","🚪":"door","🚲":"bicycle","🚶":"person-walking","🚽":"toilet","🚿":"shower","🛁":"bathtub","🛏️":"bed","🛏":"bed","🛝":"playground-slide","🛣️":"motorway","🛣":"motorway","🛤️":"railway-track","🛤":"railway-track","🛷":"sled","🛸":"flying-saucer","🟠":"orange-circle","🟡":"yellow-circle","🟢":"green-circle","🟣":"purple-circle","🟥":"red-square","🟦":"blue-square","🟧":"orange-square","🟨":"yellow-square","🟩":"green-square","🟪":"purple-square","🟰":"heavy-equals-sign","🤍":"white-heart","🤎":"brown-heart","🤔":"thinking-face","🤖":"robot","🤝":"handshake","🤡":"clown-face","🤤":"drooling-face","🤧":"sneezing-face","🤨":"face-with-raised-eyebrow","🤫":"shushing-face","🤲":"palms-up-together","🥁":"drum","🥄":"spoon","🥅":"goal-net","🥒":"cucumber","🥕":"carrot","🥚":"egg","🥛":"glass-of-milk","🥜":"peanuts","🥝":"kiwi-fruit","🥣":"bowl-with-spoon","🥦":"broccoli","🥬":"leafy-green","🥳":"partying-face","🥵":"hot-face","🥾":"hiking-boot","🦀":"crab","🦁":"lion","🦄":"unicorn","🦅":"eagle","🦆":"duck","🦇":"bat","🦈":"shark","🦉":"owl","🦊":"fox","🦋":"butterfly","🦌":"deer","🦑":"squid","🦒":"giraffe","🦓":"zebra","🦕":"sauropod","🦖":"t-rex","🦙":"llama","🦛":"hippopotamus","🦜":"parrot","🦝":"raccoon","🦟":"mosquito","🦠":"microbe","🦩":"flamingo","🦭":"seal","🦴":"bone","🦵":"leg","🦶":"foot","🦷":"tooth","🦸":"person-superhero","🧀":"cheese-wedge","🧁":"cupcake","🧃":"beverage-box","🧊":"ice","🧒":"child","🧠":"brain","🧡":"orange-heart","🧢":"billed-cap","🧣":"scarf","🧤":"gloves","🧥":"coat","🧦":"socks","🧩":"puzzle-piece","🧪":"test-tube","🧮":"abacus","🧱":"brick","🧲":"magnet","🧸":"teddy-bear","🧹":"broom","🧺":"basket","🧻":"roll-of-paper","🧼":"soap","🧽":"sponge","🩳":"shorts","🩴":"thong-sandal","🩷":"pink-heart","🩹":"adhesive-bandage","🩻":"x-ray","🪀":"yo-yo","🪁":"kite","🪄":"magic-wand","🪇":"maracas","🪈":"flute","🪐":"ringed-planet","🪜":"ladder","🪣":"bucket","🪥":"toothbrush","🪨":"rock","🪵":"wood","🪸":"coral","🪺":"nest-with-eggs","🪻":"hyacinth","🪼":"jellyfish","🫂":"people-hugging","🫐":"blueberries","🫗":"pouring-liquid","🫘":"beans","🫙":"jar","🫧":"bubbles"};
KP.EPRE={"abacus":1,"artist-palette":1,"balance-scale":1,"balloon":1,"basket":1,"bathtub":1,"bear":1,"beating-heart":1,"bell":1,"birthday-cake":1,"books":1,"bowl-with-spoon":1,"brain":1,"bubbles":1,"bullseye":1,"butterfly":1,"card-index-dividers":1,"carrot":1,"clown-face":1,"crayon":1,"crocodile":1,"cyclone":1,"dashing-away":1,"deciduous-tree":1,"dog-face":1,"door":1,"drum":1,"duck":1,"ear":1,"egg":1,"film-frames":1,"fireworks":1,"first-quarter-moon":1,"fish":1,"framed-picture":1,"gear":1,"glowing-star":1,"guitar":1,"hamster":1,"handshake":1,"hospital":1,"hundred-points":1,"input-latin-letters":1,"input-numbers":1,"joker":1,"keycap-1":1,"large-blue-diamond":1,"ledger":1,"light-bulb":1,"link":1,"lion":1,"locomotive":1,"lollipop":1,"magnet":1,"magnifying-glass-tilted-left":1,"memo":1,"musical-keyboard":1,"musical-note":1,"musical-notes":1,"musical-score":1,"notebook":1,"open-book":1,"package":1,"paintbrush":1,"pen":1,"pencil":1,"people-hugging":1,"person-superhero":1,"puzzle-piece":1,"racing-car":1,"rainbow":1,"raised-hand":1,"raising-hands":1,"red-apple":1,"red-question-mark":1,"red-triangle":1,"repeat-button":1,"rocket":1,"round-pushpin":1,"seedling":1,"smiling-face-with-smiling-eyes":1,"soap":1,"soft-ice-cream":1,"sponge":1,"sports-medal":1,"t-shirt":1,"test-tube":1,"toilet":1,"toothbrush":1,"vertical-traffic-light":1,"wavy-dash":1,"wind-chime":1};

;

/* ==== js/core/art.js ==== */
/* =====================================================================
   그림(일러스트) — 이모지 문자를 통일된 Fluent 일러스트 SVG로 그린다.
   KP.EMAP 은 빌드 도구(tools/build.js)가 js/gen/emoji-map.js 로 생성.
   지도에 없는 문자는 기기 이모지 글자로 대체 표시된다.
===================================================================== */
"use strict";
(function (KP) {
  const MAP = () => KP.EMAP || {};
  // 미리 구운 그림(webp)을 읽을 수 있는 기기인지 — 못 읽는 옛 iPad(iOS 14 미만) 등은 SVG 그대로
  // 크롬 계열은 바로 판별(캔버스가 webp 를 만들 수 있으면 읽기도 됨), 사파리는 아래 그림 읽기가 끝나면 그때부터 씀
  let webp = false;
  try {
    webp = document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch (e) {}
  try {
    const im = new Image();
    im.onload = () => { if (im.width === 1) webp = true; };
    im.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
  } catch (e) {}
  const seg =
    typeof Intl !== "undefined" && Intl.Segmenter
      ? new Intl.Segmenter("ko", { granularity: "grapheme" })
      : null;

  /** 문자열을 글자(그래핌) 단위로 나누기 */
  function graphemes(str) {
    if (seg) return [...seg.segment(str)].map((s) => s.segment);
    return Array.from(str);
  }
  function lookup(g) {
    const m = MAP();
    return m[g] || m[g.replace(/️/g, "")] || null;
  }
  /** 그림 파일 경로 (없으면 null) */
  KP.esrc = (ch) => {
    const f = lookup(ch);
    return f ? "assets/e/" + f + ".svg" : null;
  };
  /** 이모지가 섞인 문자열 → HTML (이모지는 <img>, 나머지는 글자 그대로)
   *  pre: 홈 화면용 — 미리 구운 그림(assets/ep/*.webp, 192px)이 있으면 그걸 씀. SVG 는 흐림 효과가 많아 켤 때마다 그리는 비용이 큼.
   *  크게 보이는 곳(큰 카드 hero 등)에는 쓰지 말 것(192px 라 흐려짐) */
  KP.E = (str, cls = "", pre = false) => {
    if (str == null) return "";
    let out = "";
    const P = pre && webp && KP.EPRE;
    for (const g of graphemes(String(str))) {
      const f = lookup(g);
      if (f) out += '<img class="e ' + cls + '" src="' + (P && P[f] ? "assets/ep/" + f + ".webp" : "assets/e/" + f + ".svg") + '" alt="" draggable="false">';
      else if (/\p{Extended_Pictographic}/u.test(g)) out += '<span class="e et ' + cls + '">' + g + "</span>";
      else out += g.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
    }
    return out;
  };
  /** 이모지 하나를 담은 요소 */
  KP.Eel = (ch, cls = "") => {
    const span = document.createElement("span");
    span.className = "eb " + cls;
    span.innerHTML = KP.E(ch);
    return span;
  };

  /* ---- 저장된 SVG 정화: 그림 요소·속성만 남기고 스크립트 여지는 모두 제거 ---- */
  const OK_TAG = new Set(["svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "defs", "lineargradient", "radialgradient", "pattern", "stop"]);
  const OK_ATTR = new Set(["class", "id", "viewbox", "xmlns", "fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "opacity", "fill-opacity",
    "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "d", "points", "transform", "offset", "stop-color", "stop-opacity",
    "patternunits", "patterntransform", "gradientunits", "data-p", "data-uid"]);
  KP.sanitizeSvg = (str) => {
    if (typeof str !== "string" || str.length > 300000) return "";
    try {
      const doc = new DOMParser().parseFromString(str, "image/svg+xml");
      const root = doc.documentElement;
      if (!root || root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return "";
      const walk = (el) => {
        for (const c of [...el.children]) {
          if (!OK_TAG.has(c.nodeName.toLowerCase())) c.remove();
          else walk(c);
        }
        for (const a of [...el.attributes]) {
          const n = a.name.toLowerCase(),
            v = a.value;
          const bad = !OK_ATTR.has(n) || /javascript:|data:|expression|<|>/i.test(v) || (/url\(/i.test(v) && !/^url\(#[\w-]+\)$/.test(v.trim()));
          if (bad) el.removeAttribute(a.name);
        }
      };
      walk(root);
      return new XMLSerializer().serializeToString(root);
    } catch (e) {
      return "";
    }
  };

  /* ---- 캔버스용 이미지 캐시 ---- */
  const cache = new Map();
  KP.eImage = (ch) => {
    const src = KP.esrc(ch);
    if (!src) return null;
    if (cache.has(src)) return cache.get(src);
    const im = new Image();
    im.decoding = "async";
    im.src = src;
    cache.set(src, im);
    return im;
  };
  /** 여러 그림을 미리 불러오기 → Promise */
  KP.loadE = (chars) =>
    Promise.all(
      chars.map(
        (ch) =>
          new Promise((res) => {
            const im = KP.eImage(ch);
            if (!im) return res();
            if (im.complete && im.naturalWidth) return res();
            im.addEventListener("load", res, { once: true });
            im.addEventListener("error", res, { once: true });
          })
      )
    );
  /* ---- 캔버스용 비트맵 캐시 ----
     SVG 그림을 캔버스에 그릴 때마다 기기가 다시 그려내면(특히 iPad Safari) 매우 느리다.
     크기별로 한 번만 비트맵으로 만들어 두고 그걸 찍는다. 크기는 8px 단위로 묶어 개수를 제한. */
  const bmp = new Map();
  function bitmapOf(im, src, px) {
    const q = Math.min(512, Math.max(16, Math.ceil(px / 8) * 8));
    const key = src + "|" + q;
    let c = bmp.get(key);
    if (c) {
      bmp.delete(key); // 최근 사용 순서 갱신
      bmp.set(key, c);
      return c;
    }
    try {
      c = document.createElement("canvas");
      c.width = c.height = q;
      c.getContext("2d").drawImage(im, 0, 0, q, q);
    } catch (e) {
      return null;
    }
    bmp.set(key, c);
    if (bmp.size > 240) bmp.delete(bmp.keys().next().value);
    return c;
  }
  /** 캔버스에 그림 그리기 (가운데 기준) */
  KP.drawE = (ctx, ch, x, y, size, rot = 0) => {
    const im = KP.eImage(ch);
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (im && im.complete && im.naturalWidth) {
      let scale = 1;
      try {
        const m = ctx.getTransform();
        scale = Math.hypot(m.a, m.b) || 1;
      } catch (e) {}
      const b = size * scale >= 4 ? bitmapOf(im, im.src, size * scale) : null;
      ctx.drawImage(b || im, -size / 2, -size / 2, size, size);
    } else {
      ctx.font = size * 0.85 + "px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, 0, size * 0.04);
    }
    ctx.restore();
  };
})(window.KP);

;

/* ==== js/core/store.js ==== */
/* =====================================================================
   저장소
   - KP.store : 작은 값(설정·스티커·단계·기록) → localStorage
   - KP.db    : 큰 값(사진·그림 작품)        → IndexedDB
   - KP.backup: 모든 데이터를 파일로 내보내기/불러오기
   모든 접근은 실패해도 앱이 멈추지 않도록 try/catch 로 감싼다.
===================================================================== */
"use strict";
(function (KP) {
  const PFX = "kp:";
  const mem = {}; // localStorage 를 못 쓰는 환경에서의 임시 보관
  const stale = new Set(); // 저장에 실패한 키 → 예전 값 대신 mem 을 먼저 읽음

  const store = (KP.store = {
    ok: true,
    get(k, def) {
      if (stale.has(k)) return mem[k] == null ? def : mem[k];
      try {
        const v = localStorage.getItem(PFX + k);
        if (v == null) return k in mem ? mem[k] : def;
        const p = JSON.parse(v);
        return p == null ? def : p; // 저장된 "null" 방어
      } catch (e) {
        return k in mem ? mem[k] : def;
      }
    },
    set(k, v) {
      mem[k] = v;
      try {
        localStorage.setItem(PFX + k, JSON.stringify(v));
        stale.delete(k);
        return true;
      } catch (e) {
        stale.add(k);
        store.ok = false;
        return false;
      }
    },
    update(k, def, fn) {
      const v = fn(store.get(k, def));
      store.set(k, v);
      return v;
    },
    del(k) {
      delete mem[k];
      stale.delete(k);
      try {
        localStorage.removeItem(PFX + k);
      } catch (e) {}
    },
    keys() {
      const out = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(PFX)) out.push(k.slice(PFX.length));
        }
      } catch (e) {}
      return out;
    },
  });

  /* ---------------- IndexedDB ---------------- */
  const DBN = "kids-playground",
    STORES = ["photos", "art"];
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open(DBN, 1);
        r.onupgradeneeded = () => {
          STORES.forEach((s) => {
            if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: "id" });
          });
        };
        r.onsuccess = () => {
          const db = r.result;
          // iPad 가 오래 쉬었다 깨어나며 연결을 끊으면 다음 사용 때 새로 연결
          db.onclose = () => (dbp = null);
          db.onversionchange = () => {
            db.close();
            dbp = null;
          };
          res(db);
        };
        r.onerror = () => {
          dbp = null;
          rej(r.error);
        };
      } catch (e) {
        rej(e);
      }
    });
    return dbp;
  }
  function tx1(s, mode, fn) {
    return open().then(
      (db) =>
        new Promise((res, rej) => {
          const t = db.transaction(s, mode);
          const os = t.objectStore(s);
          const r = fn(os);
          t.oncomplete = () => res(r && r.result);
          t.onerror = () => rej(t.error);
          t.onabort = () => rej(t.error || new Error("abort"));
        })
    );
  }
  // 연결이 끊겨 실패하면 한 번 새로 연결해서 다시 시도
  function tx(s, mode, fn) {
    return tx1(s, mode, fn).catch(() => {
      dbp = null;
      return tx1(s, mode, fn);
    });
  }
  KP.db = {
    /** 항목 저장: {id, ...} */
    put: (s, obj) => tx(s, "readwrite", (os) => os.put(obj)).catch(() => false),
    get: (s, id) => tx(s, "readonly", (os) => os.get(id)).catch(() => null),
    del: (s, id) => tx(s, "readwrite", (os) => os.delete(id)).catch(() => false),
    /** 전체 목록 (등록 순) */
    all: (s, strict) =>
      tx(s, "readonly", (os) => os.getAll())
        .then((a) => (a || []).sort((x, y) => (x.t || 0) - (y.t || 0)))
        .catch((e) => {
          if (strict) throw e; // 백업처럼 '못 읽음'과 '비어 있음'을 구분해야 할 때
          return [];
        }),
    clear: (s) => tx(s, "readwrite", (os) => os.clear()).catch(() => false),
  };
  /** 그림 주소가 안전한 이미지 dataURL 인지 (아니면 빈 문자열) */
  KP.safeImg = (u) => (typeof u === "string" && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u) ? u : "");
  /** 새 id */
  KP.newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /** 기기가 저장공간 정리 시 지우지 않도록 영구 보관 요청 */
  KP.persist = () => {
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    } catch (e) {}
  };

  /** 이미지 파일 → 정사각형으로 잘라 줄인 dataURL */
  KP.fileToSquare = (file, size = 600, q = 0.86) =>
    new Promise((res) => {
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => {
          const c = document.createElement("canvas");
          c.width = c.height = size;
          const x = c.getContext("2d");
          const s = Math.min(im.width, im.height);
          x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, size, size);
          res(c.toDataURL("image/jpeg", q));
        };
        im.onerror = () => res(null);
        im.src = rd.result;
      };
      rd.onerror = () => res(null);
      rd.readAsDataURL(file);
    });

  /** 사진 고르기 창 열기 → dataURL 배열 */
  KP.pickPhotos = (multiple = true, size = 600) =>
    new Promise((res) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "image/*";
      inp.multiple = multiple;
      inp.style.display = "none";
      document.body.appendChild(inp);
      let done = false;
      const cancel = () => {
        if (done) return;
        done = true;
        inp.remove();
        res([]);
      };
      inp.addEventListener("cancel", cancel);
      // cancel 이벤트가 없는 기기: 창으로 돌아온 뒤에도 파일이 없으면 취소로 봄
      setTimeout(() => window.addEventListener("focus", () => setTimeout(() => {
        if (!inp.files || !inp.files.length) cancel();
      }, 3500), { once: true }), 300); // iCloud 사진 내려받기 등으로 늦게 오는 경우 대비
      inp.addEventListener("change", async () => {
        if (done) return;
        done = true;
        const files = [...(inp.files || [])];
        const out = [];
        for (const f of files) {
          const d = await KP.fileToSquare(f, size);
          if (d) out.push(d);
        }
        inp.remove();
        res(out);
      });
      inp.click();
    });

  /* ---------------- 백업 ---------------- */
  KP.backup = {
    async export() {
      const data = { app: "kids-playground", v: 1, at: new Date().toISOString(), local: {}, db: {} };
      store.keys().forEach((k) => (data.local[k] = store.get(k)));
      // 작품·사진을 못 읽으면 빈 백업을 만들지 않고 실패로 알림 (빈 목록과 구분)
      try {
        for (const s of STORES) data.db[s] = await KP.db.all(s, true);
      } catch (e) {
        return false;
      }
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const a = document.createElement("a");
      const stamp = KP.gate ? KP.gate.today() : new Date().toISOString().slice(0, 10).replace(/-/g, ""); // 한국 날짜
      const name = "아이놀이터_백업_" + stamp + ".json";
      // iPad·iPhone 홈 화면 앱에서는 다운로드가 잘 안 되므로 '공유' 창(파일에 저장, 카톡 등)을 우선 사용
      try {
        const file = new File([blob], name, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "아이 놀이터 백업" });
          return true;
        }
      } catch (e) {
        if (e && e.name === "AbortError") return null; // 사용자가 취소
      }
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 60000);
      return true;
    },
    /** 백업 불러오기 → false(못 불러옴) / null(취소) / {fail: 저장 못 한 개수} */
    import() {
      return new Promise((res) => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = "application/json,.json";
        inp.style.display = "none";
        document.body.appendChild(inp);
        // 파일 고르기를 취소하면 끝냄 (안 그러면 기다림이 영영 안 끝남)
        let fin = false;
        const cancel = () => {
          if (fin) return;
          fin = true;
          inp.remove();
          res(null);
        };
        inp.addEventListener("cancel", cancel);
        setTimeout(() => window.addEventListener("focus", () => setTimeout(() => {
          if (!fin && !(inp.files && inp.files.length)) cancel();
        }, 1500), { once: true }), 300);
        inp.addEventListener("change", () => {
          if (fin) return;
          fin = true;
          const f = inp.files && inp.files[0];
          inp.remove();
          if (!f) return res(null);
          const rd = new FileReader();
          rd.onload = async () => {
            try {
              const data = JSON.parse(rd.result);
              if (!data || data.app !== "kids-playground") return res(false);
              // 받아들일 값만 골라서 넣기 (조작된 파일 방어)
              // earn(열쇠 별)·mypaints(만든 물감)·colordex(색 도감)도 (예전엔 빠졌음)
              const okKey = (k) => /^(settings|stickers|lastSticker|winCount|usage|lastGame|earn|mypaints|colordex)$/.test(k) || /^lv:[a-z0-9]+$/.test(k) || /^[a-z0-9]+:[\w:-]{1,40}$/.test(k);
              let fail = 0;
              Object.entries(data.local && typeof data.local === "object" ? data.local : {}).forEach(([k, v]) => {
                if (okKey(k) && v !== null && JSON.stringify(v).length < 200000 && store.set(k, v) === false) fail++;
              });
              for (const s of STORES) {
                const list = data.db && Array.isArray(data.db[s]) ? data.db[s] : [];
                for (const it of list) {
                  if (!it || typeof it !== "object" || (typeof it.id !== "string" && typeof it.id !== "number")) continue;
                  if (typeof it.kind !== "string" || it.kind.length > 20) continue;
                  const clean = Object.assign({}, it);
                  for (const f of ["img", "thumb", "ink"]) if (f in clean) clean[f] = KP.safeImg(clean[f]);
                  if ("img" in it && !clean.img) continue;
                  if ("svg" in clean) {
                    clean.svg = KP.sanitizeSvg ? KP.sanitizeSvg(clean.svg) : "";
                    if (!clean.svg) continue;
                  }
                  if ("paint" in clean) clean.paint = KP.zooCleanPaint ? KP.zooCleanPaint(clean.paint) : {}; // 동물원 크레파스 그림도 검사
                  if ((await KP.db.put(s, clean)) === false) fail++;
                }
              }
              res({ fail });
            } catch (e) {
              res(false);
            }
          };
          rd.readAsText(f);
        });
        inp.click();
      });
    },
  };
})(window.KP);

;

/* ==== js/core/settings.js ==== */
/* =====================================================================
   설정 값 (영구 저장) — 화면(부모 설정 패널)은 pages.js
===================================================================== */
"use strict";
(function (KP) {
  const DEF = {
    sfx: 0.8, // 효과음 음량 0~1
    music: 0.35, // 배경음악 음량
    voice: 1, // 목소리 음량
    bgm: false, // 배경음악 켜짐
    timer: 0, // 하루 사용 시간(분), 0 = 제한 없음
    hidden: {}, // 숨긴 게임 {id:true}
    lastCat: "play", // 마지막으로 본 메뉴
    hints: true, // 손가락 힌트
    natural: true, // 자연 음성(미리 만든 음성 파일) 쓰기
    lock: true, // 게임 잠금: 오늘 날짜(한국 시간 8자리)를 넣어야 열림
    lockCats: ["play", "make", "music", "smart", "bigkid"], // 잠글 카테고리 (공부 놀이는 바로)
    kidGate: false, // 아이용 문지기 퀴즈로도 열기 (기본 끔: 열쇠 별 모으기를 씀)
    kidQ: 3, // 맞혀야 할 문제 수
    kidMin: 20, // 열리는 시간(분)
    kidQuizMax: 2, // 문지기 퀴즈로 열 수 있는 횟수(하루)
    earnOn: true, // 열쇠 별 모으기 → 문 열기
    earnStars: 5, // 문 여는 데 필요한 별
    earnMin: 15, // 문이 열리는 시간(분)
    earnCapMin: 45, // 하루에 별로 열 수 있는 최대 시간(분), 0 = 제한 없음
    earnPerGame: 3, // 같은 놀이에서 하루에 받을 수 있는 별
    oneMore: true, // 끝날 때 '한 번만 더'(하루 1번, 2분)
    pin: "", // 부모 비밀번호 4자리 ("" = 오늘 날짜 8자리 사용)
    kidName: "", // 아이 이름 (예: "동훈") — 칭찬할 때 "동훈아, 최고!" / 비우면 이름 없이 칭찬
    kidVoice: null, // (예비) 이 기기 전용 이름 음성 {v: "동훈아" 주소, n: "동훈이" 주소} — 없으면 미리 만든 이름 음성(NAME_VOICES) 또는 기기 목소리
    stats: true, // 익명 사용 통계 보내기 (놀이 보완용, stats.js) — 이름·사진·소리는 안 보냄
    ver: 2,
  };
  // 이름: 한글·영문·숫자만, 8자까지 (화면에 그대로 넣으므로 꺾쇠 등은 버림)
  const cleanName = (n) => (typeof n === "string" ? n.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 8) : "");
  // 이름 음성 주소: 자연 음성과 같은 서버(CSP 허용)만
  const VOICE_HOST = "https://d8j0ntlcm91z4.cloudfront.net/";
  const okUrl = (u) => typeof u === "string" && u.startsWith(VOICE_HOST) && u.length < 300 && !/[\s"'<>]/.test(u);
  const cleanVoice = (v) => (v && typeof v === "object" && okUrl(v.v) ? { v: v.v, n: okUrl(v.n) ? v.n : "" } : null);
  function clean(v) {
    const c = Object.assign({}, DEF, v && typeof v === "object" ? v : {});
    ["sfx", "music", "voice"].forEach((k) => {
      if (!Number.isFinite(c[k])) c[k] = DEF[k];
      c[k] = Math.min(1, Math.max(0, c[k]));
    });
    if (!Number.isFinite(c.timer) || c.timer < 0) c.timer = 0;
    if (!c.hidden || typeof c.hidden !== "object" || Array.isArray(c.hidden)) c.hidden = {};
    c.bgm = !!c.bgm;
    c.hints = c.hints !== false;
    c.natural = c.natural !== false;
    if (typeof c.lastCat !== "string") c.lastCat = DEF.lastCat;
    c.lock = c.lock !== false;
    if (!Array.isArray(c.lockCats)) c.lockCats = DEF.lockCats.slice();
    c.lockCats = c.lockCats.filter((x) => typeof x === "string");
    c.kidGate = c.kidGate !== false;
    if (![2, 3, 5].includes(c.kidQ)) c.kidQ = DEF.kidQ;
    if (![10, 20, 30].includes(c.kidMin)) c.kidMin = DEF.kidMin;
    if (![1, 2, 3].includes(c.kidQuizMax)) c.kidQuizMax = DEF.kidQuizMax;
    c.earnOn = c.earnOn !== false;
    if (![3, 5, 7].includes(c.earnStars)) c.earnStars = DEF.earnStars;
    if (![10, 15, 20].includes(c.earnMin)) c.earnMin = DEF.earnMin;
    if (![0, 30, 45, 60].includes(c.earnCapMin)) c.earnCapMin = DEF.earnCapMin;
    if (![2, 3, 5].includes(c.earnPerGame)) c.earnPerGame = DEF.earnPerGame;
    c.oneMore = c.oneMore !== false;
    c.pin = /^\d{4}$/.test(String(c.pin || "")) ? String(c.pin) : "";
    c.kidName = cleanName(c.kidName);
    c.kidVoice = cleanVoice(c.kidVoice);
    return c;
  }
  const raw = KP.store.get("settings", {}) || {};
  let cur = clean(raw);
  // 판 올림 2: 열쇠 별이 생기면서 문지기 퀴즈(아무거나 눌러도 통과 가능)는 기본으로 끔
  if (!(raw.ver >= 2)) {
    cur.kidGate = false;
    cur.ver = 2;
    KP.store.set("settings", cur);
  }
  const subs = [];
  KP.settings = {
    DEF,
    get: () => cur,
    set(patch) {
      cur = clean(Object.assign({}, cur, patch));
      KP.store.set("settings", cur);
      subs.forEach((f) => {
        try {
          f(cur);
        } catch (e) {}
      });
      if (KP.audio) KP.audio.applyVolumes();
      return cur;
    },
    on(fn) {
      subs.push(fn);
    },
  };

  /* ---------- 아이 이름 부르기 ----------
     문장 안의 "{부름}" → "동훈아," / "근호야," (이름이 없으면 빼고 칭찬만)
     받침 있으면 아/이, 없으면 야/(없음): 동훈아·동훈이 / 근호야·근호 */
  const hasBatchim = (w) => {
    const c = w.charCodeAt(w.length - 1);
    return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  };
  const isHangul = (w) => /[가-힣]$/.test(w);
  // 미리 만들어 둔 이름 음성 — 이름은 글자로 안 보이게 해시(FNV-1a)로만 적음. 이름 칸에 그 이름을 넣으면 자연 음성으로 부름
  const fnv = (s) => {
    let h = 0x811c9dc5;
    for (const ch of s) {
      h ^= ch.codePointAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
  };
  const NAME_VOICES = {
    h5hr4y: {
      v: "https://d8j0ntlcm91z4.cloudfront.net/user_3GrLGEslsPa61Qgpp8m440Yjp4M/hf_20261020_054108_01afc1c3-c29d-4149-bb4c-2b448738c869.mp3",
      n: "https://d8j0ntlcm91z4.cloudfront.net/user_3GrLGEslsPa61Qgpp8m440Yjp4M/hf_20261020_054107_840509a1-6121-4d58-a80b-07aaaed82621.mp3",
    },
  };
  const kid = (KP.kid = {
    name: () => cur.kidName,
    /** 부르는 말: 동훈아 / 근호야 (한글 아니면 이름 그대로) */
    call() {
      const n = cur.kidName;
      if (!n) return "";
      return isHangul(n) ? n + (hasBatchim(n) ? "아" : "야") : n;
    },
    /** 이름(문장 속): 동훈이 / 근호 */
    nick() {
      const n = cur.kidName;
      if (!n) return "";
      return isHangul(n) && hasBatchim(n) ? n + "이" : n;
    },
    /** 지금 이름의 음성 {v, n} — 코드로 넣은 것 또는 미리 만들어 둔 것, 없으면 null */
    voice: () => (cur.kidName ? cur.kidVoice || NAME_VOICES[fnv(cur.kidName)] || null : null),
    /** 이름 음성이 있으면 그 주소 (음성 조각 찾기에서 씀) */
    clip(word) {
      const v = kid.voice();
      if (!v) return null;
      if (word === kid.call()) return v.v;
      if (word === kid.nick() && v.n) return v.n;
      return null;
    },
  });
  /** "{부름} 퍼즐 박사!" → "동훈아, 퍼즐 박사!" / "퍼즐 박사!"
      (이름 음성이 없는 이름은 voice.js 가 이름만 기기 목소리로, 나머지는 자연 음성으로 이어 말함) */
  KP.who = (t) => {
    t = String(t == null ? "" : t);
    if (!t.includes("{부름}")) return t;
    const c = kid.call();
    return t.replace(/\{부름\}\s*/g, c ? c + ", " : "").replace(/\s{2,}/g, " ").trim();
  };
})(window.KP);

;

/* ==== js/core/audio.js ==== */
/* =====================================================================
   소리 엔진 (Web Audio 합성, 음원 파일 없음)
   - 버스 3개: sfx(효과음) / music(배경음악) / voice(목소리 음량 표시용)
   - 컴프레서로 여러 소리가 겹쳐도 찢어지지 않게 함
   - 악기: bell(오르골 종), marimba(마림바), pluck(뜯는 소리), pad(부드러운 화음), bass
   - 동요 멜로디 라이브러리 + 화음 반주 배경음악
===================================================================== */
"use strict";
(function (KP) {
  const A = (KP.audio = {});
  let ctx = null,
    comp = null,
    master = null;
  const bus = {};
  let noiseBuf = null;

  const vol = () => (KP.settings ? KP.settings.get() : { sfx: 0.8, music: 0.35, voice: 1 });

  A.ctx = function () {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 18;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      master = ctx.createGain();
      master.gain.value = 0.95;
      comp.connect(master);
      master.connect(ctx.destination);
      ["sfx", "music"].forEach((b) => {
        bus[b] = ctx.createGain();
        bus[b].connect(comp);
      });
      A.applyVolumes();
    }
    if (ctx.state !== "running") ctx.resume().catch(() => {}); // iOS: suspended / interrupted
    return ctx;
  };
  A.applyVolumes = function () {
    if (!ctx) return;
    const v = vol();
    bus.sfx.gain.value = v.sfx;
    bus.music.gain.value = v.music * (ducked ? 0.35 : 1);
  };
  /** iOS 등에서 첫 터치 때 소리 잠금 해제 */
  A.unlock = function () {
    // iPhone: 무음 스위치가 켜져 있으면 웹 오디오(효과음·자연 음성)가 안 들림 → '재생' 종류로 지정하면 들림 (Safari 16.4+)
    try {
      if (navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback";
    } catch (e) {}
    const c = A.ctx();
    if (!c) return;
    try {
      const b = c.createBuffer(1, 1, 22050),
        s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch (e) {}
  };
  /* 목소리가 나올 때 배경음악을 살짝 줄이기 */
  let ducked = false;
  A.duck = function (on) {
    ducked = on;
    if (!ctx) return;
    const v = vol();
    bus.music.gain.cancelScheduledValues(ctx.currentTime);
    bus.music.gain.setTargetAtTime(v.music * (on ? 0.35 : 1), ctx.currentTime, 0.12);
  };

  /* ---------------- 음 이름 → 주파수 ---------------- */
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  A.hz = function (n) {
    if (typeof n === "number") return n;
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    if (!m) return 440;
    let s = SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    const midi = (+m[3] + 1) * 12 + s;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };
  A.midiOf = function (n) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    return (+m[3] + 1) * 12 + SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  };
  /** 도레미 음계 (C4 ~ E5) */
  A.SCALE = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"];
  A.SOLFA = ["도", "레", "미", "파", "솔", "라", "시", "도", "레", "미", "파", "솔"];

  /* ---------------- 기본 부품 ---------------- */
  /* 효과음은 '화면 묶음'을 거쳐 나간다. 화면을 나가면 묶음을 끊어서
     미리 예약해 둔 노래(생일 노래 등)까지 함께 멈춘다. */
  let scene = null;
  function out(b) {
    if (b === "music") return bus.music;
    if (!scene) {
      scene = ctx.createGain();
      scene.connect(bus.sfx);
    }
    return scene;
  }
  /** 소리를 내보낼 곳 (샘플 재생기 등 바깥 모듈용) — 효과음은 '화면 묶음'이라 화면을 나가면 같이 끊김 */
  A.dest = function (b) {
    return A.ctx() ? out(b) : null;
  };
  A.newScene = function () {
    if (!ctx || !scene) return;
    const old = scene;
    scene = null;
    old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04);
    setTimeout(() => {
      try {
        old.disconnect();
      } catch (e) {}
    }, 400);
  };
  function osc(type, f, t, dur, peak, dest, attack = 0.004, detune = 0) {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
    return { o, g };
  }

  /* ---------------- 악기 ---------------- */
  const INST = {
    bell(f, t, dur, v, d) {
      [
        [1, 1, 1],
        [2.0, 0.42, 0.6],
        [3.0, 0.16, 0.38],
        [4.16, 0.08, 0.22],
      ].forEach(([m, a, dl]) => osc("sine", f * m, t, dur * dl + 0.05, v * a, d));
    },
    marimba(f, t, dur, v, d) {
      osc("sine", f, t, Math.min(dur, 0.7), v, d, 0.003);
      osc("sine", f * 4, t, 0.09, v * 0.22, d, 0.002);
      osc("sine", f * 9.9, t, 0.03, v * 0.06, d, 0.001);
    },
    pluck(f, t, dur, v, d) {
      const o = ctx.createOscillator(),
        g = ctx.createGain(),
        lp = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.value = f;
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(5000, t);
      lp.frequency.exponentialRampToValueAtTime(700, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp);
      lp.connect(g);
      g.connect(d);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    pad(f, t, dur, v, d) {
      const g = ctx.createGain(),
        lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + Math.min(0.25, dur * 0.4));
      g.gain.setValueAtTime(v, t + Math.max(0.05, dur - 0.25));
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
      lp.connect(g);
      g.connect(d);
      [-7, 7].forEach((dt) => {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        o.detune.value = dt;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.4);
      });
    },
    bass(f, t, dur, v, d) {
      osc("sine", f, t, dur, v, d, 0.01);
      osc("triangle", f * 2, t, dur * 0.4, v * 0.15, d, 0.01);
    },
    soft(f, t, dur, v, d) {
      osc("sine", f, t, dur, v, d, 0.04);
    },
    square(f, t, dur, v, d) {
      osc("square", f, t, dur, v * 0.35, d, 0.003);
    },
  };

  /** 음 하나 연주: A.note("C5",{inst:"bell",dur:0.4,vol:0.3,when:0,bus:"sfx"}) */
  A.note = function (n, o = {}) {
    if (!A.ctx()) return;
    const f = A.hz(n);
    const t = ctx.currentTime + (o.when || 0);
    (INST[o.inst || "bell"] || INST.bell)(f, t, o.dur || 0.4, o.vol == null ? 0.3 : o.vol, o.dest || out(o.bus));
  };
  /** 단순 음(주파수 미끄러짐 지원) */
  A.tone = function (f, o = {}) {
    if (!A.ctx()) return;
    const t = ctx.currentTime + (o.when || 0);
    const os = ctx.createOscillator(),
      g = ctx.createGain();
    os.type = o.type || "sine";
    os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + (o.dur || 0.2));
    const v = o.vol == null ? 0.25 : o.vol,
      dur = o.dur || 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    os.connect(g);
    g.connect(o.dest || out(o.bus));
    os.start(t);
    os.stop(t + dur + 0.05);
  };
  /** 잡음(바람·북·물 소리 재료) */
  A.noise = function (o = {}) {
    if (!A.ctx()) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + (o.when || 0),
      dur = o.dur || 0.2;
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    let node = s;
    if (o.hp) {
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = o.hp;
      node.connect(f);
      node = f;
    }
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.lp;
      node.connect(f);
      node = f;
    }
    if (o.bp) {
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = o.q || 1.2;
      f.frequency.setValueAtTime(o.bp, t);
      if (o.bpTo) f.frequency.exponentialRampToValueAtTime(o.bpTo, t + dur);
      node.connect(f);
      node = f;
    }
    const g = ctx.createGain();
    const v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g);
    g.connect(o.dest || out(o.bus));
    s.start(t, Math.random() * 0.4);
    s.stop(t + dur + 0.05);
  };
  A.kick = function (o = {}) {
    if (!A.ctx()) return;
    const t = ctx.currentTime + (o.when || 0);
    const os = ctx.createOscillator(),
      g = ctx.createGain();
    os.frequency.setValueAtTime(150, t);
    os.frequency.exponentialRampToValueAtTime(42, t + 0.28);
    g.gain.setValueAtTime(o.vol || 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    os.connect(g);
    g.connect(out(o.bus));
    os.start(t);
    os.stop(t + 0.4);
  };

  /* ---------------- 효과음 라이브러리 ---------------- */
  const SFX = {
    tap: () => A.note("G5", { inst: "marimba", dur: 0.25, vol: 0.22 }),
    tap2: () => A.note(KP.u.pick(["C5", "D5", "E5", "G5", "A5"]), { inst: "marimba", dur: 0.25, vol: 0.22 }),
    select: () => A.note("E5", { inst: "marimba", dur: 0.2, vol: 0.2 }),
    pop: () => {
      A.tone(900, { to: 320, dur: 0.12, vol: 0.3 });
      A.noise({ dur: 0.06, vol: 0.12, hp: 2500 });
    },
    bubble: () => A.tone(500 + Math.random() * 300, { to: 1400, dur: 0.12, vol: 0.22 }),
    good: () => ["C5", "E5", "G5"].forEach((n, i) => A.note(n, { when: i * 0.07, dur: 0.5, vol: 0.24 })),
    bad: () => {
      A.note("E4", { inst: "soft", dur: 0.18, vol: 0.18 });
      A.note("C4", { inst: "soft", dur: 0.32, vol: 0.16, when: 0.16 });
    },
    whoosh: () => A.noise({ dur: 0.45, vol: 0.18, bp: 400, bpTo: 2600, q: 0.8, attack: 0.08 }),
    sparkle: () => {
      for (let i = 0; i < 5; i++) A.note(A.hz("C6") * Math.pow(2, KP.u.rand(8) / 12), { when: i * 0.05, dur: 0.35, vol: 0.09 });
    },
    boom: () => {
      A.kick({ vol: 0.6 });
      A.noise({ dur: 0.5, vol: 0.14, lp: 1400 });
    },
    snap: () => {
      A.noise({ dur: 0.03, vol: 0.2, hp: 3000 });
      A.note("A5", { inst: "marimba", dur: 0.25, vol: 0.2, when: 0.02 });
    },
    drop: () => A.note("C4", { inst: "pluck", dur: 0.3, vol: 0.25 }),
    pick: () => A.tone(420, { to: 640, dur: 0.08, vol: 0.14 }),
    boing: () => A.tone(220, { to: 660, dur: 0.22, vol: 0.2, type: "triangle" }),
    slide: () => A.tone(880, { to: 330, dur: 0.3, vol: 0.14, type: "triangle" }),
    levelup: () => ["C5", "E5", "G5", "C6", "E6"].forEach((n, i) => A.note(n, { when: i * 0.06, dur: 0.45, vol: 0.2 })),
    sticker: () => {
      ["G5", "C6", "E6", "G6"].forEach((n, i) => A.note(n, { when: i * 0.08, dur: 0.6, vol: 0.18 }));
      A.noise({ dur: 0.5, vol: 0.05, hp: 6000, when: 0.25 });
    },
    open: () => {
      A.note("C5", { inst: "marimba", vol: 0.18, dur: 0.2 });
      A.note("G5", { inst: "marimba", vol: 0.18, dur: 0.25, when: 0.07 });
    },
    back: () => {
      A.note("G5", { inst: "marimba", vol: 0.16, dur: 0.2 });
      A.note("C5", { inst: "marimba", vol: 0.16, dur: 0.25, when: 0.07 });
    },
    water: () => A.noise({ dur: 0.35, vol: 0.12, bp: 900, bpTo: 2200, q: 2 }),
    rub: () => A.noise({ dur: 0.06, vol: 0.05, hp: 1500 }),
    tick: () => A.note("C6", { inst: "marimba", dur: 0.06, vol: 0.12 }),
  };
  A.sfx = function (name) {
    if (!A.ctx()) return;
    try {
      (SFX[name] || SFX.tap)();
    } catch (e) {}
  };

  /* ---------------- 동요 멜로디 (모두 다장조, [음, 박]) ---------------- */
  A.SONGS = {
    twinkle: {
      name: "반짝반짝 작은 별",
      notes: [["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2],
              ["G4",1],["G4",1],["F4",1],["F4",1],["E4",1],["E4",1],["D4",2],["G4",1],["G4",1],["F4",1],["F4",1],["E4",1],["E4",1],["D4",2],
              ["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2]],
    },
    airplane: {
      name: "비행기",
      notes: [["E4",1.5],["D4",0.5],["C4",1],["D4",1],["E4",1],["E4",1],["E4",2],["D4",1],["D4",1],["D4",2],["E4",1],["G4",1],["G4",2],
              ["E4",1.5],["D4",0.5],["C4",1],["D4",1],["E4",1],["E4",1],["E4",2],["D4",1],["D4",1],["E4",1.5],["D4",0.5],["C4",4]],
    },
    butterfly: {
      name: "나비야",
      notes: [["G4",1],["E4",1],["E4",2],["F4",1],["D4",1],["D4",2],["C4",1],["D4",1],["E4",1],["F4",1],["G4",1],["G4",1],["G4",2],
              ["G4",1],["E4",1],["E4",1],["E4",1],["F4",1],["D4",1],["D4",1],["D4",1],["C4",1],["E4",1],["G4",1],["G4",1],["E4",1],["E4",1],["E4",2]],
    },
    schoolbell: {
      name: "학교종",
      notes: [["G4",1],["G4",1],["A4",1],["A4",1],["G4",1],["G4",1],["E4",2],["G4",1],["G4",1],["E4",1],["E4",1],["D4",3],["R",1],
              ["G4",1],["G4",1],["A4",1],["A4",1],["G4",1],["G4",1],["E4",2],["G4",1],["E4",1],["D4",1],["E4",1],["C4",3],["R",1]],
    },
    bears: {
      name: "곰 세 마리",
      notes: [["C4",1],["C4",0.5],["C4",0.5],["C4",1],["C4",1],["E4",1],["G4",0.5],["G4",0.5],["E4",1],["C4",1],
              ["G4",0.5],["G4",0.5],["E4",1],["G4",0.5],["G4",0.5],["E4",1],["C4",1],["C4",1],["C4",2]],
    },
    birthday: {
      name: "생일 축하합니다",
      notes: [["G4",0.75],["G4",0.25],["A4",1],["G4",1],["C5",1],["B4",2],["G4",0.75],["G4",0.25],["A4",1],["G4",1],["D5",1],["C5",2],
              ["G4",0.75],["G4",0.25],["G5",1],["E5",1],["C5",1],["B4",1],["A4",1],["F5",0.75],["F5",0.25],["E5",1],["C5",1],["D5",1],["C5",3]],
    },
  };
  /** 첫 소절만(칭찬 징글용) */
  const JINGLES = [
    [["E4",1],["D4",1],["C4",1],["D4",1],["E4",1],["E4",1],["E4",2]],
    [["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2]],
    [["G4",1],["G4",1],["A4",1],["A4",1],["G4",1],["G4",1],["E4",2]],
    [["G4",1],["E4",1],["E4",2],["F4",1],["D4",1],["D4",2]],
    [["C4",1],["E4",1],["G4",1],["C5",1],["G4",1],["C5",3]],
    [["C5",1],["G4",1],["E4",1],["G4",1],["C5",1],["E5",3]],
  ];

  /** 멜로디 연주. 반환값: 재생 길이(초). octave: 옥타브 올림 수 */
  A.melody = function (notes, o = {}) {
    if (!A.ctx()) return 0;
    const beat = o.beat || 0.2,
      up = o.octave || 0;
    let t = o.when || 0;
    notes.forEach(([n, b]) => {
      if (n !== "R") {
        const f = A.hz(n) * Math.pow(2, up);
        A.note(f, { inst: o.inst || "bell", dur: Math.max(0.25, b * beat * 1.6), vol: o.vol || 0.22, when: t, bus: o.bus, dest: o.dest });
      }
      t += b * beat;
    });
    return t;
  };
  /** 성공 징글 (동요 첫 소절, 한 옥타브 위 오르골) */
  A.jingle = function () {
    const len = A.melody(KP.u.pick(JINGLES), { beat: 0.14, octave: 1, vol: 0.2 });
    A.sfx("sparkle");
    return len;
  };

  /* ---------------- 배경음악 (멜로디 + 화음 + 베이스) ---------------- */
  const CHORDS = { C: [0, 4, 7], F: [5, 9, 0], G: [7, 11, 2], Am: [9, 0, 4] };
  const ROOT = { C: "C3", F: "F2", G: "G2", Am: "A2" };
  function chordFor(notes) {
    // 두 박 구간의 음들을 가장 많이 품는 화음 고르기
    const pcs = notes.filter((n) => n !== "R").map((n) => A.midiOf(n) % 12);
    let best = "C",
      bs = -1;
    for (const [k, set] of Object.entries(CHORDS)) {
      let s = 0;
      pcs.forEach((p, i) => {
        if (set.includes(p)) s += i === 0 ? 2 : 1;
      });
      if (k === "C") s += 0.3;
      if (s > bs) {
        bs = s;
        best = k;
      }
    }
    return best;
  }
  const bgm = (A.bgm = { on: false, gain: null, timer: null, order: [], idx: 0 });
  function scheduleSong(key, startAt) {
    const song = A.SONGS[key].notes;
    const beat = 0.46;
    const dest = bgm.gain;
    // 멜로디(오르골)
    let t = 0;
    song.forEach(([n, b]) => {
      if (n !== "R")
        A.note(A.hz(n) * 2, { inst: "bell", dur: Math.max(0.35, b * beat * 1.5), vol: 0.13, when: startAt + t, dest });
      t += b * beat;
    });
    const total = t;
    // 2박 단위 화음 + 베이스
    let bt = 0;
    const timeline = [];
    song.forEach(([n, b]) => {
      timeline.push({ n, s: bt, e: bt + b });
      bt += b;
    });
    const c4 = A.hz("C4");
    for (let w = 0; w < bt; w += 2) {
      const inWin = timeline.filter((x) => x.s < w + 2 && x.e > w).map((x) => x.n);
      const ch = chordFor(inWin.length ? inWin : ["C4"]);
      const when = startAt + w * beat;
      CHORDS[ch].forEach((pc) => A.note(c4 * Math.pow(2, pc / 12), { inst: "pad", dur: beat * 2 - 0.05, vol: 0.035, when, dest }));
      A.note(ROOT[ch], { inst: "bass", dur: beat * 1.6, vol: 0.12, when, dest });
    }
    return total;
  }
  bgm.start = function () {
    if (!A.ctx() || bgm.on) return;
    bgm.on = true;
    bgm.gain = ctx.createGain();
    bgm.gain.gain.value = 1;
    bgm.gain.connect(bus.music);
    const next = () => {
      if (!bgm.on) return;
      if (!bgm.order.length || bgm.idx >= bgm.order.length) {
        bgm.order = KP.u.shuffle(["twinkle", "airplane", "butterfly", "schoolbell", "bears"]);
        bgm.idx = 0;
      }
      const len = scheduleSong(bgm.order[bgm.idx++], 0.15);
      bgm.timer = setTimeout(next, (len + 1.6) * 1000);
    };
    next();
  };
  bgm.stop = function () {
    bgm.on = false;
    clearTimeout(bgm.timer);
    if (bgm.gain && ctx) {
      const g = bgm.gain;
      g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      setTimeout(() => {
        try {
          g.disconnect();
        } catch (e) {}
      }, 900);
    }
    bgm.gain = null;
  };
})(window.KP);

;

/* ==== js/core/voice.js ==== */
/* =====================================================================
   목소리 안내 (기기 내장 음성 합성)
   - 기기에 있는 한국어 음성 중 가장 자연스러운 것을 자동 선택
     (iPad: Yuna/Sora 계열, Android: Google 한국어)
   - 말하는 동안 배경음악 자동으로 줄이기
   - 녹음 파일 연결용 자리(KP.voice.clips): 문장 → 오디오 파일 경로
===================================================================== */
"use strict";
(function (KP) {
  const V = (KP.voice = { clips: {} });
  const has = typeof window !== "undefined" && "speechSynthesis" in window;
  let voices = [],
    ko = null,
    en = null,
    current = null,
    clipAudio = null;

  function score(v, lang) {
    if (!v.lang || !v.lang.toLowerCase().startsWith(lang)) return -1;
    let s = 0;
    const n = v.name || "";
    if (/premium|enhanced|고품질|향상/i.test(n)) s += 6;
    if (/yuna|sora|유나|소라/i.test(n)) s += 5;
    if (/google/i.test(n)) s += 4;
    if (/samantha|ava|allison|susan/i.test(n)) s += 4;
    if (/heami|sunhi|injoon/i.test(n)) s += 2;
    if (/female|여/i.test(n)) s += 1;
    if (v.localService) s += 1;
    if (/compact|eloquence|grandma|grandpa|rocko|shelley|flo|reed|sandy|eddy/i.test(n)) s -= 4;
    return s;
  }
  function load() {
    if (!has) return;
    voices = speechSynthesis.getVoices() || [];
    const best = (lang) => voices.reduce((b, v) => (score(v, lang) > (b ? score(b, lang) : -1) ? v : b), null);
    ko = best("ko");
    en = best("en");
  }
  if (has) {
    load();
    try {
      speechSynthesis.addEventListener("voiceschanged", load);
    } catch (e) {
      speechSynthesis.onvoiceschanged = load;
    }
  }
  V.available = () => has;
  V.koName = () => (ko ? ko.name : "");

  function volume() {
    return KP.settings ? KP.settings.get().voice : 1;
  }
  function done(fn) {
    KP.audio && KP.audio.duck(false);
    if (fn) fn();
  }

  /**
   * 말하기
   * @param {string} text
   * @param {{en?:boolean, queue?:boolean, rate?:number, pitch?:number, onend?:Function}} o
   */
  /* 놀이 카드를 누르면 이름을 읽는데, 곧바로 열리는 놀이 화면이 그 소리를 끊지 않게:
     이름을 다 읽을 때까지(최대 3초) 다른 말은 이름 뒤로 미루고, 멈춤 요청도 무시 */
  let holdP = null,
    holdUntil = 0;
  V.hold = function (text) {
    holdUntil = performance.now() + 3000;
    const p = (holdP = sayNow(text, {}));
    p.then(() => {
      if (holdP === p) {
        holdP = null;
        holdUntil = 0;
      }
    });
    return p;
  };
  const holding = () => holdP && performance.now() < holdUntil;
  V.say = function (text, o = {}) {
    if (KP.who) text = KP.who(text); // "{부름}" → "동훈아," (아이 이름)
    if (holding() && !o.queue) {
      const p = holdP;
      return p.then(() => sayNow(text, o));
    }
    return sayNow(text, o);
  };
  function sayNow(text, o = {}) {
    // 말이 끝나면 resolve 되는 Promise (음성이 없어도 글자 수로 대략 기다림)
    return new Promise((resolve) => {
      let fin = false;
      const est = setTimeout(() => {
        if (!fin) {
          fin = true;
          KP.audio && KP.audio.duck(false); // onend 가 안 오는 기기 대비
          resolve();
        }
      }, 900 + String(text || "").length * 170);
      sayRaw(text, Object.assign({}, o, {
        onend() {
          clearTimeout(est);
          if (!fin) {
            fin = true;
            resolve();
          }
          if (o.onend) o.onend();
        },
      }));
    });
  }
  function sayRaw(text, o) {
    if (!text) return o.onend && o.onend();
    const vol = volume();
    // 녹음 파일이 등록되어 있으면 녹음 우선
    const clip = V.clips[text];
    if (clip && vol > 0) {
      try {
        if (clipAudio) clipAudio.pause();
        if (has) speechSynthesis.cancel();
        clipAudio = new Audio(clip);
        clipAudio.volume = vol;
        KP.audio && KP.audio.duck(true);
        clipAudio.onended = () => done(o.onend);
        clipAudio.play().catch(() => done(o.onend));
        return;
      } catch (e) {}
    }
    if (vol <= 0) {
      if (o.onend) setTimeout(o.onend, 300);
      return;
    }
    // 새 말이 시작되면 이전 말(자연 음성·녹음·받는 중인 것)을 먼저 멈춤 → 두 목소리가 겹치지 않게
    if (!o.queue) {
      stopNatural();
      try {
        if (clipAudio) clipAudio.pause();
      } catch (e) {}
    } else if (natSrcs.length && KP.audio.ctx()) {
      // 이어 말하기인데 자연 음성이 아직 나오는 중이면 끝난 뒤에
      const wait = Math.max(0, (natEnd - KP.audio.ctx().currentTime) * 1000);
      if (wait > 30 && !(natOn() && natUrls(text))) return void setTimeout(() => speakTTS(text, o, vol), wait + 60);
    }
    // 아이 이름 음성이 없는 이름: 이름만 기기 목소리, 앞뒤는 자연 음성 ([근호야] + [퍼즐 박사!])
    if (natOn() && KP.kid && !natUrls(text)) {
      const c = KP.kid.call();
      const i = c && !KP.kid.clip(c) ? text.indexOf(c) : -1;
      if (i >= 0) {
        const before = text.slice(0, i).trim(),
          after = text.slice(i + c.length).replace(/^[,~!\s]+/, "").trim();
        const ub = before ? natUrls(before) : [],
          ua = after ? natUrls(after) : [];
        if (ub && ua) return sayMixed([[before, ub], [c, null], [after, ua]].filter((p) => p[0]), o, vol);
      }
    }
    // 자연 음성(미리 만든 음성 파일): 문장의 모든 조각이 있으면 그걸로
    if (natOn()) {
      // 영어 낱말도 미리 만든 음성이 있으면 그것으로 ("A! Apple!")
      const urls = natUrls(text);
      if (urls) return playNatural(text, urls, o, vol);
    }
    speakTTS(text, o, vol);
  }
  // 조각을 차례로: 자연 음성 조각은 playNatural, 이름(null)은 기기 목소리. 그사이 다른 말이 시작되면 멈춤
  function sayMixed(parts, o, vol) {
    const tok = mixTok;
    const step = (k) => {
      if (tok !== mixTok) return;
      if (k >= parts.length) return o.onend && o.onend();
      const [t, urls] = parts[k];
      const next = Object.assign({}, o, { queue: k > 0 || o.queue, onend: () => step(k + 1) });
      if (urls) playNatural(t, urls, next, vol);
      else speakTTS(t, next, vol);
    };
    step(0);
  }
  function speakTTS(text, o, vol) {
    V.lastVia = "tts";
    if (!has) {
      if (o.onend) setTimeout(o.onend, 300);
      return;
    }
    try {
      if (!voices.length) load();
      const busy = speechSynthesis.speaking || speechSynthesis.pending;
      if (!o.queue && busy) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = o.en ? en : ko;
      if (v) u.voice = v;
      u.lang = o.en ? "en-US" : "ko-KR";
      u.rate = o.rate || (o.en ? 0.85 : 0.95);
      u.pitch = o.pitch || 1.12;
      u.volume = vol;
      u.onstart = () => KP.audio && KP.audio.duck(true);
      u.onend = () => {
        if (current === u) current = null;
        done(o.onend);
      };
      u.onerror = () => done(o.onend);
      current = u;
      // iOS Safari: cancel() 직후 바로 speak() 하면 가끔 무시되므로 살짝 띄움
      if (!o.queue && busy) setTimeout(() => current === u && speechSynthesis.speak(u), 60);
      else speechSynthesis.speak(u);
      if (speechSynthesis.paused) speechSynthesis.resume();
    } catch (e) {
      if (o.onend) setTimeout(o.onend, 300);
    }
  }
  V.en = (text, o = {}) => V.say(text, Object.assign({ en: true }, o));

  /* ---------------- 자연 음성 (미리 만든 음성 파일) ----------------
     - KP.VOICE_CLIPS: 문장 조각 → 음성 파일 주소 (js/gen/clips.js, 빌드 때 생성)
     - 문장을 '!', '?', '.' 뒤에서 조각으로 나눠, 모든 조각에 파일이 있으면 이어서 재생.
       하나라도 없으면 기계 음성(한 목소리로 끝까지 — 섞이면 어색해서)
     - 처음 받을 때 기기 저장소(Cache)에 넣어 두어 그 뒤로는 인터넷 없이도 재생
     - 아직 안 받아진 파일이 늦게 오면(1.2초) 이번엔 기계 음성으로 말하고, 받는 건 계속 */
  // 저장소 이름은 빌드가 정함(js/gen/clips.js 의 KP.VOICE_CACHE, sw.js 와 같은 이름) — clips.js 가 이 파일 뒤에 불려서 쓸 때 읽음
  const VCACHE = () => KP.VOICE_CACHE;
  const natOn = () => !KP.settings || KP.settings.get().natural !== false;
  const norm = (t) => String(t || "").replace(/\p{Extended_Pictographic}|\uFE0F/gu, "").replace(/\s+/g, " ").trim();
  function segs(t) {
    const out = [];
    let cur = "";
    for (let i = 0; i < t.length; i++) {
      cur += t[i];
      if ("!?.".includes(t[i]) && (i + 1 >= t.length || t[i + 1] === " ")) {
        if (cur.trim()) out.push(cur.trim());
        cur = "";
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  /* 문장 → 음성 파일 목록. 각 문장 조각(! ? . 로 끊은 것)마다
       ① 통째로 있으면 그것 ② 끝 문장부호만 다른 것("오리!" ↔ "오리")
       ③ 낱말 단위로 나눠 가장 적은 조각으로 이어 붙이기("토끼를" + "상자 안에 쏙 넣어 줘!")
     하나라도 못 찾으면 null(→ 기기 목소리로 문장 전체). 조각 사이 쉼: 문장 사이 0.08초, 낱말 사이 0.02초 */
  const bare = (t) => t.replace(/[!?.…~,\s]+$/u, "");
  let bareMap = null,
    bareFor = null;
  function lookup(k) {
    const M = KP.VOICE_CLIPS;
    if (M[k]) return M[k];
    // 아이 이름 음성(부모가 넣은 것): "동훈아," "동훈이" 처럼 끝 문장부호만 다른 것도
    const kc = KP.kid && KP.kid.clip(bare(k));
    if (kc) return kc;
    // 숫자만 있으면 한자어 읽기로 ("3" → "삼")
    const dm = /^(\d{1,3})([!?.]?)$/.exec(k);
    if (dm && KP.u && KP.u.numSino && +dm[1] > 0 && +dm[1] <= 100) return lookup(KP.u.numSino(+dm[1]) + "!");
    if (bareFor !== M) {
      bareFor = M;
      bareMap = new Map();
      for (const key in M) {
        const b = bare(key);
        if (b && !bareMap.has(b)) bareMap.set(b, M[key]);
      }
    }
    return bareMap.get(bare(k)) || null;
  }
  function splitWords(seg) {
    const w = seg.split(" ");
    const n = w.length;
    // best[i] = w[i..] 를 덮는 가장 적은 조각 목록
    const best = new Array(n + 1);
    best[n] = [];
    for (let i = n - 1; i >= 0; i--) {
      for (let j = n; j > i; j--) {
        if (!best[j]) continue;
        const u = lookup(w.slice(i, j).join(" "));
        if (u && (!best[i] || best[j].length + 1 < best[i].length)) best[i] = [u].concat(best[j]);
      }
    }
    return best[0] || null;
  }
  function natUrls(text) {
    const M = KP.VOICE_CLIPS;
    if (!M) return null;
    const ss = segs(norm(text));
    if (!ss.length) return null;
    const out = [],
      gaps = [];
    for (let k = 0; k < ss.length; k++) {
      const one = lookup(ss[k]);
      const parts = one ? [one] : splitWords(ss[k]);
      if (!parts) return null;
      parts.forEach((u, i) => {
        out.push(u);
        gaps.push(i < parts.length - 1 ? 0.02 : 0.08);
      });
    }
    out.gaps = gaps;
    return out;
  }
  V._natUrls = natUrls; // 점검용
  V._cacheSizes = () => ({ bufs: bufs.size, loading: loading.size }); // 점검용: 풀어 둔 소리·받는 중 개수
  /** 앞뒤 빈 소리 잘라내기(조각을 이어 붙일 때 덜 끊기게) — 앞뒤 0.03초만 남김 */
  function trim(c, b) {
    try {
      const d = b.getChannelData(0),
        th = 0.012,
        pad = Math.round(b.sampleRate * 0.03);
      let a = 0,
        z = d.length - 1;
      while (a < d.length && Math.abs(d[a]) < th) a++;
      while (z > a && Math.abs(d[z]) < th) z--;
      a = Math.max(0, a - pad);
      z = Math.min(d.length - 1, z + pad);
      if (z - a < b.sampleRate * 0.05 || (a < pad * 2 && d.length - 1 - z < pad * 2)) return b;
      const nb = c.createBuffer(b.numberOfChannels, z - a + 1, b.sampleRate);
      for (let ch = 0; ch < b.numberOfChannels; ch++) nb.getChannelData(ch).set(b.getChannelData(ch).subarray(a, z + 1));
      return nb;
    } catch (e) {
      return b;
    }
  }
  const bufs = new Map(),
    loading = new Map(),
    nocors = new Set(); // 내려받기(CORS)가 막힌 주소 → 소리만 바로 재생(인터넷 필요)
  const failed = new Set();
  // 기기 저장소에 이미 받아 둔 주소 (있으면 인터넷 없이 금방 풀 수 있음 → 기기 목소리로 바꾸지 않고 기다림)
  const stored = new Set();
  let storedReady = null;
  function loadStored() {
    if (!storedReady)
      storedReady = (async () => {
        try {
          const c = await caches.open(VCACHE());
          (await c.keys()).forEach((r) => stored.add(r.url));
        } catch (e) {}
      })();
    return storedReady;
  }
  V.loadStored = loadStored;
  V.natStats = { ok: 0, fail: 0 };
  V.lastVia = ""; // 방금 말한 방식: natural(자연 음성) · el(자연 음성, 저장 안 됨) · tts(기기 음성)
  function loadBuf(url) {
    if (bufs.has(url)) return Promise.resolve(bufs.get(url));
    if (loading.has(url)) return loading.get(url);
    const c = KP.audio && KP.audio.ctx();
    if (!c) return Promise.reject(new Error("no audio"));
    const p = (async () => {
      let resp = null,
        cache = null;
      try {
        cache = await caches.open(VCACHE());
        resp = await cache.match(url);
      } catch (e) {}
      if (!resp) {
        const r = await fetch(url, { mode: "cors", credentials: "omit" });
        if (!r.ok) throw new Error("http " + r.status);
        if (cache) {
          try {
            await cache.put(url, r.clone());
            stored.add(url);
          } catch (e) {}
        }
        resp = r;
      }
      const ab = await resp.arrayBuffer();
      // 옛 Safari 는 콜백만, 요즘 브라우저는 Promise 도 돌려줌 → 둘 다 받아 처리(실패가 밖으로 새지 않게)
      const b = trim(
        c,
        await new Promise((res, rej) => {
          const pr = c.decodeAudioData(ab, res, rej);
          if (pr && pr.catch) pr.catch(rej);
        })
      );
      bufs.set(url, b);
      // 풀어 둔 소리는 최근 60개만 (수천 개를 다 풀면 메모리를 수백 MB 차지)
      if (bufs.size > 60) bufs.delete(bufs.keys().next().value);
      failed.delete(url);
      V.natStats.ok = bufs.size;
      return b;
    })();
    loading.set(url, p);
    p.then(() => loading.delete(url), () => {}); // 다 받은 것도 지움 (안 지우면 bufs 60개 제한을 넘어 소리가 계속 메모리에 남음)
    p.catch((e) => {
      loading.delete(url);
      failed.add(url);
      V.natStats.fail = failed.size;
      if (e && /fetch|network|cors|load failed/i.test(String(e.message || e)) && navigator.onLine !== false) nocors.add(url);
    });
    return p;
  }
  // iOS: 오디오 요소는 터치 안에서 한 번 재생해 둔 것만 나중에 자유롭게 재생 가능 → 하나를 미리 깨워 둠
  // 재생이 실제로 성공했을 때만 깨운 것으로 침 → 실패하면 다음 터치에서 다시 시도
  let el = null,
    elTrying = false;
  V.unlockEl = function () {
    if (el || elTrying) return;
    try {
      const a = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=");
      elTrying = true;
      Promise.resolve(a.play())
        .then(() => {
          a.pause();
          el = a;
        })
        .catch(() => {})
        .finally(() => (elTrying = false));
    } catch (e) {
      elTrying = false;
    }
  };
  function playEl(text, urls, o, vol, tok) {
    if (!el) return speakTTS(text, o, vol);
    let i = 0;
    V.lastVia = "el";
    KP.audio.duck(true);
    const next = () => {
      if (tok !== natTok) return;
      if (i >= urls.length) return done(o.onend);
      el.src = urls[i++];
      el.volume = Math.min(1, vol);
      el.onended = () => setTimeout(next, 80);
      el.onerror = () => tok === natTok && speakTTS(text, o, vol);
      el.play().catch(() => tok === natTok && speakTTS(text, o, vol));
    };
    next();
  }
  let mixTok = 0;
  let natTok = 0,
    natSrcs = [],
    natEnd = 0;
  function playNatural(text, urls, o, vol) {
    const c = KP.audio.ctx();
    if (!c) return speakTTS(text, o, vol);
    const tok = ++natTok;
    if (!o.queue) stopNatural(true);
    if (urls.some((u) => nocors.has(u)) && navigator.onLine !== false) {
      try {
        if (has) speechSynthesis.cancel();
      } catch (e) {}
      return playEl(text, urls, o, vol, tok);
    }
    const ready = urls.every((u) => bufs.has(u));
    const onDisk = urls.every((u) => bufs.has(u) || stored.has(u));
    const all = Promise.all(urls.map(loadBuf));
    // 기기에 저장된 파일이면 풀 때까지 기다림(최대 4초), 인터넷에서 받아야 하면 1.2초 넘으면 이번만 기기 목소리
    const late = new Promise((res) => setTimeout(() => res("late"), ready ? 0 : onDisk ? 4000 : 1200));
    Promise.race([all, late])
      .then((list) => {
        if (tok !== natTok) return;
        if (list === "late") return speakTTS(text, o, vol); // 이번엔 기계 음성, 파일은 계속 받는 중
        if (o.queue && has && (speechSynthesis.speaking || speechSynthesis.pending) && !(o._w > 80)) {
          // 이어 말하기: 기기 목소리가 끝날 때까지 기다렸다가(최대 8초) — 끊지도 겹치지도 않게
          o._w = (o._w || 0) + 1;
          return setTimeout(() => tok === natTok && playNatural(text, urls, o, vol), 100);
        }
        try {
          if (has) speechSynthesis.cancel();
        } catch (e) {}
        V.lastVia = "natural";
        KP.audio.duck(true);
        const g = c.createGain();
        g.gain.value = Math.min(1, vol * 1.1);
        g.connect(c.destination);
        let t = Math.max(c.currentTime + 0.03, o.queue ? natEnd : 0);
        const mine = [];
        list.forEach((b, i) => {
          const src = c.createBufferSource();
          src.buffer = b;
          src.connect(g);
          src.start(t);
          t += b.duration + (i < list.length - 1 ? (urls.gaps ? urls.gaps[i] : 0.08) : 0);
          mine.push(src);
          natSrcs.push(src);
        });
        mine[mine.length - 1].onended = () => {
          natSrcs = natSrcs.filter((x) => !mine.includes(x));
          if (!natSrcs.length) done(o.onend);
          else if (o.onend) o.onend();
        };
        natEnd = t;
      })
      .catch(() => {
        if (tok === natTok) speakTTS(text, o, vol);
      });
  }
  function stopNatural(keepTok) {
    if (!keepTok) {
      natTok++;
      mixTok++; // 이름 섞어 말하기도 멈춤
    }
    try {
      if (el && !el.paused) el.pause();
    } catch (e) {}
    natSrcs.forEach((s) => {
      try {
        s.onended = null;
        s.stop();
      } catch (e) {}
    });
    natSrcs = [];
    natEnd = 0;
  }
  /** 자연 음성 파일을 미리 받아 두기 (첫 터치 뒤 한가할 때) */
  /** 파일만 기기 저장소에 받아 두기(풀지는 않음) — 4개씩 동시에 */
  async function store(url, cache) {
    if (stored.has(url)) return true;
    if (cache && (await cache.match(url))) return (stored.add(url), true);
    const r = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!r.ok) throw new Error("http " + r.status);
    if (cache) {
      await cache.put(url, r);
      stored.add(url);
    }
    return true;
  }
  /** 지금 목록(VOICE_CLIPS)에 없는 옛 음성 파일을 저장소에서 지움 */
  async function prune(cache) {
    try {
      const keep = new Set(Object.values(KP.VOICE_CLIPS || {}));
      if (!keep.size) return; // 목록이 비었으면(빌드 이상) 지우지 않음
      const kv = KP.kid && KP.kid.voice(); // 아이 이름 음성은 목록에 없어도 남김
      if (kv) [kv.v, kv.n].forEach((u) => u && keep.add(u));
      for (const r of await cache.keys())
        if (!keep.has(r.url)) {
          await cache.delete(r);
          stored.delete(r.url);
        }
    } catch (e) {}
  }
  // 데이터 절약 모드·휴대폰 데이터(셀룰러)면 자동으로 전부 받지 않음 (설정 화면 버튼은 그대로 받음)
  const metered = () => {
    const c = navigator.connection;
    return !!(c && (c.saveData || c.type === "cellular"));
  };
  let prefetching = null;
  /** @param {Function} [onProg] 진행 표시(설정 화면) — 주면 직접 누른 것으로 보고 force
   *  @param {{force?:boolean}} [o] force: 셀룰러·데이터 절약이어도 받기 */
  V.prefetch = function (onProg, o = {}) {
    const force = !!(onProg || o.force);
    if (prefetching && !onProg) return prefetching;
    const run = async () => {
      await loadStored();
      // 아이 이름 음성("OO아~"·"OO이")은 공용 목록에 없으므로 맨 앞에 넣어 함께 받아 둠 (안 받으면 오프라인에서 이름만 기기 목소리)
      const nv = KP.kid && KP.kid.voice ? KP.kid.voice() : null;
      const L = [...(nv ? [nv.v, nv.n].filter(Boolean) : []), ...Object.values(KP.VOICE_CLIPS || {})];
      let cache = null;
      try {
        cache = await caches.open(VCACHE());
      } catch (e) {}
      if (!cache) return V.natStats;
      if (!force && metered()) {
        await prune(cache);
        return V.natStats;
      }
      let i = 0,
        done = 0,
        corsFail = 0;
      const worker = async () => {
        while (i < L.length) {
          const u = L[i++];
          try {
            await store(u, cache);
            failed.delete(u);
          } catch (e) {
            failed.add(u);
            if (/fetch|network|cors|load failed/i.test(String(e.message || e)) && navigator.onLine !== false) {
              nocors.add(u);
              corsFail++;
            }
          }
          done++;
          if (onProg) onProg(done, L.length);
          // 처음 몇 개가 모두 막히면(서버가 저장을 막음) 더 받지 않음
          if (done === 8 && corsFail === 8) i = L.length;
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      await prune(cache);
      V.natStats.fail = failed.size;
      return V.natStats;
    };
    const p = run().finally(() => prefetching === p && (prefetching = null));
    prefetching = p;
    return p;
  };
  /** 상태 보고: 전체 · 기기 저장소에 있는 것 · 못 받은 것 · 저장은 막혔지만 바로 재생 가능한 것 */
  V.natReport = async function () {
    const L = Object.values(KP.VOICE_CLIPS || {});
    let stored = 0;
    try {
      const c = await caches.open(VCACHE());
      const keys = new Set((await c.keys()).map((r) => r.url));
      stored = L.filter((u) => keys.has(u)).length;
    } catch (e) {}
    return { total: L.length, stored, ready: bufs.size, failed: failed.size, nocors: nocors.size, online: navigator.onLine !== false };
  };
  V.natCount = () => Object.keys(KP.VOICE_CLIPS || {}).length;
  /** 지금 말하는 중인지 (마이크 놀이에서 앱 목소리를 아이 소리로 잘못 듣지 않게) */
  V.busy = function () {
    try {
      if (has && (speechSynthesis.speaking || speechSynthesis.pending)) return true;
    } catch (e) {}
    if (natSrcs.length) return true;
    if (el && !el.paused && !el.ended) return true;
    if (clipAudio && !clipAudio.paused && !clipAudio.ended) return true;
    return false;
  };

  V.stop = function () {
    if (holding()) return; // 놀이 이름을 읽는 중
    stopNatural();
    try {
      if (has) speechSynthesis.cancel();
      if (clipAudio) clipAudio.pause();
    } catch (e) {}
    KP.audio && KP.audio.duck(false);
  };
})(window.KP);

;

/* ==== js/core/ui.js ==== */
/* =====================================================================
   화면 틀 · 게임 등록 · 게임 컨텍스트(ctx)

   게임 등록:
   KP.game({
     id:"count", icon:"🔢", name:"숫자 세기", cat:"smart",
     levels: 3,            // (선택) 자동 난이도 단계 수
     score: "⭐",          // (선택) 상단 점수 표시 아이콘
     bubble: true,         // (선택, 기본 true) 안내 말풍선 표시
     setup(ctx){},         // 처음 열 때 한 번: 화면 요소 만들기
     start(ctx){},         // 열 때마다: 새 판 시작
     stop(ctx){},          // 나갈 때: (타이머 등은 자동 정리됨)
   })

   ctx 주요 기능 — docs/GAME_API.md 참고
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;
  const GAMES = (KP.GAMES = {});
  const ORDER = (KP.ORDER = []);

  KP.CATS = [
    // color: 놀이 안 강조색, soft: 홈 카드·제목 스티커의 파스텔색
    { id: "play", short: "신나는", name: "신나는 놀이", icon: "🎈", color: "#2f95f5", soft: "#ffb4a2" },
    { id: "make", short: "만들기", name: "만들기", icon: "🎨", color: "#ff7452", soft: "#ffe08a" },
    { id: "music", short: "음악", name: "음악", icon: "🎵", color: "#8a63ee", soft: "#d6c4ff" },
    { id: "smart", short: "똑똑", name: "똑똑 놀이", icon: "🧠", color: "#2fb466", soft: "#a8e8c2" },
    { id: "study", short: "공부", name: "공부 놀이", icon: "📚", color: "#ff5d8f", soft: "#ffc6da" },
    // 이름을 넣으면 "동훈이 도전", 없으면 "도전 놀이"
    { id: "bigkid", short: "도전", get name() { return KP.kid && KP.kid.nick() ? KP.kid.nick() + " 도전" : "도전 놀이"; }, icon: "🦸", color: "#f29a00", soft: "#a9d0ff" },
  ];
  KP.SOFT_DEFAULT = "#c9e4ff";
  KP.MASCOT = "🐻";

  KP.game = function (def) {
    if (GAMES[def.id]) console.warn("duplicate game id", def.id);
    GAMES[def.id] = Object.assign({ bubble: true, levels: 1 }, def);
    ORDER.push(def.id);
  };

  /* ---------------- 자동 난이도 ---------------- */
  KP.level = {
    get(id) {
      const d = { lvl: 1, streak: 0, miss: 0, wins: 0, best: 0, plays: 0 };
      const v = KP.store.get("lv:" + id, d);
      if (!v || typeof v !== "object") return d;
      const o = Object.assign({}, d, v);
      for (const k in d) if (!Number.isFinite(o[k])) o[k] = d[k];
      o.lvl = Math.max(1, Math.round(o.lvl));
      return o;
    },
    save(id, v) {
      KP.store.set("lv:" + id, v);
    },
  };

  /* ---------------- 화면 전환 ---------------- */
  let current = null; // 현재 ctx (홈이면 null)
  const screens = {};
  KP.current = () => current;

  KP.open = function (id) {
    const def = GAMES[id];
    if (!def) return;
    if (current) leave();
    KP.voice.stop();
    let ctx = screens[id];
    let setupErr = null;
    if (!ctx) {
      ctx = screens[id] = makeCtx(def);
      try {
        def.setup && def.setup(ctx);
      } catch (e) {
        setupErr = e;
      }
    }
    U.$$(".screen.on").forEach((s) => s.classList.remove("on"));
    ctx.root.classList.add("on");
    U.replay(ctx.root, "enter");
    current = ctx;
    ctx._active = true;
    ctx._session = (ctx._session || 0) + 1; // 나갔다 다시 들어오면 이전 판의 후속 동작 무효
    ctx._idleAt = Date.now();
    ctx._missed = false;
    ctx._softMiss = 0;
    ctx._hinted = false;
    ctx._resetFew();
    if (setupErr) return failed(ctx, setupErr); // 준비가 깨졌으면 놀이 횟수·단계 처리 전에 멈춤
    KP.earn && setTimeout(() => KP.earn.render(), 0);
    const lv = KP.level.get(id);
    lv.plays++;
    KP.level.save(id, lv);
    ctx._updateLevel();
    if (def.score) ctx.score.set(0);
    try {
      const r = def.start && def.start(ctx);
      // start 가 async 면 기다리는 중에 난 오류도 잡음 (나갔다 다시 들어온 뒤 옛 실행의 오류는 무시)
      const sess = ctx._session;
      if (r && typeof r.catch === "function") r.catch((e) => (ctx._session === sess ? failed(ctx, e) : console.error(e)));
    } catch (e) {
      return failed(ctx, e); // 실패한 놀이를 '방금 한 놀이'로 저장하지 않음
    }
    KP.store.set("lastGame", id);
  };
  /** 놀이를 여는 중 문제가 생기면: 깨진 화면 대신 '다시 하기 / 홈으로' (다시 하기는 화면을 처음부터 새로 만듦) */
  function failed(ctx, e) {
    console.error(e);
    KP.reportError && KP.reportError(ctx.id, e);
    if (!ctx._active || U.$(".gameFail", ctx.root)) return;
    const box = U.el("div", "gameFail", '<div class="gfEm">' + KP.E("🙈") + '</div><div class="gfTxt">앗, 놀이를 여는 중에 문제가 생겼어요</div>');
    const row = U.el("div", "gfBtns");
    const bRetry = U.btn(KP.E("🔄") + " 다시 하기", "btn big primary");
    const bHome = U.btn(KP.E("🏠") + " 홈으로", "btn big");
    // 문제가 생긴 화면은 버리고 다음에 열 때 처음부터 새로 만듦
    const drop = () => {
      if (screens[ctx.id] === ctx) delete screens[ctx.id];
      ctx.root.remove();
    };
    bRetry.addEventListener("click", () => {
      leave();
      drop();
      KP.open(ctx.id);
    });
    bHome.addEventListener("click", () => {
      KP.home();
      drop();
    });
    row.append(bRetry, bHome);
    box.appendChild(row);
    ctx.root.appendChild(box);
    KP.voice.say("다시 해 볼까요?");
  }
  function leave() {
    const ctx = current;
    if (!ctx) return;
    ctx._active = false;
    ctx._clearTimers();
    KP.cancelCelebrate && KP.cancelCelebrate();
    KP.audio.newScene();
    ctx.hint(null);
    try {
      ctx.def.stop && ctx.def.stop(ctx);
    } catch (e) {
      console.error(e);
    }
    if (ctx.def.score) {
      const lv = KP.level.get(ctx.id);
      if (ctx.score.get() > (lv.best || 0)) {
        lv.best = ctx.score.get();
        KP.level.save(ctx.id, lv);
      }
    }
    current = null;
    // '마지막 판'을 기다리던 중 놀이에서 나가면 바로 마무리 (다른 놀이에서 엉뚱하게 터지지 않게)
    if (KP.lastRoundWaiting && KP.lastRoundWaiting()) setTimeout(() => KP.lastRoundNow(), 0);
  }
  KP.home = function () {
    leave();
    KP.voice.stop();
    U.$$(".screen.on").forEach((s) => s.classList.remove("on"));
    const h = U.$("#home");
    h.classList.add("on");
    U.replay(h, "enter");
    KP.renderHome && KP.renderHome();
  };

  /* ---------------- 게임 컨텍스트 ---------------- */
  function makeCtx(def) {
    const cat = KP.CATS.find((c) => c.id === def.cat) || KP.CATS[0];
    const root = U.el("section", "screen game cat-" + def.cat);
    root.id = "g-" + def.id;
    root.style.setProperty("--cat", cat.color);
    root.style.setProperty("--soft", def.cat === cat.id ? cat.soft : KP.SOFT_DEFAULT);

    const bar = U.el("header", "bar");
    const homeBtn = U.btn(KP.E("🏠"), "barBtn home");
    const title = U.el("div", "title", KP.E(def.icon) + "<span>" + def.name + "</span>");
    const right = U.el("div", "barRight");
    const lvDots = U.el("div", "lvDots");
    lvDots.setAttribute("aria-hidden", "true");
    const lvBadge = U.el("div", "pill lvPill");
    const scorePill = U.el("div", "pill scorePill", KP.E(def.score || "⭐") + "<b>0</b>");
    const stPill = U.el("div", "pill stickerPill", KP.E("📒") + "<b>0</b>");
    const keyPill = U.el("div", "pill keyPill"); // 열쇠 별 / 문 남은 시간
    keyPill.style.display = "none";
    if (!def.score) scorePill.style.display = "none";
    right.append(lvDots, lvBadge, scorePill, keyPill, stPill);
    bar.append(homeBtn, title, right);

    const bubble = U.el("div", "bubble");
    const bubbleTxt = U.el("div", "bubbleTxt");
    bubble.append(U.el("span", "bubbleMascot", KP.E(KP.MASCOT)), bubbleTxt, U.el("span", "bubbleSpk", KP.E("🔊")));
    if (!def.bubble) bubble.style.display = "none";

    const stage = U.el("main", "stage");
    root.append(bar, bubble, stage);
    U.$("#app").appendChild(root);

    const timers = new Set(),
      intervals = new Set(),
      rafs = new Set();
    let score = 0;
    // 열쇠 별 '보기가 적은 판' 표시. v: 값, set: 놀이가 직접 정했나, drag: 이번 판 끌기 관찰(자동 판정용)
    const few = { v: false, set: false, drag: null };

    const ctx = {
      id: def.id,
      def,
      root,
      bar,
      body: stage,
      stage,
      bubble,
      cat,
      _active: false,
      _idleAt: Date.now(),
      instr: "",
      /** 현재 난이도 단계 (1부터) */
      get level() {
        return Math.min(KP.level.get(def.id).lvl, def.levels || 1);
      },
      /** 안내 문장 표시 + 읽어주기 */
      say(text, speak = true) {
        const spoken = typeof speak === "string" ? speak : text;
        ctx.instr = spoken;
        bubbleTxt.innerHTML = KP.E(text);
        U.replay(bubble, "pop");
        if (speak) return KP.voice.say(spoken.replace(/\p{Extended_Pictographic}|️/gu, ""));
        return Promise.resolve();
      },
      /** 읽어주기만 (말풍선은 그대로) */
      tell(text, o) {
        KP.voice.say(text, o);
      },
      score: {
        get: () => score,
        set(n) {
          score = n;
          scorePill.querySelector("b").textContent = n;
        },
        add(n = 1) {
          score += n;
          const b = scorePill.querySelector("b");
          b.textContent = score;
          U.replay(scorePill, "bump");
          return score;
        },
      },
      /* --- 자동 정리되는 타이머 --- */
      after(ms, fn) {
        const t = setTimeout(() => {
          timers.delete(t);
          if (ctx._active) fn();
        }, ms);
        timers.add(t);
        return t;
      },
      every(ms, fn) {
        const t = setInterval(() => {
          if (ctx._active) fn();
        }, ms);
        intervals.add(t);
        return t;
      },
      cancel(t) {
        clearTimeout(t);
        clearInterval(t);
        timers.delete(t);
        intervals.delete(t);
      },
      /** 매 프레임 실행. fn(dt초)가 false 를 돌려주면 멈춤 */
      loop(fn) {
        let last = performance.now(),
          id = 0;
        const step = (now) => {
          rafs.delete(id);
          if (!ctx._active) return;
          const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); // 첫 프레임 시각이 앞설 수 있어 음수 방지
          last = now;
          if (fn(dt, now) === false) return;
          id = requestAnimationFrame(step);
          rafs.add(id);
        };
        id = requestAnimationFrame(step);
        rafs.add(id);
      },
      wait(ms) {
        return new Promise((res) => ctx.after(ms, res));
      },
      _clearTimers() {
        timers.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        rafs.forEach(cancelAnimationFrame);
        timers.clear();
        intervals.clear();
        rafs.clear();
      },
      /* --- 터치 --- */
      /** 버튼류: 스크롤과 구분되는 click (살짝 늦지만 오작동 없음) */
      tap(el, fn) {
        el.addEventListener("click", (e) => {
          KP.audio.unlock();
          if (el.dataset.busy) return;
          fn(e);
        });
        return el;
      },
      /** 게임판: 닿는 순간 즉시 반응 */
      fast(el, fn) {
        el.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          KP.audio.unlock();
          fn(e);
        });
        return el;
      },
      /* --- 결과 --- */
      /**
       * 성공 처리: 축하 연출 + 난이도/스티커 진행
       * @param {{big?:boolean, msg?:string, say?:string, quiet?:boolean, noLevel?:boolean}} o  (say: 화면 글자와 다르게 말할 문장)
       *   noLevel: 축하 화면·마지막 판 처리는 그대로, 단계(lvl/streak)·열쇠 별에는 넣지 않음
       *            (녹음 축하·'10씩 세기' 완성·악어 운 판처럼 '문제를 맞힌 것'이 아닌 축하)
       * @returns Promise (연출이 끝나면 resolve)
       */
      win(o = {}) {
        if (!ctx._active) return Promise.resolve(false); // 이미 나간 놀이의 늦은 승리는 무시
        // 열쇠 별: 이번 문제를 한 번에 맞혔나 (틀린 적 있으면 별 없음)
        // 가벼운 실수(soft)는 1번까지 봐줌 — 글자 타일을 아무거나 눌러 채우는 것 방지
        // 손가락 힌트가 정답을 가리킨 판, 보기가 2개뿐인 판(찍어도 반)도 별 없음
        const clean = !ctx._missed && (ctx._softMiss || 0) <= 1 && !ctx._hinted && !ctx._isFew();
        ctx._missed = false;
        ctx._softMiss = 0;
        ctx._hinted = false;
        ctx._resetFew();
        let up = false;
        if (!o.noLevel) {
          KP.earn && KP.earn.onWin(ctx, clean);
          const lv = KP.level.get(def.id);
          lv.wins = (lv.wins || 0) + 1;
          lv.streak = (lv.streak || 0) + 1;
          lv.miss = 0;
          if (def.levels > 1 && lv.streak >= 3 && lv.lvl < def.levels) {
            lv.lvl++;
            lv.streak = 0;
            up = true;
          }
          KP.level.save(def.id, lv);
          ctx._updateLevel();
        }
        // 축하 동안엔 힌트를 끄되, 이번 판 마지막 힌트는 기억해 둠 (아래 '힌트 되살리기')
        // win 이 겹치면(앞 축하가 끝나기 전에 새 win) 앞 win 이 이미 힌트를 꺼 둠 → 그때 기억한 힌트를 이어받음
        // (그 사이 놀이가 힌트를 새로 걸거나 지웠으면 seq 가 달라 이어받지 않음)
        const keep = ctx._hint || (ctx._winKeep && ctx._winKeep.seq === ctx._hintSeq ? ctx._winKeep.h : null);
        ctx.hint(null);
        const hseq = ctx._hintSeq;
        ctx._winKeep = keep ? { h: keep, seq: hseq } : null;
        const sess = ctx._session;
        return KP.celebrate(Object.assign({ levelUp: up, ctx }, o)).then(() => {
          // 시간이 끝나 '마지막 판'을 기다리는 중이면 지금 마무리
          if (KP.lastRoundWaiting && KP.lastRoundWaiting()) {
            setTimeout(() => KP.lastRoundNow(), 300);
            return false;
          }
          const ok = ctx._active && ctx._session === sess;
          // 힌트 되살리기: 판이 끊기지 않는 놀이(두더지·물고기·과일 등)는 start 에서만 힌트를 걸어
          // win 뒤에 힌트가 사라졌음. win 부터 축하가 끝날 때까지 놀이가 힌트를 새로 걸거나 지우지 않았으면
          // 마지막 힌트를 다시 건다. 놀이가 win 뒤에 ctx.hint(...) 를 부르면 그쪽이 이김(이 then 이 먼저 돎).
          // win 전에 ctx.hint(null) 로 지운 놀이는 되살릴 것이 없음. 대상이 사라졌거나 숨겨졌거나
          // 오답 보기면 showHint 가 가리키지 않음(restored 검사).
          if (ok && keep && !ctx._hint && ctx._hintSeq === hseq) {
            ctx._hint = { getTarget: keep.getTarget, text: keep.text, shown: 0, restored: true, answer: keep.answer };
            ctx._idleAt = Date.now();
          }
          return ok;
        });
      },
      /** 틀렸을 때: 흔들기 + 부드러운 소리 + (선택) 안내 */
      miss(el, msg, o = {}) {
        if (el) U.replay(el, "wrong");
        KP.audio.sfx("bad");
        if (msg) KP.voice.say(msg);
        if (o.soft) {
          ctx._softMiss = (ctx._softMiss || 0) + 1;
          return; // 단계 계산에 넣지 않는 가벼운 실수
        }
        ctx._missed = true;
        const lv = KP.level.get(def.id);
        lv.miss = (lv.miss || 0) + 1;
        lv.streak = 0;
        if (lv.miss >= 5 && lv.lvl > 1) {
          lv.lvl--;
          lv.miss = 0;
        }
        KP.level.save(def.id, lv);
        ctx._updateLevel();
      },
      /**
       * 보기 고르기 버튼 묶음 만들기 (퀴즈형 공통)
       * @param {HTMLElement} box   버튼을 넣을 곳 (내용은 비워짐)
       * @param {Array} list        보기 값들
       * @param {{render:(v)=>string, right:(v)=>boolean, wrongMsg?:(v)=>string,
       *          onRight:(v,btn)=>any, cls?:string}} o
       * @returns {HTMLElement[]} 버튼들 (각 버튼 dataset.right="1" 이면 정답)
       */
      choices(box, list, o) {
        box.innerHTML = "";
        if (list.length < 3) ctx.fewChoice(true);
        let busy = false;
        return list.map((v, i) => {
          const b = U.el("button", "choice " + (o.cls || ""), o.render ? o.render(v) : KP.E(String(v)));
          b.style.setProperty("--i", i);
          if (o.right(v)) b.dataset.right = "1";
          b.addEventListener("click", async () => {
            if (busy) return;
            KP.audio.unlock();
            if (o.right(v)) {
              busy = true;
              b.classList.add("right");
              await (o.onRight && o.onRight(v, b));
            } else ctx.miss(b, o.wrongMsg ? o.wrongMsg(v) : "다시 해 볼까요?");
          });
          box.appendChild(b);
          return b;
        });
      },
      /** 진행형 게임용: 일정 개수마다 축하 (예: 풍선 10개) */
      milestone(n, every = 10) {
        if (n > 0 && n % every === 0) return ctx.win({ msg: n + "개!" });
        return Promise.resolve(true);
      },
      /* --- 열쇠 별: 보기가 적은 판 --- */
      /**
       * 이번 판은 찍어도 맞힐 수 있으니(보기 2개 이하 등) 열쇠 별 없음 — 축하·단계·스티커는 그대로.
       * 판을 차린 뒤(이전 win 다음) 부를 것. win 할 때마다 저절로 풀림.
       * ctx.fewChoice(false) = '이번 판은 보기가 충분함'을 놀이가 직접 정함 → KP.drag 자동 판정을 끔.
       */
      fewChoice(on = true) {
        few.v = !!on;
        few.set = true;
      },
      /** 자유 놀이·만들기처럼 '정답 없는' win 에서 열쇠 별을 뺄 때 (fewChoice(true) 와 같음) */
      noStar() {
        ctx.fewChoice(true);
      },
      // 예전 방식(ctx._fewChoice = true/false)도 그대로 동작 (= fewChoice(값))
      get _fewChoice() {
        return few.v;
      },
      set _fewChoice(v) {
        ctx.fewChoice(v);
      },
      _resetFew() {
        few.v = false;
        few.set = false;
        few.drag = null;
      },
      /** KP.drag 가 집을 때 알려 줌 → 이번 판 '끌 수 있는 것 수·놓을 곳 수'의 최댓값 기록 */
      _dragSeen(pool, spots, judged) {
        const d = few.drag || (few.drag = { pool: 0, spots: 0, free: false });
        if (!judged) d.free = true; // 맞고 틀림이 없는 끌기(자유 배치·위치 판정 등)가 섞인 판은 자동 판정 안 함
        else {
          d.pool = Math.max(d.pool, pool);
          d.spots = Math.max(d.spots, spots);
        }
      },
      _isFew() {
        if (few.set) return few.v;
        // 자동: 이번 판 내내 끌 수 있는 것이 2개 이하이고 놓을 곳이 1곳뿐인 '맞고 틀림(accept)' 끌기 → 찍어도 반
        const d = few.drag;
        return !!(d && !d.free && d.pool > 0 && d.pool <= 2 && d.spots === 1);
      },
      /* --- 힌트 --- */
      _hint: null,
      _hintSeq: 0,
      /**
       * 아이가 한동안 멈춰 있으면 손가락으로 가리키며 다시 안내
       * @param {Function|null} getTarget  () => 가리킬 요소
       * @param {string} text  다시 읽어줄 말 (없으면 현재 안내)
       * @param {{answer?:boolean}} o  answer: 가리키는 것이 이번 판 정답(보기 버튼이 아닌 이빨·집·도구 등)
       *        → 손가락이 실제로 가리키는 순간 이번 판은 열쇠 별 없음(_hinted)
       */
      hint(getTarget, text, o) {
        ctx._hintSeq++;
        ctx._hint = getTarget ? { getTarget, text, shown: 0, answer: !!(o && o.answer) } : null;
        ctx._idleAt = Date.now();
        KP.hideHint();
      },
      _updateLevel() {
        const lv = KP.level.get(def.id);
        if (def.levels > 1) {
          lvBadge.style.display = "";
          lvBadge.innerHTML = KP.E("🏅") + "<b>" + Math.min(lv.lvl, def.levels) + "단계</b>";
          // 다음 단계까지: 연속 3번 성공하면 단계가 오른다 (win 의 규칙과 같음)
          if (lv.lvl < def.levels) {
            const n = Math.min(3, lv.streak || 0);
            lvDots.innerHTML = "<i></i><i></i><i></i>";
            [...lvDots.children].forEach((d, i) => d.classList.toggle("on", i < n));
            lvDots.style.display = "";
          } else lvDots.style.display = "none";
        } else {
          lvBadge.style.display = "none";
          lvDots.style.display = "none";
        }
        stPill.querySelector("b").textContent = KP.stickers ? KP.stickers.count() : 0;
      },
      stickerPill: stPill,
      keyPill,
    };
    homeBtn.addEventListener("click", () => {
      KP.home();
      KP.audio.sfx("back");
    });
    bubble.addEventListener("click", () => {
      if (ctx.instr) KP.voice.say(ctx.instr.replace(/\p{Extended_Pictographic}|️/gu, ""));
      U.replay(bubble, "pop");
    });
    root.addEventListener("pointerdown", () => {
      ctx._idleAt = Date.now();
      KP.hideHint();
    }, true);
    // 끄는 동안에도 '멈춰 있음'으로 보지 않기
    root.addEventListener("pointermove", (e) => {
      if (e.buttons || e.pointerType !== "mouse") ctx._idleAt = Date.now();
    }, { capture: true, passive: true });
    return ctx;
  }

  /* ---------------- 힌트 손가락 ---------------- */
  let hand = null,
    handMove = null;
  KP.hideHint = function () {
    if (hand) hand.classList.remove("show");
    if (handMove) {
      handMove.cancel();
      handMove = null;
    }
    U.$$(".hintGlow").forEach((e) => e.classList.remove("hintGlow"));
  };
  /** 화면에 실제로 보이는 요소인가 (붙어 있고, 크기가 있고, 숨김이 아님) */
  function visible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true })) return false;
    return true;
  }
  /** KP.drag 가 집을 때 부름(drag.js) — 열쇠 별 자동 판정용. spots: 놓을 곳들, judged: accept 가 있는 끌기 */
  KP._dragSeen = function (el, spots, judged) {
    const ctx = current;
    if (!ctx || !ctx._active || !ctx.root.contains(el)) return;
    const pool = U.$$(".draggable:not(.locked)", ctx.root).filter((d) => d === el || visible(d)).length;
    ctx._dragSeen(pool, spots.filter(visible).length, judged);
  };
  function showHint(ctx) {
    const h = ctx._hint;
    let t = null;
    try {
      t = h.getTarget();
    } catch (e) {}
    if (!t) return;
    let x,
      y,
      dest = null;
    if (typeof t.x === "number" && !(t instanceof Element)) {
      // 캔버스 게임: 화면 좌표 {x, y}
      if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) return;
      x = t.x;
      y = t.y;
      if (h.answer) ctx._hinted = true;
    } else {
      if (!t.isConnected) return;
      const r = t.getBoundingClientRect();
      if (!r.width) return;
      // win 뒤 되살린 힌트는 더 엄격히: 숨겨졌거나 잠겼거나 오답 보기면 가리키지 않음
      if (h.restored) {
        if (!visible(t) || t.disabled || t.classList.contains("locked")) return;
        if (t.classList.contains("choice") && t.dataset.right !== "1") return;
      }
      // 정답 보기를 가리켰으면 이번 판은 열쇠 별 없음 (기다렸다 누르기 방지)
      if (h.answer || t.dataset.right === "1" || t.classList.contains("choice")) ctx._hinted = true;
      x = r.left + r.width / 2;
      y = r.top + r.height * 0.6;
      t.classList.add("hintGlow");
      // 끌기 힌트: 두 번째부터는 손가락이 '놓을 곳'까지 움직여 보여 줌 (accept 로 맞는 자리가 정해진 KP.drag 만)
      if (h.shown >= 1 && t._kpDragDest) {
        try {
          dest = t._kpDragDest();
        } catch (e) {
          dest = null;
        }
        if (dest && !visible(dest)) dest = null;
      }
    }
    if (!hand) {
      hand = U.el("div", "hintHand", KP.E("👆"));
      document.body.appendChild(hand);
    }
    hand.style.left = x + "px";
    hand.style.top = y + "px";
    hand.classList.add("show");
    if (handMove) {
      handMove.cancel();
      handMove = null;
    }
    if (dest && hand.animate) {
      const dr = dest.getBoundingClientRect();
      const tx = dr.left + dr.width / 2,
        ty = dr.top + dr.height * 0.6;
      dest.classList.add("hintGlow");
      ctx._hinted = true; // 놓을 곳까지 알려 줬으니 이번 판은 열쇠 별 없음
      // 집을 것에서 잠깐 멈춤 → 놓을 곳으로 미끄러짐 → 잠깐 멈춤 (2번 되풀이, 손가락 3.2초 안에 끝)
      handMove = hand.animate(
        [
          { left: x + "px", top: y + "px", offset: 0 },
          { left: x + "px", top: y + "px", offset: 0.2 },
          { left: tx + "px", top: ty + "px", offset: 0.75 },
          { left: tx + "px", top: ty + "px", offset: 1 },
        ],
        { duration: 1500, iterations: 2, easing: "ease-in-out" }
      );
    }
    const txt = h.text || ctx.instr;
    if (txt) KP.voice.say(txt.replace(/\p{Extended_Pictographic}|️/gu, ""));
    h.shown++;
    setTimeout(KP.hideHint, 3200);
  }
  setInterval(() => {
    const ctx = current;
    if (!ctx || !ctx._hint || !KP.settings.get().hints || KP.celebrating) return;
    const idle = Date.now() - ctx._idleAt;
    const wait = ctx._hint.shown === 0 ? 8000 : 14000;
    if (idle > wait && ctx._hint.shown < 3) {
      ctx._idleAt = Date.now();
      showHint(ctx);
    }
  }, 1000);

  /* ---------------- 오류 기록 (자동 점검용) ---------------- */
  KP.errors = [];
  KP.reportError = (where, e) => KP.errors.push(where + ": " + (e && e.message));
  window.addEventListener("error", (e) => KP.errors.push("window: " + e.message));
})(window.KP);

;

/* ==== js/core/drag.js ==== */
/* =====================================================================
   끌어다 놓기 엔진 (손가락/마우스 공통, 멀티터치 안전)

   KP.drag(el, {
     targets: () => [요소...]          // 놓을 수 있는 자리들
     accept:  (target, el) => bool      // 이 자리에 맞는가? (기본: 항상 true)
     onPick:  (el) => {}                // 집었을 때
     onMove:  (x, y, el) => {}          // 움직일 때 (화면 좌표)
     onDrop:  (target|null, el) => {}   // 놓은 뒤 (자리 맞으면 target, 아니면 null)
     onReject:(target, el) => {}        // 틀린 자리에 놓았을 때
     snap: true                         // 맞으면 자리 가운데로 쏙 이동
     pad: 24                            // 자리 판정 여유(px)
   })
   반환: { lock(), unlock(), home() }
   - 틀리거나 빈 곳에 놓으면 제자리로 부드럽게 돌아간다.
   - snap 후 onDrop 에서 target.appendChild(el) 등 재배치를 하면 된다.
   - 열쇠 별: accept 가 있는 끌기에서 이번 판 끌 수 있는 것(.draggable, 잠기지 않은 것)이 2개 이하이고
     놓을 곳이 1곳뿐이면 '찍어도 반'으로 보고 별 없음(ui.js _isFew). 놀이가 ctx.fewChoice(값)로 직접 정하면 그쪽이 우선.
   - 힌트: ctx.hint(() => 이 요소) 로 가리키면 두 번째 손가락부터 accept 가 맞는 놓을 곳까지 움직여 보여 줌.
===================================================================== */
"use strict";
(function (KP) {
  KP.drag = function (el, o = {}) {
    let pid = null,
      sx = 0,
      sy = 0,
      dx = 0,
      dy = 0,
      locked = false,
      hover = null;
    const pad = o.pad == null ? 24 : o.pad;
    el.classList.add("draggable");
    el.style.touchAction = "none";

    function targets() {
      const t = typeof o.targets === "function" ? o.targets() : o.targets || [];
      return t.filter(Boolean);
    }
    // 힌트 손가락이 '놓을 곳'을 알 수 있게 (맞는 자리가 정해진 끌기만)
    el._kpDragDest = () => {
      if (locked || !o.accept) return null;
      return targets().find((t) => o.accept(t, el)) || null;
    };
    function hit(x, y) {
      let best = null,
        bd = 1e9;
      for (const t of targets()) {
        const r = t.getBoundingClientRect();
        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
          const d = KP.u.dist(x, y, r.left + r.width / 2, r.top + r.height / 2);
          if (d < bd) {
            bd = d;
            best = t;
          }
        }
      }
      return best;
    }
    function setHover(t) {
      if (hover === t) return;
      if (hover) hover.classList.remove("dropHover");
      hover = t;
      if (hover) hover.classList.add("dropHover");
    }
    function goHome() {
      el.style.transition = "transform .28s cubic-bezier(.3,1.4,.5,1)";
      el.style.transform = "";
      setTimeout(() => {
        el.style.transition = "";
        el.classList.remove("dragging");
      }, 300);
    }

    el.addEventListener("pointerdown", (e) => {
      if (locked || pid !== null) return;
      e.preventDefault();
      e.stopPropagation();
      KP.audio && KP.audio.unlock();
      pid = e.pointerId;
      try {
        el.setPointerCapture(pid);
      } catch (_) {}
      sx = e.clientX;
      sy = e.clientY;
      dx = dy = 0;
      el.style.transition = "";
      el.classList.add("dragging");
      KP.audio && KP.audio.sfx("pick");
      try {
        KP._dragSeen && KP._dragSeen(el, targets(), !!o.accept);
      } catch (_) {}
      o.onPick && o.onPick(el);
    });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      e.preventDefault();
      dx = e.clientX - sx;
      dy = e.clientY - sy;
      el.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.12)";
      setHover(hit(e.clientX, e.clientY));
      o.onMove && o.onMove(e.clientX, e.clientY, el);
    });
    function end(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      setHover(null);
      const t = hit(e.clientX, e.clientY);
      if (t && (!o.accept || o.accept(t, el))) {
        if (o.snap !== false) {
          const er = el.getBoundingClientRect(),
            tr = t.getBoundingClientRect();
          const ex = er.left + er.width / 2 - dx,
            ey = er.top + er.height / 2 - dy; // 원래 중심
          const tx = tr.left + tr.width / 2 - ex,
            ty = tr.top + tr.height / 2 - ey;
          el.style.transition = "transform .18s ease-out";
          el.style.transform = "translate(" + tx + "px," + ty + "px)";
          // 쏙 들어가는 사이에 놀이를 나갔는지 알아보려고 지금 놀이(ctx)·회차를 기억
          const g = KP.current && KP.current(),
            gs = g && g._session;
          setTimeout(() => {
            el.style.transition = "";
            el.classList.remove("dragging");
            // 그사이 놀이를 나갔거나 판이 바뀌어 요소가 없어졌으면 아무것도 안 함
            if (!el.isConnected || (g && (!g._active || g._session !== gs))) return;
            // 쏙 들어가는 사이에 상황이 바뀌었으면(두 손가락으로 동시에 넣기 등) 제자리로
            if (locked || !targets().includes(t) || (o.accept && !o.accept(t, el))) return goHome();
            o.onDrop && o.onDrop(t, el);
          }, 190);
        } else {
          el.classList.remove("dragging");
          o.onDrop && o.onDrop(t, el);
        }
      } else {
        if (t && o.onReject) o.onReject(t, el);
        goHome();
        if (!t && o.onDrop) o.onDrop(null, el);
      }
    }
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", (e) => {
      if (e.pointerId === pid) end(e);
    });

    return {
      lock() {
        locked = true;
        el.classList.add("locked");
      },
      unlock() {
        locked = false;
        el.classList.remove("locked");
      },
      home: goHome,
    };
  };
})(window.KP);

;

/* ==== js/core/paint.js ==== */
/* =====================================================================
   물감 공용 엔진 — 물감 실험실·색깔 섞기·색 주문 맞추기·데칼코마니·팔레트가 함께 씀
   - KP.paint.mix(v)        : 물감 양 [빨,노,파,하,검] → RGB — 진짜 물감처럼 (Kubelka–Munk, spectral.js 3.0.0 방식·MIT,
                              라이선스 원문 vendor/spectral.LICENSE). 검증표: tools/out/paint2/swatch.js
   - KP.paint.nameOf(rgb)   : 가장 가까운 한국어 색 이름 (색마다 대표 레시피 → 같은 엔진으로 기준색)
   - KP.paint.mine / saveMine(hex, 이름, 비율) : 내 물감 통 (아이가 만든 색, 기기 저장) · pick/takePick: 칠하러 가기
   - KP.paint.dex / discover  : 색깔 도감 (처음 만든 색 기록)
   - KP.paint.advise(...)   : 목표 색으로 가려면 어떤 물감을 더 넣을지
   - KP.paint.bowl(host)    : 손가락으로 젓는 물감 그릇 (격자 유체 + 두께 음영·광택·주걱 자국)
   - KP.paint.studio(o)     : 점토 튜브 + 그릇 + 나무 주걱 작업대 · KP.paint.stageBg(el): 점토 작업실 배경(팔레트를 그릇 밑에)
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;
  const P = (KP.paint = {});

  /* ---------------- 기본 물감 ---------------- */
  P.BASE = [
    { id: 0, key: "r", n: "빨강", hex: "#e0204a" }, // 살짝 자홍 쪽 빨강 → 빨+파가 탁한 밤색이 아닌 보라로
    { id: 1, key: "y", n: "노랑", hex: "#ffd200" },
    { id: 2, key: "b", n: "파랑", hex: "#2a62f0" },
    { id: 3, key: "w", n: "하양", hex: "#ffffff" },
    { id: 4, key: "k", n: "검정", hex: "#2a2a33" },
  ];

  /* ---------------- 물감 혼합 (Kubelka–Munk) ----------------
     진짜 물감처럼 섞기: 색마다 빛 반사 곡선(380~750nm, 10nm 간격 38칸)을 만들고,
     흡수/산란 비(K/S)를 물감 양으로 가중 평균 → 다시 반사 곡선 → 눈에 보이는 색(XYZ → sRGB)
     - 노랑+파랑 = 초록, 빨강+노랑 = 주황, 셋 다 = 갈색, 하양 = 파스텔(틴트), 검정은 조금만 넣어도 진해짐
     - 수식과 기준 반사 곡선(SPD)·CIE 표(CMF)·행렬은 spectral.js 3.0.0 (MIT License,
       Copyright (c) 2025 Ronald van Wijnen, https://github.com/rvanwijnen/spectral.js) 에서 옮겨 씀
       → 라이선스 원문: vendor/spectral.LICENSE
     - 물감마다 착색력(ts): 하양·검정은 너무 세지 않게 조정 (검정 한 방울에 전체가 시커매지지 않게) */
  const SPD = {
    W: [1.00116,1.00116,1.00116,1.00116,1.00115,1.00113,1.00109,1.001,1.00087,1.0007,1.0005,1.00031,1.00012,0.999953,0.999822,0.999739,0.99971,0.999732,0.999799,0.9999,1.00002,1.00014,1.00026,1.00036,1.00043,1.00048,1.00051,1.00053,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054],
    C: [0.970585,0.970592,0.970625,0.970787,0.971369,0.973163,0.97674,0.981588,0.98628,0.989949,0.992493,0.994146,0.995184,0.995757,0.995913,0.995606,0.994598,0.992216,0.986236,0.967943,0.891285,0.536202,0.154108,0.0574575,0.031535,0.0222634,0.0182023,0.0162991,0.0153656,0.0149112,0.0146954,0.0145964,0.014547,0.0145229,0.014512,0.0145067,0.0145045,0.0145038],
    M: [0.990674,0.990672,0.990663,0.990618,0.990451,0.989871,0.988287,0.984291,0.973935,0.941818,0.81739,0.432473,0.138454,0.0537347,0.0292175,0.0213137,0.020135,0.0241323,0.0372236,0.0760507,0.205375,0.541269,0.815842,0.912818,0.94634,0.959928,0.966261,0.969326,0.970855,0.971605,0.971963,0.972127,0.972209,0.97225,0.972268,0.972277,0.97228,0.972281],
    Y: [0.0210523,0.0210565,0.0210746,0.0211649,0.0215028,0.0226739,0.0258236,0.0334879,0.051907,0.100749,0.23913,0.534804,0.797808,0.91145,0.953798,0.971242,0.979303,0.98338,0.985461,0.986435,0.986738,0.986618,0.986278,0.985861,0.985475,0.985177,0.984972,0.984846,0.984775,0.984738,0.98472,0.984711,0.984707,0.984705,0.984704,0.984703,0.984703,0.984703],
    R: [0.0315606,0.0315521,0.0315148,0.0313318,0.030673,0.028648,0.024645,0.0192961,0.0142067,0.0102943,0.00761915,0.00589804,0.00482332,0.00422987,0.00405992,0.00435337,0.00534344,0.00769172,0.013597,0.0316975,0.107861,0.463813,0.847055,0.943185,0.968862,0.978031,0.982044,0.983924,0.984845,0.985294,0.985507,0.985605,0.985654,0.985678,0.985688,0.985694,0.985696,0.985697],
    G: [0.00955607,0.00955816,0.00956732,0.00961291,0.00978371,0.0103786,0.0120026,0.0160978,0.0267062,0.0595555,0.18604,0.57058,0.861468,0.945879,0.970465,0.978414,0.979589,0.975534,0.962289,0.923122,0.793434,0.45927,0.185574,0.0881775,0.054363,0.0406288,0.0342215,0.0311186,0.0295709,0.0288109,0.0284486,0.028282,0.0281988,0.0281582,0.0281399,0.0281309,0.0281271,0.028126],
    B: [0.979405,0.979401,0.979383,0.979294,0.978963,0.977814,0.974724,0.967198,0.94908,0.90085,0.76315,0.465922,0.201263,0.0877524,0.0457177,0.0284706,0.0205272,0.0165303,0.0145135,0.0136004,0.0133604,0.0135489,0.0139594,0.0144434,0.0148854,0.0152254,0.0154593,0.0156018,0.0156825,0.0157249,0.0157458,0.0157556,0.0157605,0.015763,0.0157641,0.0157646,0.0157648,0.0157649],
  };
  const CMF = [
    [0.000064692,0.00021941,0.00112057,0.00376661,0.0118806,0.0232864,0.0345594,0.0372238,0.0324184,0.0212332,0.010491,0.00329584,0.000507035,0.000948674,0.00627372,0.0168646,0.0286896,0.0426748,0.0562547,0.0694704,0.0830532,0.0861261,0.0904661,0.0850039,0.0709067,0.0506289,0.035474,0.0214682,0.0125165,0.00680458,0.00346457,0.00149761,0.0007697,0.000407368,0.00016901,0.0000952245,0.000049031,0.0000199961],
    [0.00000184429,0.00000620532,0.0000310096,0.000104748,0.000353641,0.000951471,0.00228226,0.00420733,0.0066888,0.0098884,0.0152495,0.0214183,0.0334229,0.05131,0.0704021,0.0878387,0.0942491,0.0979567,0.0941522,0.086781,0.0788565,0.0635267,0.0537414,0.0426461,0.0316173,0.0208852,0.0138601,0.00810264,0.0046301,0.00249138,0.0012593,0.000541647,0.000277953,0.000147108,0.0000610327,0.0000343873,0.000017706,0.00000722097],
    [0.000305017,0.00103681,0.00531314,0.0179544,0.0570776,0.113652,0.173359,0.196207,0.186082,0.13995,0.0891745,0.0478962,0.0281456,0.0161377,0.0077591,0.00429615,0.00200551,0.000861471,0.000369039,0.000191429,0.000149556,0.0000923109,0.0000681349,0.0000288264,0.0000157672,0.0000039406,0.00000158401,0,0,0,0,0,0,0,0,0,0,0],
  ];
  const XYZ_RGB = [[3.240969942,-1.537383178,-0.4986107603],[-0.9692436363,1.875967502,0.04155505741],[0.0556300797,-0.2039769589,1.056971514]];
  const NW = 38;
  const lin = (x) => (x > 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92);
  const gam = (x) => (x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : x * 12.92);
  /** sRGB(0~1) → 반사 곡선 (spectral.js lRGB_to_R) */
  function reflect(rgb) {
    const l = rgb.map(lin);
    const w = Math.min(l[0], l[1], l[2]);
    const r0 = l[0] - w, g0 = l[1] - w, b0 = l[2] - w;
    const c = Math.min(g0, b0), m = Math.min(r0, b0), y = Math.min(r0, g0);
    const r = Math.max(0, Math.min(r0 - b0, r0 - g0)), g = Math.max(0, Math.min(g0 - b0, g0 - r0)), b = Math.max(0, Math.min(b0 - g0, b0 - r0));
    const R = new Float64Array(NW);
    for (let i = 0; i < NW; i++)
      R[i] = Math.max(1e-9, w * SPD.W[i] + c * SPD.C[i] + m * SPD.M[i] + y * SPD.Y[i] + r * SPD.R[i] + g * SPD.G[i] + b * SPD.B[i]);
    return R;
  }
  /** 물감 하나 = {ks[38], lum(밝기 Y), ts(착색력)} */
  function pigment(hex, ts) {
    const R = reflect(P.rgb(hex));
    const ks = new Float64Array(NW);
    let Y = 0;
    for (let i = 0; i < NW; i++) {
      ks[i] = (1 - R[i]) ** 2 / (2 * R[i]);
      Y += CMF[1][i] * R[i];
    }
    return { ks, lum: Math.max(1e-6, Y), ts: ts || 1 };
  }
  // 착색력 (1 = spectral.js 기본) — 노랑·파랑은 조금 세게(주황·초록이 빨강·파랑에 묻히지 않게), 하양은 조금 약하게,
  // 검정은 밝기 가중 때문에 원래 약해서 1.8 (한 방울 = 살짝 어둡게, 1:1 = 진한 색, 하양+검정 1:1 = 중간 회색) — tools/out/paint2 검증표로 정함
  P.TS = [1, 1.6, 1.3, 0.9, 1.8];
  P.EXP = 1; // 양 → 농도 지수 (spectral.js 는 2 — 아이 놀이에서는 "한 방울 더"가 고르게 보이도록 1)
  let PIG = null;
  P._pig = () => PIG || (PIG = P.BASE.map((b, i) => pigment(b.hex, P.TS[i])));
  P._reset = () => {
    PIG = null;
    cache.clear();
    if (P.NAMES) P._names();
  };
  const KSM = new Float64Array(NW);
  /** 물감 양 [빨,노,파,하,검] → out[0..2] (sRGB 0~1). 물감이 없으면 false */
  P.mixInto = function (v, out) {
    const pg = P._pig();
    let tot = 0;
    const w0 = [0, 0, 0, 0, 0];
    for (let p = 0; p < 5; p++) {
      const a = v[p] > 0 ? v[p] : 0;
      if (!a) continue;
      const q = pg[p];
      const c = (P.EXP === 2 ? a * a : Math.pow(a, P.EXP)) * q.ts * q.ts * q.lum;
      w0[p] = c;
      tot += c;
    }
    if (tot <= 1e-12) return false;
    KSM.fill(0);
    for (let p = 0; p < 5; p++) {
      const c = w0[p] / tot;
      if (!c) continue;
      const ks = pg[p].ks;
      for (let i = 0; i < NW; i++) KSM[i] += ks[i] * c;
    }
    let X = 0, Y = 0, Z = 0;
    const c0 = CMF[0], c1 = CMF[1], c2 = CMF[2];
    for (let i = 0; i < NW; i++) {
      const k = KSM[i];
      const R = 1 + k - Math.sqrt(k * k + 2 * k);
      X += c0[i] * R;
      Y += c1[i] * R;
      Z += c2[i] * R;
    }
    const M = XYZ_RGB;
    for (let j = 0; j < 3; j++) {
      const l = M[j][0] * X + M[j][1] * Y + M[j][2] * Z;
      out[j] = Math.min(1, Math.max(0, gam(Math.min(1, Math.max(0, l)))));
    }
    return true;
  };
  /** 물감 양 [빨,노,파,하,검] → RGB(0~1). 물감이 없으면 null (양의 비율만 봄) */
  P.mix = function (v) {
    const out = [0, 0, 0];
    return P.mixInto(v, out) ? out : null;
  };
  /** 그릇 그리기용: 비율을 잘게 나눠 기억 (같은 비율은 다시 계산하지 않음) */
  const cache = new Map();
  P.mixFast = function (v, out) {
    const s = v[0] + v[1] + v[2] + v[3] + v[4];
    if (s <= 1e-9) return false;
    const q = 40 / s;
    const key = ((((Math.round(v[0] * q) * 41 + Math.round(v[1] * q)) * 41 + Math.round(v[2] * q)) * 41 + Math.round(v[3] * q)) * 41) + Math.round(v[4] * q);
    let c = cache.get(key);
    if (!c) {
      if (cache.size > 6000) cache.clear();
      c = new Float32Array(3);
      const t = [0, 0, 0];
      if (!P.mixInto(v, t)) return false;
      c[0] = t[0];
      c[1] = t[1];
      c[2] = t[2];
      cache.set(key, c);
    }
    out[0] = c[0];
    out[1] = c[1];
    out[2] = c[2];
    return true;
  };
  P.hex = (rgb) => "#" + rgb.map((x) => Math.round(U.clamp(x, 0, 1) * 255).toString(16).padStart(2, "0")).join("");
  P.rgb = (hex) => {
    const h = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  };

  /* ---------------- Lab 색 거리 (사람 눈에 가까운 차이) ---------------- */
  function lab(rgb) {
    const lin = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    let X = (lin[0] * 0.4124 + lin[1] * 0.3576 + lin[2] * 0.1805) / 0.95047,
      Y = lin[0] * 0.2126 + lin[1] * 0.7152 + lin[2] * 0.0722,
      Z = (lin[0] * 0.0193 + lin[1] * 0.1192 + lin[2] * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    X = f(X);
    Y = f(Y);
    Z = f(Z);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
  P.lab = lab;
  P.dist = (a, b) => {
    const A = lab(a),
      B = lab(b);
    return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
  };

  /* ---------------- 색 이름 (도감 칸 = dex:true) ----------------
     색마다 '대표 레시피'(물감 양 [빨,노,파,하,검])를 두고, 기준색은 같은 엔진으로 섞어서 만듦
     → 실험실에서 그 레시피로 섞으면 반드시 그 이름이 나옴 (엔진을 바꿔도 이름표가 따라감)
     레시피는 도감·색 주문(mix)의 견본/레시피 카드에도 씀 */
  P.NAMES = [
    { n: "빨강", v: [1, 0, 0, 0, 0] },
    { n: "노랑", v: [0, 1, 0, 0, 0] },
    { n: "파랑", v: [0, 0, 1, 0, 0] },
    { n: "하양", v: [0, 0, 0, 1, 0] },
    { n: "검정", v: [0, 0, 0, 0, 1] },
    { n: "주황", v: [1, 1, 0, 0, 0], dex: true },
    { n: "귤색", v: [1, 3, 0, 0, 0], dex: true },
    { n: "다홍", v: [3, 1, 0, 0, 0], dex: true },
    { n: "연노랑", v: [0, 1, 0, 4, 0], dex: true },
    { n: "연두", v: [0, 3, 1, 0, 0], dex: true },
    { n: "초록", v: [0, 1, 1, 0, 0], dex: true },
    { n: "진초록", v: [0, 1, 1, 0, 2], dex: true },
    { n: "청록", v: [0, 1, 8, 2, 0], dex: true },
    { n: "하늘색", v: [0, 0, 1, 2, 0], dex: true },
    { n: "남색", v: [0, 0, 2, 0, 1], dex: true },
    { n: "보라", v: [1, 0, 1, 0, 0], dex: true },
    { n: "연보라", v: [1, 0, 1, 2, 0], dex: true },
    { n: "자주", v: [4, 0, 1, 0, 0], dex: true },
    { n: "분홍", v: [1, 0, 0, 2, 0], dex: true },
    { n: "살구색", v: [1, 1, 0, 5, 0], dex: true },
    { n: "황토색", v: [1, 4, 0, 0, 1], dex: true }, // 예전 [1,3,1] 은 올리브빛이라 초록 물감이 황토색으로 불렸음
    { n: "갈색", v: [2, 1, 1, 0, 0], dex: true },
    { n: "고동색", v: [2, 1, 1, 0, 3], dex: true },
    { n: "회색", v: [0, 0, 0, 2, 1], dex: true },
  ];
  P._names = () =>
    P.NAMES.forEach((x) => {
      x.rgb = P.mix(x.v);
      x.hex = P.hex(x.rgb);
    });
  P._names();
  /** 이름 → 대표 레시피 항목 */
  P.named = (n) => P.NAMES.find((x) => x.n === n) || null;
  P.nameOf = (rgb) => {
    let best = P.NAMES[0],
      bd = 1e9;
    for (const x of P.NAMES) {
      const d = P.dist(rgb, x.rgb);
      if (d < bd) {
        bd = d;
        best = x;
      }
    }
    return best;
  };

  /* ---------------- 내 물감 통 / 색깔 도감 (기기 저장) ---------------- */
  P.MAX_MINE = 12;
  P.mine = () => {
    const a = KP.store.get("mypaints", []);
    return Array.isArray(a) ? a.filter((x) => x && /^#[0-9a-f]{6}$/i.test(x.hex)) : [];
  };
  /** 내 물감에 담기 → 저장된 목록 */
  P.saveMine = (hex, n, v) => {
    let a = P.mine().filter((x) => P.dist(P.rgb(x.hex), P.rgb(hex)) > 4); // 거의 같은 색은 하나만
    const it = { hex, n: String(n || "").slice(0, 10), t: Date.now() };
    // 원재료 비율도 함께 (색은 hex 로 그대로 쓰고, 비율은 나중에 다시 섞기·레시피 보기용) — e: 엔진 판(2 = KM)
    if (Array.isArray(v) && v.length === 5) {
      const s = v.reduce((x, y) => x + y, 0) || 1;
      it.v = v.map((x) => Math.round((x / s) * 1000) / 1000);
      it.e = 2;
    }
    a.unshift(it);
    a = a.slice(0, P.MAX_MINE);
    KP.store.set("mypaints", a);
    return a;
  };
  /** '칠하러 가기': 색칠 공방이 열리면 이 색을 골라 두게 (10분 안에 한 번) */
  P.pick = (hex) => KP.store.set("paint:pick", { hex: String(hex).toLowerCase(), t: Date.now() });
  P.takePick = () => {
    const o = KP.store.get("paint:pick", null);
    if (!o) return null;
    KP.store.set("paint:pick", null);
    return o.hex && Date.now() - (o.t || 0) < 600000 ? o.hex : null;
  };
  P.delMine = (hex) => KP.store.set("mypaints", P.mine().filter((x) => x.hex !== hex));
  P.dex = () => {
    const d = KP.store.get("colordex", {});
    return d && typeof d === "object" ? d : {};
  };
  /** 도감에 기록. 처음이면 true */
  P.discover = (name) => {
    const ent = P.NAMES.find((x) => x.n === name && x.dex);
    if (!ent) return false;
    const d = P.dex();
    if (d[name]) return false;
    d[name] = KP.gate.monthDay();
    KP.store.set("colordex", d);
    return true;
  };

  /* =================================================================
     물감 그리기 (WebGL) — 64칸 계산 결과를 화면 해상도 그대로 그림
     - 예전엔 160px 그림을 4~7배 늘려 붙여 가장자리가 계단처럼 깨지고 흐렸음
     - 텍스처 2장: A = 물감 색(RGB) + 두께(√ 압축), B = 두께 기울기(빛 계산용) + 덮임(가장자리 선)
     - 두께·색은 B-스플라인(부드러운 3차) 보간 → 가장자리가 매끈한 곡선, 화면 픽셀 단위로 안티에일리어싱
     - 못 쓰면(구형 기기·문맥 잃음) null → 그릇이 예전 방식(CPU)으로 그림
  ================================================================= */
  const HMAX = 8; // 두께 압축 상한
  P._paintGL = function (N) {
    const cv = document.createElement("canvas");
    let gl = null;
    try {
      gl = cv.getContext("webgl", { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false });
    } catch (_) {}
    if (!gl) return null;
    const deriv = !!gl.getExtension("OES_standard_derivatives");
    const VS = "attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
    const FS =
      (deriv ? "#extension GL_OES_standard_derivatives : enable\n" : "") +
      `precision mediump float;
varying vec2 uv;
uniform sampler2D tA, tB;
uniform float N, R;
vec4 cub(float v){vec4 n=vec4(1.,2.,3.,4.)-v;vec4 s=n*n*n;float x=s.x,y=s.y-4.*s.x,z=s.z-4.*s.y+6.*s.x;return vec4(x,y,z,6.-x-y-z)/6.;}
vec4 bs(sampler2D t,vec2 q){
  vec2 g=q*N-.5;vec2 f=fract(g);g-=f;
  vec4 xc=cub(f.x),yc=cub(f.y);
  vec4 c=g.xxyy+vec2(-.5,1.5).xyxy;
  vec4 s=vec4(xc.xz+xc.yw,yc.xz+yc.yw);
  vec4 o=(c+vec4(xc.yw,yc.yw)/s)/N;
  vec4 a=texture2D(t,o.xz),b=texture2D(t,o.yz),cc=texture2D(t,o.xw),d=texture2D(t,o.yw);
  float sx=s.x/(s.x+s.y),sy=s.z/(s.z+s.w);
  return mix(mix(d,cc,sx),mix(b,a,sx),sy);
}
float H(float a){return a*a*${HMAX.toFixed(1)};}
void main(){
  vec2 d=uv-.5;
  if(dot(d,d)>R*R){gl_FragColor=vec4(0.);return;}
  vec4 A=bs(tA,uv);
  float h=H(A.a);
  // 그릇 바닥에 지는 그림자 (빛이 왼쪽 위 → 오른쪽 아래로)
  float hs=H(texture2D(tA,uv+vec2(-.48,-.62)*(1.6/N)).a);
  float sh=smoothstep(.05,.9,hs)*.2;
  // 가장자리: 두께 대신 '덮임'(0~1)의 절반 선 → 칸 모양(팔각형·물결) 없이 매끈한 곡선
  vec4 B=bs(tB,uv);
  float w=${deriv ? "max(fwidth(B.z)*.8,.003)" : ".04"};
  float al=smoothstep(.36-w,.36+w,B.z);
  if(al<.002){gl_FragColor=vec4(0.,0.,0.,sh);return;}
  vec3 n=normalize(vec3(-(B.x*3.-1.5)*2.6,-(B.y*3.-1.5)*2.6,1.));
  vec3 L=vec3(-.48,-.62,.62);
  float k=clamp(.92+(dot(n,L)-.62)*.5,.62,1.22);
  vec3 c=A.rgb;
  // 그늘은 회색으로 탁해지지 않게 같은 색을 더 진하게 (노랑 → 황토, 올리브 X)
  vec3 col=k<1.?pow(c,vec3(1.+(1.-k)*2.2))*(.86+.14*k):mix(c,vec3(1.),(k-1.)*.55);
  col*=.84+.16*smoothstep(.05,.6,h); // 얇은 가장자리는 살짝 어둡게 (두께감 · 하얀 물감도 접시와 구분)
  vec3 hv=normalize(L+vec3(0.,0.,1.));
  float nh=max(dot(n,hv),0.);
  col+=vec3(pow(nh,70.)*.45+pow(nh,9.)*.05); // 젖은 광택
  col=min(col,vec3(1.));
  float a=al+sh*(1.-al);
  gl_FragColor=vec4(col*al,a);
}`;
    const sh = (t, src) => {
      const s = gl.createShader(t);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = sh(gl.VERTEX_SHADER, VS),
      fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    const pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = (unit, name) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(pr, name), unit);
      return t;
    };
    const tA = tex(0, "tA"),
      tB = tex(1, "tB");
    gl.uniform1f(gl.getUniformLocation(pr, "N"), N);
    const uR = gl.getUniformLocation(pr, "R");
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const bA = new Uint8Array(N * N * 4),
      bB = new Uint8Array(N * N * 4);
    let lost = false;
    cv.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      lost = true;
    });
    return {
      cv,
      bA,
      bB,
      ok: () => !lost && !gl.isContextLost(),
      /** side: 그림 크기(px), r: 그릴 원 반지름(그림 폭 대비 0~0.5) */
      render(side, r) {
        side = Math.max(16, Math.round(side));
        if (cv.width !== side) cv.width = cv.height = side;
        gl.viewport(0, 0, side, side);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tA);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, bA);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tB);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, bB);
        gl.uniform1f(uR, r);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return !gl.isContextLost();
      },
    };
  };

  /* =================================================================
     손가락으로 젓는 물감 그릇 (걸쭉한 포스터 물감)
     - N×N 격자(기본 64)에 물감 5종의 양을 저장, 손가락 움직임으로 흐름(속도)을 만들고
       물감을 그 흐름대로 옮김(반라그랑주 이류) + 아주 약한 번짐 → 처음엔 줄무늬, 저을수록 한 색 (마블링)
     - 그리기: 칸마다 물감 색(KM, 비율 기억) → 2배 해상도로 부드럽게 보간 + 두께(높이) 음영·광택 + 주걱 자국(홈)
     - 점성: 물감이 두꺼운 곳은 흐름이 빨리 잦아듦, 흐름을 이웃과 나눔(덩어리로 움직임)
     - 가만히 있으면 계산·그리기를 거의 쉼 (저가 기기)
     - opt: { N, capacity, tilt(세로 납작 비율 — 탁자 위 그릇처럼, 1=정면) }
  ================================================================= */
  P.bowl = function (host, opt = {}) {
    const N = opt.N || 64;
    const NN = N * N;
    const tilt = opt.tilt || 1;
    const DAB = opt.dab || 0.1; // 한 방울 물감 덩어리 반지름 (격자 폭 대비)
    const IN = 0.43; // 물감이 담기는 안쪽 반지름 (그릇 지름 대비)
    const cv = U.el("canvas", "pbBowl");
    host.appendChild(cv);
    const cx = cv.getContext("2d");
    const M = Math.round(N * 2.5); // 그림 해상도 (계산 격자의 2.5배)
    const small = document.createElement("canvas");
    small.width = small.height = M;
    const sx = small.getContext("2d");
    const img = sx.createImageData(M, M);

    let pig = Array.from({ length: 5 }, () => new Float32Array(NN));
    let tmp = Array.from({ length: 5 }, () => new Float32Array(NN));
    const vx = new Float32Array(NN),
      vy = new Float32Array(NN),
      tvx = new Float32Array(NN),
      tvy = new Float32Array(NN);
    const groove = new Float32Array(NN); // 주걱이 지나간 홈 (0~1, 천천히 메워짐)
    const E = new Float32Array(NN), // 보이는 두께
      GX = new Float32Array(NN),
      GY = new Float32Array(NN),
      CR = new Float32Array(NN),
      CG = new Float32Array(NN),
      CB = new Float32Array(NN);
    const mask = new Uint8Array(NN);
    const src = new Uint8Array(NN), // 색 채우기 표시 (0 빈칸 · 1 물감 · 2~ 이웃에서 빌려 온 색)
      wall = new Int32Array(NN).fill(-1), // 그릇 밖 칸 → 가장 가까운 안쪽 칸 (물감이 벽까지 차도 가장자리가 비탈지지 않게)
      HS = new Float32Array(NN); // 빛 계산용 두께 (위가 납작한 물감 덩어리처럼)
    let G; // WebGL 그리기 (처음 그릴 때 만듦, 못 쓰면 null)
    const R = N / 2 - 1.2;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) mask[j * N + i] = Math.hypot(i + 0.5 - N / 2, j + 0.5 - N / 2) <= R ? 1 : 0;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const k = j * N + i;
        if (mask[k]) continue;
        const dx = i + 0.5 - N / 2,
          dy = j + 0.5 - N / 2,
          L = Math.hypot(dx, dy) || 1;
        for (let t = L - R + 0.5; t < L; t += 0.5) {
          const q = Math.floor(N / 2 + (dx / L) * (L - t)) + Math.floor(N / 2 + (dy / L) * (L - t)) * N;
          if (q >= 0 && q < NN && mask[q]) {
            wall[k] = q;
            break;
          }
        }
      }
    const BOTTOM = [0.965, 0.95, 0.925]; // 점토 접시 바닥 (따뜻한 흰색)
    const cc = [0, 0, 0],
      vv = [0, 0, 0, 0, 0];
    let stirHeat = 0, // 최근에 얼마나 열심히 저었는지 (0~1)
      moving = 0, // 최근 움직임 크기 (적으면 계산 생략)
      grooveMax = 0,
      idleT = 0,
      size = 300,
      scale = 1,
      dirty = true;
    const api = {
      cv,
      N,
      tilt,
      capacity: opt.capacity || 60,
      /** 그릇 안 물감 총량 [빨,노,파,하,검] */
      total() {
        const t = [0, 0, 0, 0, 0];
        for (let k = 0; k < 5; k++) {
          const a = pig[k];
          let s = 0;
          for (let i = 0; i < NN; i++) s += a[i];
          t[k] = s;
        }
        return t;
      },
      volume() {
        return api.total().reduce((a, b) => a + b, 0);
      },
      /** 전체를 다 섞었을 때의 색 (없으면 null) */
      color() {
        return P.mix(api.total());
      },
      /** 그릇 안 위치(0~1) → 화면 좌표 */
      toScreen(fx, fy) {
        const r = cv.getBoundingClientRect();
        const k = (IN * N) / R; // 격자 폭 N 이 그릇 지름의 몇 배인가
        return { x: r.left + r.width * (0.5 + (fx - 0.5) * k), y: r.top + r.height * (0.5 + (fy - 0.5) * k) };
      },
      /** 화면 좌표 → 캔버스 좌표(px, 납작하게 눕힌 것을 펴서) */
      fromClient(x, y) {
        const r = cv.getBoundingClientRect();
        return { x: ((x - r.left) / r.width) * size, y: ((y - r.top) / r.height) * size };
      },
      /** 물감 붓기: id(0~4), amt, 위치(0~1, 기본은 그릇 위쪽 가운데 근처) */
      pour(id, amt = 1, fx, fy) {
        if (api.volume() >= api.capacity) return false;
        const cxg = (fx == null ? 0.5 + U.randf(-0.12, 0.12) : fx) * N,
          cyg = (fy == null ? 0.42 + U.randf(-0.1, 0.1) : fy) * N;
        const sig = N * DAB, // 물감 덩어리 반지름 (가장자리가 또렷한 둥근 언덕)
          a = pig[id];
        let wsum = 0;
        const w = new Float32Array(NN);
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const k = j * N + i;
            if (!mask[k]) continue;
            const d2 = (i + 0.5 - cxg) ** 2 + (j + 0.5 - cyg) ** 2;
            if (d2 >= sig * sig) continue;
            const g = Math.pow(1 - d2 / (sig * sig), 0.6);
            w[k] = g;
            wsum += g;
          }
        if (wsum <= 0) return false;
        for (let k = 0; k < NN; k++) if (w[k]) a[k] += (amt * w[k]) / wsum;
        // 떨어진 자리에서 살짝 퍼지는 흐름
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const k = j * N + i;
            if (!w[k]) continue;
            const dx = i + 0.5 - cxg,
              dy = j + 0.5 - cyg,
              d = Math.hypot(dx, dy) || 1;
            vx[k] += (dx / d) * w[k] * 0.22;
            vy[k] += (dy / d) * w[k] * 0.22;
          }
        moving = Math.max(moving, 0.4);
        dirty = true;
        return true;
      },
      /** 젓기: 캔버스 좌표(px)와 움직인 양 */
      stir(px, py, dx, dy) {
        const s = R / (size * IN); // 안쪽 반지름(px) = 격자 R 칸
        const gx = N / 2 + (px - size / 2) * s,
          gy = N / 2 + (py - size / 2) * s,
          ux = dx * s,
          uy = dy * s;
        const rad = N * 0.14,
          rg = N * 0.05; // 주걱 끝 (홈)
        const i0 = Math.max(0, Math.floor(gx - rad)),
          i1 = Math.min(N - 1, Math.ceil(gx + rad)),
          j0 = Math.max(0, Math.floor(gy - rad)),
          j1 = Math.min(N - 1, Math.ceil(gy + rad));
        const sp = Math.hypot(ux, uy);
        for (let j = j0; j <= j1; j++)
          for (let i = i0; i <= i1; i++) {
            const k = j * N + i;
            if (!mask[k]) continue;
            const d = Math.hypot(i + 0.5 - gx, j + 0.5 - gy);
            if (d > rad) continue;
            const f = 1 - d / rad;
            vx[k] += ux * f * f * 1.1;
            vy[k] += uy * f * f * 1.1;
            if (d < rg && sp > 0.05) groove[k] = Math.max(groove[k], (1 - d / rg) * Math.min(1, 0.5 + sp));
          }
        grooveMax = 1;
        moving = Math.max(moving, Math.min(3, sp));
        stirHeat = Math.min(1, stirHeat + Math.min(0.08, sp * 0.05));
        dirty = true;
      },
      clear() {
        pig.forEach((a) => a.fill(0));
        vx.fill(0);
        vy.fill(0);
        groove.fill(0);
        dirty = true;
      },
      /** 한 걸음 진행 (dt 초) */
      step(dt) {
        const k60 = Math.min(3, dt * 60);
        if (moving > 0.01) {
          // 점성: 흐름을 이웃과 나눔 (덩어리로 움직임)
          for (let j = 1; j < N - 1; j++)
            for (let i = 1; i < N - 1; i++) {
              const k = j * N + i;
              if (!mask[k]) continue;
              tvx[k] = vx[k] * 0.6 + (vx[k - 1] + vx[k + 1] + vx[k - N] + vx[k + N]) * 0.1;
              tvy[k] = vy[k] * 0.6 + (vy[k - 1] + vy[k + 1] + vy[k - N] + vy[k + N]) * 0.1;
            }
          vx.set(tvx);
          vy.set(tvy);
          // 이류: 각 칸이 흐름을 거슬러 올라간 자리의 물감을 가져옴
          for (let c = 0; c < 5; c++) tmp[c].fill(0);
          for (let j = 0; j < N; j++)
            for (let i = 0; i < N; i++) {
              const k = j * N + i;
              if (!mask[k]) continue;
              let x = i - vx[k] * k60,
                y = j - vy[k] * k60;
              x = U.clamp(x, 0, N - 1.001);
              y = U.clamp(y, 0, N - 1.001);
              const x0 = x | 0,
                y0 = y | 0,
                fx = x - x0,
                fy = y - y0;
              const a = y0 * N + x0,
                b = a + 1,
                c2 = a + N,
                d = c2 + 1;
              const wa = (1 - fx) * (1 - fy) * mask[a],
                wb = fx * (1 - fy) * mask[b],
                wc = (1 - fx) * fy * mask[c2],
                wd = fx * fy * mask[d];
              const ws = wa + wb + wc + wd || 1;
              for (let p = 0; p < 5; p++) {
                const s = pig[p];
                tmp[p][k] = (s[a] * wa + s[b] * wb + s[c2] * wc + s[d] * wd) / ws;
              }
            }
          // 물감 총량 보존 (이류 과정의 오차 보정)
          for (let p = 0; p < 5; p++) {
            let s0 = 0,
              s1 = 0;
            const A = pig[p],
              B = tmp[p];
            for (let k = 0; k < NN; k++) {
              s0 += A[k];
              s1 += B[k];
            }
            if (s1 > 1e-6) {
              const r = s0 / s1;
              for (let k = 0; k < NN; k++) B[k] *= r;
            }
          }
          const sw = pig;
          pig = tmp;
          tmp = sw;
          // 흐름은 점점 잦아듦 — 물감이 두꺼운 곳은 더 빨리 (걸쭉함)
          const vol = api.volume();
          const thick = (230 * Math.min(4, Math.max(1, 4 / Math.max(vol, 0.25)))) / 2.5;
          let mx = 0;
          for (let k = 0; k < NN; k++) {
            if (!mask[k]) continue;
            const s = pig[0][k] + pig[1][k] + pig[2][k] + pig[3][k] + pig[4][k];
            const damp = Math.pow(0.9 - 0.07 * Math.min(1, s * thick), k60);
            vx[k] *= damp;
            vy[k] *= damp;
            const m = Math.abs(vx[k]) + Math.abs(vy[k]);
            if (m > mx) mx = m;
          }
          moving = mx;
          dirty = true;
        }
        // 주걱 홈은 천천히 메워짐
        if (grooveMax > 0.003) {
          const g = Math.pow(0.94, k60);
          let gm = 0;
          for (let k = 0; k < NN; k++) {
            const v = (groove[k] *= g);
            if (v > gm) gm = v;
          }
          grooveMax = gm;
          dirty = true;
        }
        // 번짐: 가만히 두면 아주 천천히(0.5초마다 한 번), 저으면 빠르게 섞임
        stirHeat = Math.max(0, stirHeat - dt * 0.7);
        if (stirHeat > 0.01 || moving > 0.01) {
          api._diffuse(Math.min(0.24, (0.003 + 0.13 * stirHeat) * k60));
          idleT = 0;
        } else if ((idleT += dt) > 0.5) {
          api._diffuse(Math.min(0.2, 0.003 * idleT * 60));
          idleT = 0;
        }
      },
      /** 번짐 — 걸쭉한 물감: 두께는 아주 조금만 퍼지고(빈 곳으로 안개처럼 번지지 않게),
          물감이 닿아 있는 칸끼리는 '섞인 비율'을 나눔(저을수록 한 색) */
      _diffuse(rate) {
        if (rate <= 0) return;
        const TH = tvx; // 빌려 씀 (step 안에서만 쓰는 임시 칸)
        let any = false;
        for (let k = 0; k < NN; k++) {
          const s = pig[0][k] + pig[1][k] + pig[2][k] + pig[3][k] + pig[4][k];
          TH[k] = s;
          if (s > 1e-6) any = true;
        }
        if (!any) return;
        const lev = rate * 0.1,
          EPS = 1e-6;
        for (let p = 0; p < 5; p++) {
          const A = pig[p],
            B = tmp[p];
          let s0 = 0,
            s1 = 0;
          for (let j = 0; j < N; j++)
            for (let i = 0; i < N; i++) {
              const k = j * N + i;
              if (!mask[k]) {
                B[k] = 0;
                continue;
              }
              const a = A[k];
              s0 += a;
              let sa = 0,
                n = 0,
                sf = 0,
                nf = 0;
              const nb = (q) => {
                sa += A[q];
                n++;
                if (TH[q] > EPS) {
                  sf += A[q] / TH[q];
                  nf++;
                }
              };
              if (i > 0 && mask[k - 1]) nb(k - 1);
              if (i < N - 1 && mask[k + 1]) nb(k + 1);
              if (j > 0 && mask[k - N]) nb(k - N);
              if (j < N - 1 && mask[k + N]) nb(k + N);
              let b = a + (n ? lev * (sa / n - a) : 0);
              const s = TH[k];
              if (s > EPS && nf) b += rate * s * (sf / nf - a / s);
              B[k] = b > 0 ? b : 0;
              s1 += B[k];
            }
          if (s1 > 1e-9) {
            const r = s0 / s1;
            for (let k = 0; k < NN; k++) B[k] *= r;
          }
          pig[p] = B;
          tmp[p] = A;
        }
        dirty = true;
      },
      /** 얼마나 고르게 섞였는지 (0~1, 1=완전히 한 색) 와 물감이 덮은 비율 */
      evenness() {
        const tot = api.total();
        const all = tot.reduce((a, b) => a + b, 0);
        if (all < 1e-3) return { even: 0, cover: 0 };
        const ref = tot.map((x) => x / all);
        let dev = 0,
          wsum = 0,
          covered = 0,
          inside = 0;
        for (let k = 0; k < NN; k++) {
          if (!mask[k]) continue;
          inside++;
          let s = 0;
          for (let p = 0; p < 5; p++) s += pig[p][k];
          if (s > 0.004 * (44 * 44) / NN) covered++;
          if (s < 1e-5) continue;
          let d = 0;
          for (let p = 0; p < 5; p++) d += Math.abs(pig[p][k] / s - ref[p]);
          dev += d * s;
          wsum += s;
        }
        return { even: U.clamp(1 - dev / (wsum || 1) / 0.55, 0, 1), cover: covered / inside };
      },
      /** 화면 크기 맞추기 (지름 px) */
      fit(px) {
        size = px;
        // 화면 해상도대로 (예전엔 900px 넘으면 1배로 그려 태블릿에서 흐렸음), 너무 크면 1400px 까지
        const dpr = Math.min(2, devicePixelRatio || 1) || 1;
        const d = Math.max(1, Math.min(dpr, 1400 / px));
        scale = d;
        cv.width = cv.height = Math.round(px * d);
        cv.style.width = px + "px";
        cv.style.height = Math.round(px * tilt) + "px";
        cx.setTransform(d, 0, 0, d, 0, 0);
        dirty = true;
      },
      size: () => size,
      draw() {
        if (!dirty) return;
        dirty = false;
        const vol = api.volume();
        // 물감이 적게 퍼져 있으면 진하게 보여 줌 (한두 방울을 넓게 저어도 색이 보이게)
        const gain = ((260 * (44 * 44)) / NN) * Math.min(4, Math.max(1, 4 / Math.max(vol, 0.25)));
        // 1) 칸마다: 색(KM) · 보이는 두께(홈 빼고)
        for (let k = 0; k < NN; k++) {
          if (!mask[k]) {
            E[k] = 0;
            continue;
          }
          let s = 0;
          for (let p = 0; p < 5; p++) s += vv[p] = pig[p][k];
          const h = s * gain;
          E[k] = h * (1 - 0.8 * groove[k]);
          if (h > 0.02 && P.mixFast(vv, cc)) {
            CR[k] = cc[0];
            CG[k] = cc[1];
            CB[k] = cc[2];
          } else {
            CR[k] = BOTTOM[0];
            CG[k] = BOTTOM[1];
            CB[k] = BOTTOM[2];
          }
        }
        // 물감이 없는 칸의 색은 옆 물감 색으로 두 겹까지 (가장자리가 하얗게 바래 보이지 않게)
        for (let k = 0; k < NN; k++) src[k] = E[k] > 0.02 ? 1 : 0;
        for (let pass = 0; pass < 2; pass++)
          for (let j = 1; j < N - 1; j++)
            for (let i = 1; i < N - 1; i++) {
              const k = j * N + i;
              if (src[k] || !mask[k]) continue;
              let best = -1,
                bh = -1;
              for (const o of [-1, 1, -N, N]) {
                const q = k + o;
                if (src[q] && src[q] <= pass + 1 && E[q] > bh) (bh = E[q]), (best = q);
              }
              if (best >= 0) {
                CR[k] = CR[best];
                CG[k] = CG[best];
                CB[k] = CB[best];
                src[k] = pass + 2;
              }
            }
        const S = size,
          C = S / 2,
          rin = S * IN;
        const side = rin * 2 * (N / 2 / R);
        if (G === undefined) G = P._paintGL(N);
        let viaGL = false;
        if (G && G.ok()) {
          // 화면 해상도로 그리기: 칸 색·두께·기울기를 텍스처로 넘김
          // 그릇 밖 칸은 안쪽 이웃 두께·색을 그대로 → 벽에 닿은 물감이 평평하게 이어지고 그릇 테가 깔끔히 자름
          for (let k = 0; k < NN; k++) {
            const q = wall[k];
            if (q < 0) continue;
            E[k] = E[q];
            CR[k] = CR[q];
            CG[k] = CG[q];
            CB[k] = CB[q];
          }
          for (let k = 0; k < NN; k++) HS[k] = 2.2 * (1 - Math.exp(-E[k] / 2.2));
          const bA = G.bA,
            bB = G.bB;
          for (let j = 0; j < N; j++)
            for (let i = 0; i < N; i++) {
              const k = j * N + i,
                o = k * 4;
              const l = i > 0 ? HS[k - 1] : HS[k],
                r = i < N - 1 ? HS[k + 1] : HS[k],
                u = j > 0 ? HS[k - N] : HS[k],
                d = j < N - 1 ? HS[k + N] : HS[k];
              bA[o] = CR[k] * 255;
              bA[o + 1] = CG[k] * 255;
              bA[o + 2] = CB[k] * 255;
              bA[o + 3] = Math.sqrt(Math.min(E[k], HMAX) / HMAX) * 255;
              bB[o] = (U.clamp((r - l) * 0.5, -1.5, 1.5) + 1.5) * 85;
              bB[o + 1] = (U.clamp((d - u) * 0.5, -1.5, 1.5) + 1.5) * 85;
              GX[k] = E[k] / (E[k] + 0.12); // 덮임 (아래에서 이웃과 부드럽게 섞음)
            }
          // 덮임을 3×3 가우스로 두 번 번지게 → 절반 선이 칸 모양을 안 따라감
          for (let pass = 0; pass < 2; pass++) {
            const a = pass ? GY : GX,
              b = pass ? GX : GY;
            for (let j = 0; j < N; j++)
              for (let i = 0; i < N; i++) {
                let t = 0,
                  ws = 0;
                for (let y = -1; y <= 1; y++)
                  for (let x = -1; x <= 1; x++) {
                    const ii = i + x,
                      jj = j + y;
                    if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue;
                    const wt = (2 - Math.abs(x)) * (2 - Math.abs(y));
                    t += a[jj * N + ii] * wt;
                    ws += wt;
                  }
                b[j * N + i] = t / ws;
              }
          }
          for (let k = 0; k < NN; k++) bB[k * 4 + 2] = GX[k] * 255;
          viaGL = G.render(Math.min(1400, side * scale), (R + 1.5) / N); // 원 테두리는 그릇(2D)이 자름
        }
        if (!viaGL) {
          // 2) 두께 기울기 (빛 받는 면 · 그늘)
          for (let j = 0; j < N; j++)
            for (let i = 0; i < N; i++) {
              const k = j * N + i;
              const l = i > 0 ? E[k - 1] : E[k],
                r = i < N - 1 ? E[k + 1] : E[k],
                u = j > 0 ? E[k - N] : E[k],
                d = j < N - 1 ? E[k + N] : E[k];
              GX[k] = Math.max(-1.5, Math.min(1.5, (r - l) * 0.5));
              GY[k] = Math.max(-1.5, Math.min(1.5, (d - u) * 0.5));
            }
          // 3) 2배 해상도로 부드럽게: 색 · 두께 · 음영 · 광택
          const data = img.data;
          const LX = -0.48,
            LY = -0.62,
            LZ = 0.62; // 빛: 왼쪽 위
          const HX = LX,
            HY = LY,
            HZ = LZ + 1,
            HL = Math.hypot(HX, HY, HZ);
          const hx = HX / HL,
            hy = HY / HL,
            hz = HZ / HL;
          const KH = 2.0; // 높이 → 기울기 세기
          const c2 = M / 2;
          const rr = (R / N) * M;
          for (let y = 0; y < M; y++) {
            const gy = ((y + 0.5) * N) / M - 0.5;
            let y0 = Math.floor(gy);
            const fy = gy - y0;
            if (y0 < 0) y0 = 0;
            const y1 = Math.min(N - 1, y0 + 1);
            for (let x = 0; x < M; x++) {
              const o = (y * M + x) * 4;
              const ddx = x + 0.5 - c2,
                ddy = y + 0.5 - c2;
              if (ddx * ddx + ddy * ddy > rr * rr) {
                data[o + 3] = 0;
                continue;
              }
              const gx = ((x + 0.5) * N) / M - 0.5;
              let x0 = Math.floor(gx);
              const fx = gx - x0;
              if (x0 < 0) x0 = 0;
              const x1 = Math.min(N - 1, x0 + 1);
              const a = y0 * N + x0,
                b = y0 * N + x1,
                c = y1 * N + x0,
                d = y1 * N + x1;
              const wa = (1 - fx) * (1 - fy),
                wb = fx * (1 - fy),
                wc = (1 - fx) * fy,
                wd = fx * fy;
              const h = E[a] * wa + E[b] * wb + E[c] * wc + E[d] * wd;
              // 물감 가장자리를 또렷하게 (얇게 번진 안개가 아니라 덩어리)
              let al = (h - 0.04) / 0.16;
              al = al <= 0 ? 0 : al >= 1 ? 1 : al * al * (3 - 2 * al);
              let r = BOTTOM[0],
                g = BOTTOM[1],
                bl = BOTTOM[2];
              if (al > 0.001) {
                const pr = CR[a] * wa + CR[b] * wb + CR[c] * wc + CR[d] * wd,
                  pg = CG[a] * wa + CG[b] * wb + CG[c] * wc + CG[d] * wd,
                  pb = CB[a] * wa + CB[b] * wb + CB[c] * wc + CB[d] * wd;
                const nx = -(GX[a] * wa + GX[b] * wb + GX[c] * wc + GX[d] * wd) * KH,
                  ny = -(GY[a] * wa + GY[b] * wb + GY[c] * wc + GY[d] * wd) * KH;
                const nl = 1 / Math.sqrt(nx * nx + ny * ny + 1);
                const dif = (nx * LX + ny * LY + LZ) * nl; // 0.62 = 평평
                const shade = 0.86 + (dif - LZ) * 0.55 + Math.min(0.06, h * 0.02);
                let sp = (nx * hx + ny * hy + hz) * nl;
                sp = sp > 0.9 ? (sp - 0.9) * 10 : 0; // 좁은 광택
                sp = sp * sp * 0.55 * al;
                r = r * (1 - al) + Math.min(1, pr * shade) * al + sp;
                g = g * (1 - al) + Math.min(1, pg * shade) * al + sp;
                bl = bl * (1 - al) + Math.min(1, pb * shade) * al + sp;
              }
              data[o] = r * 255;
              data[o + 1] = g * 255;
              data[o + 2] = bl * 255;
              data[o + 3] = 255;
            }
          }
          sx.putImageData(img, 0, 0);
        }
        // 4) 점토 접시 + 물감
        cx.clearRect(0, 0, S, S);
        // 접시 몸통 (바깥 둘레·두께)
        const body = cx.createRadialGradient(C - S * 0.12, C - S * 0.14, S * 0.05, C, C, S * 0.5);
        body.addColorStop(0, "#fffdf8");
        body.addColorStop(0.75, "#f3ece0");
        body.addColorStop(1, "#ddd0bd");
        cx.fillStyle = body;
        cx.beginPath();
        cx.arc(C, C, S * 0.49, 0, Math.PI * 2);
        cx.fill();
        // 안쪽 우묵한 곳
        cx.save();
        cx.beginPath();
        cx.arc(C, C, rin, 0, Math.PI * 2);
        cx.clip();
        cx.imageSmoothingEnabled = true;
        if (viaGL) {
          cx.fillStyle = "rgb(" + BOTTOM.map((x) => Math.round(x * 255)).join(",") + ")";
          cx.fillRect(0, 0, S, S);
        }
        cx.drawImage(viaGL ? G.cv : small, C - side / 2, C - side / 2, side, side);
        // 우묵한 벽 그늘 (빛 반대쪽 = 왼쪽 위 벽이 그늘)
        const inner = cx.createRadialGradient(C + S * 0.05, C + S * 0.06, rin * 0.78, C, C, rin * 1.02);
        inner.addColorStop(0, "rgba(90,60,30,0)");
        inner.addColorStop(1, "rgba(90,60,30,.28)");
        cx.fillStyle = inner;
        cx.fillRect(0, 0, S, S);
        cx.restore();
        // 테두리 윤기
        cx.lineWidth = S * 0.012;
        cx.strokeStyle = "rgba(255,255,255,.9)";
        cx.beginPath();
        cx.arc(C, C, rin + S * 0.012, Math.PI * 0.15, Math.PI * 1.05);
        cx.stroke();
        cx.strokeStyle = "rgba(120,90,60,.22)";
        cx.beginPath();
        cx.arc(C, C, rin + S * 0.008, Math.PI * 1.15, Math.PI * 2.05);
        cx.stroke();
        cx.lineWidth = S * 0.01;
        cx.strokeStyle = "rgba(255,255,255,.75)";
        cx.beginPath();
        cx.arc(C, C, S * 0.475, Math.PI * 1.1, Math.PI * 1.7);
        cx.stroke();
      },
      /** 저장(앱을 껐다 켜도 그릇 그대로) — 0~255 로 줄여 문자열로 */
      save() {
        const mx = Math.max(1e-6, ...pig.map((a) => a.reduce((m, x) => Math.max(m, x), 0)));
        const bytes = new Uint8Array(NN * 5);
        pig.forEach((a, p) => a.forEach((x, k) => (bytes[p * NN + k] = Math.round((x / mx) * 255))));
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return { N, mx, d: btoa(bin) };
      },
      /** 불러오기 — 예전 44칸 그릇도 지금 칸 수로 옮겨 담음 (물감 양 그대로) */
      load(o) {
        try {
          if (!o || !(o.N >= 8 && o.N <= 256) || typeof o.d !== "string" || !(o.mx > 0)) return false;
          const n0 = o.N,
            nn0 = n0 * n0;
          const bin = atob(o.d);
          if (bin.length !== nn0 * 5) return false;
          const src = Array.from({ length: 5 }, (_, p) => {
            const a = new Float32Array(nn0);
            for (let k = 0; k < nn0; k++) a[k] = (bin.charCodeAt(p * nn0 + k) / 255) * o.mx;
            return a;
          });
          pig.forEach((a, p) => {
            const s = src[p];
            let want = 0;
            for (let k = 0; k < nn0; k++) want += s[k];
            if (n0 === N) for (let k = 0; k < NN; k++) a[k] = mask[k] ? s[k] : 0;
            else
              for (let j = 0; j < N; j++)
                for (let i = 0; i < N; i++) {
                  const k = j * N + i;
                  if (!mask[k]) {
                    a[k] = 0;
                    continue;
                  }
                  const x = U.clamp(((i + 0.5) / N) * n0 - 0.5, 0, n0 - 1.001),
                    y = U.clamp(((j + 0.5) / N) * n0 - 0.5, 0, n0 - 1.001);
                  const x0 = x | 0,
                    y0 = y | 0,
                    fx = x - x0,
                    fy = y - y0,
                    q = y0 * n0 + x0;
                  a[k] = s[q] * (1 - fx) * (1 - fy) + s[q + 1] * fx * (1 - fy) + s[q + n0] * (1 - fx) * fy + s[q + n0 + 1] * fx * fy;
                }
            let got = 0;
            for (let k = 0; k < NN; k++) got += a[k];
            if (got > 1e-9) for (let k = 0; k < NN; k++) a[k] *= want / got;
          });
          dirty = true;
          return true;
        } catch (e) {
          return false;
        }
      },
    };
    return api;
  };

  /* =================================================================
     도움말: 지금 그릇(tot)에서 목표 색(target, 레시피 v, 허용 거리 tol)으로 가려면 어떤 물감을 넣을까
     1) 그릇이 넘치기 전에 허용 거리 안으로 갈 길이 있는지: 레시피 비율로 맞추려면
        각 물감을 얼마나 더 넣어야 하는지(부족분)를 양을 늘려 가며 찾음 (다른 색이 섞였으면 묽혀서)
     2) 부족한 물감들 중에서 '한 방울 더 넣었을 때 거리가 가장 줄어드는' 물감을 고름
     → {id, lot(많이), need} 또는 null(되돌릴 수 없음 → 비우고 다시)  — 색 주문 맞추기·색깔 섞기가 같이 씀
  ================================================================= */
  P.advise = function (tot, v, target, tol, cap) {
    const vol = tot.reduce((x, y) => x + y, 0);
    let k = 0;
    v.forEach((x, i) => x > 0 && (k = Math.max(k, tot[i] / x)));
    k = Math.max(k, 0.9 / Math.min(...v.filter((x) => x > 0)));
    let add = null;
    if (!(cap > 0)) cap = vol + 60; // 상한이 없으면 무한 반복하지 않게
    for (let guard = 0; guard < 400; guard++, k += 0.3) {
      const a = v.map((x, i) => Math.max(0, k * x - tot[i]));
      const sum = a.reduce((x, y) => x + y, 0);
      if (vol + sum > cap) break;
      const w = tot.map((x, i) => x + a[i]);
      if (P.dist(P.mix(w), target) <= tol * 0.8) {
        add = a;
        break;
      }
    }
    if (!add) return null;
    const cur = P.dist(P.mix(tot) || [1, 1, 1], target);
    let best = null;
    add.forEach((need, id) => {
      if (need < 0.45) return;
      const w = tot.slice();
      w[id] += 0.9;
      const gain = cur - P.dist(P.mix(w), target);
      if (!best || gain > best.gain + 0.01 || (Math.abs(gain - best.gain) <= 0.01 && need > best.need)) best = { id, gain, need };
    });
    return best ? { id: best.id, lot: best.need >= 2.7, need: best.need } : null;
  };

  /* =================================================================
     물감 작업대 (실험실·색깔 섞기·색 주문 맞추기 공용 화면 부품)
     KP.paint.studio({ctx, jars:[0,1,2,3,4], capacity, tilt, hold, onPour(id), onStir()})
       hold: false 또는 () => boolean (누를 때마다 물음) — false 면 꾹 눌러도 계속 붓지 않고 한 방울만
     → { jarsEl, bowlEl, meterEl, bowl, fit(px), tick(dt), drain(), state, jar(id) }
     - 물감 튜브(점토): 톡 누르면 한 방울 쭉, 꾹 누르고 있으면 계속 (튜브가 눌렸다 펴짐, 방울이 날아가 그릇에 퐁)
     - 그릇: 손가락으로 빙글빙글 저으면 마블링처럼 섞임 (나무 주걱이 손가락을 따라감, 지나간 자리에 홈)
     - 섞기 막대: 얼마나 고르게 섞였는지
     - 튜브 그림: assets/play-clay/paint/tube.png (흰 튜브) 에 물감색을 곱하기로 입힘
  ================================================================= */
  const ART = "assets/play-clay/paint/";
  P.ART = ART;
  KP.css("paint-studio", `
    .psJars{display:flex;gap:clamp(6px,1.4vw,12px);justify-content:center;align-items:flex-end;flex-wrap:wrap}
    .psJar{position:relative;width:clamp(66px,8.6vw,86px);height:clamp(84px,11vw,108px);touch-action:none;background:none;border:0;padding:0}
    .psJar .tb{position:absolute;left:50%;bottom:20%;height:80%;width:auto;aspect-ratio:141/300;transform:translateX(-50%) rotate(180deg);transform-origin:50% 50%;transition:transform .12s;filter:drop-shadow(0 5px 3px rgba(80,50,20,.28))}
    .psJar.pour .tb{transform:translateX(-50%) rotate(180deg) scale(1.1,.86)}
    .psJar .jn{position:absolute;left:-4px;right:-4px;bottom:-4px;text-align:center;font-size:clamp(14px,1.8vw,17px);background:rgba(255,251,242,.95);border-radius:999px;box-shadow:0 3px 0 rgba(90,60,30,.15);padding:1px 0}
    .psJar .jd{position:absolute;left:50%;top:-2%;width:30%;aspect-ratio:1;margin-left:-15%;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -2px -3px 0 rgba(0,0,0,.14),0 0 0 2px rgba(255,255,255,.75);opacity:0;transform:scale(.3);transition:opacity .12s,transform .12s}
    .psJar.pour .jd{opacity:1;transform:scale(1)}
    .psBowlBox{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px}
    .pbBowl{display:block;touch-action:none;filter:drop-shadow(0 9px 6px rgba(80,50,20,.25))}
    .psSpoon{position:absolute;left:0;top:0;width:clamp(90px,14vmin,150px);pointer-events:none;transform-origin:8% 92%;transition:opacity .25s;z-index:3;filter:drop-shadow(0 6px 4px rgba(80,50,20,.3))}
    .psSpoon.rest{opacity:.95}
    .psMeter{display:flex;align-items:center;gap:8px;font-size:clamp(15px,2vw,19px);color:var(--ink2);background:rgba(255,251,242,.85);border-radius:999px;padding:2px 12px}
    .psMeter .pbar{display:inline-block;flex:0 0 auto;width:clamp(110px,20vw,210px);height:16px;border-radius:999px;background:#fff;box-shadow:inset 0 2px 4px rgba(0,0,0,.12);overflow:hidden}
    .psMeter .pbar i{display:block;height:16px;width:0;border-radius:999px;background:linear-gradient(90deg,#ffd166,#06d6a0);transition:width .3s}
    .psDrop{position:fixed;z-index:70;width:22px;height:26px;margin:-13px 0 0 -11px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -3px -4px 0 rgba(0,0,0,.14),0 0 0 2px rgba(255,255,255,.7);pointer-events:none;transition:transform .38s cubic-bezier(.45,-0.3,.7,1)}
    .pbBowl.drain{transition:opacity .6s, transform .6s;opacity:.15;transform:scale(.9) rotate(-8deg)}
  `);
  /** 흰 튜브 그림에 물감색 입히기 (곱하기) → 캔버스. 그림을 못 불러오면 단색 둥근 튜브 */
  const tubeCache = {};
  let tubeImg = null;
  P.tubeCanvas = function (hex, cb) {
    if (tubeCache[hex]) return cb(tubeCache[hex]);
    const make = (im) => {
      const W = 141, H = 300;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      if (im) {
        g.drawImage(im, 0, 0, W, H);
        // 하양은 그대로, 검정은 그림자가 보이게 조금 밝게
        const tint = hex.toLowerCase() === "#ffffff" ? null : P.hex(P.rgb(hex).map((x) => (hex === P.BASE[4].hex ? 0.2 + x * 0.8 : x)));
        if (tint) {
          g.globalCompositeOperation = "multiply";
          g.fillStyle = tint;
          g.fillRect(0, 0, W, H * 0.8); // 뚜껑(아래 20%)은 흰색 그대로
          g.globalCompositeOperation = "destination-in";
          g.drawImage(im, 0, 0, W, H);
        }
      } else {
        g.fillStyle = hex;
        g.beginPath();
        if (g.roundRect) g.roundRect(20, 10, W - 40, H - 20, 30);
        else g.rect(20, 10, W - 40, H - 20); // 옛 사파리(15.4 미만)
        g.fill();
      }
      tubeCache[hex] = c;
      cb(c);
    };
    if (tubeImg === false) return make(null);
    if (tubeImg && tubeImg.complete) return make(tubeImg);
    if (!tubeImg) {
      tubeImg = new Image();
      tubeImg.src = ART + "tube.png";
    }
    tubeImg.addEventListener("load", () => make(tubeImg), { once: true });
    tubeImg.addEventListener("error", () => ((tubeImg = false), make(null)), { once: true });
  };
  P.studio = function (o = {}) {
    const ctx = o.ctx;
    const A = KP.audio;
    const jarsEl = U.el("div", "psJars");
    const bowlEl = U.el("div", "psBowlBox");
    const bowl = P.bowl(bowlEl, { capacity: o.capacity || 60, tilt: o.tilt || 1, dab: o.dab });
    const spoon = U.el("img", "psSpoon rest");
    spoon.src = ART + "stick.png";
    spoon.alt = "";
    spoon.draggable = false;
    bowlEl.appendChild(spoon);
    const meterEl = U.el("div", "psMeter", "<span>섞기</span><span class=\"pbar\"><i></i></span>");
    bowlEl.appendChild(meterEl);
    const st = { lastPourAt: 0, lastStirAt: 0, pending: 0, even: 0, cover: 0, enabled: true, pours: 0 };
    const NOTE = ["C5", "E5", "G5", "C6", "A4"];

    /* 물감 튜브 */
    (o.jars || [0, 1, 2, 3, 4]).forEach((id) => {
      const p = P.BASE[id];
      const j = U.el("button", "psJar", '<canvas class="tb" width="141" height="300"></canvas><span class="jd"></span><span class="jn">' + p.n + "</span>");
      j.style.setProperty("--c", p.hex);
      j.dataset.id = id;
      const tcv = j.querySelector(".tb");
      P.tubeCanvas(p.hex, (c) => tcv.getContext("2d").drawImage(c, 0, 0));
      let t = null,
        held = false;
      const drop = () => {
        if (!st.enabled) return;
        if (bowl.volume() + st.pending >= bowl.capacity) {
          if (!st.fullTold) {
            st.fullTold = true;
            KP.voice.say("그릇이 가득 찼어요! 비우고 다시 해요.");
          }
          return;
        }
        st.pending += 0.9;
        const a = j.getBoundingClientRect();
        const fx = 0.5 + U.randf(-(o.spread || 0.2), o.spread || 0.2),
          fy = 0.45 + U.randf(-(o.spread || 0.2) * 0.8, (o.spread || 0.2) * 0.8);
        const tp = bowl.toScreen(fx, fy);
        const d = U.el("div", "psDrop");
        d.style.setProperty("--c", p.hex);
        const sx0 = a.left + a.width / 2,
          sy0 = a.top + a.height * 0.06;
        d.style.left = sx0 + "px";
        d.style.top = sy0 + "px";
        document.body.appendChild(d);
        requestAnimationFrame(() => (d.style.transform = "translate(" + (tp.x - sx0) + "px," + (tp.y - sy0) + "px) scale(.9)"));
        A.noise({ dur: 0.09, vol: 0.06, bp: 260, bpTo: 520, q: 2 }); // 쭉
        setTimeout(() => {
          d.remove();
          st.pending = Math.max(0, st.pending - 0.9);
          if (ctx && !ctx._active) return;
          bowl.pour(id, 0.9, fx, fy);
          st.lastPourAt = performance.now();
          st.pours++;
          A.tone(A.hz(NOTE[id]) * U.randf(0.95, 1.05), { to: A.hz(NOTE[id]) * 0.6, dur: 0.12, vol: 0.18 });
          A.noise({ dur: 0.06, vol: 0.05, bp: 800, q: 2 });
          o.onPour && o.onPour(id);
        }, 390);
      };
      j.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        A.unlock();
        if (!st.enabled) return;
        held = true;
        j.classList.add("pour");
        drop();
        clearInterval(t);
        // hold:false (또는 false 를 돌려주는 함수) → 꾹 눌러도 한 방울만 (톡 = 한 방울을 익히는 단계용)
        const hold = typeof o.hold === "function" ? o.hold() : o.hold !== false;
        if (!hold) return;
        t = setInterval(() => (held && (!ctx || ctx._active) ? drop() : clearInterval(t)), 200);
      });
      const end = () => {
        held = false;
        clearInterval(t);
        j.classList.remove("pour");
      };
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => j.addEventListener(ev, end));
      jarsEl.appendChild(j);
    });

    /* 젓기 (나무 주걱) */
    let last = null,
      pid = null, // 젓는 손가락 (다른 손가락·손바닥은 무시 — 좌표가 튀어 마블링이 깨지지 않게)
      lastSnd = 0,
      ang = -30;
    const cv = bowl.cv;
    const local = (e) => bowl.fromClient(e.clientX, e.clientY);
    // 주걱: 쉬는 동안은 그릇 오른쪽 가장자리에 걸쳐 둠
    const restSpoon = () => {
      spoon.classList.add("rest");
      const S = bowl.size(),
        bw = spoon.offsetWidth || 110;
      const x = cv.offsetLeft + S * 0.78,
        y = cv.offsetTop + S * bowl.tilt * 0.62;
      spoon.style.transform = "translate(" + (x - bw * 0.08) + "px," + (y - bw * 0.92) + "px) rotate(8deg)";
    };
    const moveSpoon = (p, dx, dy) => {
      spoon.classList.remove("rest");
      const bw = spoon.offsetWidth || 110;
      // 끝(왼쪽 아래)이 손가락에 오게, 움직이는 쪽으로 살짝 기울임
      if (dx || dy) ang += (U.clamp(-dx * 2.2, -40, 40) - 10 - ang) * 0.25;
      const x = cv.offsetLeft + (p.x / bowl.size()) * cv.offsetWidth,
        y = cv.offsetTop + (p.y / bowl.size()) * cv.offsetHeight;
      spoon.style.transform = "translate(" + (x - bw * 0.08) + "px," + (y - bw * 0.92) + "px) rotate(" + ang + "deg)";
    };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (last && e.pointerId !== pid) return;
      pid = e.pointerId;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
      last = local(e);
      moveSpoon(last, 0, 0);
    });
    cv.addEventListener("pointermove", (e) => {
      if (!last || e.pointerId !== pid) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      let mdx = 0,
        mdy = 0;
      for (const ev of evs) {
        const p = local(ev);
        const dx = p.x - last.x,
          dy = p.y - last.y;
        bowl.stir(p.x, p.y, dx, dy);
        mdx += dx;
        mdy += dy;
        last = p;
      }
      moveSpoon(last, mdx, mdy);
      st.lastStirAt = performance.now();
      if (performance.now() - lastSnd > 140 && bowl.volume() > 0.3) {
        lastSnd = performance.now();
        A.noise({ dur: 0.14, vol: 0.05 + Math.min(0.05, Math.hypot(mdx, mdy) * 0.002), bp: 300 + Math.random() * 160, q: 3 }); // 찰박
      }
      o.onStir && o.onStir();
    });
    const endStir = (e) => {
      if (e && e.pointerId !== pid) return;
      last = null;
      pid = null;
      restSpoon();
    };
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => cv.addEventListener(ev, endStir));

    let acc = 0,
      simAcc = 0;
    const api = {
      jarsEl,
      bowlEl,
      meterEl,
      bowl,
      spoon,
      state: st,
      jar: (id) => jarsEl.querySelector('.psJar[data-id="' + id + '"]'),
      fit(px) {
        bowl.fit(Math.max(140, Math.round(px)));
        requestAnimationFrame(() => !last && restSpoon());
      },
      /** 매 프레임 호출 — 물감 계산·그리기는 초당 최대 30번 (저가 기기) */
      tick(dt) {
        simAcc += dt;
        if (simAcc >= 1 / 31) {
          bowl.step(Math.min(0.1, simAcc));
          bowl.draw();
          simAcc = 0;
        }
        acc += dt;
        if (acc > 0.25) {
          acc = 0;
          const ev = bowl.evenness();
          st.even = ev.even;
          st.cover = ev.cover;
          const v = bowl.volume();
          meterEl.querySelector("i").style.width = (v > 0.3 ? Math.round(ev.even * 100) : 0) + "%";
          if (v < bowl.capacity * 0.9) st.fullTold = false;
        }
      },
      /** 그릇 비우기 (연출 후 비움) */
      drain() {
        return new Promise((res) => {
          A.noise({ dur: 0.6, vol: 0.12, bp: 900, bpTo: 300, q: 1.5 });
          cv.classList.add("drain");
          setTimeout(() => {
            bowl.clear();
            cv.classList.remove("drain");
            res();
          }, 620);
        });
      },
      setEnabled(on) {
        st.enabled = on;
      },
    };
    return api;
  };

  /* =================================================================
     점토 물감 작업실 배경 (assets/play-clay/paint/bg.jpg, 1600×900) — 그림 속 흰 팔레트 접시가 그릇 바로 밑에 오게 자르기
     KP.paint.stageBg(el) → { align(bowlRect, hostRect) } — 그릇 위치가 바뀔 때마다 부름
  ================================================================= */
  P.STAGE = { file: ART + "bg.jpg", img: [1600, 900], pal: [0.5007, 0.7074, 0.3274] }; // 팔레트 가운데(u,v)·폭(그림 폭 대비)
  P.stageBg = function (el) {
    const S = P.STAGE;
    el.style.backgroundImage = 'url("' + S.file + '")';
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundColor = "#c98b4e";
    return {
      align(br, hr) {
        const w = hr.width,
          h = hr.height,
          ar = S.img[1] / S.img[0];
        if (!w || !h || !br.width) return;
        const bx = br.left - hr.left + br.width / 2,
          by = br.top - hr.top + br.height * 0.5;
        const base = Math.max((br.width * 0.97) / S.pal[2], w, h / ar);
        let best = null;
        for (let z = 1; z <= 2.2; z += 0.05) {
          const fw = base * z,
            fh = fw * ar;
          const ox = S.pal[0] * fw - bx,
            oy = S.pal[1] * fh - by;
          const cox = U.clamp(ox, 0, fw - w),
            coy = U.clamp(oy, 0, fh - h);
          const err = Math.hypot(cox - ox, coy - oy);
          if (!best || err < best.err - 0.5) best = { fw, fh, ox: cox, oy: coy, err };
          if (err < 2) break;
        }
        el.style.backgroundSize = Math.round(best.fw) + "px " + Math.round(best.fh) + "px";
        el.style.backgroundPosition = Math.round(-best.ox) + "px " + Math.round(-best.oy) + "px";
      },
    };
  };
})(window.KP);

;

/* ==== js/core/notebook.js ==== */
/* =====================================================================
   쓰기 공책 엔진 — 한글·ABC·숫자 쓰기 공책이 함께 쓰는 틀 (학습지식 따라 쓰기)
   KP.notebook({
     id, name, icon, cat,
     key: "저장 키",            // 별 기록
     paper: "han" | "abc" | "num", // 칸 모양 (십자 칸 / 영어 4줄)
     book: () => [{id, name, items:[...]}],
     partStrokes: (part) => 획,   // 낱말 쓰기에서 한 칸(글자)의 획
     partSmall: bool,            // 낱말 칸 획이 작은지(한글 글자 = 자음+모음이 한 칸에)
     firstHint: "처음 안내",
   })
   항목: {id, kind:"line"|"jamo"|"word", label, ch, say(한국어로 읽기), en(영어로 읽기, 선택),
          color, strokes, word:[낱말, 그림], syl(획이 작은 칸), parts(낱말의 칸들)}
   한 항목 = 공책 한 줄: ① 보고 따라 쓰기(획순 시범·번호·화살표) ② 흐린 글씨 ③ 보고 혼자 쓰기
   펜을 쓰면 손바닥 터치 무시, 필압 굵기, 획마다 85%·빠진 곳 15% 판정, 별 1~3·도장
   쓰는 중 크게 벗어나면 이어 쓸 곳 반짝(혼자 쓰기 칸 제외), 시범은 획 수를 "하나, 둘…" 세며
   다른 놀이에서 특정 글자로 바로 열기: KP.nbWant = {id, ch}; KP.open(id)
===================================================================== */
"use strict";
(function (KP) {
  KP.notebook = function (cfg) {
    KP.game({
      id: cfg.id,
      icon: cfg.icon,
      name: cfg.name,
      cat: cfg.cat || "study",
      setup(ctx) {
        const U = KP.u;
        const self = this;
        ctx.cfg = cfg;
        ctx.root.classList.add("nb");
        KP.css("notebook", `
          .screen.nb .stage{background:#fffdf6}
          .hwView{flex:1;min-height:0;display:none;flex-direction:column;position:relative}
          .hwView.on{display:flex}
          /* 목차 */
          .hwBook{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px clamp(10px,2vw,24px) 26px}
          .hwGo{display:flex;justify-content:center;margin:2px 0 10px}
          .hwSec{margin-bottom:14px}
          .hwSecH{display:flex;align-items:center;gap:10px;font-size:clamp(20px,2.6vw,26px);color:var(--night);margin:4px 2px 8px}
          .hwSecH .n{background:var(--night);color:#fff;border-radius:12px;padding:1px 10px;font-size:.8em}
          .hwSecH small{font-size:.65em;color:var(--ink2)}
          /* 접어 둔 묶음(숫자 21~99 등): [펼쳐 보기]를 누르면 칸이 보임 */
          .hwSec.fold .hwTiles{display:none}
          .hwSec.fold.open .hwTiles{display:grid}
          .hwFold{margin-left:auto;font-size:clamp(16px,2vw,20px);min-height:64px;padding:6px 16px}
          .hwSec.fold.open .hwFold{display:none}
          .hwTiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(74px,9.5vw,100px),1fr));gap:10px}
          .hwTile{position:relative;aspect-ratio:1;background:#fff;border-radius:18px;border:3px solid #e8ebf4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 4px 0 #e3e7f2;color:var(--c)}
          .hwTile .ch{font-size:clamp(34px,4.6vw,48px);line-height:1}
          .hwTile .ch .e{font-size:.9em}
          .hwTile.word .ch{font-size:clamp(20px,2.6vw,28px)}
          .hwTile .st{font-size:13px;letter-spacing:1px;color:#d9dce8;line-height:1}
          .hwTile .st b{color:#ffb800;font-weight:400}
          /* 다음 칸 반짝: 빛을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (glowLoop, app.css) — 매번 다시 칠하면 저가 태블릿이 버벅임. inset:-3px = 테두리 두께. 예전 glow 의 brightness(1.12)가 빛까지 밝혔으므로 빛 색을 미리 12% 밝게(197,49→221,55) */
          .hwTile.next{border-color:var(--star);animation:none}
          .hwTile.next::after,.glowNext::after{content:"";position:absolute;inset:-3px;border-radius:inherit;pointer-events:none;opacity:0;background:rgba(255,255,255,.1);
            box-shadow:0 0 0 10px rgba(255,221,55,.85),0 0 30px 10px rgba(255,221,55,.6);animation:glowLoop 1.4s ease-in-out infinite}
          .hwTile:active{transform:translateY(3px)}
          /* 쓰기 페이지 */
          .hwPage{flex:1;min-height:0;display:grid;grid-template-columns:minmax(150px,22%) 1fr minmax(120px,15%);grid-template-rows:minmax(0,1fr) auto;gap:8px 12px;padding:8px 12px 10px}
          .hwModel{grid-row:1/3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--c);text-align:center}
          .hwModel .big{font-size:clamp(70px,min(11vw,17vh),140px);line-height:1;background:#fff;border-radius:24px;padding:8px 16px;box-shadow:0 5px 0 #eceff6;min-width:1.3em;position:relative}
          .hwModel .big .e{font-size:.8em}
          /* 혼자 쓰기 칸 [다시 보기]: 본보기 자리에서 획순을 잠깐 보여 줌 */
          .hwPeek{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border-radius:18px;box-shadow:0 0 0 3px var(--star),0 6px 0 rgba(47,58,102,.1);z-index:4;pointer-events:none}
          /* 쓰는 중 벗어났을 때: 이어 쓸 곳 반짝 (부드럽게 커졌다 작아졌다 3번) */
          .hwSpot{position:absolute;display:none;border-radius:50%;border:4px solid #ffb800;background:rgba(255,210,63,.32);pointer-events:none;z-index:3;transform:translate(-50%,-50%)}
          .hwSpot.on{display:block;animation:hwSpot .5s ease-in-out 4 alternate}
          @keyframes hwSpot{from{transform:translate(-50%,-50%) scale(.75);opacity:.6}to{transform:translate(-50%,-50%) scale(1.2);opacity:1}}
          .hwModel .pic{display:flex;flex-direction:column;align-items:center;font-size:clamp(16px,2.2vw,24px);color:var(--ink)}
          .hwModel .pic .e{font-size:clamp(46px,min(6vw,9vh),78px)}
          .hwModel .pic b{color:var(--c);font-weight:400}
          .hwStepName{font-size:clamp(17px,2.2vw,24px);color:var(--night);background:var(--star);border-radius:14px;padding:4px 14px}
          .hwBoard{position:relative;min-width:0;min-height:0}
          .hwBoard canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);touch-action:none}
          .hwBoard canvas.guide{background:#fff;border-radius:6px;box-shadow:0 0 0 3px #f2b8a8,0 8px 0 rgba(47,58,102,.08)}
          .hwSide{grid-row:1/3;grid-column:3;display:flex;flex-direction:column;justify-content:center;gap:12px}
          .hwSide .btn{justify-content:center;min-height:64px}
          .hwLine{grid-column:2;display:flex;gap:8px;justify-content:center;align-items:center}
          .hwCell{width:clamp(54px,min(7vw,10vh),76px);aspect-ratio:1;border-radius:6px;background:#fff;box-shadow:0 0 0 2px #f2b8a8;position:relative;display:flex;align-items:center;justify-content:center;font-size:13px;color:#c9cede;overflow:hidden}
          .hwCell canvas{width:100%;height:100%}
          .hwCell.cur{box-shadow:0 0 0 4px var(--star)}
          .hwCell .s{position:absolute;bottom:1px;left:0;right:0;text-align:center;font-size:11px;color:#ffb800;letter-spacing:-1px}
          .hwDone{opacity:.35;pointer-events:none}
          .glowNext{position:relative;animation:none}
          .glowNext::after{inset:0;animation-duration:1s}
          @media (max-aspect-ratio:1/1){
            .hwPage{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) auto auto;padding:6px 8px 8px}
            .hwModel{grid-row:auto;flex-direction:row;gap:14px}
            .hwModel .big{font-size:58px;padding:4px 12px}
            .hwModel .pic{flex-direction:row;gap:6px}.hwModel .pic .e{font-size:44px}
            .hwSide{grid-row:auto;grid-column:auto;flex-direction:row;justify-content:center;flex-wrap:wrap;gap:8px}
            .hwLine{grid-column:auto}
            /* 폰: 단계 이름이 두 줄로 접히지 않게 */
            .hwStepName{font-size:15px;white-space:nowrap;padding:3px 10px}
            .hwSide .btn{min-height:64px}
          }
          @media (max-aspect-ratio:1/1) and (max-height:760px){
            .hwModel .big{font-size:46px}
            .hwModel .pic .e{font-size:36px}
            .hwSide .btn{font-size:16px;padding:8px 14px}
            .hwCell{width:42px}
          }
          @media (min-aspect-ratio:1/1) and (max-height:500px){
            .hwModel{grid-row:1;gap:4px}
            .hwModel .big{font-size:56px;padding:4px 12px}
            .hwModel .pic .e{font-size:38px}
            .hwBoard{grid-row:1/3;grid-column:2}
            .hwLine{grid-column:1;grid-row:2;gap:5px;flex-wrap:wrap}
            .hwCell{width:40px}
            .hwStepName{font-size:14px;white-space:nowrap;padding:3px 8px}
            .hwSide .btn{font-size:16px;padding:6px 10px;min-height:56px}
          }
          /* 도장 */
          .hwStamp{position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(255,253,246,.88);flex-direction:column;gap:14px}
          .hwStamp.on{display:flex}
          .hwSeal{width:clamp(170px,min(26vw,34vh),250px);aspect-ratio:1;border-radius:50%;border:8px solid #e8413a;color:#e8413a;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(30px,min(4.6vw,6vh),44px);line-height:1.15;transform:rotate(-12deg);box-shadow:inset 0 0 0 5px #fff,inset 0 0 0 9px #e8413a;background:rgba(255,255,255,.6);animation:seal .5s cubic-bezier(.2,1.5,.4,1)}
          .hwSeal small{font-size:.45em;margin-top:4px}
          @keyframes seal{from{transform:rotate(-12deg) scale(2.4);opacity:0}}
          .hwStars{font-size:clamp(34px,5vw,52px);letter-spacing:6px}
          .hwStars .off{filter:grayscale(1) opacity(.25)}
          .hwRes{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:0 8px}
          @media (max-width:520px){.hwRes .btn.big{font-size:18px;padding:10px 16px;min-height:64px}}
        `);
        ctx.book = cfg.book();
        ctx.items = ctx.book.flatMap((s) => s.items);
        ctx.stars = KP.store.get(cfg.key, {});
        if (!ctx.stars || typeof ctx.stars !== "object") ctx.stars = {};

        /* ---- 목차 화면 ---- */
        ctx.vBook = U.el("div", "hwView");
        const book = U.el("div", "hwBook");
        const go = U.el("div", "hwGo");
        ctx.bGo = U.btn(KP.E("✏️") + " 이어서 쓰기", "btn big primary");
        go.appendChild(ctx.bGo);
        book.appendChild(go);
        ctx.tap(ctx.bGo, () => self.openItem(ctx, self.nextIdx(ctx)));
        ctx.tiles = [];
        ctx.book.forEach((s, si) => {
          const box = U.el("section", "hwSec" + (s.fold ? " fold" : ""));
          const head = U.el("div", "hwSecH", '<span class="n">' + (si + 1) + "</span>" + s.name + " <small>" + s.items.length + "개</small>");
          box.appendChild(head);
          if (s.fold) {
            // 양이 많은 묶음은 접어 둠 — [펼쳐 보기]를 누르거나 차례가 오면 펼침
            const bOpen = U.btn(KP.E("👀") + " 펼쳐 보기", "btn hwFold");
            head.appendChild(bOpen);
            ctx.tap(bOpen, () => {
              KP.audio.sfx("open");
              box.classList.add("open");
            });
          }
          const grid = U.el("div", "hwTiles");
          s.items.forEach((it) => {
            const t = U.btn('<span class="ch">' + (it.kind === "line" ? KP.E(it.label) : it.label) + '</span><span class="st"></span>', "hwTile" + (it.kind === "word" || String(it.label).length > 2 ? " word" : ""));
            t.style.setProperty("--c", it.color);
            const idx = ctx.items.indexOf(it);
            ctx.tap(t, () => self.openItem(ctx, idx));
            t.dataset.idx = idx;
            grid.appendChild(t);
            ctx.tiles[idx] = t;
          });
          box.appendChild(grid);
          book.appendChild(box);
        });
        ctx.vBook.appendChild(book);

        /* ---- 쓰기 화면 ---- */
        ctx.vPage = U.el("div", "hwView");
        const page = U.el("div", "hwPage");
        ctx.model = U.el("div", "hwModel");
        ctx.board = U.el("div", "hwBoard");
        ctx.gcv = U.el("canvas", "guide");
        ctx.icv = U.el("canvas", "ink");
        ctx.spot = U.el("div", "hwSpot");
        ctx.board.append(ctx.gcv, ctx.icv, ctx.spot);
        ctx.side = U.el("div", "hwSide");
        ctx.bShow = U.btn(KP.E("👀") + " 다시 보기", "btn");
        ctx.bAgain = U.btn(KP.E("🔄") + " 지우기", "btn");
        ctx.bDone = U.btn(KP.E("👍") + " 다 썼어요", "btn primary");
        ctx.bBook = U.btn(KP.E("📒") + " 목차", "btn");
        ctx.side.append(ctx.bShow, ctx.bAgain, ctx.bDone, ctx.bBook);
        ctx.line = U.el("div", "hwLine");
        page.append(ctx.model, ctx.board, ctx.side, ctx.line);
        ctx.stamp = U.el("div", "hwStamp");
        ctx.vPage.append(page, ctx.stamp);
        ctx.tap(ctx.bShow, () => self.demo(ctx));
        ctx.tap(ctx.bAgain, () => {
          KP.audio.sfx("back");
          self.cellReset(ctx);
        });
        ctx.tap(ctx.bDone, () => self.finishCell(ctx, true));
        ctx.tap(ctx.bBook, () => self.showBook(ctx));

        ctx.body.append(ctx.vBook, ctx.vPage);
        this.setupInk(ctx);
        addEventListener("resize", () => {
          if (ctx._active && ctx.vPage.classList.contains("on") && ctx.cell) {
            self.fit(ctx);
            ctx.spot.classList.remove("on");
            self.drawGuide(ctx);
            if (ctx.T.demoing) self.demo(ctx); // 시범 중이면 새 크기로 처음부터 다시
            else self.redrawInk(ctx);
          }
        });
      },

      start(ctx) {
        const want = KP.nbWant && KP.nbWant.id === cfg.id ? KP.nbWant.ch : null;
        KP.nbWant = null;
        const i = want != null ? ctx.items.findIndex((it) => it.ch === want) : -1;
        if (i >= 0) this.openItem(ctx, i, true);
        else this.showBook(ctx, true);
      },
      stop(ctx) {
        ctx.tok = (ctx.tok || 0) + 1;
      },

      /* ================= 목차 ================= */
      nextIdx(ctx) {
        const i = ctx.items.findIndex((it) => !ctx.stars[it.id]);
        return i < 0 ? 0 : i;
      },
      showBook(ctx, first) {
        ctx.tok = (ctx.tok || 0) + 1;
        ctx.vBook.classList.add("on");
        ctx.vPage.classList.remove("on");
        const nx = this.nextIdx(ctx);
        ctx.items.forEach((it, i) => {
          const t = ctx.tiles[i];
          const n = ctx.stars[it.id] || 0;
          t.querySelector(".st").innerHTML = n ? "<b>" + "★".repeat(n) + "</b>" + "★".repeat(3 - n) : "☆☆☆";
          t.classList.toggle("next", i === nx);
        });
        // 다음 칸이 접힌 묶음 안에 있으면 펼침
        const nsec = ctx.tiles[nx] && ctx.tiles[nx].closest(".hwSec.fold");
        if (nsec) nsec.classList.add("open");
        const done = Object.keys(ctx.stars).length;
        // 화면에는 쓴 개수, 말로는 숫자를 빼고(숫자가 붙으면 자연 음성이 없어 기기 목소리가 됨)
        if (done) ctx.say("✍️ 쓰기 공책이에요! " + done + "개 썼어요. 반짝이는 칸부터 써 봐요!", "쓰기 공책이에요! 반짝이는 칸부터 써 봐요!");
        else ctx.say("✍️ 쓰기 공책이에요! " + (cfg.firstHint || "첫 칸부터 시작해 볼까요?"));
        if (!first) KP.audio.sfx("open");
        ctx.hint(() => ctx.tiles[nx], "반짝이는 칸을 눌러요!");
        ctx.after(60, () => ctx.tiles[nx] && ctx.tiles[nx].scrollIntoView && ctx.tiles[nx].scrollIntoView({ block: "center", behavior: "smooth" }));
      },

      /* ================= 쓰기 페이지 ================= */
      /** 한 항목을 쓰는 칸 목록 */
      cellsOf(it) {
        if (it.kind === "line") return [{ strokes: it.strokes, mode: "dot", demo: true }, { strokes: it.strokes, mode: "faint" }, { strokes: it.strokes, mode: "faint" }];
        if (it.kind === "word") {
          const sm = !!cfg.partSmall;
          const a = it.parts.map((s) => ({ strokes: cfg.partStrokes(s), mode: "dot", demo: true, syl: sm, ch: s }));
          if (cfg.wordOnce) return a; // 낱말을 한 줄만 (긴 낱말이 두 배로 늘어나지 않게 — ABC 쓰기 공책)
          const b = it.parts.map((s) => ({ strokes: cfg.partStrokes(s), mode: "faint", syl: sm, ch: s }));
          return a.concat(b);
        }
        const cells = [
          { strokes: it.strokes, mode: "dot", demo: true, syl: it.syl, ch: it.ch },
          { strokes: it.strokes, mode: "faint", syl: it.syl, ch: it.ch },
          { strokes: it.strokes, mode: "alone", syl: it.syl, ch: it.ch },
        ];
        // it.cells === 2: '보고 따라 쓰기 → 혼자 쓰기' 2칸 (두 자리 수처럼 한 칸이 긴 항목 — 3칸이면 1분을 넘김)
        return it.cells === 2 ? [cells[0], cells[2]] : cells;
      },
      openItem(ctx, idx, quiet) {
        const U = KP.u;
        ctx.tok = (ctx.tok || 0) + 1;
        ctx.idx = (idx + ctx.items.length) % ctx.items.length;
        const it = (ctx.it = ctx.items[ctx.idx]);
        ctx.cells = this.cellsOf(it);
        ctx.ci = 0;
        ctx.cellStars = [];
        ctx.vBook.classList.remove("on");
        ctx.vPage.classList.add("on");
        ctx.stamp.classList.remove("on");
        ctx.vPage.style.setProperty("--c", it.color);
        // 공책 줄 칸
        ctx.line.innerHTML = "";
        ctx.cellEls = ctx.cells.map((c, i) => {
          const e = U.el("div", "hwCell", c.ch && it.kind === "word" ? c.ch : String(i + 1));
          ctx.line.appendChild(e);
          return e;
        });
        if (!quiet) KP.audio.sfx("open");
        this.sayIntro(it);
        this.startCell(ctx);
      },
      /** 시작 안내: 자연 음성이 있는 말을 고름 — "가를 써 봐요!" 가 없으면 "가! 써 봐요!" 처럼 조각으로.
          영어 글자·낱말은 한국어 안내에 자연 음성이 있으면 한국어로만 (영어 이름 + 한국어는 너무 김) */
      sayIntro(it) {
        const U = KP.u;
        const nat = (t) => !!(KP.voice._natUrls && KP.voice._natUrls(t));
        if (it.kind === "line") return KP.voice.say(it.guide);
        const tail = it.kind === "word" ? " 한 글자씩!" : "";
        const full = U.josa(it.say, "을/를") + " 써 봐요!" + tail;
        const part = it.say + "! 써 봐요!" + tail;
        if (nat(full)) return KP.voice.say(full);
        if (nat(part)) return KP.voice.say(part);
        if (it.en) {
          // 영어 이름(자연 음성) + "써 봐요!"
          KP.voice.en(it.en + "!");
          return KP.voice.say("써 봐요!" + tail, { queue: true });
        }
        return KP.voice.say(full);
      },
      startCell(ctx) {
        const U = KP.u;
        const it = ctx.it;
        const cell = (ctx.cell = ctx.cells[ctx.ci]);
        ctx.cellEls.forEach((e, i) => e.classList.toggle("cur", i === ctx.ci));
        // 왼쪽 본보기
        const big = it.kind === "line" ? KP.E(it.from) + (it.to !== it.from ? '<span style="font-size:.5em;color:#c9cede">→</span>' + KP.E(it.to) : "") : it.kind === "word" ? cell.ch : it.label;
        const step = it.kind === "line" ? (cell.mode === "dot" ? "① 점선 따라 긋기" : ctx.ci === 1 ? "② 흐린 선 따라 긋기" : "③ 한 번 더!") : cell.mode === "dot" ? "① 보고 따라 쓰기" : cell.mode === "faint" ? "② 흐린 글씨 따라 쓰기" : "③ 보고 혼자 쓰기";
        let pic = "";
        if (it.kind === "line") pic = '<div class="pic"><span>' + it.name + "</span></div>";
        else if (it.word) pic = '<div class="pic">' + KP.E(it.word[1]) + "<span>" + (it.kind === "word" ? it.word[0] : "<b>" + it.word[0][0] + "</b>" + it.word[0].slice(1)) + "</span></div>";
        ctx.model.innerHTML = '<div class="hwStepName">' + step + '</div><div class="big">' + big + "</div>" + pic;
        // [다시 보기]는 모든 칸에서 (혼자 쓰기 칸은 본보기 자리에서만 보여 줌 — demo 참고)
        ctx.bShow.classList.remove("hwDone");
        ctx.bDone.classList.remove("glowNext");
        ctx.T.talks = 0; // 쓰는 중 도움말 횟수 (칸마다 새로)
        ctx.T.peeking = false;
        this.fit(ctx);
        this.cellReset(ctx);
        const say = cell.mode === "dot" ? (cell.demo ? "잘 봐요! 이렇게 써요." : "점선을 따라 써요!") : cell.mode === "faint" ? "흐린 글씨를 따라 써요!" : "이번엔 혼자 써 볼까요? 옆의 글자를 보고 써요!";
        ctx.say((it.kind === "line" ? "〰️ " : "✍️ ") + step.replace(/^. /, "") + (it.kind === "word" ? " · " + cell.ch : ""), false);
        ctx.instr = say;
        const stok = ctx.tok;
        if (cell.demo && (ctx.ci === 0 || it.kind === "word"))
          ctx.after(it.kind === "word" && ctx.ci > 0 ? 200 : 900, () => {
            if (stok !== ctx.tok || ctx.cell !== cell) return;
            if (ctx.T.ink.length) return KP.voice.say(say); // 벌써 쓰기 시작했으면 시범 대신 안내만
            this.demo(ctx);
          });
        else KP.voice.say(say);
        ctx.hint(() => this.startPoint(ctx), cell.mode === "alone" ? "옆의 글자를 보고 써요!" : "노란 동그라미에서 시작해요!");
      },
      fit(ctx) {
        const w = ctx.board.clientWidth,
          h = ctx.board.clientHeight;
        if (!w || !h) return;
        const sz = Math.max(150, Math.min(w - 10, h - 10, 640));
        const d = Math.min(devicePixelRatio || 1, 2);
        [ctx.gcv, ctx.icv].forEach((c) => {
          c.style.width = c.style.height = sz + "px";
          c.width = c.height = Math.round(sz * d);
        });
      },
      /** 획을 잘게 나눈 점 (획 진행 순서대로) */
      points(strokes) {
        const out = [];
        (strokes || []).forEach((s, si) => {
          if (s.o) {
            const [cx, cy, r] = s.o;
            const n = Math.max(10, Math.ceil((2 * Math.PI * r) / 3));
            for (let k = 0; k <= n; k++) {
              const a = -Math.PI / 2 - (k / n) * Math.PI * 2; // 위에서 시작, 시계 반대 방향
              out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, s: si, hit: false });
            }
          } else {
            for (let k = 1; k < s.length; k++) {
              const [x1, y1] = s[k - 1],
                [x2, y2] = s[k];
              const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3));
              for (let j = k === 1 ? 0 : 1; j <= n; j++) out.push({ x: x1 + ((x2 - x1) * j) / n, y: y1 + ((y2 - y1) * j) / n, s: si, hit: false });
            }
          }
        });
        return out;
      },
      cellReset(ctx) {
        const T = ctx.T;
        const c = ctx.cell;
        T.pts = this.points(c.strokes);
        T.n = (c.strokes || []).length;
        T.sdone = new Array(T.n).fill(false);
        // 획별 안내 점 (획마다 따라온 정도를 잼)
        T.byS = [];
        T.pts.forEach((q) => (T.byS[q.s] = T.byS[q.s] || []).push(q));
        T.done = false;
        T.pend = false;
        T.ink = [];
        T.segs = [];
        T.pid = null;
        T.last = null;
        T.demoing = false;
        T.offAt = 0;
        T.offFired = false;
        T.nudges = 0;
        ctx.spot.classList.remove("on");
        ctx.dtok = (ctx.dtok || 0) + 1;
        T.color = ctx.it.kind === "line" ? ctx.it.color : "#33395e";
        ctx.icv.getContext("2d").clearRect(0, 0, ctx.icv.width, ctx.icv.height);
        this.drawGuide(ctx);
      },
      /** 아래 판: 공책 칸 + 안내 글씨 */
      drawGuide(ctx) {
        const T = ctx.T,
          c = ctx.cell,
          it = ctx.it;
        const cv = ctx.gcv,
          g = cv.getContext("2d");
        const k = cv.width / 100;
        g.clearRect(0, 0, cv.width, cv.height);
        if (cfg.paper === "abc") {
          // 영어 쓰기 4줄: 윗줄 · 가운데 점선 · 밑줄(빨강) · 아랫줄 점선
          const line = (y, col, dash, w) => {
            g.strokeStyle = col;
            g.lineWidth = w * k;
            g.setLineDash(dash ? [2.2 * k, 2 * k] : []);
            g.beginPath();
            g.moveTo(0, y * k);
            g.lineTo(100 * k, y * k);
            g.stroke();
          };
          line(14, "#b9c8e8", false, 0.8);
          line(47, "#b9c8e8", true, 0.8);
          line(82, "#f08c7d", false, 1.1);
          line(96, "#d6deef", true, 0.7);
          g.setLineDash([]);
        } else {
          // 십자 점선 (쓰기 칸)
          g.strokeStyle = "#f6c9bd";
          g.lineWidth = 0.7 * k;
          g.setLineDash([2 * k, 2 * k]);
          g.beginPath();
          g.moveTo(50 * k, 0);
          g.lineTo(50 * k, 100 * k);
          g.moveTo(0, 50 * k);
          g.lineTo(100 * k, 50 * k);
          g.stroke();
          g.setLineDash([]);
        }
        const strokes = c.strokes || [];
        const path = (s) => {
          g.beginPath();
          if (s.o) g.arc(s.o[0] * k, s.o[1] * k, s.o[2] * k, 0, Math.PI * 2);
          else s.forEach(([x, y], j) => (j ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k)));
        };
        const lw = (c.syl ? 9 : 13) * k;
        g.lineCap = g.lineJoin = "round";
        const nextS = T.sdone.indexOf(false);
        strokes.forEach((s, si) => {
          if (c.mode === "alone" && !T.done) return;
          const done = T.sdone[si];
          const now = si === nextS && !T.done; // 지금 쓸 획
          g.strokeStyle = done ? it.color : c.mode === "dot" ? (now ? "#e1e5f1" : "#eceef5") : "#dde3f2";
          g.globalAlpha = done ? 0.28 : 1;
          g.lineWidth = lw;
          path(s);
          g.stroke();
          g.globalAlpha = 1;
          if (c.mode === "dot" && !done) {
            g.strokeStyle = now ? "#6f7aa6" : "#c3c9dd";
            g.lineWidth = (now ? 1.7 : 1.1) * k;
            g.setLineDash([2.4 * k, 2.6 * k]);
            path(s);
            g.stroke();
            g.setLineDash([]);
          }
        });
        // 방향 화살표 (따라 쓰기 칸)
        if (c.mode === "dot") {
          strokes.forEach((s, si) => {
            if (T.sdone[si] || si !== nextS) return;
            const P = T.pts.filter((q) => q.s === si);
            if (P.length < 4) return;
            const a = P[Math.floor(P.length * 0.5)],
              b = P[Math.min(P.length - 1, Math.floor(P.length * 0.5) + 2)];
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            // 획 옆으로 살짝 비켜서 그림
            const off = (c.syl ? 7.5 : 10.5) * k;
            const ox = Math.cos(ang - Math.PI / 2) * off,
              oy = Math.sin(ang - Math.PI / 2) * off;
            const x = a.x * k + ox,
              y = a.y * k + oy,
              L = (c.syl ? 4 : 5.5) * k;
            g.strokeStyle = "#ff7452";
            g.fillStyle = "#ff7452";
            g.lineWidth = 1.2 * k;
            g.beginPath();
            g.moveTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L);
            g.lineTo(x + Math.cos(ang) * L * 0.4, y + Math.sin(ang) * L * 0.4);
            g.stroke();
            g.beginPath();
            g.moveTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L);
            g.lineTo(x + Math.cos(ang + 2.5) * L * 0.6, y + Math.sin(ang + 2.5) * L * 0.6);
            g.lineTo(x + Math.cos(ang - 2.5) * L * 0.6, y + Math.sin(ang - 2.5) * L * 0.6);
            g.closePath();
            g.fill();
          });
        }
        // 시작점 번호 (따라 쓰기: 모든 획 / 흐린 글씨: 다음 획만)
        if (!T.done && c.mode !== "alone") {
          // 번호 동그라미가 서로 겹치지 않게 놓은 자리를 기억 (ㄷ·ㄹ·ㅁ·ㅌ, '피'처럼 획이 많은 글자)
          const ru = c.syl ? 4.2 : 5.6;
          const placed = [];
          strokes.forEach((s, si) => {
            const mine = T.pts.filter((z) => z.s === si);
            let p = mine[0];
            if (!p) return;
            // 앞 획의 번호와 겹치면 이 획을 따라 조금씩 옮겨 겹치지 않는 첫 자리에
            const free = (z) => placed.every((q) => Math.hypot(q.x - z.x, q.y - z.y) >= ru * 2.1);
            if (!free(p)) p = mine.find((z) => free(z) && Math.hypot(z.x - mine[0].x, z.y - mine[0].y) < 40) || mine.find((z) => Math.hypot(z.x - mine[0].x, z.y - mine[0].y) >= (c.syl ? 8 : 11)) || p;
            placed.push(p);
            if (T.sdone[si]) return;
            if (c.mode === "faint" && si !== nextS) return;
            const r = ru * k;
            const isNext = si === nextS;
            g.fillStyle = isNext ? "#ffd23f" : "#fff";
            g.strokeStyle = isNext ? "#fff" : "#c3c9dd";
            g.lineWidth = 1.2 * k;
            g.beginPath();
            g.arc(p.x * k, p.y * k, r, 0, Math.PI * 2);
            g.fill();
            g.stroke();
            if (it.kind !== "line" && T.n > 1) {
              g.fillStyle = isNext ? "#1b2550" : "#8b93b3";
              g.font = r * 1.3 + "px Jua, sans-serif";
              g.textAlign = "center";
              g.textBaseline = "middle";
              g.fillText(String(si + 1), p.x * k, p.y * k + 0.06 * r);
            }
          });
        }
        // 선 긋기: 출발·도착 그림
        if (it.kind === "line" && T.pts.length) {
          const P = T.pts;
          const a = P[0],
            z = P[P.length - 1];
          KP.drawE(g, it.from, a.x * k, a.y * k, 14 * k);
          if (it.to !== it.from || Math.hypot(a.x - z.x, a.y - z.y) > 10) KP.drawE(g, it.to, z.x * k, z.y * k, 14 * k);
        }
      },
      startPoint(ctx) {
        const T = ctx.T;
        if (!ctx.vPage.classList.contains("on") || T.done || T.demoing) return null;
        if (ctx.cell && ctx.cell.mode === "alone") return null; // 혼자 쓰기: 정답 위치를 알려 주지 않음
        const ni = T.sdone.indexOf(false);
        const p = T.pts.find((q) => q.s === ni);
        if (!p) return null;
        const r = ctx.icv.getBoundingClientRect();
        return { x: r.left + (p.x / 100) * r.width, y: r.top + (p.y / 100) * r.height };
      },

      /* ---- 획순 시범: 연필이 한 획씩 써 보임 ---- */
      /** 획이 여러 개인 글자는 "하나, 둘, 셋…" 세며 그림 (선 긋기·한 획 글자는 세지 않음) */
      counts(ctx) {
        return ctx.it.kind !== "line" && (ctx.cell.strokes || []).length > 1;
      },
      demo(ctx) {
        const T = ctx.T;
        const c = ctx.cell;
        if (!c || ctx.T.done) return;
        if (c.mode === "alone") return this.peek(ctx); // 혼자 쓰기: 쓰는 칸은 그대로, 본보기 자리에서만 보여 줌
        if (T.ink.length && !T.demoing) this.cellReset(ctx); // 쓴 것을 지우고 시범 (화면과 점수가 어긋나지 않게)
        const tok = ctx.tok; // 화면을 떠나면 멈춤
        const dtok = (ctx.dtok = (ctx.dtok || 0) + 1); // 다시 보기를 누르면 이전 시범 멈춤
        const alive = () => ctx._active && tok === ctx.tok && dtok === ctx.dtok && ctx.cell === c;
        T.demoing = true;
        ctx.spot.classList.remove("on");
        const g = ctx.icv.getContext("2d");
        const k = ctx.icv.width / 100;
        const count = this.counts(ctx);
        const intro = KP.voice.say(ctx.it.kind === "line" ? "잘 봐요! 이렇게 그어요." : count ? "잘 봐요!" : "잘 봐요! 이렇게 써요.");
        this.playStrokes(ctx, {
          g,
          k,
          lw: (c.syl ? 6.5 : 8.5) * k,
          alive,
          count,
          wait: count ? intro : null, // 세는 글자는 "잘 봐요!"가 끝난 뒤 "하나"와 함께 첫 획 시작
          done: () => {
            ctx.after(700, () => {
              if (!alive()) return;
              g.clearRect(0, 0, ctx.icv.width, ctx.icv.height);
              T.demoing = false;
              KP.voice.say(ctx.it.kind === "line" ? "이제 따라 그어 봐요! 동그라미에서 시작!" : T.n > 1 ? "이제 따라 써 봐요! 1번 동그라미부터!" : "이제 따라 써 봐요! 동그라미에서 시작!");
              ctx.hint(() => this.startPoint(ctx), "노란 동그라미에서 시작해요!");
            });
          },
        });
      },
      /** 시범 멈추기 (시범 중 아이가 쓰는 칸을 누름): 연필 그림을 지우고 바로 쓸 수 있게 */
      stopDemo(ctx) {
        const T = ctx.T;
        if (!T.demoing) return;
        KP.voice.stop && KP.voice.stop();
        this.cellReset(ctx); // demoing=false, dtok 올림 → 시범 루프·"이제 따라 써 봐요" 안내가 멈춤
        T.demoStopped = (T.demoStopped || 0) + 1; // 점검용
        ctx.hint(() => this.startPoint(ctx), "노란 동그라미에서 시작해요!");
      },
      /** 혼자 쓰기 칸 [다시 보기]: 왼쪽 본보기 위에 작은 카드로 획순을 보여 주고 사라짐.
          쓰는 칸에는 아무 선도 안 그려서(위치를 알려 주지 않음) 아이가 쓴 글씨도 그대로 남음 */
      peek(ctx) {
        const c = ctx.cell;
        const big = ctx.model.querySelector(".big");
        if (!big) return;
        const old = big.querySelector(".hwPeek");
        if (old) old.remove();
        const r = big.getBoundingClientRect();
        const side = Math.round(Math.max(r.width, r.height, 60));
        const d = Math.min(devicePixelRatio || 1, 2);
        const cv = document.createElement("canvas");
        cv.className = "hwPeek";
        cv.style.width = cv.style.height = side + "px";
        cv.width = cv.height = Math.round(side * d);
        big.appendChild(cv);
        const tok = ctx.tok;
        const ptok = (ctx.ptok = (ctx.ptok || 0) + 1);
        const alive = () => ctx._active && tok === ctx.tok && ptok === ctx.ptok && ctx.cell === c && cv.isConnected;
        const g = cv.getContext("2d");
        const k = cv.width / 100;
        const count = this.counts(ctx);
        // 흐린 바탕 글씨 (모양 전체) — 그 위에 연필이 한 획씩
        const under = () => {
          g.fillStyle = "#fff";
          g.fillRect(0, 0, cv.width, cv.height);
          g.strokeStyle = "#e3e7f2";
          g.lineWidth = (c.syl ? 9 : 13) * k;
          g.lineCap = g.lineJoin = "round";
          (c.strokes || []).forEach((s) => {
            g.beginPath();
            if (s.o) g.arc(s.o[0] * k, s.o[1] * k, s.o[2] * k, 0, Math.PI * 2);
            else s.forEach(([x, y], j) => (j ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k)));
            g.stroke();
          });
        };
        ctx.T.peeking = true;
        const intro = KP.voice.say(count ? "잘 봐요!" : "잘 봐요! 이렇게 써요.");
        this.playStrokes(ctx, {
          g,
          k,
          lw: (c.syl ? 6.5 : 8.5) * k,
          alive,
          count,
          under,
          wait: count ? intro : null,
          done: () => {
            ctx.after(900, () => {
              if (!alive()) return;
              cv.remove();
              ctx.T.peeking = false;
              KP.voice.say("이제 써 봐요!");
            });
          },
        });
      },
      /** 획을 한 획씩 연필로 그려 보임 (시범·본보기 보기 함께 씀)
          o: {g, k, lw, alive(), count(획 번호 세기), wait(이 Promise 뒤 시작), under(바탕 그리기), done()} */
      playStrokes(ctx, o) {
        const U = KP.u;
        const T = ctx.T;
        const c = ctx.cell;
        const { g, k } = o;
        const W = g.canvas.width,
          H = g.canvas.height;
        const byS = [];
        T.pts.forEach((p) => (byS[p.s] = byS[p.s] || []).push(p));
        if (!byS.length) return;
        let si = 0,
          j = 0,
          pause = 0,
          ready = !o.wait;
        const speed = c.syl ? 85 : 75; // 점/초
        // 세며 그릴 때는 짧은 획(꼭지)도 말과 맞게 조금 천천히 (한 획 최소 0.45초), 획 사이도 조금 더 쉼
        const minDur = o.count ? 0.45 : 0;
        const gapPause = o.count ? (c.syl ? 0.32 : 0.42) : c.syl ? 0.22 : 0.35;
        const begin = (s) => {
          KP.audio.note(KP.audio.SCALE[(s * 2) % 8], { inst: "marimba", dur: 0.2, vol: 0.2 });
          if (o.count && U.NAT[s + 1]) KP.voice.say(U.NAT[s + 1], { queue: true }); // "하나", "둘", "셋"…
        };
        if (o.wait) {
          const go = () => {
            if (ready) return;
            ready = true;
            if (o.alive()) begin(0);
          };
          ctx.after(1500, go); // 말이 끝났다는 소식이 안 오는 기기 대비 (놀이를 나가면 함께 정리됨)
          Promise.resolve(o.wait).then(go, go);
        } else begin(0);
        const drawUpTo = () => {
          g.clearRect(0, 0, W, H);
          if (o.under) o.under();
          g.strokeStyle = ctx.it.color;
          g.lineWidth = o.lw;
          g.lineCap = g.lineJoin = "round";
          for (let s = 0; s <= si && s < byS.length; s++) {
            const P = byS[s];
            const upto = s < si ? P.length : Math.min(P.length, Math.floor(j) + 1);
            if (upto < 1) continue;
            g.beginPath();
            g.moveTo(P[0].x * k, P[0].y * k);
            for (let q = 1; q < upto; q++) g.lineTo(P[q].x * k, P[q].y * k);
            g.stroke();
          }
          const P = byS[Math.min(si, byS.length - 1)];
          if (!P || !P.length) return;
          const tip = P[Math.max(0, Math.min(P.length - 1, Math.floor(j)))];
          KP.drawE(g, "✏️", tip.x * k + 6 * k, tip.y * k - 6 * k, 13 * k);
        };
        if (o.under) drawUpTo();
        ctx.loop((dt) => {
          if (!o.alive()) return false;
          if (!ready) return;
          if (pause > 0) {
            pause -= dt;
            return;
          }
          const L = byS[si].length - 1;
          j += dt * (minDur ? Math.min(speed, Math.max(1, L) / minDur) : speed);
          if (j >= L) {
            j = L;
            drawUpTo();
            si++;
            j = 0;
            pause = gapPause;
            if (si >= byS.length) {
              o.done();
              return false;
            }
            begin(si);
            return;
          }
          drawUpTo();
        });
      },

      /* ---- 펜·손가락 입력 ---- */
      setupInk(ctx) {
        const U = KP.u;
        const ink = ctx.icv;
        const g = ink.getContext("2d");
        const T = (ctx.T = { pts: [], pid: null, pen: false, ink: [], segs: [] });
        const pos = (e) => {
          const r = ink.getBoundingClientRect();
          return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, p: e.pressure };
        };
        const width = (p) => (ctx.cell && ctx.cell.syl ? 0.75 : 1) * (T.isPen ? 3.5 + 6 * Math.min(1, p > 0 ? p : 0.5) : 10);
        ink.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          KP.audio.unlock();
          if (e.pointerType === "pen") T.penAt = Date.now();
          else if (e.pointerType === "touch" && Date.now() - (T.penAt || 0) < 3000) return; // 펜으로 쓰는 중 닿은 손바닥 (펜을 내려놓으면 손가락으로 쓸 수 있음)
          // 시범 중에 아이가 먼저 쓰기 시작하면: 시범을 멈추고 바로 쓰게 (예전엔 시범이 끝날 때까지 무시돼 첫 획이 안 남음)
          if (T.demoing && !T.done && ctx.cell && T.pid === null) this.stopDemo(ctx);
          if (T.done || T.demoing || T.pid !== null || !ctx.cell) return; // 쓰는 중(pointerup 유실 포함)의 다른 손가락은 무시 — 마무리는 1.1초 타이머가 맡음
          T.pid = e.pointerId;
          try {
            ink.setPointerCapture(e.pointerId);
          } catch (_) {}
          T.isPen = e.pointerType === "pen";
          T.last = pos(e);
          const w = width(T.last.p);
          T.segs.push([T.last.x, T.last.y, T.last.x, T.last.y, w]);
          const k = ink.width / 100;
          g.fillStyle = T.color;
          g.beginPath();
          g.arc(T.last.x * k, T.last.y * k, (w / 2) * k, 0, Math.PI * 2);
          g.fill();
          T.ink.push({ x: T.last.x, y: T.last.y });
          T.offAt = 0;
          T.offFired = false;
          this.hit(ctx, T.last);
          this.offCheck(ctx, T.last);
        });
        ink.addEventListener("pointermove", (e) => {
          if (e.pointerType === "pen") T.penAt = Date.now(); // 펜으로 길게 쓰는 동안에도 손바닥 무시 유지
          if (e.pointerId !== T.pid || T.done) return;
          const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
          const list = evs.length ? evs : [e];
          const k = ink.width / 100;
          g.strokeStyle = T.color;
          g.lineCap = g.lineJoin = "round";
          for (const ev of list) {
            const p = pos(ev);
            const d = U.dist(T.last.x, T.last.y, p.x, p.y);
            if (d < 0.25) continue;
            const w = width(p.p);
            g.lineWidth = w * k;
            g.beginPath();
            g.moveTo(T.last.x * k, T.last.y * k);
            g.lineTo(p.x * k, p.y * k);
            g.stroke();
            T.segs.push([T.last.x, T.last.y, p.x, p.y, w]);
            const n = Math.max(1, Math.ceil(d / 2));
            for (let j = 1; j <= n; j++) {
              const q = { x: T.last.x + ((p.x - T.last.x) * j) / n, y: T.last.y + ((p.y - T.last.y) * j) / n };
              T.ink.push(q);
              this.hit(ctx, q);
            }
            if (d > 1.2 && Math.random() < 0.12) KP.audio.sfx("rub");
            if (T.pend) T.moveAt = Date.now(); // 다 찬 뒤에도 쓰는 중 → 자동 마무리 미룸
            T.last = p;
            if (T.done) break;
          }
          if (T.last && !T.done && !T.pend) this.offCheck(ctx, T.last);
        });
        const end = (e) => {
          if (e.pointerType === "pen") T.penAt = Date.now();
          if (e.pointerId !== T.pid) return;
          T.pid = null;
          T.last = null;
          T.offAt = 0;
          T.offFired = false;
          // 획을 다 따라온 뒤에도 손을 뗄 때까지 선을 그림 → 손을 떼면 마무리 (끝부분이 끊긴 채 완성되지 않게)
          if (T.pend) return this.finishCell(ctx, false);
          // 혼자 쓰기·흐린 글씨: [다 썼어요]를 눌러도 될 만큼 썼으면 반짝 (누르면 거절되는 때는 반짝이지 않게)
          if (!T.done && ctx.cell && this.enough(ctx)) ctx.bDone.classList.add("glowNext");
        };
        ink.addEventListener("pointerup", end);
        ink.addEventListener("pointercancel", end);
        ink.addEventListener("lostpointercapture", end);
      },
      redrawInk(ctx) {
        const T = ctx.T;
        const g = ctx.icv.getContext("2d"),
          k = ctx.icv.width / 100;
        g.clearRect(0, 0, ctx.icv.width, ctx.icv.height);
        g.strokeStyle = T.color;
        g.lineCap = g.lineJoin = "round";
        T.segs.forEach(([a, b, c, d, w]) => {
          g.lineWidth = w * k;
          g.beginPath();
          g.moveTo(a * k, b * k);
          g.lineTo(c * k + 0.01, d * k);
          g.stroke();
        });
      },
      /** 판정 범위: 안내 글씨 굵기 정도 (넓으면 옆으로 지나가도 된 걸로 쳐짐). 손가락은 펜보다 조금 넓게 */
      radius(ctx) {
        const c = ctx.cell;
        const base = (c.syl ? 5.5 : c.mode === "alone" ? 8.5 : 7.5) + (ctx.T.isPen ? 0 : c.syl ? 1 : 1.5);
        if (ctx.T.isPen) return base;
        // 손가락: 화면이 작은 폰에서 작은 글씨 칸(가~호, 10~100)도 최소 28px 은 되게 (태블릿은 원래 값이 더 커서 그대로)
        const w = ctx.icv.clientWidth || 0;
        return w > 0 ? Math.max(base, Math.min(12, 2800 / w)) : base;
      },
      /** 쓰는 중 부드러운 도움: 아직 안 쓴 획에서 판정 범위의 1.5배 넘게 벗어난 채 0.6초 넘게 쓰면 이어 쓸 곳을 반짝.
          (흐린 글씨 칸은 획 순서를 따지지 않으므로 '안 쓴 획 아무 데나' 가까우면 벗어난 걸로 치지 않음)
          혼자 쓰기 칸은 정답 위치를 알려 주지 않으므로 하지 않음 */
      offCheck(ctx, p) {
        const T = ctx.T,
          c = ctx.cell;
        if (!c || c.mode === "alone" || T.done || T.demoing || !T.n) return;
        const far = (1.5 * this.radius(ctx)) ** 2;
        let near = false;
        for (let si = 0; si < T.n && !near; si++) {
          if (T.sdone[si]) continue;
          for (const q of T.byS[si])
            if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 < far) {
              near = true;
              break;
            }
        }
        if (near) {
          T.offAt = 0;
          T.offFired = false;
          return;
        }
        const now = performance.now();
        if (!T.offAt) T.offAt = now;
        if (T.offFired || now - T.offAt < 600) return;
        T.offFired = true; // 한 번 벗어날 때 한 번만 (다시 선 위로 오거나 손을 떼면 새로)
        this.nudge(ctx);
      },
      /** 이어 쓸 곳(지금 쓸 획에서 아직 안 지나간 첫 지점) 반짝 + 말 (5초에 한 번, 같은 칸에서 3번까지) */
      nudge(ctx) {
        const T = ctx.T,
          c = ctx.cell;
        const ni = T.sdone.indexOf(false);
        if (ni < 0) return;
        const P = T.byS[ni];
        const q = P.find((z) => !z.hit) || P[0];
        const br = ctx.board.getBoundingClientRect(),
          r = ctx.icv.getBoundingClientRect();
        const dpx = Math.max(44, ((this.radius(ctx) * 2.4) / 100) * r.width);
        const s = ctx.spot.style;
        s.left = r.left - br.left + (q.x / 100) * r.width + "px";
        s.top = r.top - br.top + (q.y / 100) * r.height + "px";
        s.width = s.height = dpx + "px";
        KP.u.replay(ctx.spot, "on");
        const st = (ctx.spotTok = (ctx.spotTok || 0) + 1);
        ctx.after(2100, () => st === ctx.spotTok && ctx.spot.classList.remove("on"));
        T.nudges = (T.nudges || 0) + 1; // 점검용
        const now = performance.now();
        if (now - (T.talkAt || -1e9) < 5000 || (T.talks || 0) >= 3) return;
        T.talkAt = now;
        T.talks = (T.talks || 0) + 1;
        const first = T.talks === 1;
        KP.voice.say(ctx.it.kind === "line" ? "반짝이는 곳에서 이어서 그려요!" : !first ? "끝까지 따라가요!" : c.mode === "dot" ? "점선을 따라 써요!" : "흐린 글씨를 따라 써요!");
      },
      /** 획 하나를 얼마나 따라왔는지: 덮은 비율, 가장 길게 빠진 곳(획 길이 대비) */
      strokeCover(P, closed) {
        const n = P.length;
        let hit = 0,
          gap = 0,
          run = 0;
        // 닫힌 획(동그라미)은 끝과 처음이 이어져 있으므로 두 바퀴 돌며 빠진 곳을 잼
        for (let i = 0; i < (closed ? n * 2 : n); i++) {
          const h = P[i % n].hit;
          if (i < n && h) hit++;
          run = h ? 0 : run + 1;
          if (run > gap) gap = run;
        }
        return { cov: hit / n, gap: Math.min(1, gap / n) };
      },
      /** 펜이 지나간 안내 점 표시 → 획마다 85% 이상 덮고, 크게 빠진 곳(획의 15% 넘게)이 없으면 그 획 완성 */
      hit(ctx, p) {
        const T = ctx.T,
          c = ctx.cell;
        if (T.done || T.pend) return;
        const R = this.radius(ctx);
        for (const q of T.pts) if (!q.hit && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R) q.hit = true;
        let changed = false;
        for (let si = 0; si < T.n; si++) {
          if (T.sdone[si]) continue;
          const P = T.byS[si];
          const a = P[0],
            z = P[P.length - 1];
          const closed = !!c.strokes[si].o || Math.hypot(a.x - z.x, a.y - z.y) < 4;
          const { cov, gap } = this.strokeCover(P, closed);
          // 아주 짧은 획(점·짧은 꼭지)은 콕 찍어도 완성
          const short = !closed && P.length * 3 < R * 2;
          // 획 끝까지 왔는지: 지나간 점 비율만 보면 판정 반지름 앞쪽 점·스스로 겹치는 획('8')때문에 65~75% 지점에서 '다 참'이 됨
          if (short ? cov >= 0.5 : cov >= 0.85 && gap <= 0.15 && this.endReached(P, closed, R)) {
            T.sdone[si] = true;
            changed = true;
            if (c.mode !== "alone") KP.audio.note(KP.audio.SCALE[(si * 2) % 8], { inst: "marimba", dur: 0.22, vol: 0.2 });
          }
        }
        if (!changed) return;
        if (c.mode !== "alone") this.drawGuide(ctx);
        if (T.sdone.every(Boolean)) {
          if (T.pid === null) return this.finishCell(ctx, false);
          // 아직 쓰는 중: 손을 뗄 때 마무리 (그동안 선은 계속 그려짐).
          // 손을 안 떼면 '손가락이 1.1초 동안 안 움직였을 때' 마무리 (움직이는 동안은 다시 기다림, 최대 PEND_MAX)
          // — 천천히 쓰는 아이도 획 끝까지 그린 뒤 마무리됨 (예전엔 다 찬 순간부터 1.1초라 끝이 끊김, 4초 상한도 짧았음)
          const PEND_MAX = 10000;
          T.pend = true;
          T.pendAt = T.moveAt = Date.now();
          ctx.spot.classList.remove("on");
          const dt0 = ctx.dtok,
            cell = ctx.cell;
          const wait = () => {
            if (!T.pend || T.done || dt0 !== ctx.dtok || ctx.cell !== cell) return;
            const now = Date.now();
            if (now - T.moveAt >= 1100 || now - T.pendAt >= PEND_MAX) this.finishCell(ctx, false);
            else ctx.after(Math.max(50, Math.min(1100 - (now - T.moveAt), PEND_MAX - (now - T.pendAt))), wait);
          };
          ctx.after(1100, wait);
        }
      },
      /** 획 끝점 도달: 열린 획은 마지막 점, 닫힌 획(0·8·ㅇ)은 시작점 둘레(1.3R) 밖의 가장 끝 점을 지났는지
          (닫힌 획의 마지막 점은 시작점과 같은 자리라 처음 누를 때 이미 지나간 걸로 쳐지므로) */
      endReached(P, closed, R) {
        if (!closed) return !!P[P.length - 1].hit;
        const a = P[0],
          r2 = (1.3 * R) ** 2;
        for (let i = P.length - 1; i > 0; i--) if ((P[i].x - a.x) ** 2 + (P[i].y - a.y) ** 2 > r2) return !!P[i].hit;
        return true;
      },
      /** 칸 채점: 따라간 정도(coverage) + 선 안에 쓴 정도(accuracy) → 별 1~3 */
      grade(ctx) {
        const T = ctx.T,
          c = ctx.cell;
        const cov = T.pts.length ? T.pts.filter((q) => q.hit).length / T.pts.length : 0;
        // 선 안 판정도 폰의 작은 칸에서는 판정 반지름만큼은 넓게
        const R = Math.max(c.syl ? 8 : 11, this.radius(ctx) * 1.2);
        let inside = 0;
        for (const p of T.ink) {
          for (const q of T.pts) {
            if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R) {
              inside++;
              break;
            }
          }
        }
        const acc = T.ink.length ? inside / T.ink.length : 0;
        const sc = 0.6 * cov + 0.4 * acc;
        return sc >= 0.82 ? 3 : sc >= 0.58 ? 2 : 1;
      },
      /** [다 썼어요]로 넘어가도 될 만큼 썼는지: 전체 70%(혼자 쓰기 60%) + 획마다 절반 이상(혼자 쓰기 40%) */
      enough(ctx) {
        const T = ctx.T,
          alone = ctx.cell.mode === "alone";
        if (T.ink.length < 8 || !T.pts.length) return false;
        const cov = T.pts.filter((q) => q.hit).length / T.pts.length;
        if (cov < (alone ? 0.6 : 0.7)) return false;
        return T.byS.every((P) => P.filter((q) => q.hit).length / P.length >= (alone ? 0.4 : 0.5));
      },
      finishCell(ctx, byButton) {
        const U = KP.u;
        const T = ctx.T;
        if (T.done || T.demoing || !ctx.cell) return;
        if (byButton) {
          // [다 썼어요]는 막혔을 때 넘어가는 용도 — 덜 썼으면 조금 더 쓰도록 안내
          if (!this.enough(ctx)) {
            KP.audio.sfx("tap");
            KP.voice.say(ctx.cell.mode === "alone" ? (T.ink.length < 8 ? "먼저 써 볼까요? 옆의 글자를 보고 써요!" : "조금 더! 옆의 글자를 보고 써요!") : T.ink.length < 8 ? "먼저 써 볼까요? 동그라미에서 시작해요!" : "아직 덜 썼어요! 회색 길을 끝까지 따라가요.");
            if (ctx.cell.mode !== "alone") ctx.hint(() => this.startPoint(ctx), "끝까지 따라가요!");
            return;
          }
        }
        T.done = true;
        T.pend = false;
        T.pid = null;
        const st = this.grade(ctx);
        ctx.cellStars[ctx.ci] = st;
        this.drawGuide(ctx);
        // 공책 줄 칸에 작게 남기기
        const cellEl = ctx.cellEls[ctx.ci];
        const mini = document.createElement("canvas");
        mini.width = mini.height = 120;
        const mg = mini.getContext("2d");
        mg.fillStyle = "#fff";
        mg.fillRect(0, 0, 120, 120);
        mg.globalAlpha = 0.5;
        mg.drawImage(ctx.gcv, 0, 0, 120, 120);
        mg.globalAlpha = 1;
        mg.drawImage(ctx.icv, 0, 0, 120, 120);
        cellEl.innerHTML = "";
        cellEl.appendChild(mini);
        cellEl.appendChild(U.el("span", "s", "★".repeat(st)));
        KP.audio.sfx("good");
        KP.voice.say(U.pick(st === 3 ? ["와, 아주 잘 썼어요!", "멋져요!", "최고예요!"] : st === 2 ? ["잘했어요!", "좋아요!"] : ["좋아요! 다음엔 선을 따라가 봐요!", "잘했어요! 점선을 보며 써요!"]));
        ctx.bDone.classList.remove("glowNext");
        const tok = ctx.tok,
          dt0 = ctx.dtok; // 그사이 [지우기]를 누르면(dtok 바뀜) 넘어가지 않음
        ctx.after(1100, () => {
          if (tok !== ctx.tok || dt0 !== ctx.dtok) return;
          if (ctx.ci < ctx.cells.length - 1) {
            ctx.ci++;
            this.startCell(ctx);
          } else this.finishItem(ctx);
        });
      },
      finishItem(ctx) {
        const U = KP.u;
        const it = ctx.it;
        const avg = ctx.cellStars.reduce((a, b) => a + b, 0) / ctx.cellStars.length;
        const stars = Math.max(1, Math.min(3, Math.round(avg)));
        // 열쇠 별: 글자는 '혼자 쓰기 칸 ★★ 이상'일 때만. 낱말(혼자 쓰기 칸 없음 — 여러 글자를 이어 따라 쓰는 긴 항목)은 전체 ★★ 이상이면.
        // 선 긋기(따라 긋기만, 쉬움)는 공책 별·도장만, 열쇠 별 없음
        const alone = ctx.cells.map((c, i) => (c.mode === "alone" ? ctx.cellStars[i] || 0 : -1)).filter((v) => v >= 0);
        const keyStars = it.kind === "word" ? stars : alone.length ? Math.min.apply(null, alone) : 0;
        KP.earn && KP.earn.onNotebook(ctx, keyStars);
        const prev = ctx.stars[it.id] || 0;
        ctx.stars[it.id] = Math.max(prev, stars);
        KP.store.set(cfg.key, ctx.stars);
        ctx.cellEls.forEach((e) => e.classList.remove("cur"));
        const word = stars === 3 ? "참 잘했어요" : stars === 2 ? "잘했어요" : "좋아요";
        ctx.stamp.innerHTML = "";
        const seal = U.el("div", "hwSeal", word.replace(" ", "<br>") + "<small>" + (it.kind === "line" ? it.name : it.label) + "</small>");
        const starsEl = U.el("div", "hwStars", [1, 2, 3].map((n) => '<span class="' + (n <= stars ? "" : "off") + '">' + KP.E("⭐") + "</span>").join(""));
        const row = U.el("div", "hwRes");
        const bRe = U.btn(KP.E("🔄") + " 한 번 더", "btn big");
        const bNext = U.btn("다음 " + KP.E("▶️"), "btn big primary");
        const bList = U.btn(KP.E("📒") + " 목차", "btn big");
        row.append(bRe, bNext, bList);
        ctx.stamp.append(seal, starsEl, row);
        ctx.stamp.classList.add("on");
        ctx.tap(bRe, () => this.openItem(ctx, ctx.idx));
        ctx.tap(bNext, () => this.openItem(ctx, ctx.idx + 1));
        ctx.tap(bList, () => this.showBook(ctx));
        KP.audio.sfx("sparkle");
        if (it.en) KP.voice.en(it.en + "!");
        KP.voice.say(word + "! " + (it.kind === "line" ? it.name : it.say) + " 완성!", it.en ? { queue: true } : undefined);
        ctx.hint(() => (ctx.stamp.classList.contains("on") ? bNext : null), "다음 것도 써 볼까요?");
        KP.confetti && KP.confetti(stars === 3 ? 160 : 90);
        // 세 개 완성할 때마다 스티커 한 장 — 새로 완성했거나 별이 늘었을 때만 셈 (같은 글자 반복으로 계속 받지 않게)
        const better = stars > prev;
        const n = (KP.store.get("nb:count", 0) || 0) + (better ? 1 : 0);
        if (better) KP.store.set("nb:count", n);
        if (better && n % 3 === 0 && KP.stickers) {
          const [e, nm] = KP.stickers.award();
          ctx.after(1600, () => KP.toast(e + " " + nm + " 스티커를 받았어요!"));
        }
      },
    });
  };
})(window.KP);

;

/* ==== js/core/celebrate.js ==== */
/* =====================================================================
   축하 연출 · 스티커 보상
   - KP.celebrate(o) : 색종이 + 칭찬 + 징글 (+ 단계 상승, + 스티커)
   - KP.stickers     : 스티커 모으기 (영구 저장)
   성공 3번마다, 그리고 단계가 오를 때마다 새 스티커 1장.
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;

  /* ---------------- 스티커 목록 ---------------- */
  const STICKERS = [
    ["🦖", "티라노사우루스"], ["🦕", "브라키오사우루스"], ["🐉", "용"], ["🦁", "사자"], ["🐯", "호랑이"], ["🐻", "곰"],
    ["🐼", "판다"], ["🐨", "코알라"], ["🐰", "토끼"], ["🦊", "여우"], ["🐶", "강아지"], ["🐱", "고양이"],
    ["🐵", "원숭이"], ["🐘", "코끼리"], ["🦒", "기린"], ["🦓", "얼룩말"], ["🦛", "하마"], ["🐊", "악어"],
    ["🐢", "거북이"], ["🐸", "개구리"], ["🐧", "펭귄"], ["🦉", "부엉이"], ["🦜", "앵무새"], ["🦩", "홍학"],
    ["🐳", "고래"], ["🐬", "돌고래"], ["🦈", "상어"], ["🐙", "문어"], ["🦀", "꽃게"], ["🐠", "열대어"],
    ["🦋", "나비"], ["🐞", "무당벌레"], ["🐝", "꿀벌"], ["🐌", "달팽이"], ["🦄", "유니콘"], ["🐿️", "다람쥐"],
    ["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚓", "경찰차"], ["🚑", "구급차"], ["🚜", "트랙터"],
    ["🚂", "기차"], ["✈️", "비행기"], ["🚁", "헬리콥터"], ["🚀", "로켓"], ["⛵", "배"], ["🚲", "자전거"],
    ["🛸", "비행접시"], ["🏎️", "경주용 자동차"], ["🚛", "트럭"], ["🚧", "공사장"], ["⛽", "주유소"], ["🗽", "자유의 여신상"],
    ["🍎", "사과"], ["🍓", "딸기"], ["🍌", "바나나"], ["🍉", "수박"], ["🍇", "포도"], ["🍑", "복숭아"],
    ["🍦", "아이스크림"], ["🍩", "도넛"], ["🍪", "쿠키"], ["🧁", "컵케이크"], ["🍭", "막대사탕"], ["🍰", "케이크"],
    ["🌈", "무지개"], ["⭐", "별"], ["🌙", "달"], ["☀️", "해님"], ["⛄", "눈사람"], ["🌻", "해바라기"],
    ["🎈", "풍선"], ["🎁", "선물"], ["⚽", "축구공"], ["🏆", "트로피"], ["👑", "왕관"], ["💎", "보석"],
  ];
  const stickers = (KP.stickers = {
    LIST: STICKERS,
    have: () => KP.store.get("stickers", {}),
    count: () => Object.keys(KP.store.get("stickers", {})).length,
    /** 새 스티커 하나 주기 → [이모지, 이름] */
    award() {
      const have = stickers.have();
      const left = STICKERS.filter(([e]) => !have[e]);
      const s = left.length ? U.pick(left) : U.pick(STICKERS);
      have[s[0]] = (have[s[0]] || 0) + 1;
      KP.store.set("stickers", have);
      KP.store.set("lastSticker", s[0]);
      return s;
    },
    nameOf: (e) => (STICKERS.find((s) => s[0] === e) || [e, ""])[1],
  });

  /* ---------------- 색종이 ---------------- */
  let cv = null,
    cx = null,
    parts = [],
    running = false;
  let CW = 0,
    CH = 0; // 색종이 판의 실제 화면 크기
  const COLORS = ["#ff5b6e", "#ffb020", "#ffe14d", "#3fd17a", "#33b7ff", "#8a63ee", "#ff7ac6"];
  function ensureCanvas() {
    if (cv) return;
    cv = U.el("canvas", "confetti");
    document.body.appendChild(cv);
    cx = cv.getContext("2d");
    fitCanvas();
    addEventListener("resize", fitCanvas);
  }
  /* iPad 앱(전체 화면)에서는 innerHeight 가 실제 화면보다 작게 잡힐 때가 있어,
     창 크기 대신 판의 실제 크기로 맞추고 지울 때도 판 전체를 지운다.
     (예전엔 화면 맨 아래 띠가 지워지지 않아 색종이 자국이 줄처럼 남았음) */
  // 색종이는 빠르게 움직여서 1배로 그려도 티가 안 남 → 칠할 점 수를 줄임 (저가 태블릿 렉)
  // 배율은 정수만: 1.25배 같은 소수 배율은 화면에 붙일 때 늘이는 계산이 붙어 오히려 느림
  // (PC 느린 기기 흉내, 색 섞기 단계 올라감 장면: 1.25배 36장/초 → 1배 45장/초)
  const DPR = () => 1;
  let D = 1;
  function fitCanvas() {
    if (!cv) return;
    D = DPR();
    CW = cv.clientWidth || innerWidth;
    CH = cv.clientHeight || innerHeight;
    cv.width = Math.round(CW * D);
    cv.height = Math.round(CH * D);
    box = null;
  }
  function clearAll() {
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.globalAlpha = 1;
    cx.clearRect(0, 0, cv.width, cv.height);
    box = null;
  }
  /* 조각 그림은 처음 한 번만 그려 두고(색 7 × 모양 3) 매 장면에는 찍기만 함 — 매번 모양을 그리는 것보다 훨씬 가벼움 */
  const SPR = 24; // 조각 그림 한 변(px) — 가장 큰 조각(r 10)의 별 지름(약 11)보다 넉넉히
  let sprites = null;
  function makeSprites() {
    sprites = COLORS.map((c) =>
      [0, 1, 2].map((sh) => {
        const k = document.createElement("canvas");
        k.width = k.height = SPR;
        const g = k.getContext("2d");
        g.translate(SPR / 2, SPR / 2);
        g.fillStyle = c;
        const r = SPR / 2.2; // 조각 크기 r 에 해당하는 그림 크기
        if (sh === 0) g.fillRect(-r / 2, -r / 4, r, r / 2);
        else if (sh === 1) {
          g.beginPath();
          g.arc(0, 0, r / 2.4, 0, Math.PI * 2);
          g.fill();
        } else {
          g.beginPath();
          for (let i = 0; i < 10; i++) {
            const rr = i % 2 ? r / 4 : r / 1.8,
              aa = (i * Math.PI) / 5;
            g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
          }
          g.fill();
        }
        return k;
      })
    );
  }
  let box = null; // 지난 장면에 그린 곳 (그 부분만 지움)
  KP.confetti = function (n = 140, x = innerWidth / 2, y = innerHeight * 0.38) {
    ensureCanvas();
    if (!cx) return;
    if (cv.clientWidth !== CW || cv.clientHeight !== CH || D !== DPR()) fitCanvas();
    if (!sprites) makeSprites();
    for (let i = 0; i < n; i++) {
      const a = U.randf(0, Math.PI * 2),
        sp = U.randf(4, 14);
      parts.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - U.randf(3, 8),
        r: U.randf(5, 10),
        rot: U.randf(0, 6),
        vr: U.randf(-0.3, 0.3),
        c: U.rand(COLORS.length),
        s: U.rand(3),
        life: 1,
      });
    }
    if (!running) {
      running = true;
      last = 0;
      requestAnimationFrame(tick);
    }
  };
  let last = 0;
  function tick(now) {
    // 움직임은 시간 기준 (느린 기기에서 장면이 빠져도 색종이가 느려지지 않게) — 60장/초일 때 예전과 같음
    const k = last ? Math.min(3, (now - last) / (1000 / 60)) : 1;
    last = now;
    if (box) {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.globalAlpha = 1;
      cx.clearRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
    }
    parts = parts.filter((p) => p.life > 0 && p.y < CH + 40);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const f = Math.pow(0.985, k);
    for (const p of parts) {
      p.vx *= f;
      p.vy = p.vy * f + 0.32 * k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.rot += p.vr * k;
      p.life -= 0.006 * k;
      const sc = (p.r / (SPR / 2.2)) * D, cs = Math.cos(p.rot) * sc, sn = Math.sin(p.rot) * sc;
      cx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      cx.setTransform(cs, sn, -sn, cs, p.x * D, p.y * D);
      cx.drawImage(sprites[p.c][p.s], -SPR / 2, -SPR / 2);
      const e = p.r + 2;
      if (p.x - e < x0) x0 = p.x - e;
      if (p.y - e < y0) y0 = p.y - e;
      if (p.x + e > x1) x1 = p.x + e;
      if (p.y + e > y1) y1 = p.y + e;
    }
    // 다음 장면에 지울 곳 (화면 픽셀, 여유 2px)
    box = parts.length ? [Math.max(0, Math.floor(x0 * D) - 2), Math.max(0, Math.floor(y0 * D) - 2), Math.min(cv.width, Math.ceil(x1 * D) + 2), Math.min(cv.height, Math.ceil(y1 * D) + 2)] : null;
    if (parts.length) requestAnimationFrame(tick);
    else {
      running = false;
      clearAll();
    }
  }

  /* ---------------- 축하 ---------------- */
  const PRAISE = [
    ["🎉", "잘했어요!"], ["🌟", "최고예요!"], ["👏", "멋져요!"], ["💯", "딩동댕!"],
    ["🏆", "우와, 대단해!"], ["😎", "{부름} 정말 멋져!"], ["💪", "정말 잘했어!"], ["🥳", "와아, 성공!"],
  ];
  let layer = null;
  function ensureLayer() {
    if (layer) return;
    layer = U.el("div", "celebrate");
    document.body.appendChild(layer);
  }
  let winCount = KP.store.get("winCount", 0);

  /**
   * @param {{msg?:string, say?:string, big?:boolean, levelUp?:boolean, ctx?:object, quiet?:boolean, sticker?:boolean}} o
   *   say: 화면 글자(msg)와 다르게 말할 문장 (예: msg "10개 팡팡!", say "십! 팡팡!") — 없으면 msg 를 그대로 읽음
   */
  /* 축하 도중 화면을 나가면 남은 연출·소리 예약을 모두 취소 */
  let ctimers = [],
    pendingRes = null;
  const later = (fn, ms) => {
    const t = setTimeout(fn, ms);
    ctimers.push(t);
    return t;
  };
  // 말이 끝날 때까지(최대 4초 — 끝 소식이 안 오는 기기 대비) 기다리기. 다음 말이 앞 말을 자르지 않게
  const talkDone = (p) => Promise.race([p || Promise.resolve(), new Promise((r) => setTimeout(r, 4000))]);
  const wait = (ms) => new Promise((r) => later(r, ms)); // 축하가 취소되면 타이머째 사라짐
  KP.cancelCelebrate = function () {
    ctimers.forEach(clearTimeout);
    ctimers = [];
    if (layer) layer.className = "celebrate";
    U.$$(".flySticker").forEach((e) => e.remove());
    KP.celebrating = false;
    const r = pendingRes;
    pendingRes = null;
    if (r) r();
  };

  KP.celebrate = function (o = {}) {
    ensureLayer();
    KP.cancelCelebrate(); // 앞의 축하가 남아 있으면 정리
    KP.celebrating = true;
    KP.hideHint && KP.hideHint();
    const [em, word] = U.pick(PRAISE);
    const raw = o.msg || word;
    const msg = KP.who(raw); // "{부름}" → 아이 이름 (말할 때는 voice.say 가 따로 바꿈)
    layer.innerHTML =
      '<div class="cBox"><div class="cEm">' + KP.E(em) + '</div><div class="cTxt">' + KP.E(msg) + "</div></div>";
    layer.className = "celebrate show block" + (o.big ? " big" : "");
    KP.confetti(o.big ? 220 : 120);
    if (o.big) later(() => KP.confetti(140, innerWidth * 0.25, innerHeight * 0.3), 350);
    if (o.big) later(() => KP.confetti(140, innerWidth * 0.75, innerHeight * 0.3), 650);
    KP.audio.jingle();
    const spoken = o.say || raw; // 말은 따로 정할 수 있음(숫자는 글자로 읽기 등)
    const praise = o.quiet ? null : KP.voice.say(spoken.replace(/\p{Extended_Pictographic}|️/gu, ""));
    const base = o.big ? 2100 : 1350;

    winCount = (+KP.store.get("winCount", 0) || 0) + 1; // 매번 저장소에서 (설정에서 초기화한 뒤 옛 값이 되살아나지 않게)
    KP.store.set("winCount", winCount);
    const giveSticker = o.sticker !== false && (o.levelUp || winCount % 3 === 0);
    // 스티커는 지금 바로 지급 (말이 끝나길 기다리는 사이 놀이를 나가도 받은 건 남게) — 보여 주기만 나중에
    const stk = giveSticker ? stickers.award() : null;

    // 각 장면(칭찬 → 단계 올라감 → 스티커)은 '정해진 시간'과 '앞 말이 끝남'을 둘 다 기다린 뒤 넘어감
    // (전에는 시간만 기다려서, 이름이 붙어 길어진 칭찬이 다음 문제 안내에 잘렸음)
    return new Promise((res) => {
      pendingRes = res;
      const alive = () => pendingRes === res;
      (async () => {
        await Promise.all([wait(base - 150), talkDone(praise)]);
        if (!alive()) return;
        layer.classList.remove("show");
        await wait(150);
        if (o.levelUp) {
          const lv = o.ctx ? o.ctx.level : 2;
          layer.innerHTML =
            '<div class="cBox lvl"><div class="cEm">' + KP.E("🦸") + '</div><div class="cTxt">한 단계 올라갔어요!</div><div class="cSub">' +
            KP.E("⭐") + " " + lv + "단계 도전!</div></div>";
          layer.className = "celebrate show block big";
          KP.audio.sfx("levelup");
          KP.confetti(160);
          const lvTalk = KP.voice.say("한 단계 올라갔어요! 이제 " + lv + "단계! {부름} 최고!");
          await Promise.all([wait(2150), talkDone(lvTalk)]);
          if (!alive()) return;
          layer.classList.remove("show");
          await wait(150);
        }
        if (stk) showSticker(o.ctx, () => finish(), stk);
        else finish();
      })();
      function finish() {
        if (pendingRes !== res) return; // 이미 취소됨
        pendingRes = null;
        ctimers = [];
        layer.className = "celebrate";
        KP.celebrating = false;
        res();
      }
    });
  };

  function showSticker(ctx, done, stk) {
    const [e, name] = stk;
    layer.innerHTML =
      '<div class="cBox sticker"><div class="rays"></div><div class="cEm cStk">' + KP.E(e) +
      '</div><div class="cTxt">스티커 받았어요!</div><div class="cSub">' + name + "</div></div>";
    layer.className = "celebrate show block sticker";
    KP.audio.sfx("sticker");
    const talk = KP.voice.say("스티커 받았어요! " + name + "!");
    const me = pendingRes;
    Promise.all([wait(1900), talkDone(talk)]).then(() => {
      if (pendingRes !== me) return; // 그사이 축하가 취소됨
      // 스티커가 스티커북 아이콘으로 날아가기
      const src = layer.querySelector(".cStk img, .cStk span");
      const target = ctx ? ctx.stickerPill : document.querySelector("#home .stickerBtn");
      if (src && target) {
        const a = src.getBoundingClientRect(),
          b = target.getBoundingClientRect();
        const fly = U.el("div", "flySticker", KP.E(e));
        Object.assign(fly.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
        document.body.appendChild(fly);
        layer.classList.remove("show");
        requestAnimationFrame(() => {
          fly.style.transform =
            "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.2)";
          fly.style.opacity = "0.4";
        });
        later(() => {
          fly.remove();
          if (ctx) {
            ctx._updateLevel();
            U.replay(target, "bump");
          }
          KP.audio.sfx("snap");
          done();
        }, 750);
      } else {
        layer.classList.remove("show");
        done();
      }
    });
  }
})(window.KP);

;

/* ==== js/core/home.js ==== */
/* =====================================================================
   홈 화면 · 사용 시간 제한(잘 시간 화면) · 어른 확인(꾹 누르기)
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;

  /** 어른용 꾹 누르기 버튼: ms 동안 누르고 있어야 실행 */
  KP.hold = function (el, ms, onDone, onStart) {
    let t = null,
      t0 = 0,
      raf = 0,
      pid = null; // 누르고 있는 손가락 하나만 인정 (두 손가락 톡 → 실행되는 문제 방지)
    el.classList.add("holdBtn");
    const stop = () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      t = null;
      pid = null;
      el.style.setProperty("--p", 0);
      el.classList.remove("holding");
    };
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (pid !== null) {
        stop(); // 다른 손가락이 또 닿으면 처음부터 다시
        return;
      }
      pid = e.pointerId;
      t0 = performance.now();
      el.classList.add("holding");
      onStart && onStart();
      const step = () => {
        el.style.setProperty("--p", Math.min(1, (performance.now() - t0) / ms));
        raf = requestAnimationFrame(step);
      };
      step();
      t = setTimeout(() => {
        stop();
        KP.audio.sfx("good");
        onDone();
      }, ms);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, (e) => (pid === null || e.pointerId === pid) && stop()));
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  };

  /* ---------------- 게임 잠금 (오늘 날짜 8자리) ----------------
     공부 놀이 외의 카테고리는 한국 시간 기준 오늘 날짜(예: 20261010)를 넣어야 열린다.
     한 번 풀면 앱을 다시 열 때까지(또는 날짜가 바뀔 때까지) 열려 있다. */
  const todayKST = () => {
    try {
      const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
      const g = (t) => (p.find((x) => x.type === t) || {}).value || "";
      const v = g("year") + g("month") + g("day");
      if (/^\d{8}$/.test(v)) return v;
    } catch (e) {}
    return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
  };
  let openedOn = ""; // 어른이 날짜로 연 날(한국 시간). 날짜가 바뀌면 다시 잠김
  // 아이가 문지기 퀴즈로 연 경우: 정해진 시간까지만 (앱을 껐다 켜도 그 시간까지는 유지)
  let kidUntil = +KP.store.get("gate:until", 0) || 0;
  const gate = (KP.gate = {
    today: todayKST,
    /** 한국 날짜 "5월 3일" (작품·도감 날짜 표시용) */
    monthDay: () => {
      const t = todayKST();
      return +t.slice(4, 6) + "월 " + +t.slice(6, 8) + "일";
    },
    unlocked: () => openedOn === todayKST() || Date.now() < kidUntil,
    kidLeft: () => Math.max(0, kidUntil - Date.now()),
    unlock() {
      openedOn = todayKST();
    },
    /** 어른이 날짜로 '오늘 계속' 연 상태 */
    adultOpen: () => openedOn === todayKST(),
    /** 정해진 시간만 열기. src: "earn"(별) | "quiz"(문지기) | "adult"(어른 30분) */
    unlockFor(min, src = "quiz") {
      kidUntil = Date.now() + min * 60000;
      KP.store.set("gate:until", kidUntil);
      KP.store.set("gate:len", min * 60000);
      KP.store.set("gate:src", src);
    },
    src: () => KP.store.get("gate:src", "quiz"),
    relock() {
      openedOn = "";
      kidUntil = 0;
      KP.store.set("gate:until", 0);
    },
    /** 이 카테고리가 지금 잠겨 있나 */
    locked(cat) {
      const s = KP.settings.get();
      return !!s.lock && s.lockCats.includes(cat) && !gate.unlocked();
    },
    /** 날짜 입력판을 띄우고, 맞으면 then() */
    ask(then) {
      if (gate.unlocked()) return then && then();
      showPad(then);
    },
    /** 어른만: 날짜 입력판 (이미 열려 있어도 항상 묻고, 놀이 잠금은 건드리지 않음) */
    adult(then) {
      showPad(then, { adultOnly: true });
    },
  });
  let pad = null;
  function showPad(then, opt = {}) {
    if (pad) pad.remove();
    KP.voice.stop();
    let val = "";
    // 부모 비밀번호(4자리)를 정해 두었으면 그걸로, 아니면 오늘 날짜 8자리
    const pin = KP.settings.get().pin;
    const usePin = !!pin && !opt.dateMode;
    const N = usePin ? 4 : 8;
    const answer = () => (usePin ? pin : todayKST());
    pad = U.el("div", "gatePad" + (opt.adultOnly ? " top" : ""));
    const box = U.el("div", "gateBox");
    box.innerHTML =
      '<div class="gateTitle">' + KP.E("🔒") + " 어른이 열어 주세요</div>" +
      (usePin
        ? '<div class="gateSub">부모 비밀번호 4자리를 눌러 주세요</div>'
        : '<div class="gateSub">오늘 날짜 8자리를 눌러 주세요 <small>(예: 2026년 1월 5일 → 20260105)</small></div>');
    const slots = U.el("div", "gateSlots" + (usePin ? " pin" : ""));
    for (let i = 0; i < N; i++) slots.appendChild(U.el("span", "gateSlot" + (!usePin && (i === 3 || i === 5) ? " gap" : "")));
    const keys = U.el("div", "gateKeys");
    const draw = () => U.$$(".gateSlot", slots).forEach((el, i) => {
      el.textContent = val[i] ? (usePin ? "●" : val[i]) : "";
      el.classList.toggle("on", i === val.length);
    });
    const close = () => {
      if (pad) pad.remove();
      pad = null;
    };
    // 여러 번 틀리면 잠시 입력 막기 (아이가 마구 눌러 우연히 맞히는 것 방지, 새로고침해도 유지)
    const sub = U.$(".gateSub", box);
    const subTxt = sub.innerHTML;
    const lockLeft = () => Math.max(0, (+(KP.store.get("gate:fail", {}).until) || 0) - Date.now());
    const showLock = () => {
      const s = Math.ceil(lockLeft() / 1000);
      sub.innerHTML = s > 0 ? "잠시 후 다시 눌러 주세요 (" + s + "초)" : subTxt;
      if (s > 0) setTimeout(() => pad && sub.isConnected && showLock(), 1000);
    };
    const failed = () => {
      const f = KP.store.get("gate:fail", {});
      f.n = (f.n || 0) + 1;
      if (f.n >= 5) f.until = Date.now() + Math.min(600, 30 * 2 ** (f.n - 5)) * 1000; // 30초부터 두 배씩, 최대 10분
      KP.store.set("gate:fail", f);
      if (f.until > Date.now()) showLock();
    };
    if (lockLeft() > 0) showLock();
    const press = (k) => {
      KP.audio.unlock();
      if (lockLeft() > 0) {
        U.replay(slots, "wrong");
        return;
      }
      if (k === "del") val = val.slice(0, -1);
      else if (val.length < N) val += k;
      KP.audio.sfx("tap");
      draw();
      if (val.length === N) {
        if (val === answer()) {
          KP.store.set("gate:fail", {});
          KP.audio.sfx("good");
          if (opt.adultOnly) {
            close();
            then && then();
            return;
          }
          // 어른: 오늘 계속 열기 / 30분만 열기
          box.innerHTML = '<div class="gateTitle">' + KP.E("🔓") + " 얼마나 열까요?</div>";
          const row = U.el("div", "gateChoice");
          const bAll = U.btn(KP.E("☀️") + " 오늘 계속", "gateKid");
          const b30 = U.btn(KP.E("⏰") + " 30분만", "gateKid");
          row.append(b30, bAll);
          box.appendChild(row);
          const done = (min) => {
            if (min) gate.unlockFor(min, "adult");
            else gate.unlock();
            close();
            KP.renderHome();
            then && then();
          };
          b30.addEventListener("click", () => done(30));
          bAll.addEventListener("click", () => done(0));
        } else {
          U.replay(slots, "wrong");
          KP.audio.sfx("bad");
          failed();
          setTimeout(() => {
            val = "";
            draw();
          }, 450);
        }
      }
    };
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "cancel", "0", "del"].forEach((k) => {
      const b = U.btn(k === "del" ? "⌫" : k === "cancel" ? "닫기" : k, "gateKey" + (k.length > 1 ? " fn" : ""));
      b.addEventListener("click", () => (k === "cancel" ? (KP.audio.sfx("back"), close()) : press(k)));
      keys.appendChild(b);
    });
    box.append(slots, keys);
    if (usePin) {
      // 비밀번호를 잊었을 때: 5초 꾹 → 오늘 날짜로 열기
      const forgot = U.btn("비밀번호를 잊었어요 (5초 꾹)", "gateForgot");
      KP.hold(forgot, 5000, () => showPad(then, Object.assign({}, opt, { dateMode: true })));
      box.appendChild(forgot);
    }
    const st = KP.settings.get();
    // 아이에게: 별 모으기 안내
    if (!opt.adultOnly && KP.earn && KP.earn.active()) {
      const es = KP.earn.state();
      const need = Math.max(0, st.earnStars - es.stars);
      const go = U.btn(
        KP.earn.capDone() ? KP.E("💤") + " 오늘은 문을 다 열었어요" : need ? KP.E("⭐") + " 별 " + need + "개 더 모으러 가기" : KP.E("🚪") + " 별을 다 모았어요! 문 열기",
        "gateKid gateEarn"
      );
      go.addEventListener("click", () => {
        KP.audio.sfx("open");
        close();
        if (KP.earn.capDone()) return KP.voice.say("오늘은 문을 다 열었어요. 내일 또 열어요!");
        if (!need) return KP.earn.open();
        KP.voice.say("공부 놀이에서 별을 모으면 문이 열려요!");
        if (KP.current()) KP.home();
        KP.settings.set({ lastCat: (KP.CATS.find((c) => !st.lockCats.includes(c.id)) || {}).id || st.lastCat });
        KP.renderHome();
      });
      box.appendChild(go);
    }
    const quiz = KP.store.get("gate:quiz", {});
    const quizLeft = quiz.d === todayKST() ? Math.max(0, st.kidQuizMax - (quiz.n || 0)) : st.kidQuizMax;
    if (st.kidGate && !opt.adultOnly && quizLeft <= 0) box.appendChild(U.el("div", "gateSub", KP.E("🐻") + " 문지기 퀴즈는 오늘 다 했어요"));
    if (st.kidGate && !opt.adultOnly && quizLeft > 0) {
      const kid = U.btn(KP.E("🐻") + " " + (KP.kid.nick() ? KP.kid.nick() + ": " : "") + "문제 " + st.kidQ + "개 맞히고 열기", "gateKid");
      kid.addEventListener("click", () => {
        KP.audio.sfx("open");
        kidQuiz(box, then, close);
      });
      box.appendChild(kid);
    }
    pad.appendChild(box);
    pad.addEventListener("click", (e) => e.target === pad && close());
    document.body.appendChild(pad);
    draw();
  }
  /* ---------- 문지기 퀴즈: 아이가 배운 것(한글·숫자·알파벳)을 맞히면 정해진 시간 동안 열림 ----------
     한 번에 맞힌 문제만 셈(틀리면 새 문제). 소리로만 묻고 보기는 글자·숫자·그림. */
  const GQ = {
    C: [["ㄱ", "기역", "🚂", "기차"], ["ㄴ", "니은", "🦋", "나비"], ["ㄷ", "디귿", "🐿️", "다람쥐"], ["ㄹ", "리을", "📻", "라디오"], ["ㅁ", "미음", "🎩", "모자"],
      ["ㅂ", "비읍", "🍌", "바나나"], ["ㅅ", "시옷", "🦁", "사자"], ["ㅇ", "이응", "🦆", "오리"], ["ㅈ", "지읒", "🚲", "자전거"], ["ㅊ", "치읓", "🧀", "치즈"],
      ["ㅋ", "키읔", "🐘", "코끼리"], ["ㅌ", "티읕", "🐰", "토끼"], ["ㅍ", "피읖", "🍇", "포도"], ["ㅎ", "히읗", "🦛", "하마"]],
    V: [["ㅏ", "아"], ["ㅑ", "야"], ["ㅓ", "어"], ["ㅕ", "여"], ["ㅗ", "오"], ["ㅛ", "요"], ["ㅜ", "우"], ["ㅠ", "유"], ["ㅡ", "으"], ["ㅣ", "이"]],
    A: [["A", "에이"], ["B", "비"], ["C", "씨"], ["D", "디"], ["E", "이"], ["F", "에프"], ["G", "지"], ["H", "에이치"], ["K", "케이"], ["L", "엘"], ["M", "엠"],
      ["N", "엔"], ["O", "오"], ["P", "피"], ["R", "알"], ["S", "에스"], ["T", "티"], ["W", "더블유"], ["X", "엑스"], ["Z", "제트"]],
  };
  function makeQ() {
    const t = U.pick(["cons", "cons", "pic", "vow", "num", "num", "abc"]);
    if (t === "cons" || t === "pic") {
      const opts = U.sample(GQ.C, 3);
      const ans = opts[0];
      if (t === "pic") return { show: ans[2], say: ans[3] + "! 무슨 글자로 시작할까요?", opts: U.shuffle(opts.map((o) => o[0])), ans: ans[0], right: ans[3] + "! " + ans[1] + "!" };
      return { show: "👂", say: U.josa(ans[1], "을/를") + " 찾아요!", opts: U.shuffle(opts.map((o) => o[0])), ans: ans[0], right: ans[1] + "!" };
    }
    if (t === "vow") {
      const opts = U.sample(GQ.V, 3);
      return { show: "👂", say: U.josa(opts[0][1], "을/를") + " 찾아요!", opts: U.shuffle(opts.map((o) => o[0])), ans: opts[0][0], right: opts[0][1] + "!" };
    }
    if (t === "abc") {
      const opts = U.sample(GQ.A, 3);
      return { show: "👂", say: U.josa(opts[0][1], "을/를") + " 찾아요!", en: "Find " + opts[0][0] + "!", opts: U.shuffle(opts.map((o) => o[0])), ans: opts[0][0], right: opts[0][1] + "!" };
    }
    const n = 1 + U.rand(20);
    const set = new Set([n]);
    while (set.size < 3) {
      const x = Math.max(1, Math.min(20, n + U.pick([-2, -1, 1, 2, 10, -10]) ));
      set.add(x === n ? 1 + U.rand(20) : x);
    }
    return { show: "👂", say: U.josa(U.numSino(n), "을/를") + " 찾아요! " + U.numNative(n) + "!", opts: U.shuffle([...set].map(String)), ans: String(n), right: U.numSino(n) + "!" };
  }
  function kidQuiz(box, then, close) {
    const need = KP.settings.get().kidQ;
    let got = 0,
      q = null;
    box.innerHTML = "";
    const title = U.el("div", "gateTitle", KP.E("🐻") + " 문제를 맞히면 문이 열려요!");
    const dots = U.el("div", "gateDots");
    const ask = U.btn("", "gateAsk");
    const opts = U.el("div", "gateOpts");
    const back = U.btn("닫기", "gateKey fn gateBack");
    box.append(title, dots, ask, opts, back);
    back.addEventListener("click", () => {
      KP.audio.sfx("back");
      KP.voice.stop();
      close();
    });
    const drawDots = () => (dots.innerHTML = Array.from({ length: need }, (_, i) => "<i class='" + (i < got ? "on" : "") + "'></i>").join(""));
    const speak = () => {
      if (q.en) {
        KP.voice.en(q.en);
        KP.voice.say(q.say, { queue: true });
      } else KP.voice.say(q.say);
    };
    ask.addEventListener("click", () => speak());
    const next = () => {
      q = gate.cur = makeQ(); // gate.cur: 자동 점검용
      ask.innerHTML = KP.E(q.show);
      opts.innerHTML = "";
      let tried = false,
        busy = false;
      q.opts.forEach((o) => {
        const b = U.btn(o, "gateOpt");
        b.addEventListener("click", () => {
          if (busy) return;
          KP.audio.unlock();
          if (o !== q.ans) {
            tried = true;
            U.replay(b, "wrong");
            KP.audio.sfx("bad");
            busy = true;
            KP.voice.say("아니에요! 다른 문제를 줄게요.");
            setTimeout(() => box.isConnected && next(), 1300); // 닫은 뒤 새로 연 입력판에 이전 퀴즈가 끼어들지 않게
            return;
          }
          busy = true;
          b.classList.add("right");
          KP.audio.sfx("good");
          KP.voice.say(q.right);
          if (!tried) got++;
          drawDots();
          setTimeout(() => {
            if (!box.isConnected) return;
            if (got >= need) {
              const min = KP.settings.get().kidMin;
              const q0 = KP.store.get("gate:quiz", {});
              KP.store.set("gate:quiz", { d: todayKST(), n: (q0.d === todayKST() ? q0.n || 0 : 0) + 1 });
              gate.unlockFor(min, "quiz");
              KP.audio.sfx("sparkle");
              KP.confetti && KP.confetti(140);
              KP.voice.say("문이 열렸어요! " + (Number.isInteger(+min) && +min > 0 && +min <= 100 ? U.numSino(+min) + " " : min) + "분 동안 놀 수 있어요!"); // 숫자는 글자로(자연 음성 조각으로 이어 말하기)
              close();
              KP.renderHome();
              then && then();
            } else next();
          }, 1100);
        });
        opts.appendChild(b);
      });
      speak();
    };
    drawDots();
    next();
  }
  // 문지기로 연 시간이 끝나면: 홈은 다시 잠그고, 잠긴 놀이 중이면 홈으로
  let kidWarned = 0;
  setInterval(() => {
    if (kidUntil && kidUntil - Date.now() <= 60000 && kidUntil - Date.now() > 0 && kidWarned !== kidUntil && openedOn !== todayKST()) {
      kidWarned = kidUntil;
      KP.toast("⏰ 1분 뒤에 문이 잠겨요");
      KP.voice.say("1분 뒤에 문이 잠겨요!");
    }
    // 어른이 '오늘 계속' 연 날이 지나면(자정) 다시 잠금
    const dayOver = openedOn && openedOn !== todayKST();
    if (dayOver) openedOn = "";
    if (!dayOver && (!kidUntil || Date.now() < kidUntil)) return;
    if (kidUntil && Date.now() >= kidUntil) {
      kidUntil = 0;
      KP.store.set("gate:until", 0);
    }
    if (gate.unlocked()) return; // 어른이 날짜로 연 날은 그대로
    const c = KP.current();
    if (c && gate.locked(c.def.cat)) KP.lastRound(() => doorClosed());
    else {
      if (!c) KP.renderHome();
      KP.toast("🚪 문이 닫혔어요");
    }
  }, 2000);
  /** 문이 닫힘: 곰이 안내 + 큰 버튼 (공부 놀이로 / 한 번만 더) */
  function doorClosed() {
    if (KP.current()) KP.home();
    const ov = U.el("div", "doorOv");
    const earnOn = KP.earn && KP.earn.active();
    ov.innerHTML = '<div class="doorBox"><div class="doorEm">' + KP.E("🐻") + KP.E("🚪") + '</div><div class="doorTxt">문이 닫혔어요<br><small>' + (earnOn ? "별을 모으면 또 열려요" : "공부 놀이를 하고 또 열어요") + "</small></div></div>";
    const box = ov.firstChild;
    const row = U.el("div", "doorBtns");
    const bGo = U.btn(KP.E("📚") + (earnOn ? " 별 모으러 가기" : " 공부 놀이로"), "btn big primary");
    row.appendChild(bGo);
    if (KP.earn && KP.earn.canOneMore()) {
      const bOne = U.btn(KP.E("☝️") + " 한 번만 더", "btn big");
      bOne.addEventListener("click", () => {
        if (!KP.earn.useOneMore()) return;
        gate.unlockFor(2, "quiz");
        KP.voice.say("딱 한 번만 더!");
        ov.remove();
        KP.renderHome();
      });
      row.appendChild(bOne);
    }
    box.appendChild(row);
    bGo.addEventListener("click", () => {
      KP.audio.sfx("open");
      ov.remove();
      const st = KP.settings.get();
      KP.settings.set({ lastCat: (KP.CATS.find((c) => !st.lockCats.includes(c.id)) || {}).id || st.lastCat });
      KP.renderHome();
    });
    document.body.appendChild(ov);
    KP.audio.sfx("back");
    KP.voice.say(earnOn ? "문이 닫혔어요. 별을 모으면 또 열려요!" : "놀이 시간이 끝났어요! 공부 놀이를 하고 또 열어요.");
    KP.renderHome();
  }

  /* 마지막 판: 놀이 중이면 바로 끊지 않고, 이번 판이 끝날 때(성공 연출 뒤) 또는 최대 90초 뒤에 fn */
  let lastFn = null,
    lastT = 0;
  KP.lastRound = function (fn) {
    const c = KP.current();
    if (!c) return fn();
    if (lastFn) return; // 이미 기다리는 중
    // 판(성공)이 있는 놀이만 판 끝까지 기다림. 자유 놀이(그리기·피아노 등)는 20초 뒤 마무리
    const rounds = (KP.level.get(c.id).wins || 0) > 0;
    KP.toast(rounds ? "⏳ 이번 판이 마지막이에요" : "⏳ 곧 문이 닫혀요");
    if (rounds) KP.voice.say("이번 판이 마지막이에요!", { queue: true });
    lastFn = fn;
    lastT = setTimeout(KP.lastRoundNow, rounds ? 90000 : 20000);
  };
  KP.lastRoundNow = function () {
    const f = lastFn;
    lastFn = null;
    clearTimeout(lastT);
    if (f) f();
  };
  KP.lastRoundWaiting = () => !!lastFn;

  // 어떤 길로 놀이를 열든(홈 카드, 작품 '이어 그리기' 등) 잠금 확인
  const rawOpen = KP.open;
  KP.open = function (id) {
    const g = KP.GAMES[id];
    if (g && gate.locked(g.cat)) return gate.ask(() => rawOpen(id));
    return rawOpen(id);
  };

  /* ---------------- 홈 ---------------- */
  const home = U.el("section", "screen on");
  home.id = "home";
  KP.buildHome = function () {
    home.innerHTML = "";
    const top = U.el("header", "homeTop");
    const brand = U.el("div", "brand");
    const mascot = U.el("button", "homeMascot", KP.E(KP.MASCOT, "", true));
    mascot.setAttribute("aria-label", "곰돌이");
    brand.append(U.el("h1", "", "아이 놀이터"));
    const acts = U.el("div", "homeActs");
    const bKey = U.btn("", "act keyBtn");
    bKey.addEventListener("click", () => {
      KP.audio.unlock();
      const E = KP.earn;
      if (gate.unlocked()) return KP.voice.say("문이 열려 있어요! 신나게 놀아요!");
      if (E.capDone()) return KP.voice.say("오늘은 문을 다 열었어요. 내일 또 열어요!");
      if (E.full()) return E.open();
      KP.audio.sfx("tap");
      const st = KP.settings.get();
      KP.voice.say("공부 놀이에서 별을 모으면 문이 열려요!");
      KP.settings.set({ lastCat: (KP.CATS.find((c) => !st.lockCats.includes(c.id)) || {}).id || st.lastCat });
      KP.renderHome();
    });
    const bSt = U.btn(KP.E("📒", "", true) + "<b>0</b>", "act stickerBtn");
    const bGal = U.btn(KP.E("🖼️", "", true), "act galBtn");
    const bMusic = U.btn(KP.E("🎵", "", true), "act musicBtn");
    const bSet = U.btn(KP.E("⚙️", "", true), "act setBtn");
    acts.append(bKey, bSt, bGal, bMusic, bSet); // 전체 화면(📺)은 아이가 잘못 눌러 풀지 않게 설정 화면으로 옮김
    top.append(brand, acts);

    const tabs = U.el("nav", "tabs");
    tabs.appendChild(mascot);
    const grid = U.el("div", "grid");
    home.append(tabs, top, grid);

    mascot.addEventListener("click", () => {
      U.replay(mascot, "jump");
      KP.audio.sfx("boing");
      KP.voice.say(U.pick(["안녕! 오늘은 뭐 하고 놀까?", "같이 놀자!", "{부름} 반가워!", "무슨 놀이를 할까?"]));
    });
    bSt.addEventListener("click", () => {
      KP.audio.sfx("open");
      KP.open("stickers");
    });
    bGal.addEventListener("click", () => {
      KP.audio.sfx("open");
      KP.open("gallery");
    });
    bMusic.addEventListener("click", () => {
      KP.audio.unlock();
      const on = !KP.settings.get().bgm;
      KP.settings.set({ bgm: on });
      on ? KP.audio.bgm.start() : KP.audio.bgm.stop();
      KP.renderHome();
    });
    KP.hold(
      bSet,
      2000,
      // 시간 제한이 켜져 있으면 아이가 끄지 못하게 날짜 확인을 한 번 더
      () => KP.gate.adult(() => KP.openSettings()), // 늘 오늘 날짜로 한 번 더 확인 (아이가 잠금을 끄지 못하게)
      () => KP.toast("어른용 버튼이에요")
    );

    KP.CATS.forEach((c) => {
      // 이름(음성으로도 읽음) + 좁은 화면용 짧은 이름(폰에서 잘리지 않게)
      const t = U.btn(KP.E(c.icon, "", true) + '<span class="tFull">' + c.name + '</span><span class="tShort">' + (c.short || c.name) + "</span>", "tab");
      t.dataset.cat = c.id;
      t.style.setProperty("--cat", c.color);
      t.style.setProperty("--tsoft", c.soft);
      t.addEventListener("click", () => {
        if (gate.locked(c.id)) {
          KP.audio.sfx("tap");
          return gate.ask(() => {
            KP.settings.set({ lastCat: c.id });
            KP.renderHome();
          });
        }
        KP.audio.sfx("select");
        KP.voice.say(c.name);
        KP.settings.set({ lastCat: c.id });
        KP.renderHome();
        grid.scrollTop = 0;
      });
      tabs.appendChild(t);
    });
    // 아이 이름을 바꾸면 탭 이름도 ("동훈이 도전")
    KP.settings.on(() =>
      U.$$(".tab", tabs).forEach((t) => {
        const c = KP.CATS.find((x) => x.id === t.dataset.cat);
        const sp = t.querySelector(".tFull");
        if (c && sp && sp.textContent !== c.name) sp.textContent = c.name;
      })
    );
  };
  /** 오늘의 도전: 날짜와 카테고리로 정해지는 하루 한 놀이 */
  KP.heroOf = function (cat) {
    const s = KP.settings.get();
    const ids = KP.ORDER.filter((id) => KP.GAMES[id].cat === cat && !s.hidden[id]);
    if (ids.length < 2) return null;
    const key = today() + cat;
    let hsh = 0;
    for (let k = 0; k < key.length; k++) hsh = (hsh * 31 + key.charCodeAt(k)) >>> 0;
    return ids[hsh % ids.length];
  };
  KP.renderHome = function () {
    const s = KP.settings.get();
    let cat = KP.CATS.find((c) => c.id === s.lastCat) ? s.lastCat : KP.CATS[0].id;
    // 잠긴 카테고리면 열린 카테고리(공부 놀이 우선)로 보여 줌
    if (gate.locked(cat)) cat = (KP.CATS.find((c) => c.id === "study" && !gate.locked(c.id)) || KP.CATS.find((c) => !gate.locked(c.id)) || { id: cat }).id;
    U.$$(".tab", home).forEach((t) => {
      t.classList.toggle("sel", t.dataset.cat === cat);
      t.classList.toggle("locked", gate.locked(t.dataset.cat));
    });
    const grid = U.$(".grid", home);
    const c = KP.CATS.find((x) => x.id === cat);
    grid.style.setProperty("--cat", c.color);
    grid.style.setProperty("--soft", c.soft);
    grid.innerHTML = "";
    const ids = KP.ORDER.filter((id) => KP.GAMES[id].cat === cat && !s.hidden[id]);
    // 오늘의 도전: 날짜와 카테고리로 정해지는 하루 한 놀이 (하루 동안은 그대로)
    const hero = KP.heroOf(cat);
    if (hero && ids.includes(hero)) {
      ids.splice(ids.indexOf(hero), 1);
      ids.unshift(hero);
    }
    const ROT = [1.5, -1, 2, -2, 1, -1.5, -1, 2, -0.5, 1.2, -1.8, 0.6];
    const lastId = KP.store.get("lastGame", "");
    ids.forEach((id, i) => {
      const g = KP.GAMES[id];
      const isHero = id === hero;
      const card = U.btn(
        isHero
          ? '<span class="hTag">오늘의 도전</span><span class="cIco">' + KP.E(g.icon) + '</span><span class="cName">' + g.name + '</span><span class="hGo">시작!</span>'
          : '<span class="cIco">' + KP.E(g.icon, "", true) + '</span><span class="cName">' + g.name + "</span>",
        "card" + (isHero ? " hero" : "")
      );
      card.style.setProperty("--i", i);
      card.style.setProperty("--rot", (isHero ? -1.5 : ROT[i % ROT.length]) + "deg");
      if (g.badge) card.appendChild(U.el("span", "cBadge", g.badge));
      // 방금 한 놀이: 테두리가 은은하게 반짝 (자리는 그대로 — 아이가 다시 찾기 쉽게)
      if (id === lastId && !isHero) card.classList.add("last");
      const lv = KP.level.get(id);
      if (g.levels > 1 && lv.lvl > 1) card.appendChild(U.el("span", "cLv", KP.E("🏅", "", true) + Math.min(lv.lvl, g.levels)));
      card.addEventListener("click", () => {
        if (card.dataset.busy) return; // 연타 시 두 번 열리지 않게
        card.dataset.busy = "1";
        setTimeout(() => delete card.dataset.busy, 1000); // 잠금판을 닫고 돌아와도 다시 누를 수 있게
        KP.audio.sfx("open");
        KP.voice.hold(isHero ? "오늘의 도전! " + g.name : g.name); // 이름을 끝까지 읽고 놀이 안내가 이어짐
        U.replay(card, "press");
        setTimeout(() => KP.open(id), 140);
      });
      grid.appendChild(card);
    });
    U.$(".stickerBtn b", home).textContent = KP.stickers.count();
    KP.earn && KP.earn.render();
    U.$(".musicBtn", home).classList.toggle("off", !s.bgm);
  };
  KP.homeEl = home;

  /* ---------------- 알림 토스트 ---------------- */
  let toastEl = null,
    toastT = 0;
  KP.toast = function (msg) {
    if (!toastEl) {
      toastEl = U.el("div", "toast");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = KP.E(msg);
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
  };

  /* ---------------- 사용 시간 제한 ---------------- */
  // 기기 시간(한국 시간) 기준 날짜 — toISOString 은 UTC 라 아침 9시에 날짜가 바뀌는 문제가 있었음
  const today = () => {
    const t = todayKST(); // 잠금과 같은 한국 날짜 기준
    return t.slice(0, 4) + "-" + t.slice(4, 6) + "-" + t.slice(6);
  };
  function usage() {
    const u = KP.store.get("usage", null);
    if (!u || typeof u !== "object" || u.d !== today() || !Number.isFinite(u.s)) return { d: today(), s: 0, bonus: 0 };
    if (!Number.isFinite(u.bonus)) u.bonus = 0;
    return u;
  }
  KP.usage = usage;
  /* 이번만 타이머: 어른이 "지금부터 N분" 을 켜면 그 시각에 잠김 (앱을 껐다 켜도 유지) */
  const sessUntil = () => +KP.store.get("session:until", 0) || 0;
  KP.session = {
    until: sessUntil,
    start(min) {
      KP.store.set("session:until", Date.now() + min * 60000);
      warned = { 5: 0, 1: 0 };
      tick();
    },
    stop() {
      KP.store.set("session:until", 0);
      tick();
    },
  };
  /** 남은 시간(초) — 하루 사용 시간과 이번만 타이머 중 먼저 끝나는 쪽. 제한 없으면 Infinity */
  function timeLeft() {
    let left = Infinity,
      why = "";
    const lim = KP.settings.get().timer;
    const u = usage();
    if (lim > 0 && !(u.bonus >= 100000)) {
      // "오늘은 제한 없이"를 고른 날은 하루 제한을 보지 않음
      left = (lim + (u.bonus || 0)) * 60 - u.s;
      why = "day";
    }
    const su = sessUntil();
    if (su) {
      const l = (su - Date.now()) / 1000;
      if (l < left) {
        left = l;
        why = "session";
      }
    }
    return { left, why };
  }
  KP.timeLeft = timeLeft;

  let bed = null,
    bedWait = false;
  function showBedtime(why) {
    if (bed || bedWait) return;
    // 놀이 중이면 이번 판을 마치고
    if (KP.current() && !KP.lastRoundWaiting()) {
      bedWait = true;
      return KP.lastRound(() => {
        bedWait = false;
        if (KP.current()) KP.home();
        showBedtime(why);
      });
    }
    if (KP.lastRoundWaiting()) return;
    KP.voice.stop();
    if (KP.current()) KP.home();
    const sess = why === "session";
    bed = U.el("div", "bedtime");
    bed.innerHTML =
      '<div class="bedSky"><div class="bedMoon">' + KP.E("🌙") + '</div><div class="bedBear">' + KP.E("🐻") +
      '<span class="zzz">Z z z</span></div><div class="bedTxt">' + (sess ? "놀이 시간 끝!<br>눈을 쉬고 또 놀아요" : "오늘은 여기까지!<br>내일 또 놀자") + "</div></div>";
    const unlock = U.btn(KP.E("🔒") + " 어른 확인", "bedUnlock");
    bed.appendChild(unlock);
    // 아이: 하루 한 번만 "한 번만 더" (2분)
    if (KP.earn && KP.earn.canOneMore()) {
      const one = U.btn(KP.E("☝️") + " 한 번만 더", "bedUnlock bedOne");
      one.addEventListener("click", () => {
        if (!KP.earn.useOneMore()) return;
        KP.voice.say("딱 한 번만 더!");
        extend(2, true);
      });
      bed.appendChild(one);
    }
    document.body.appendChild(bed);
    KP.audio.bgm.stop();
    KP.audio.melody(KP.audio.SONGS.twinkle.notes.slice(0, 14), { beat: 0.5, vol: 0.14 });
    KP.voice.say(sess ? "놀이 시간이 끝났어요! 눈을 쉬고 또 놀아요." : "오늘은 여기까지! 눈이 쉬어야 해요. 내일 또 놀자!");
    // 어른만 풀 수 있게: 오늘 날짜 8자리 → 더 놀 시간 고르기
    unlock.addEventListener("click", () => {
      KP.audio.sfx("tap");
      KP.gate.adult(() => {
        unlock.remove();
        const row = U.el("div", "bedMore");
        const add = (label, min) => {
          const b = U.btn(label, "bedUnlock");
          b.addEventListener("click", () => extend(min));
          row.appendChild(b);
        };
        add(KP.E("⏰") + " 10분 더", 10);
        add(KP.E("⏰") + " 30분 더", 30);
        add(KP.E("🔓") + " 오늘은 제한 없이", -1);
        bed.appendChild(row);
      });
    });
  }
  function extend(min, quiet) {
    const u = usage(),
      lim = KP.settings.get().timer;
    if (min < 0) {
      KP.store.set("session:until", 0);
      if (lim > 0) u.bonus = 100000;
    } else {
      if (sessUntil() && sessUntil() - Date.now() < min * 60000) KP.store.set("session:until", Date.now() + min * 60000);
      if (lim > 0) u.bonus = Math.max(u.bonus || 0, Math.ceil(u.s / 60) - lim + min);
    }
    KP.store.set("usage", u);
    warned = { 5: 0, 1: 0 };
    if (bed) bed.remove();
    bed = null;
    if (!quiet) KP.toast(min < 0 ? "오늘은 시간 제한 없이 놀아요" : min + "분 더 놀 수 있어요");
    if (KP.settings.get().bgm) KP.audio.bgm.start();
    tick();
  }

  /* 남은 시간 표시 + 미리 알려 주기 (5분 전, 1분 전) */
  const pill = U.el("div", "timePill");
  let warned = { 5: 0, 1: 0 };
  function tick() {
    const { left, why } = timeLeft();
    if (left === Infinity) {
      pill.classList.remove("show", "soon");
      return;
    }
    if (left <= 0) {
      pill.classList.toggle("show", bedWait);
      if (bedWait) pill.innerHTML = KP.E("⏳") + " 마지막 판";
      showBedtime(why);
      return;
    }
    if (!pill.parentNode) document.body.appendChild(pill);
    const inGame = !!KP.current();
    const m = Math.ceil(left / 60);
    // 홈에서는 늘 보이고, 놀이 중에는 마지막 5분만 보임
    pill.classList.toggle("show", !bed && (!inGame || left <= 300));
    pill.classList.toggle("soon", left <= 60);
    pill.innerHTML = KP.E("⏳") + " " + (left <= 60 ? Math.ceil(left) + "초" : m + "분");
    if (left <= 300 && left > 240 && !warned[5]) {
      warned[5] = 1;
      KP.toast("⏳ 5분 남았어요");
      KP.voice.say("5분 남았어요!", { queue: true });
    }
    if (left <= 60 && !warned[1]) {
      warned[1] = 1;
      warned[5] = 1;
      KP.toast("⏳ 1분 남았어요");
      KP.voice.say("1분 남았어요! 이제 마무리해요.", { queue: true });
    }
    if (left > 310) warned = { 5: 0, 1: 0 };
  }
  // 아무도 만지지 않고 2분이 지나면 하루 사용 시간을 세지 않음 (켜 두고 자리를 비운 경우)
  let lastTouch = Date.now();
  ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, () => (lastTouch = Date.now()), true));
  setInterval(() => {
    if (document.hidden || bed) return;
    if (Date.now() - lastTouch > 120000) return;
    const u = usage();
    u.s += 5;
    KP.store.set("usage", u);
  }, 5000);
  setInterval(() => !document.hidden && tick(), 1000);
})(window.KP);

;

/* ==== js/core/earn.js ==== */
/* =====================================================================
   🔑 열쇠 별 모으기 → 문 열기
   - 잠그지 않은 카테고리(기본: 공부 놀이)에서 '한 번에 맞힌' 판마다 별 1개
     (찍어서 맞힌 판·너무 빠른 연타·같은 놀이 반복은 세지 않음)
   - 별을 다 모으면 홈의 문을 눌러 정해진 시간 동안 잠긴 놀이가 열림
   - 하루에 별로 열 수 있는 시간에 상한, 하루 사용 시간·잘 시간이 항상 우선
   - 문이 열려 있는 동안은 별 칸 대신 줄어드는 막대(그림 타이머)를 보여 줌
   저장: KP.store "earn" {d, stars, used(분), per:{게임id:별}, last(ms), one(한 번만 더 썼나)}
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;
  const day = () => KP.gate.today();
  function st() {
    const s = KP.store.get("earn", null);
    if (!s || typeof s !== "object" || s.d !== day()) return { d: day(), stars: 0, used: 0, per: {}, last: 0, one: 0 };
    s.stars = Math.max(0, +s.stars || 0);
    s.used = Math.max(0, +s.used || 0);
    if (!s.per || typeof s.per !== "object") s.per = {};
    return s;
  }
  const save = (s) => KP.store.set("earn", s);
  const cfg = () => KP.settings.get();
  /** 별 모으기가 의미 있는 상태인가 (잠금 켜짐 + 잠긴 카테고리 있음 + 켜 둠) */
  const active = () => {
    const s = cfg();
    if (!(s.earnOn && s.lock && s.lockCats.length > 0)) return false;
    // 별을 모을 수 있는(잠기지 않은) 놀이가 하나라도 있어야 함
    return KP.ORDER.some((id) => !s.lockCats.includes(KP.GAMES[id].cat) && !s.hidden[id]);
  };
  /** 별을 주는 놀이인가 = 잠그지 않은 카테고리의 놀이 */
  const earnsIn = (cat) => !cfg().lockCats.includes(cat);
  const capLeft = (s) => (cfg().earnCapMin > 0 ? Math.max(0, cfg().earnCapMin - s.used) : Infinity);

  const E = (KP.earn = {
    state: st,
    active,
    earnsIn,
    /** 문이 열려 있는 동안(별로·퀴즈로·어른 30분) 남은 비율 0~1, 닫혀 있으면 -1 */
    doorFrac() {
      const left = KP.gate.kidLeft();
      if (!left) return -1;
      const tot = (+KP.store.get("gate:len", 0) || left) || 1;
      return Math.max(0, Math.min(1, left / tot));
    },
    full: () => st().stars >= cfg().earnStars,
    capDone: () => capLeft(st()) <= 0,

    /** 놀이에서 성공했을 때 (ui.js win 에서 호출) */
    onWin(ctx, clean) {
      if (!active() || !ctx || !earnsIn(ctx.def.cat)) return false;
      return give(ctx, clean, 1);
    },
    /** 공책(쓰기) 한 장을 끝냈을 때: 별 2개 이상이면 열쇠 별 1개 */
    onNotebook(ctx, stars) {
      if (!active() || !ctx || !earnsIn(ctx.def.cat)) return false;
      return give(ctx, stars >= 2, 1);
    },
    /** 어른이 별 선물 */
    gift(n = 1) {
      const s = st();
      s.stars = Math.min(cfg().earnStars, s.stars + n);
      save(s);
      E.render();
    },
    /** 문 열기 (별이 다 모였을 때) */
    open() {
      const s = st();
      if (s.stars < cfg().earnStars) return false;
      const cap = capLeft(s);
      if (cap <= 0) return false;
      if (KP.timeLeft && KP.timeLeft().left <= 0) return false;
      const min = Math.min(cfg().earnMin, cap);
      s.stars = 0;
      s.used += min;
      save(s);
      KP.gate.unlockFor(min, "earn");
      doorScene();
      KP.voice.say("문이 열렸어요! 신나게 놀아요!");
      E.render();
      KP.renderHome();
      return true;
    },
    /** 한 번만 더 (하루 1번, 아이가 누름) */
    canOneMore: () => cfg().oneMore && !st().one,
    useOneMore() {
      const s = st();
      if (!cfg().oneMore || s.one) return false;
      s.one = 1;
      save(s);
      return true;
    },
    render,
    flyStar,
  });

  function give(ctx, clean, n) {
    const s = st();
    const now = Date.now();
    const id = ctx.def.id;
    const c = cfg();
    if (KP.gate.unlocked()) return false; // 문이 이미 열려 있으면 모으지 않음
    if (!clean) return false; // 찍어서 맞힌 판
    if (now - (s.last || 0) < 6000) return false; // 너무 빠른 연타
    if ((s.per[id] || 0) >= c.earnPerGame) {
      // 같은 놀이는 하루 상한까지 — 다른 놀이로 이끌기 (가끔만 말함)
      if (!s.toldVar || now - s.toldVar > 60000) {
        s.toldVar = now;
        save(s);
        setTimeout(() => KP.voice.say("다른 공부 놀이에서도 별을 찾아봐요!", { queue: true }), 2500);
      }
      return false;
    }
    if (s.stars >= c.earnStars || capLeft(s) <= 0) return false;
    if (KP.timeLeft && KP.timeLeft().left <= 0) return false;
    // 오늘의 도전 놀이는 별 2개
    const hero = KP.heroOf && KP.heroOf(ctx.def.cat) === id;
    const add = Math.min(hero ? 2 : n, c.earnStars - s.stars, c.earnPerGame - (s.per[id] || 0)); // 같은 놀이 상한도 넘지 않게
    s.stars += add;
    s.per[id] = (s.per[id] || 0) + add; // 같은 놀이 상한은 '별 수' 기준 (오늘의 도전 하나로 다 채우지 않게)
    s.last = now;
    save(s);
    setTimeout(() => flyStar(ctx, add), 560);
    if (s.stars >= c.earnStars) setTimeout(() => KP.voice.say("별을 다 모았어요! 홈에서 문을 열어요!", { queue: true }), 2600);
    return true;
  }

  /* ---------- 그리기: 놀이 상단 열쇠 칸 + 홈 열쇠 버튼 ---------- */
  function slotsHTML(n, max) {
    let h = '<span class="kStars">';
    for (let i = 0; i < max; i++) h += '<i class="' + (i < n ? "on" : "") + '">' + (i < n ? KP.E("⭐") : "") + "</i>";
    return h + "</span>";
  }
  function barHTML(f) {
    return '<span class="kBar"><i style="width:' + Math.round(f * 100) + '%"></i></span>';
  }
  function content() {
    const s = st(),
      c = cfg();
    const f = E.doorFrac();
    if (f >= 0 && !KP.gate.adultOpen()) return { cls: "open", html: KP.E("🔓") + barHTML(f) };
    if (KP.gate.adultOpen()) return { cls: "adult", html: KP.E("🔓") };
    if (capLeft(s) <= 0) return { cls: "done", html: KP.E("🚪") + '<span class="kZz">' + KP.E("💤") + "</span>" };
    const full = s.stars >= c.earnStars;
    return { cls: full ? "full" : "", html: KP.E(full ? "🚪" : "🔑") + slotsHTML(s.stars, c.earnStars) };
  }
  function paint(el) {
    if (!el) return;
    const bar = el.closest(".bar");
    if (!active()) {
      el.style.display = "none";
      if (bar) bar.classList.remove("hasKey");
      return;
    }
    el.style.display = "";
    if (bar) bar.classList.add("hasKey");
    const { cls, html } = content();
    if (el._h !== html) {
      el._h = html;
      el.innerHTML = html;
    }
    el.classList.toggle("full", cls === "full");
    el.classList.toggle("open", cls === "open");
    el.classList.toggle("done", cls === "done");
  }
  function render() {
    const cur = KP.current && KP.current();
    if (cur && cur.keyPill) paint(cur.keyPill);
    paint(document.querySelector("#home .keyBtn"));
  }
  setInterval(() => !document.hidden && render(), 1000);

  /** 문이 열리는 장면: 별 다섯 개가 열쇠 구멍으로 → 문이 활짝 → 빛과 꽃가루 */
  function doorScene() {
    const n = cfg().earnStars;
    const ov = U.el("div", "doorScene");
    ov.innerHTML =
      '<div class="dsFrame"><div class="dsLight"></div><div class="dsDoor"><span class="dsKnob"></span><span class="dsHole"></span></div></div>' +
      '<div class="dsStars">' + Array.from({ length: n }, (_, i) => '<span style="--i:' + i + '">' + KP.E("⭐") + "</span>").join("") + "</div>";
    document.body.appendChild(ov);
    KP.audio.sfx("sparkle");
    setTimeout(() => {
      ov.classList.add("open");
      KP.audio.sfx("levelup");
    }, 1100);
    setTimeout(() => KP.confetti && KP.confetti(200), 1500);
    setTimeout(() => ov.classList.add("bye"), 2900);
    setTimeout(() => ov.remove(), 3400);
    ov.addEventListener("click", () => ov.remove());
  }

  /** 별이 열쇠 칸으로 날아가기 — 칭찬 그림이 떠 있으면 거기서 튀어나와 반짝이 꼬리를 달고 날아감 */
  function flyStar(ctx, n) {
    const target = (ctx && ctx._active && ctx.keyPill) || document.querySelector("#home .keyBtn");
    if (!target || !target.offsetParent) return render();
    const b = target.getBoundingClientRect();
    const em = document.querySelector(".celebrate.show .cEm");
    const er = em && em.getBoundingClientRect();
    const ox = er && er.width ? er.left + er.width / 2 : innerWidth / 2,
      oy = er && er.width ? er.top + er.height / 2 : innerHeight / 2;
    for (let i = 0; i < n; i++) {
      const x0 = ox - 30 + i * 40,
        y0 = oy - 30;
      const dx = b.left + b.width / 2 - x0 - 30,
        dy = b.top + b.height / 2 - y0 - 30;
      const fly = U.el("div", "flyStar", KP.E("⭐"));
      Object.assign(fly.style, { left: x0 + "px", top: y0 + "px" });
      // 꼬리 반짝이 3개: 같은 길을 조금씩 늦게, 작아지며 사라짐 (옮기기·투명도만 바꿔서 가벼움)
      const trail = [1, 2, 3].map((k) => {
        const t = U.el("div", "flyTrail");
        Object.assign(t.style, { left: x0 + "px", top: y0 + "px", transitionDelay: k * 0.06 + "s", transform: "scale(" + (1.1 - k * 0.2) + ")" });
        document.body.appendChild(t);
        return [t, k];
      });
      document.body.appendChild(fly);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          fly.style.transform = "translate(" + dx + "px," + dy + "px) scale(.35) rotate(360deg)";
          trail.forEach(([t, k]) => {
            t.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + (0.5 - k * 0.1) + ")";
            t.style.opacity = "0";
          });
        })
      );
      setTimeout(() => trail.forEach(([t]) => t.remove()), 1150 + i * 120);
      setTimeout(() => {
        fly.remove();
        if (i === n - 1) {
          render();
          U.replay(target, "bump");
          KP.audio.sfx("sparkle");
        }
      }, 900 + i * 120);
    }
  }
})(window.KP);

;

/* ==== js/core/perfmon.js ==== */
/* =====================================================================
   렉 측정 (부모 설정 → 렉 측정) — 실제 기기에서 화면마다 끊김을 기록
   - 켜 두면 매 장면 간격을 재서 화면(홈·놀이·축하)별로 모음 → 설정 화면 표 · 복사해서 보내기
   - '연 놀이 수'별로도 모아서 쓸수록 느려지는지 봄 (앱을 새로 열면 0부터)
   - 꺼 두면 아무것도 하지 않음
   KP.perf.on() · set(bool) · badge() · setBadge(bool) · report() → 글자 · clear()
===================================================================== */
"use strict";
(function (KP) {
  const S = KP.store;
  const KEY = "perf:data";
  let data = null, // { s: {화면: {f,t,j,b,w,n}}, g: {누적구간: {f,t,j,b}}, since, mem }
    raf = 0,
    last = 0,
    cur = "",
    opened = 0, // 이번에 앱을 연 뒤 연 놀이 수
    saveAt = 0,
    badgeEl = null,
    bF = 0,
    bT = 0;
  const load = () => (data = data || S.get(KEY, null) || { s: {}, g: {}, since: Date.now() });
  const bucket = () => (opened < 5 ? "0~4개" : opened < 10 ? "5~9개" : opened < 20 ? "10~19개" : opened < 40 ? "20~39개" : "40개 이상");
  const where = () => {
    const c = KP.current && KP.current();
    const id = c ? c.id : document.querySelector(".panel") ? "(설정)" : "(홈)";
    return KP.celebrating ? id + " 축하" : id;
  };
  const add = (o, dt) => {
    o.f = (o.f || 0) + 1;
    o.t = (o.t || 0) + dt;
    if (dt > 50) o.j = (o.j || 0) + 1; // 한 장이 50ms 넘게 걸림 = 눈에 띄는 끊김
    if (dt > 250) o.b = (o.b || 0) + 1; // 0.25초 넘게 멈춤
    if (dt > (o.w || 0)) o.w = Math.round(dt);
  };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = now - last;
    last = now;
    if (document.hidden || dt <= 0 || dt > 1500) return; // 가려졌다 돌아온 틈은 빼기
    const w = where();
    if (w !== cur) {
      if (KP.current && KP.current() && !/ 축하$/.test(w) && w !== cur.replace(/ 축하$/, "")) opened++;
      cur = w;
      const o = (data.s[w] = data.s[w] || {});
      o.n = (o.n || 0) + 1;
      return; // 화면이 바뀐 첫 장은 여는 데 걸린 시간이라 빼기
    }
    add((data.s[w] = data.s[w] || { n: 1 }), dt);
    add((data.g[bucket()] = data.g[bucket()] || {}), dt);
    const m = performance.memory;
    if (m && m.usedJSHeapSize > (data.mem || 0)) data.mem = m.usedJSHeapSize;
    if (badgeEl) {
      bF++;
      bT += dt;
      if (bT > 1000) {
        badgeEl.textContent = Math.round((bF * 1000) / bT) + "fps";
        badgeEl.style.color = bF * 1000 < bT * 30 ? "#e5484d" : bF * 1000 < bT * 50 ? "#d58a00" : "#2a9d4b";
        bF = bT = 0;
      }
    }
    if (now > saveAt) {
      saveAt = now + 10000;
      S.set(KEY, data);
    }
  }
  function start() {
    if (raf) return;
    load();
    last = performance.now();
    saveAt = last + 10000;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    S.set(KEY, data);
  }
  function showBadge(on) {
    if (on && !badgeEl) {
      badgeEl = KP.u.el("div", "perfBadge", "");
      badgeEl.style.cssText = "position:fixed;left:max(4px,env(safe-area-inset-left));bottom:max(4px,env(safe-area-inset-bottom));z-index:99999;pointer-events:none;font:700 12px/1 system-ui,sans-serif;padding:3px 6px;border-radius:8px;background:rgba(255,255,255,.85)";
      document.body.appendChild(badgeEl);
    } else if (!on && badgeEl) {
      badgeEl.remove();
      badgeEl = null;
    }
  }
  document.addEventListener("visibilitychange", () => document.hidden && raf && S.set(KEY, data));

  function gpu() {
    try {
      const g = document.createElement("canvas").getContext("webgl");
      if (!g) return "WebGL 없음";
      const x = g.getExtension("WEBGL_debug_renderer_info");
      const r = x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER);
      const lose = g.getExtension("WEBGL_lose_context");
      lose && lose.loseContext();
      return String(r);
    } catch (e) {
      return "?";
    }
  }
  const fps = (o) => (o.t ? Math.round((o.f * 1000) / o.t) : 0);
  const name = (id) => {
    const base = id.replace(/ 축하$/, "");
    const g = KP.GAMES && KP.GAMES[base];
    return (g ? g.name + " (" + base + ")" : base) + (base !== id ? " 축하" : "");
  };

  KP.perf = {
    on: () => S.get("perf:on", false) === true,
    set(on) {
      S.set("perf:on", !!on);
      on ? start() : (stop(), showBadge(false));
      if (on && KP.perf.badge()) showBadge(true);
    },
    badge: () => S.get("perf:badge", false) === true,
    setBadge(on) {
      S.set("perf:badge", !!on);
      showBadge(on && KP.perf.on());
    },
    clear() {
      data = { s: {}, g: {}, since: Date.now() };
      cur = "";
      S.set(KEY, data);
    },
    /** 화면별 목록 (느린 것 먼저) — 너무 짧게 본 화면(약 5초 미만)은 빼기 */
    rows() {
      load();
      return Object.entries(data.s)
        .filter(([, o]) => o.t >= 5000)
        .map(([id, o]) => ({ id, name: name(id), fps: fps(o), jank: Math.round(((o.j || 0) * 1000) / (o.f || 1)) / 10, freeze: o.b || 0, worst: o.w || 0, sec: Math.round(o.t / 1000), n: o.n || 0 }))
        .sort((a, b) => a.fps - b.fps || b.jank - a.jank);
    },
    groups() {
      load();
      return ["0~4개", "5~9개", "10~19개", "20~39개", "40개 이상"].filter((k) => data.g[k] && data.g[k].t >= 5000).map((k) => ({ k, fps: fps(data.g[k]), jank: Math.round(((data.g[k].j || 0) * 1000) / data.g[k].f) / 10 }));
    },
    /** 보내기용 글자 */
    report() {
      load();
      const q = S.keys().filter((k) => /:q$/.test(k)).map((k) => k + "=" + JSON.stringify(S.get(k, null) && S.get(k, null).q != null ? S.get(k, null).q : S.get(k, null)));
      const L = [
        "[렉 측정] 버전 " + (KP.VERSION || "dev") + " · 기록 시작 " + new Date(data.since).toLocaleString("ko-KR"),
        "기기: " + navigator.userAgent,
        "화면 " + screen.width + "x" + screen.height + " · 배율 " + (devicePixelRatio || 1) + " · 코어 " + (navigator.hardwareConcurrency || "?") + " · 메모리 " + (navigator.deviceMemory || "?") + "GB · 그래픽 " + gpu(),
        "최대 사용 메모리(JS) " + (data.mem ? Math.round(data.mem / 1e6) + "MB" : "?") + " · 3D 화질 " + (q.join(", ") || "-"),
        "지금 열어 둔 놀이 화면 " + document.querySelectorAll(".screen.game").length + "개 · 그림판 메모리 약 " + Math.round([...document.querySelectorAll("canvas")].reduce((n, c) => n + c.width * c.height * 4, 0) / 1e6) + "MB · 앱 켜진 지 " + Math.round(performance.now() / 60000) + "분",
        "",
        "화면 | 초당 장수 | 끊김% | 멈춤(0.25초+) | 최악ms | 본 시간(초) | 들어간 횟수",
      ];
      KP.perf.rows().forEach((r) => L.push([r.name, r.fps, r.jank, r.freeze, r.worst, r.sec, r.n].join(" | ")));
      L.push("", "연 놀이 수 | 초당 장수 | 끊김%");
      KP.perf.groups().forEach((g) => L.push([g.k, g.fps, g.jank].join(" | ")));
      return L.join("\n");
    },
  };
  if (KP.perf.on()) {
    start();
    if (KP.perf.badge()) (document.body ? showBadge(true) : addEventListener("DOMContentLoaded", () => showBadge(true)));
  }
})(window.KP);

;

/* ==== js/core/stats.js ==== */
/* =====================================================================
   사용 통계 (익명) — 놀이 보완용. 부모 설정 → 사용 통계 에서 끌 수 있음
   - 무엇을: 앱 켬 / 놀이 열기·나감(머문 초) / 이김·틀림 / 단계 오르내림 / 문 열기(방법·분) / 오류 / 주요 설정 변경
   - 무엇을 안 보내나: 아이 이름(있는지만), 사진·작품, 음성, 위치, IP(서버도 저장 안 함)
   - 어떻게: 기기에 모아 두었다가(최대 500개) 인터넷 될 때 묶어 보냄. 실패해도 놀이에 영향 없음. 서버 주소(KP.STATS_URL)가 없으면 아무것도 안 함
   - 기기번호: 처음 켤 때 무작위로 만든 글자 (설정에서 '기록 지우기' 하면 새로 만듦)
   KP.stats.on() · dev() · pending() · flush() · reset()
===================================================================== */
"use strict";
(function (KP) {
  const S = KP.store;
  const url = () => (typeof KP.STATS_URL === "string" && /^https:\/\//.test(KP.STATS_URL) ? KP.STATS_URL.replace(/\/$/, "") : "");
  // 로컬 서버(localhost·사설 IP)나 자동 점검 브라우저(Playwright: navigator.webdriver)에서는 보내지 않음 — 2026-11-09 점검 기록 186대가 실제 서버에 섞여 들어간 사고
  const local = () => /^(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname) || !!navigator.webdriver;
  const on = () => !!url() && !local() && KP.settings.get().stats !== false;
  const rnd = () => {
    const a = new Uint8Array(12);
    (self.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = (Math.random() * 256) | 0));
    return [...a].map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  let dev = S.get("stats:dev", "");
  if (typeof dev !== "string" || !/^[0-9a-f]{24}$/.test(dev)) S.set("stats:dev", (dev = rnd()));
  let q = S.get("stats:q", []);
  if (!Array.isArray(q)) q = [];
  let saveT = 0,
    sending = false,
    errN = 0,
    cur = "", // 지금 열린 놀이
    openAt = 0;
  const save = () => {
    if (saveT) return;
    saveT = setTimeout(() => {
      saveT = 0;
      S.set("stats:q", q);
    }, 800);
  };
  const push = (kind, game, a, b, c) => {
    if (!on()) return;
    // 7번째 칸: 이벤트 고유 번호 — 아이폰에서 화면이 꺼질 때 보낸 묶음의 응답을 못 받아 같은 묶음을 다시 보내면 서버가 이 번호로 중복을 걸러냄 (2026-11-09 아이폰 기록 3배 중복)
    q.push([Date.now(), kind, game || "", a == null ? null : a, b == null ? null : b, c == null ? null : String(c).slice(0, 40), rnd().slice(0, 12)]);
    if (q.length > 500) q.splice(0, q.length - 500);
    save();
  };
  const info = () => {
    const ua = navigator.userAgent || "";
    const os = /android/i.test(ua) ? "android" : /iP(hone|ad|od)/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Windows/.test(ua) ? "windows" : "other";
    const st = matchMedia && matchMedia("(display-mode: standalone)").matches ? "app" : "browser";
    return { os: os + "-" + st, scr: screen.width + "x" + screen.height, dpr: Math.round((devicePixelRatio || 1) * 10) / 10, lang: navigator.language || "", named: !!KP.settings.get().kidName };
  };
  function flush(keepalive) {
    if (!on() || !q.length || sending || navigator.onLine === false) return Promise.resolve(false);
    const batch = q.slice(0, 200);
    sending = true;
    const body = JSON.stringify({ d: dev, v: (KP.VERSION || "").split(" ")[0], p: info(), e: batch });
    return fetch(url() + "/e", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: !!keepalive })
      .then((r) => {
        if (r.ok) {
          q.splice(0, batch.length);
          S.set("stats:q", q);
        }
        return r.ok;
      })
      .catch(() => false)
      .finally(() => (sending = false));
  }
  KP.stats = {
    on,
    dev: () => dev,
    pending: () => q.length,
    flush: () => flush(false),
    /** 기록과 기기번호를 지우고 새로 시작 (끌 때·지우기 버튼) */
    reset() {
      q = [];
      S.set("stats:q", q);
      S.set("stats:dev", (dev = rnd()));
    },
  };

  /* ---- 걸어 두기: 놀이 열기·나감 ---- */
  const leaveNow = () => {
    if (!cur) return;
    push("leave", cur, Math.round((Date.now() - openAt) / 1000));
    cur = "";
  };
  const open0 = KP.open;
  KP.open = function (id) {
    if (KP.GAMES && KP.GAMES[id]) {
      leaveNow();
      const lv = KP.level.get(id);
      push("open", id, null, lv.lvl);
      cur = id;
      openAt = Date.now();
    }
    return open0.apply(this, arguments);
  };
  const home0 = KP.home;
  KP.home = function () {
    leaveNow();
    return home0.apply(this, arguments);
  };
  /* ---- 이김·틀림·단계: 난이도 저장을 보고 알아냄 (놀이 코드는 손대지 않음) ---- */
  const save0 = KP.level.save;
  KP.level.save = function (id, v) {
    try {
      const p = KP.level.get(id);
      if (v && typeof v === "object") {
        if ((v.wins || 0) > (p.wins || 0)) push("win", id, null, p.lvl);
        if ((v.miss || 0) > (p.miss || 0)) push("miss", id, null, p.lvl);
        if (Number.isFinite(v.lvl) && v.lvl !== p.lvl) push("lvl", id, v.lvl > p.lvl ? 1 : -1, v.lvl);
      }
    } catch (e) {}
    return save0.apply(this, arguments);
  };
  /* ---- 문 열기 ---- */
  if (KP.gate && typeof KP.gate.unlockFor === "function") {
    const u0 = KP.gate.unlockFor;
    KP.gate.unlockFor = function (min, src) {
      push("unlock", "", min, null, src || "quiz");
      return u0.apply(this, arguments);
    };
  }
  /* ---- 주요 설정 변경 (값이 숫자/참거짓인 것만) ---- */
  const WATCH = ["timer", "lock", "earnOn", "earnStars", "earnMin", "kidGate", "natural", "hints", "oneMore", "stats"];
  const set0 = KP.settings.set;
  KP.settings.set = function (patch) {
    const r = set0.apply(this, arguments);
    try {
      if (patch && typeof patch === "object") for (const k of WATCH) if (k in patch) push("set", "", +patch[k] || 0, null, k);
      if (patch && patch.stats === false) KP.stats.reset(); // 끄면 모아 둔 것도 지움
    } catch (e) {}
    return r;
  };
  /* ---- 오류 ---- */
  const onErr = (msg) => {
    if (errN++ < 20) push("err", cur, null, null, String(msg || "").replace(/^Uncaught\s+/i, "").slice(0, 40));
  };
  addEventListener("error", (e) => onErr(e.message));
  addEventListener("unhandledrejection", (e) => onErr(e.reason && (e.reason.message || e.reason)));

  /* ---- 보내기 시점: 켠 뒤 8초, 그 뒤 5분마다, 화면이 가려질 때(앱 닫힘), 인터넷이 돌아올 때 ---- */
  push("app", "", null, null, info().os);
  setTimeout(() => flush(false), 8000);
  setInterval(() => flush(false), 300000);
  addEventListener("online", () => setTimeout(() => flush(false), 3000));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      leaveNow(); // 앱을 닫는 중이면 머문 시간을 남김
      if (cur === "" && KP.current && KP.current()) {
        cur = KP.current().id; // 돌아오면 이어서 잼
        openAt = Date.now();
      }
      flush(true);
    }
  });
})(window.KP);

;

/* ==== js/core/pages.js ==== */
/* =====================================================================
   특별 화면: 스티커북 · 내 작품 갤러리 · 부모 설정 패널
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;

  /* ---------------- 스티커북 ---------------- */
  KP.game({
    id: "stickers",
    icon: "📒",
    name: "내 스티커북",
    cat: "sys",
    bubble: true,
    setup(ctx) {
      ctx.head = U.el("div", "stkHead");
      ctx.grid = U.el("div", "stkGrid");
      ctx.body.append(ctx.head, ctx.grid);
    },
    start(ctx) {
      const have = KP.stickers.have();
      const n = Object.keys(have).length,
        all = KP.stickers.LIST.length;
      ctx.say(n ? "스티커를 " + n + "개 모았어요! 눌러 보세요." : "놀이를 하면 스티커를 받을 수 있어요!", n ? "스티커를 많이 모았어요! 눌러 보세요." : true);
      ctx.head.innerHTML = '<div class="stkBar"><i style="width:' + (n / all) * 100 + '%"></i></div><b>' + n + " / " + all + "</b>";
      ctx.grid.innerHTML = "";
      const last = KP.store.get("lastSticker", "");
      KP.stickers.LIST.forEach(([e, name], i) => {
        const got = have[e];
        const c = U.el("button", "stk" + (got ? " got" : "") + (e === last ? " new" : ""), KP.E(e));
        c.style.setProperty("--i", i);
        if (got > 1) c.appendChild(U.el("span", "stkN", "×" + got));
        c.addEventListener("click", () => {
          if (got) {
            U.replay(c, "jump");
            KP.audio.sfx("tap2");
            KP.voice.say(name + "!");
          } else {
            U.replay(c, "wrong");
            KP.voice.say("아직 없어요. 놀이를 하면 받을 수 있어요!");
          }
        });
        ctx.grid.appendChild(c);
      });
    },
  });

  /* ---------------- 내 작품 갤러리 ---------------- */
  KP.game({
    id: "gallery",
    icon: "🖼️",
    name: "내 작품",
    cat: "sys",
    setup(ctx) {
      ctx.grid = U.el("div", "galGrid");
      ctx.body.appendChild(ctx.grid);
      ctx.viewer = U.el("div", "viewer");
      ctx.root.appendChild(ctx.viewer);
    },
    async start(ctx) {
      ctx.viewer.classList.remove("show");
      const items = (await KP.db.all("art")).filter((x) => x.kind !== "zoo").reverse();
      ctx.say(items.length ? "내가 만든 작품이 " + items.length + "개 있어요!" : "그림 그리기에서 저장하면 여기에 모여요!", items.length ? "내가 만든 작품이 있어요!" : true);
      ctx.grid.innerHTML = "";
      if (!items.length) {
        const go = U.btn(KP.E("🎨") + " 그림 그리러 가기", "btn big");
        go.style.gridColumn = "1 / -1";
        go.addEventListener("click", () => KP.open("draw"));
        ctx.grid.appendChild(go);
      }
      items.forEach((it, i) => {
        const c = U.el("button", "galItem");
        c.style.setProperty("--i", i);
        const im = U.el("img");
        im.alt = "";
        im.src = KP.safeImg(it.img);
        const dt = U.el("span", "galDate");
        dt.textContent = String(it.date || "");
        c.append(im, dt);
        c.addEventListener("click", () => open(ctx, it));
        ctx.grid.appendChild(c);
      });
    },
  });
  /** 그림 한 장 출력
      - iPad/iPhone: 홈 화면 앱에서는 인쇄 창이 안 뜰 수 있어 공유 창을 띄움 → 거기서 '프린트' (또는 '이미지 저장')
      - 그 밖(안드로이드·PC): 브라우저 인쇄 창 (A4 가로, 그림만 한 장) */
  KP.printImg = async function (dataUrl, title) {
    const src = KP.safeImg(dataUrl);
    if (!src) return;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios && navigator.share && navigator.canShare) {
      try {
        // data: 주소를 직접 바이트로 (fetch 는 보안 설정상 data: 를 못 씀)
        const [head, b64] = src.split(",");
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const blob = new Blob([u8], { type: head.slice(5, head.indexOf(";")) });
        const file = new File([blob], (title || "그림").replace(/[\\/:*?"<>|]/g, "") + ".jpg", { type: blob.type || "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          KP.toast("🖨️ 아래 목록에서 '프린트'를 눌러 주세요");
          await navigator.share({ files: [file] });
          return;
        }
      } catch (e) {
        if (e && e.name === "AbortError") return; // 공유 창을 닫음
      }
    }
    KP.css("printImg", `
      #printArea{display:none}
      @media print{
        @page{size:A4 landscape;margin:10mm}
        html,body{background:#fff!important;height:auto!important;overflow:visible!important}
        body>*:not(#printArea){display:none!important}
        #printArea{display:flex!important;position:static;width:100%;height:180mm;align-items:center;justify-content:center}
        #printArea img{max-width:100%;max-height:100%;object-fit:contain}
      }`);
    let pa = document.getElementById("printArea");
    if (!pa) {
      pa = document.createElement("div");
      pa.id = "printArea";
      document.body.appendChild(pa);
    }
    pa.innerHTML = "";
    const im = new Image();
    im.alt = "";
    pa.appendChild(im);
    await new Promise((r) => {
      im.onload = im.onerror = r;
      im.src = src;
    });
    const t0 = document.title;
    if (title) document.title = title;
    const fin = () => {
      document.title = t0;
      pa.innerHTML = "";
      removeEventListener("afterprint", fin);
    };
    addEventListener("afterprint", fin);
    try {
      window.print();
    } catch (e) {
      fin();
      KP.toast("이 기기에서는 출력할 수 없어요");
    }
  };
  function open(ctx, it) {
    KP.audio.sfx("open");
    const v = ctx.viewer;
    v.innerHTML = "";
    const img = U.el("img", "viewImg");
    img.src = KP.safeImg(it.img);
    const row = U.el("div", "viewRow");
    const bClose = U.btn(KP.E("↩️") + " 돌아가기", "btn");
    const bEdit = U.btn(KP.E("✏️") + " 이어 그리기", "btn primary");
    const bDel = U.btn(KP.E("🗑️") + " 지우기(꾹)", "btn danger");
    const bPrint = U.btn(KP.E("🖨️") + " 출력", "btn");
    const bPuz = U.btn(KP.E("🧩") + " 퍼즐로", "btn");
    bPuz.addEventListener("click", () => {
      KP.pendingPuzzle = it.id;
      KP.open("jigsaw");
    });
    bPrint.addEventListener("click", () => KP.printImg(it.img, "내 작품 " + String(it.date || "")));
    row.append(bClose, bEdit, bPuz, bPrint, bDel);
    v.append(img, row);
    v.classList.add("show");
    bClose.addEventListener("click", () => v.classList.remove("show"));
    bEdit.addEventListener("click", () => {
      KP.pendingDraw = it;
      KP.open("draw");
    });
    KP.hold(bDel, 1500, async () => {
      await KP.db.del("art", it.id);
      KP.toast("지웠어요");
      KP.GAMES.gallery.start(ctx);
    });
  }

  /* ---------------- 부모 설정 ---------------- */
  let panel = null;
  KP.openSettings = function () {
    if (panel) panel.remove();
    KP.voice.stop();
    const s = KP.settings.get();
    panel = U.el("div", "panel");
    const box = U.el("div", "panelBox");
    panel.appendChild(box);
    box.innerHTML = '<h2>' + KP.E("⚙️") + ' 부모 설정</h2>';
    const close = U.btn("✕", "panelClose");
    close.addEventListener("click", () => {
      panel.remove();
      panel = null;
      KP.renderHome();
    });
    box.appendChild(close);

    const sec = (title) => {
      const d = U.el("section", "pSec", "<h3>" + title + "</h3>");
      box.appendChild(d);
      return d;
    };

    // 소리
    const sSnd = sec("소리");
    [["sfx", "효과음"], ["music", "배경음악"], ["voice", "목소리 안내"]].forEach(([k, label]) => {
      const row = U.el("label", "pRow", "<span>" + label + "</span>");
      const r = U.el("input");
      r.type = "range";
      r.min = 0;
      r.max = 1;
      r.step = 0.05;
      r.value = s[k];
      r.addEventListener("input", () => KP.settings.set({ [k]: +r.value }));
      r.addEventListener("change", () => {
        if (k === "voice") KP.voice.say("목소리 크기예요");
        else if (k === "sfx") KP.audio.sfx("good");
      });
      row.appendChild(r);
      sSnd.appendChild(row);
    });
    const nRow = U.el("label", "pRow", "<span>자연스러운 목소리 쓰기 (미리 만든 음성)</span>");
    const nc = U.el("input");
    nc.type = "checkbox";
    nc.checked = s.natural;
    nc.addEventListener("change", () => KP.settings.set({ natural: nc.checked }));
    nRow.appendChild(nc);
    sSnd.appendChild(nRow);
    const nInfo = U.el("p", "pNote natInfo", "");
    const showN = async (extra) => {
      const r = await KP.voice.natReport();
      let t;
      if (r.stored >= r.total && r.total) t = "✅ 자연 음성 " + r.total + "개 모두 이 기기에 저장됨 — 인터넷 없어도 나와요.";
      else if (r.nocors && !r.stored) t = "🌐 자연 음성은 인터넷이 될 때만 나와요 (파일 서버가 기기 저장을 막음). 오프라인일 땐 기기 목소리.";
      else if (r.stored) t = "⏳ " + r.total + "개 중 " + r.stored + "개 저장됨" + (r.failed ? " · 못 받은 것 " + r.failed + "개" : "") + " — 아래 버튼을 다시 눌러 주세요.";
      else if (!r.online) t = "📴 인터넷이 꺼져 있어요. 연결한 뒤 아래 버튼을 눌러 주세요.";
      else t = "아직 받지 않았어요 (" + r.total + "개). 아래 버튼을 눌러 주세요.";
      nInfo.textContent = t + (extra ? " " + extra : "") + " 준비 안 된 문장은 기기 목소리로 읽어요.";
    };
    showN();
    sSnd.appendChild(nInfo);
    const bNat = U.btn(KP.E("⬇️") + " 지금 받아 두기 / 들어 보기", "chip");
    bNat.addEventListener("click", async () => {
      if (bNat.disabled) return;
      bNat.disabled = true;
      KP.audio.unlock();
      KP.voice.unlockEl && KP.voice.unlockEl();
      await KP.voice.prefetch((i, n) => (bNat.textContent = "받는 중… " + i + " / " + n));
      bNat.innerHTML = KP.E("⬇️") + " 지금 받아 두기 / 들어 보기";
      bNat.disabled = false;
      await showN();
      KP.voice.lastVia = "";
      await KP.voice.say("기역! 기차의 기!");
      const v = KP.voice.lastVia;
      showN(v === "natural" ? "▶ 방금 소리: 자연 음성 ✓" : v === "el" ? "▶ 방금 소리: 자연 음성 ✓ (인터넷으로 재생)" : v === "tts" ? "▶ 방금 소리: 기기 목소리 (자연 음성 아님)" : "▶ 소리 크기가 0이거나 소리가 꺼져 있어요.");
    });
    sSnd.appendChild(bNat);
    const vName = KP.voice.koName();
    sSnd.appendChild(U.el("p", "pNote", vName ? "사용 중인 목소리: " + vName : "이 기기에서 한국어 음성을 찾지 못했어요. 기기 설정 > 손쉬운 사용 > 음성 콘텐츠에서 한국어 음성을 내려받으면 안내 목소리가 나와요."));

    // 시간
    const sTime = sec("하루 사용 시간");
    const tRow = U.el("div", "pChips");
    [0, 10, 20, 30, 45, 60].forEach((m) => {
      const c = U.btn(m ? m + "분" : "제한 없음", "chip" + (s.timer === m ? " sel" : ""));
      c.addEventListener("click", () => {
        KP.settings.set({ timer: m });
        U.$$(".chip", tRow).forEach((x) => x.classList.remove("sel"));
        c.classList.add("sel");
      });
      tRow.appendChild(c);
    });
    sTime.appendChild(tRow);
    const u = KP.usage();
    sTime.appendChild(U.el("p", "pNote", "오늘 사용: " + Math.floor(u.s / 60) + "분. 5분 전·1분 전에 미리 알려 주고, 시간이 되면 '잘 시간' 화면으로 잠겨요. 더 놀게 하려면 어른이 오늘 날짜 8자리를 넣어요."));
    // 이번만 타이머
    const sSess = sec("이번만 타이머 (지금부터)");
    const sRow = U.el("div", "pChips");
    const sNote = U.el("p", "pNote");
    const drawSess = () => {
      const su = KP.session.until();
      const left = su ? Math.max(0, Math.ceil((su - Date.now()) / 60000)) : 0;
      sNote.textContent = su ? "켜짐: 약 " + left + "분 뒤 잠겨요. (앱을 껐다 켜도 유지)" : "꺼짐. 아이에게 건네기 전에 눌러 두면 그 시간이 지나 잠겨요.";
    };
    [10, 15, 20, 30, 45].forEach((m) => {
      const c = U.btn(m + "분", "chip");
      c.addEventListener("click", () => {
        KP.session.start(m);
        KP.toast("지금부터 " + m + "분 타이머를 켰어요");
        drawSess();
      });
      sRow.appendChild(c);
    });
    const cOff = U.btn("끄기", "chip");
    cOff.addEventListener("click", () => {
      KP.session.stop();
      KP.toast("이번만 타이머를 껐어요");
      drawSess();
    });
    sRow.appendChild(cOff);
    sSess.append(sRow, sNote);
    drawSess();

    // 힌트
    const sHint = sec("도움말");
    const hRow = U.el("label", "pRow", "<span>멈춰 있으면 손가락 힌트 보여주기</span>");
    const hc = U.el("input");
    hc.type = "checkbox";
    hc.checked = s.hints;
    hc.addEventListener("change", () => KP.settings.set({ hints: hc.checked }));
    hRow.appendChild(hc);
    sHint.appendChild(hRow);

    // 게임 잠금
    const sLock = sec("게임 잠금");
    const lRow = U.el("label", "pRow", "<span>잠긴 카테고리는 오늘 날짜 8자리(한국 시간)를 넣어야 열기</span>");
    const lc = U.el("input");
    lc.type = "checkbox";
    lc.checked = s.lock;
    lc.addEventListener("change", () => KP.settings.set({ lock: lc.checked }));
    lRow.appendChild(lc);
    sLock.appendChild(lRow);
    const lChips = U.el("div", "pChips");
    KP.CATS.forEach((c) => {
      const on = () => KP.settings.get().lockCats.includes(c.id);
      const b = U.btn((on() ? "🔒 " : "🔓 ") + c.name, "chip" + (on() ? " sel" : ""));
      b.addEventListener("click", () => {
        const cur = KP.settings.get().lockCats.slice();
        const i = cur.indexOf(c.id);
        if (i >= 0) cur.splice(i, 1);
        else cur.push(c.id);
        KP.settings.set({ lockCats: cur });
        b.classList.toggle("sel", on());
        b.textContent = (on() ? "🔒 " : "🔓 ") + c.name;
      });
      lChips.appendChild(b);
    });
    sLock.appendChild(lChips);
    // 열쇠 별 모으기
    const sEarn = sec(KP.E("🔑") + " 열쇠 별 모으기");
    const eRow = U.el("label", "pRow", "<span>잠그지 않은 놀이(공부 놀이)에서 한 번에 맞히면 별 — 별을 다 모으면 아이가 문을 열어요</span>");
    const ec = U.el("input");
    ec.type = "checkbox";
    ec.checked = s.earnOn;
    ec.addEventListener("change", () => {
      KP.settings.set({ earnOn: ec.checked });
      KP.earn.render();
    });
    eRow.appendChild(ec);
    sEarn.appendChild(eRow);
    const eChips = (label, key, vals, fmt) => {
      const row = U.el("div", "pChips");
      row.appendChild(U.el("span", "pNote", label));
      vals.forEach((v) => {
        const c = U.btn(fmt(v), "chip" + (KP.settings.get()[key] === v ? " sel" : ""));
        c.addEventListener("click", () => {
          KP.settings.set({ [key]: v });
          U.$$(".chip", row).forEach((x) => x.classList.remove("sel"));
          c.classList.add("sel");
          KP.earn.render();
          drawEarn();
        });
        row.appendChild(c);
      });
      sEarn.appendChild(row);
    };
    eChips("필요한 별", "earnStars", [3, 5, 7], (v) => v + "개");
    eChips("열리는 시간", "earnMin", [10, 15, 20], (v) => v + "분");
    eChips("하루 최대", "earnCapMin", [30, 45, 60, 0], (v) => (v ? v + "분" : "제한 없음"));
    eChips("같은 놀이 별", "earnPerGame", [2, 3, 5], (v) => "하루 " + v + "개");
    const oRow = U.el("label", "pRow", "<span>끝날 때 '한 번만 더' 버튼 (하루 1번, 2분)</span>");
    const oc = U.el("input");
    oc.type = "checkbox";
    oc.checked = s.oneMore;
    oc.addEventListener("change", () => KP.settings.set({ oneMore: oc.checked }));
    oRow.appendChild(oc);
    sEarn.appendChild(oRow);
    const eNote = U.el("p", "pNote");
    const drawEarn = () => {
      const es = KP.earn.state(),
        c = KP.settings.get();
      const per = Object.entries(es.per)
        .map(([id, n]) => (KP.GAMES[id] ? KP.GAMES[id].name : id) + " " + n)
        .join(", ");
      eNote.textContent =
        "오늘: 별 " + es.stars + "/" + c.earnStars + " · 별로 연 시간 " + es.used + "분" + (c.earnCapMin ? "/" + c.earnCapMin + "분" : "") + (per ? " · 놀이별 " + per : "") +
        ". 틀렸다가 맞힌 문제, 6초 안에 연달아 맞힌 문제, 같은 놀이 상한을 넘긴 판은 별을 주지 않아요. 오늘의 도전 놀이는 별 2개.";
    };
    drawEarn();
    sEarn.appendChild(eNote);
    const eAct = U.el("div", "pChips");
    const bGift = U.btn(KP.E("⭐") + " 별 하나 선물", "chip");
    bGift.addEventListener("click", () => {
      KP.earn.gift(1);
      KP.toast("별 하나를 선물했어요");
      drawEarn();
    });
    const b30 = U.btn(KP.E("⏰") + " 지금 30분 열기", "chip");
    b30.addEventListener("click", () => {
      KP.gate.unlockFor(30, "adult");
      KP.toast("30분 동안 열었어요");
      KP.earn.render();
    });
    eAct.append(bGift, b30);
    sEarn.appendChild(eAct);
    // 아이용 문지기 퀴즈
    const kRow = U.el("label", "pRow", "<span>아이가 문제를 맞히면 잠시 열기 (문지기 퀴즈)</span>");
    const kc = U.el("input");
    kc.type = "checkbox";
    kc.checked = s.kidGate;
    kc.addEventListener("change", () => KP.settings.set({ kidGate: kc.checked }));
    kRow.appendChild(kc);
    sLock.appendChild(kRow);
    const chipRow = (label, key, vals, fmt) => {
      const row = U.el("div", "pChips");
      row.appendChild(U.el("span", "pNote", label));
      vals.forEach((v) => {
        const c = U.btn(fmt(v), "chip" + (KP.settings.get()[key] === v ? " sel" : ""));
        c.addEventListener("click", () => {
          KP.settings.set({ [key]: v });
          U.$$(".chip", row).forEach((x) => x.classList.remove("sel"));
          c.classList.add("sel");
        });
        row.appendChild(c);
      });
      sLock.appendChild(row);
    };
    chipRow("맞힐 문제", "kidQ", [2, 3, 5], (v) => v + "개");
    chipRow("열리는 시간", "kidMin", [10, 20, 30], (v) => v + "분");
    chipRow("하루 횟수", "kidQuizMax", [1, 2, 3], (v) => v + "번");
    sLock.appendChild(U.el("p", "pNote", "문지기 퀴즈는 한글 자음·모음, 숫자(1~20), 알파벳을 소리로 묻고, 한 번에 맞힌 문제만 세요. 보기가 3개라 아무거나 눌러도 통과될 수 있어서 기본으로 꺼 두었어요(열쇠 별 모으기 권장). 시간이 끝나면 이번 판을 마치고 홈으로 나와요."));
    const bRelock = U.btn("지금 다시 잠그기", "chip");
    bRelock.addEventListener("click", () => {
      KP.gate.relock();
      KP.toast("다시 잠갔어요");
    });
    sLock.appendChild(U.el("p", "pNote", "어른이 날짜로 열 때 '30분만' 또는 '오늘 계속'을 고를 수 있어요. 공부 놀이처럼 잠그지 않은 카테고리는 바로 들어갈 수 있어요."));
    sLock.appendChild(bRelock);

    // 부모 비밀번호
    const sPin = sec(KP.E("🔐") + " 부모 비밀번호");
    const pinNote = U.el("p", "pNote");
    const drawPin = () =>
      (pinNote.textContent = KP.settings.get().pin
        ? "켜짐: 잠금·설정을 열 때 비밀번호 4자리를 물어요. 잊으면 입력판의 '잊었어요'를 5초 꾹 → 오늘 날짜로 열 수 있어요."
        : "꺼짐: 지금은 오늘 날짜 8자리로 열어요. 아이가 숫자·날짜를 읽기 시작하면 비밀번호를 정해 주세요.");
    const pinRow = U.el("div", "pChips");
    const pinIn = U.el("input", "pinIn");
    pinIn.type = "password";
    pinIn.inputMode = "numeric";
    pinIn.maxLength = 4;
    pinIn.placeholder = "숫자 4자리";
    pinIn.autocomplete = "off";
    const bPin = U.btn("저장", "chip");
    bPin.addEventListener("click", () => {
      const v = pinIn.value.trim();
      if (!/^\d{4}$/.test(v)) return KP.toast("숫자 4자리를 넣어 주세요");
      if (/^(\d)\1{3}$/.test(v) || "0123456789".includes(v) || "9876543210".includes(v)) return KP.toast("너무 쉬운 번호예요 (1111, 1234 같은 번호)");
      KP.settings.set({ pin: v });
      pinIn.value = "";
      KP.toast("비밀번호를 정했어요");
      drawPin();
    });
    const bPinOff = U.btn("지우기(날짜로)", "chip");
    bPinOff.addEventListener("click", () => {
      KP.settings.set({ pin: "" });
      KP.toast("오늘 날짜로 여는 방식으로 돌아갔어요");
      drawPin();
    });
    pinRow.append(pinIn, bPin, bPinOff);
    sPin.append(pinRow, pinNote);
    drawPin();

    // 아이 이름 (칭찬할 때 "동훈아, 최고!") — 기기에만 저장
    const sName = sec(KP.E("🧒") + " 아이 이름");
    const nameNote = U.el("p", "pNote");
    const drawName = () => {
      nameNote.textContent = KP.kid.name()
        ? "칭찬할 때 '" + KP.kid.call() + ", 최고!'처럼 불러요." + (KP.kid.voice() ? "" : " 이름은 기기 목소리로 불러요.")
        : "비어 있으면 이름 없이 칭찬해요. 이름은 이 기기에만 저장돼요.";
    };
    const nameRow = U.el("div", "pChips");
    const nameIn = U.el("input", "pinIn textIn");
    nameIn.maxLength = 8;
    nameIn.placeholder = "예: 동훈";
    nameIn.autocomplete = "off";
    nameIn.value = KP.kid.name();
    const bName = U.btn("저장", "chip");
    bName.addEventListener("click", () => {
      const v = nameIn.value.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 8);
      // 이름을 바꾸면 코드로 넣었던 예전 이름 음성은 맞지 않으므로 지움
      KP.settings.set({ kidName: v, kidVoice: v === KP.kid.name() ? KP.settings.get().kidVoice : null });
      nameIn.value = v;
      KP.toast(v ? "이름을 넣었어요" : "이름을 지웠어요");
      if (v) KP.voice.say("{부름} 반가워!");
      drawName();
    });
    nameRow.append(nameIn, bName);
    sName.append(nameRow, nameNote);
    drawName();

    // 앱 밖으로 못 나가게 하기 (기기 기능)
    const sPinApp = sec(KP.E("📌") + " 앱 밖으로 못 나가게 하기");
    sPinApp.appendChild(
      U.el(
        "p",
        "pNote",
        "놀이터 안의 잠금·시간 제한은 이 앱 안에서만 지켜져요. 아이가 다른 앱으로 나가지 못하게 하려면 기기 기능을 함께 쓰세요.<br>" +
          "<b>아이패드·아이폰 – 사용법 유도</b>: 설정 → 손쉬운 사용 → 사용법 유도 켜기(암호 설정) → 놀이터를 연 뒤 측면(또는 홈) 버튼을 세 번 누르고 '시작'. 끝낼 때도 세 번 누르고 암호.<br>" +
          "<b>안드로이드 – 앱 고정</b>: 설정 → 보안(또는 생체 인식 및 보안) → 기타 보안 설정 → 앱 고정 켜기 → 최근 앱 화면에서 놀이터 아이콘을 눌러 '이 앱 고정'.<br>" +
          "<small>기기와 버전에 따라 메뉴 이름이 조금 다를 수 있어요.</small>"
      )
    );
    // 전체 화면 (브라우저로 열었을 때만 — 설치한 앱은 이미 전체 화면)
    const de = document.documentElement;
    if (!U.isApp() && (de.requestFullscreen || de.webkitRequestFullscreen)) {
      const bFs = U.btn(KP.E("📺") + " 전체 화면 켜기/끄기", "chip");
      bFs.addEventListener("click", () => {
        try {
          if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
          else (de.requestFullscreen || de.webkitRequestFullscreen).call(de);
        } catch (e) {}
      });
      sPinApp.appendChild(bFs);
    }

    // 게임 보이기
    const sGames = sec("보여줄 놀이 고르기");
    KP.CATS.forEach((c) => {
      sGames.appendChild(U.el("h4", "", KP.E(c.icon) + " " + c.name));
      const wrap = U.el("div", "pGames");
      KP.ORDER.filter((id) => KP.GAMES[id].cat === c.id).forEach((id) => {
        const g = KP.GAMES[id];
        const b = U.btn(KP.E(g.icon) + "<span>" + g.name + "</span>", "pGame" + (s.hidden[id] ? " off" : ""));
        b.addEventListener("click", () => {
          const h = Object.assign({}, KP.settings.get().hidden);
          if (h[id]) delete h[id];
          else h[id] = true;
          KP.settings.set({ hidden: h });
          b.classList.toggle("off", !!h[id]);
        });
        wrap.appendChild(b);
      });
      sGames.appendChild(wrap);
    });

    // 데이터
    const sData = sec("저장된 데이터");
    const info = U.el("p", "pNote", "계산 중…");
    sData.appendChild(info);
    Promise.all([KP.db.all("art"), KP.db.all("photos")]).then(([a, p]) => {
      const zoo = a.filter((x) => x.kind === "zoo").length;
      info.innerHTML =
        "스티커 " + KP.stickers.count() + "개 · 그림 작품 " + (a.length - zoo) + "개 · 동물원 친구 " + zoo + "마리 · 등록 사진 " + p.length + "장" +
        "<br>모든 기록은 이 기기 안에만 저장돼요. 기기를 바꾸거나 앱을 지우기 전에는 백업 파일을 내보내 두세요." +
        "<br>백업 파일에는 등록한 사진과 그림이 들어 있으니, 믿을 수 있는 곳에만 보관하세요." +
        (KP.u.isApp() ? "" : "<br><b>홈 화면에 추가한 앱으로 쓰면 기록이 더 안전하게 남아요.</b> (Safari 탭으로만 쓰다가 오래 안 열면 기기가 기록을 지울 수 있어요)");
    });
    const dRow = U.el("div", "pChips");
    const bExp = U.btn(KP.E("💾") + " 백업 내보내기", "chip");
    const bImp = U.btn(KP.E("📂") + " 백업 불러오기", "chip");
    const bReset = U.btn(KP.E("🔄") + " 단계·스티커 초기화(꾹)", "chip danger");
    bExp.addEventListener("click", async () => {
      if ((await KP.backup.export()) === false) KP.toast("작품을 읽지 못해 백업을 만들지 못했어요. 다시 해 주세요");
    });
    bImp.addEventListener("click", async () => {
      const r = await KP.backup.import();
      if (r === null) return; // 취소
      if (!r) return KP.toast("불러오지 못했어요 (아이 놀이터 백업 파일이 맞는지 확인해 주세요)");
      // 일부를 저장하지 못했으면 그대로 알림 (예전엔 실패해도 '불러왔어요')
      KP.toast(r.fail ? "불러왔지만 " + r.fail + "개는 저장하지 못했어요. 기기 저장공간을 확인해 주세요" : "백업을 불러왔어요");
      setTimeout(() => location.reload(), r.fail ? 2500 : 900);
    });
    KP.hold(bReset, 2000, () => {
      KP.store.keys().filter((k) => k.startsWith("lv:") || k.startsWith("rp:lvl:") || k === "rp:lvMode" || k === "stickers" || k === "winCount").forEach((k) => KP.store.del(k));
      KP.toast("초기화했어요");
    });
    const bZoo = U.btn(KP.E("🦁") + " 동물원 정리", "chip");
    dRow.append(bExp, bImp, bReset, bZoo);
    sData.appendChild(dRow);

    // 동물원 정리 (부모만 — 아이 화면에는 영구 지우기가 없음): 여러 마리 골라 이 기기에서 영구 삭제
    const zBox = U.el("div", "zClean");
    sData.appendChild(zBox);
    KP.css("zooClean", `
      .zClean{margin-top:10px}
      .zcGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;max-height:46vh;overflow-y:auto;padding:4px}
      .zcCard{position:relative;border-radius:14px;border:3px solid #e3e7f5;background:#fff;padding:4px 2px 2px;font-size:12px;color:#5a6488;display:flex;flex-direction:column;align-items:center}
      .zcCard svg{width:100%;height:auto;aspect-ratio:200/170;display:block;overflow:visible}
      .zcCard .zDollTh{width:100%;height:auto;aspect-ratio:200/170;object-fit:contain;display:block}
      .zcCard.sel{border-color:#e5484d;background:#ffecec}
      .zcCard.sel::after{content:"✔";position:absolute;right:4px;top:2px;color:#e5484d;font-size:20px}
    `);
    let zLoading = false;
    bZoo.addEventListener("click", async () => {
      if (zLoading) return; // 불러오는 중 다시 누르면 무시
      if (zBox.childElementCount) return (zBox.innerHTML = ""); // 다시 누르면 닫기
      const sizeOf = (x) => {
        try {
          return JSON.stringify(x).length;
        } catch (e) {
          return 0;
        }
      };
      const sel = new Set();
      const draw = async () => {
        zLoading = true;
        const list = (await KP.db.all("art")).filter((x) => x && x.kind === "zoo").sort((a, b) => (a.t || 0) - (b.t || 0));
        zLoading = false;
        const total = list.reduce((n, x) => n + sizeOf(x), 0);
        const rest = list.filter((x) => x.rest).length;
        zBox.innerHTML = "";
        zBox.appendChild(
          U.el("p", "pNote", "동물원 친구 " + list.length + "마리 (노는 중 " + (list.length - rest) + " · 쉬는 중 " + rest + ") · 약 " + (total / 1048576).toFixed(1) + "MB<br>오래된 친구가 앞에 있어요. 지운 친구는 되돌릴 수 없어요(백업 파일에는 남아 있어요).")
        );
        const grid = U.el("div", "zcGrid");
        list.forEach((x) => {
          const c = U.btn(KP.zooThumb ? KP.zooThumb(x) : "", "zcCard" + (sel.has(x.id) ? " sel" : ""));
          // 날짜는 글자로만 (백업 파일로 들어온 값이 화면 코드로 해석되지 않게)
          const cap = document.createElement("span");
          cap.textContent = String(x.date || "").slice(0, 12) + (x.rest ? " 💤" : "") + (x.fav ? " 👑" : "");
          c.appendChild(cap);
          c.addEventListener("click", () => {
            sel.has(x.id) ? sel.delete(x.id) : sel.add(x.id);
            c.classList.toggle("sel", sel.has(x.id));
            bDel.innerHTML = KP.E("🗑️") + " 고른 " + sel.size + "마리 영구 지우기(꾹)";
          });
          grid.appendChild(c);
        });
        const row = U.el("div", "pChips");
        const bRest = U.btn("쉬는 친구 모두 고르기", "chip");
        bRest.addEventListener("click", () => {
          list.filter((x) => x.rest && !x.fav).forEach((x) => sel.add(x.id));
          draw();
        });
        const bNone = U.btn("고르기 취소", "chip");
        bNone.addEventListener("click", () => {
          sel.clear();
          draw();
        });
        const bDel = U.btn(KP.E("🗑️") + " 고른 " + sel.size + "마리 영구 지우기(꾹)", "chip danger");
        KP.hold(bDel, 2000, async () => {
          if (!sel.size) return KP.toast("지울 친구를 먼저 골라 주세요");
          let ok = 0,
            fail = 0;
          for (const id of [...sel]) {
            // 성공하면 undefined, 실패하면 false — 실패를 성공으로 보면 지운 친구가 다시 나타남
            if ((await KP.db.del("art", id)) === false) fail++;
            else {
              ok++;
              sel.delete(id);
            }
          }
          KP.toast(ok + "마리를 지웠어요" + (fail ? " · " + fail + "마리는 못 지웠어요" : ""));
          draw();
        });
        row.append(bRest, bNone, bDel);
        zBox.append(row, grid);
      };
      draw();
    });

    // 사용 통계 (익명) — 놀이 보완용
    if (KP.stats) {
      const sSt = sec(KP.E("📊") + " 사용 통계");
      const stRow = U.el("label", "pRow", "<span>어떤 놀이를 얼마나 하는지 익명으로 보내기 (놀이를 고치는 데 써요)</span>");
      const sc = U.el("input");
      sc.type = "checkbox";
      sc.checked = s.stats !== false;
      stRow.appendChild(sc);
      const stNote = U.el("p", "pNote", "");
      const drawSt = () => {
        stNote.textContent = (KP.STATS_URL ? "" : "(아직 받는 서버가 없어 보내지 않아요) ") + (sc.checked
          ? "보내는 것: 놀이 열기·머문 시간·이김·틀림·단계·문 열기·오류·기기 종류. 안 보내는 것: 이름·사진·작품·소리·위치. 기기번호 " + KP.stats.dev().slice(0, 6) + "… · 보낼 기록 " + KP.stats.pending() + "개"
          : "꺼져 있어요. 모아 둔 기록도 지웠어요.");
      };
      sc.addEventListener("change", () => (KP.settings.set({ stats: sc.checked }), drawSt()));
      drawSt();
      sSt.append(stRow, stNote);
    }

    // 렉 측정 (실제 기기에서 어느 놀이가 버벅이는지 기록)
    if (KP.perf) {
      const sPerf = sec(KP.E("📈") + " 렉 측정");
      const pRow = U.el("label", "pRow", "<span>측정 켜기 (아이가 노는 동안 화면마다 기록)</span>");
      const pc = U.el("input");
      pc.type = "checkbox";
      pc.checked = KP.perf.on();
      const bRow = U.el("label", "pRow", "<span>왼쪽 아래에 초당 장수 보이기</span>");
      const bc = U.el("input");
      bc.type = "checkbox";
      bc.checked = KP.perf.badge();
      pc.addEventListener("change", () => (KP.perf.set(pc.checked), drawPerf()));
      bc.addEventListener("change", () => KP.perf.setBadge(bc.checked));
      pRow.appendChild(pc);
      bRow.appendChild(bc);
      const pNote = U.el("p", "pNote", "");
      const pTbl = U.el("div", "perfTbl");
      KP.css("perfTbl", `.perfTbl{max-height:40vh;overflow:auto;margin-top:6px}.perfTbl table{border-collapse:collapse;font-size:13px;width:100%}.perfTbl th,.perfTbl td{padding:4px 6px;border-bottom:1px solid #eef0f7;text-align:right;white-space:nowrap}.perfTbl th:first-child,.perfTbl td:first-child{text-align:left;white-space:normal}.perfTbl .bad{color:#e5484d;font-weight:700}.perfTbl .mid{color:#d58a00;font-weight:700}`);
      const drawPerf = () => {
        const rows = KP.perf.rows(), gs = KP.perf.groups();
        pNote.textContent = KP.perf.on()
          ? "켜져 있어요. 평소처럼 놀게 한 뒤 여기서 확인하세요. 초당 장수는 60이 가장 부드럽고, 30 아래면 버벅여 보여요. 5초 넘게 본 화면만 나와요."
          : "꺼져 있어요. 켜 두면 기록만 하고 놀이에는 영향이 거의 없어요.";
        const cls = (f) => (f < 30 ? "bad" : f < 50 ? "mid" : "");
        const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
        pTbl.innerHTML = rows.length
          ? "<table><tr><th>화면</th><th>초당 장수</th><th>끊김%</th><th>멈춤</th><th>본 시간</th></tr>" +
            rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="${cls(r.fps)}">${r.fps}</td><td>${r.jank}</td><td>${r.freeze}</td><td>${r.sec}초</td></tr>`).join("") +
            "</table>" +
            (gs.length ? "<table style='margin-top:8px'><tr><th>앱을 연 뒤 놀이 수</th><th>초당 장수</th><th>끊김%</th></tr>" + gs.map((g) => `<tr><td>${g.k}</td><td class="${cls(g.fps)}">${g.fps}</td><td>${g.jank}</td></tr>`).join("") + "</table>" : "")
          : "";
      };
      const pBtns = U.el("div", "pChips");
      const bCopy = U.btn(KP.E("📋") + " 결과 복사", "chip");
      const bClr = U.btn(KP.E("🧹") + " 기록 지우기(꾹)", "chip danger");
      const pOut = U.el("textarea", "");
      pOut.readOnly = true;
      pOut.style.cssText = "display:none;width:100%;height:120px;font-size:11px;margin-top:6px";
      bCopy.addEventListener("click", async () => {
        const t = KP.perf.report();
        try {
          await navigator.clipboard.writeText(t);
          KP.toast("복사했어요. 메신저 등에 붙여 넣어 보내 주세요");
        } catch (e) {
          // 복사가 막힌 기기: 글자를 보여 주고 직접 길게 눌러 복사
          pOut.style.display = "block";
          pOut.value = t;
          pOut.select();
          KP.toast("아래 글자를 길게 눌러 복사해 주세요");
        }
      });
      KP.hold(bClr, 1500, () => {
        KP.perf.clear();
        drawPerf();
        KP.toast("기록을 지웠어요");
      });
      pBtns.append(bCopy, bClr);
      sPerf.append(pRow, bRow, pNote, pTbl, pBtns, pOut);
      drawPerf();
    }

    box.appendChild(U.el("p", "pVer", "아이 놀이터 · 버전 " + (KP.VERSION || "dev")));
    document.body.appendChild(panel);
  };
})(window.KP);

;

/* ==== js/core/catalog.js ==== */
/* =====================================================================
   홈 화면에 보이는 놀이 순서 (카테고리 안에서 이 순서대로)
   여기에 없는 놀이는 각 카테고리 맨 뒤에 붙는다.
===================================================================== */
"use strict";
(function (KP) {
  KP.ORDER_HINT = [
    // 신나는 놀이: 누르면 바로 반응 → 움직이는 것 잡기 → 색·신호·규칙
    "firework", "balloon", "bubble", "egg", "peekaboo", "hospital", "candle", "bath", "handwash", "brush", "potty", "mole", "fish", "fruit", "rocket", "race", "croc", "colorpop", "light", "rps",
    // 만들기
    "zoo", "zoopaint", "paintlab", "decal", "draw", "wipe", "paintbook", "face", "icecream", "grow",
    // 음악 (진짜 피아노는 실제 피아노가 있어야 해서 맨 뒤)
    "piano", "xylo", "drum", "band", "musicbox", "inst", "simon", "realpiano",
    // 똑똑 놀이: 보고·듣고 고르기 (색·모양·소리 → 기억·마음)
    "color", "shape", "animals", "listen", "feed", "floatsink", "size", "mix", "odd", "shadow", "seasons", "memory", "missing", "emotion", "candy",
    // 공부 놀이: 숫자·글자 익히기 → 쓰기 공책은 뒤에
    "numbers", "count", "dots", "train", "more", "hangul", "hmerge", "abc", "n100", "nwrite", "hwrite", "awrite",
    // 도전 놀이 (이름을 넣으면 "동훈이 도전"): 끌어 놓기·길 따라가기 → 기호·순서·추론
    "sorter", "jigsaw", "sort", "spatial", "dress", "trace", "maze", "connect", "dotdot", "pattern", "sequence", "colororder",
  ];
  KP.sortGames = function () {
    const idx = (id) => {
      const i = KP.ORDER_HINT.indexOf(id);
      return i < 0 ? 9999 : i;
    };
    KP.ORDER.sort((a, b) => idx(a) - idx(b));
  };
})(window.KP);

;

/* ==== js/games/_shared/clay-stage.js ==== */
/* =====================================================================
   점토 무대 (공용) — "점토 장난감을 직접 만지는 작은 방"
   층: [배경 그림(CSS, 그리기 비용 0)] → [투명 3D(Three.js)] → [앞가림 그림(선택)] → [2D 효과·UI]
   - 배경 그림과 같은 원근 카메라(bgCam)로 3D 를 겹침 — 동물원(zoo3d.js)에서 꺼내 일반화
   - 배경마다 설정 데이터: 그림 크기·지평선(vh)·화각(fov)·잘릴 때 남길 곳(focus, 세로 화면 focusP)·햇빛(sun)·자리(spots)
   - 안전 장치(동물원과 같은 규칙): 크기 변경 자동 · 자동 화질(초당 장수 측정) · 가장 낮은 화질에서도 느리면 onSlow
     · 그래픽이 끊기면 onLost · dispose 로 그래픽 메모리 바로 돌려줌 · Three.js 는 vendor 에서 필요할 때만 불러옴

   KP.clayStage.supported() / load() → THREE / bgCam(def, vw, vh) / inPoly(pts, x, y)
   const st = KP.clayStage.create(host, def, { qKey, onLost, onSlow })
     st.ui (2D 층) · st.scene · st.camera · st.tick(dt) · st.project(x,y,z) → {x,y,z}(host 기준 px)
     st.spot("seat") → [x,z] 땅 위 자리 · st.fitH(x, z, 화면 높이 비율) → 세상 키 · st.shadow(obj) 접촉 그림자 · st.dispose()
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  let THREE = null,
    loading = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }

  /** 그림에 맞춘 카메라 (화면 비율이 다르면 그림을 꽉 채워 잘라 보여 줌) — vw·vh: 보기 크기(CSS px)
      def: { img:[폭,높이](기본 1600×900), vh 지평선 높이(그림 비율), near 맨 아래 줄 세상 1단위 크기, fov, focus[u,v], focusP(세로 화면), poly(걷는 곳, 선택),
           zoom·zoomP(가로·세로 화면에서 더 크게 자르기, 선택) }
      무대 def 에는 front(앞가림 투명 그림) 또는 frontMask(배경 그림을 이 알파 마스크 모양만 앞에 한 번 더 — 작은 PNG) */
  function bgCam(def, vw, vh) {
    const IW = (def.img && def.img[0]) || 1600, IH = (def.img && def.img[1]) || 900, IA = IW / IH;
    const t = Math.tan((def.fov * Math.PI) / 360);
    const focus = (vw / vh < 0.8 && def.focusP) || def.focus || [0.5, 0.5];
    // zoom(가로 화면)·zoomP(세로 화면): 그림을 더 크게 잘라 보여 줌(주인공을 크게) — 없으면 1 (예전과 같음)
    const zd = vw / vh >= 1 ? def.zoom : def.zoomP;
    const zm = (typeof zd === "function" ? zd(vw, vh) : zd) || 1; // 함수면 화면 비율로 정함
    const k = Math.max(vw / IW, vh / IH) * zm, fw = IW * k, fh = IH * k;
    const ox = Math.max(0, Math.min(fw - vw, focus[0] * fw - vw / 2));
    const oy = Math.max(0, Math.min(fh - vh, focus[1] * fh - vh / 2));
    const vis = { u0: ox / fw, u1: (ox + vw) / fw, v0: oy / fh, v1: (oy + vh) / fh };
    // 좁게 잘린 화면(폰 세로)에서는 동물을 조금 작게 → 여러 마리가 들어가게
    const frac = Math.min(vis.u1 - vis.u0, vis.v1 - vis.v0);
    const scale = Math.max(0.5, Math.min(1, Math.sqrt(frac) * 1.02));
    const th = Math.atan((0.5 - def.vh) * 2 * t);
    const sn = Math.sin(th), cs = Math.cos(th);
    const mk = (h) => {
      const pos = [0, h, 0], fwd = [0, -sn, -cs], up = [0, cs, -sn];
      const toUV = (x, y, z) => {
        const dx = x - pos[0], dy = y - pos[1], dz = z - pos[2];
        const zc = dx * fwd[0] + dy * fwd[1] + dz * fwd[2], yc = dx * up[0] + dy * up[1] + dz * up[2];
        return [0.5 + dx / (zc * t * IA) / 2, 0.5 - yc / (zc * t) / 2, zc];
      };
      const ground = (u, v) => {
        const nx = (u * 2 - 1) * t * IA, ny = (1 - v * 2) * t;
        const d = [nx, fwd[1] + up[1] * ny, fwd[2] + up[2] * ny];
        if (d[1] >= -1e-4) return null; // 지평선 위
        const s = -pos[1] / d[1];
        return [pos[0] + d[0] * s, pos[2] + d[2] * s];
      };
      return { pos, toUV, ground };
    };
    const m1 = mk(1), g1 = m1.ground(0.5, 1);
    const dv1 = m1.toUV(g1[0], 0, g1[1])[1] - m1.toUV(g1[0], 1, g1[1])[1];
    const H = dv1 / (def.near * scale);
    const M = mk(H);
    const pos = M.pos, target = [0, H - sn * 10, -cs * 10];
    const mu = 0.012;
    const poly = def.poly;
    const insideUV = (u, v) => u > vis.u0 + mu && u < vis.u1 - mu && v < vis.v1 - mu && v > vis.v0 && (!poly || inPoly(poly, u, v));
    /** 동물 a(w: 폭, h: 키, fly, y) 가 (x,z) 에 서도 되나: 발 양끝이 걷는 곳 안 + 몸이 화면 안 */
    const inside = (a, x, z) => {
      const w = a.w, h = a.h;
      const hw = a.fly ? w * 0.15 : w * 0.4;
      const l = M.toUV(x - hw, 0, z), r = M.toUV(x + hw, 0, z), c = M.toUV(x, 0, z);
      if (!insideUV(l[0], l[1]) || !insideUV(r[0], r[1]) || !insideUV(c[0], c[1])) return false;
      const L = M.toUV(x - w * 0.56, 0, z)[0], R = M.toUV(x + w * 0.56, 0, z)[0];
      if (L < vis.u0 + 0.004 || R > vis.u1 - 0.004) return false;
      return M.toUV(x, (a.fly ? a.y || 0 : 0) + h, z)[1] > vis.v0 + 0.01;
    };
    // 세로 화면(폰): 걷는 곳이 멀리까지 길게 보여 친구들이 아주 작아짐 → 앞쪽(가까운 곳)을 더 자주 고름
    const tall = vw / vh < 0.8;
    const pick = (a) => {
      for (let i = 0; i < 40; i++) {
        const vl = Math.max(vis.v0, 0.2), r = tall ? Math.sqrt(Math.random()) : Math.random();
        const u = vis.u0 + Math.random() * (vis.u1 - vis.u0), v = vl + r * (vis.v1 - vl);
        if (!insideUV(u, v)) continue;
        const g = M.ground(u, v);
        if (g && inside(a, g[0], g[1])) return g;
      }
      return null;
    };
    return { fov: def.fov, pos, target, view: { fw, fh, ox, oy }, vis, scale, H, IA, inside, insideUV, pick, uv: M.toUV, ground: M.ground };
  }

  const CS = (KP.clayStage = {
    ok: null,
    bgCam,
    inPoly,
    get THREE() {
      return THREE;
    },
    /** WebGL 지원 여부 (한 번만 검사) */
    supported() {
      if (this.ok !== null) return this.ok;
      try {
        const c = document.createElement("canvas");
        this.ok = !!(window.WebGLRenderingContext && c.getContext("webgl2"));
      } catch (e) {
        this.ok = false;
      }
      return this.ok;
    },
    /** Three.js (vendor) — 처음 한 번만 불러옴, 실패하면 다음에 다시 시도 */
    load() {
      if (THREE) return Promise.resolve(THREE);
      if (!loading)
        loading = import(new URL("vendor/three.module.min.js", document.baseURI).href)
          .then((m) => (THREE = m))
          .catch((e) => {
            loading = null;
            throw e;
          });
      return loading;
    },
    create(host, def, opt) {
      return new Stage(host, def, opt || {});
    },
    /** 점토 결 텍스처 (아주 약한 울퉁불퉁 — 인형 bumpMap) */
    grainTex() {
      const gc = document.createElement("canvas");
      gc.width = gc.height = 128;
      const gg = gc.getContext("2d"), im = gg.createImageData(128, 128);
      let s = 99;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      const base = new Float32Array(32 * 32).map(() => rnd());
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          const fx = x / 4, fy = y / 4, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
          const at = (a, b) => base[(b & 31) * 32 + (a & 31)];
          const v = (at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx) * (1 - ty) + (at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx) * ty;
          const c = Math.round(110 + v * 90 + (rnd() - 0.5) * 20), i = (y * 128 + x) * 4;
          im.data[i] = im.data[i + 1] = im.data[i + 2] = c;
          im.data[i + 3] = 255;
        }
      gg.putImageData(im, 0, 0);
      const t = new THREE.CanvasTexture(gc);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(5, 5);
      return t;
    },
    /** 발밑 그림자용 흐린 원판 텍스처 */
    blobTex() {
      const bc = document.createElement("canvas");
      bc.width = bc.height = 64;
      const bg = bc.getContext("2d"), gr = bg.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(0,0,0,1)");
      gr.addColorStop(0.5, "rgba(0,0,0,.55)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      bg.fillStyle = gr;
      bg.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(bc);
    },
  });

  KP.css(
    "clayStage",
    `.csHost{position:relative;overflow:hidden}
     .csBg,.csFront{position:absolute;left:0;top:0;width:100%;height:100%;background-repeat:no-repeat;pointer-events:none}
     .csBg{z-index:0}
     .csCanvas{position:absolute;left:0;top:0;z-index:1;touch-action:none;pointer-events:none}
     .csFront{z-index:2}
     .csUi{position:absolute;inset:0;z-index:3;pointer-events:none}
     .csUi>*{pointer-events:auto}`
  );

  /* ================================================================= 무대 */
  function Stage(host, def, opt) {
    this.host = host;
    this.def = def;
    this.opt = opt;
    this.qKey = opt.qKey || "clayStage:q";
    host.classList.add("csHost");
    this.bgEl = U.el("div", "csBg");
    this.frontEl = U.el("div", "csFront");
    this.ui = U.el("div", "csUi");
    host.append(this.bgEl);
    this.bgEl.style.backgroundImage = 'url("' + def.file + '")';
    if (def.front) this.frontEl.style.backgroundImage = 'url("' + def.front + '")';
    else if (def.frontMask) {
      // 앞가림 = 배경 그림 + 알파 마스크(작은 PNG) — 욕조 앞벽처럼 모양이 단순하면 큰 투명 PNG 대신
      const fe = this.frontEl.style;
      fe.backgroundImage = 'url("' + def.file + '")';
      fe.maskImage = fe.webkitMaskImage = 'url("' + def.frontMask + '")';
      fe.maskRepeat = fe.webkitMaskRepeat = "no-repeat";
    }
    this.updaters = []; // 매 장면 부를 것 (인형 움직임 등): fn(dt, t)
    this.time = 0;
    this.w = this.h = 0;
    this.gl = false;
    if (opt.flat) {
      // 3D 없이 그림만 (WebGL 이 안 되거나 느린 기기) — 같은 자르기·좌표
      host.append(this.frontEl, this.ui);
    } else {
      this.gl = true;
      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" }));
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.toneMapping = THREE.NoToneMapping;
      r.setClearColor(0x000000, 0);
      r.domElement.className = "csCanvas";
      host.append(r.domElement, this.frontEl, this.ui);
      // 화면이 끊기면(백그라운드·메모리 부족) 알림 → 놀이가 새로 만들어 다시 보여 줌 (정리 중이면 무시)
      r.domElement.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        if (this.dead) return;
        this.lost = true;
        if (this.opt.onLost) this._lostT = setTimeout(() => !this.dead && this.opt.onLost(), 600);
      });
      const S = (this.scene = new THREE.Scene());
      this.camera = new THREE.PerspectiveCamera(def.fov || 40, 1, 0.05, 400);
      this.hemi = new THREE.HemisphereLight(0xeef6ff, 0xd8cfb8, 0.62 * Math.PI);
      this.sun = new THREE.DirectionalLight(def.sunCol || 0xfff3e0, 0.5 * Math.PI);
      S.add(this.hemi, this.sun, this.sun.target);
      const sd = def.sun || [-0.45, 1, 0.6];
      this.sunDir = new THREE.Vector3(sd[0], sd[1], sd[2]).normalize();
      this.sun.position.copy(this.sunDir).multiplyScalar(10);
      this.grainT = CS.grainTex();
      this.blobT = CS.blobTex();
      this.contactM = new THREE.MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, color: def.shadowCol || 0x3a2418, opacity: 0.42 });
      this.castM = new THREE.MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, color: def.shadowCol || 0x3a2418, opacity: 0.2 });
      this.plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      this.rimU = { value: new THREE.Color("#fff6ee") };
      this.tintFromImage();
      const qs = KP.store.get(this.qKey, null);
      this.q = qs && Number.isFinite(qs.q) ? clamp(qs.q, 0, 3) : 0;
      if (qs && this.q > 0 && Date.now() - (qs.t || 0) > 7 * 864e5) this.q--; // 7일 지나면 한 단계 올려 다시 시도
      this.applyQ(this.q);
    }
    if (window.ResizeObserver) (this.ro = new ResizeObserver(() => this.resize())).observe(host);
    this.resize();
  }
  const SP = Stage.prototype;

  /** 그림의 위(벽·하늘)·아래(바닥) 평균색 → 하늘빛·바닥 반사빛. 아이 그림 색이 너무 변하지 않게 흰색 쪽으로 많이 섞음 */
  SP.tintFromImage = function () {
    const im = new Image();
    im.onload = () => {
      if (this.dead) return;
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 36;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(im, 0, 0, 64, 36);
      const d = g.getImageData(0, 0, 64, 36).data, top = [0, 0, 0, 0], bot = [0, 0, 0, 0];
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < 64; x++) {
          const v = (y + 0.5) / 36, a = v < 0.3 ? top : v > 0.72 ? bot : null;
          if (!a) continue;
          const i = (y * 64 + x) * 4;
          a[0] += d[i]; a[1] += d[i + 1]; a[2] += d[i + 2]; a[3]++;
        }
      const av = (a) => [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
      const sky = av(top), floor = av(bot);
      this.hemi.color.setRGB(...sky.map((v) => (v / 255) * 0.35 + 0.65), THREE.SRGBColorSpace);
      this.hemi.groundColor.setRGB(...floor.map((v, k) => (v / 255) * 0.4 + [0.85, 0.8, 0.7][k] * 0.6), THREE.SRGBColorSpace);
      this.rimU.value.setRGB(...sky.map((v) => (v / 255) * 0.4 + 0.6), THREE.SRGBColorSpace);
      const fm = floor.map((v) => v / 255);
      if (!this.def.shadowCol) {
        this.contactM.color.setRGB(fm[0] * 0.3, fm[1] * 0.25, fm[2] * 0.22, THREE.SRGBColorSpace);
        this.castM.color.copy(this.contactM.color);
      }
      this.render();
    };
    im.src = this.def.file;
  };

  /* ---------- 크기 · 카메라 ---------- */
  SP.resize = function (force) {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h || (!force && w === this.w && h === this.h)) return false;
    this.w = w;
    this.h = h;
    const cam = (this.bc = bgCam(this.def, w, h));
    for (const el of [this.bgEl, this.frontEl]) {
      el.style.backgroundSize = cam.view.fw + "px " + cam.view.fh + "px";
      el.style.backgroundPosition = -cam.view.ox + "px " + -cam.view.oy + "px";
    }
    if (this.def.frontMask) {
      const fe = this.frontEl.style;
      fe.maskSize = fe.webkitMaskSize = cam.view.fw + "px " + cam.view.fh + "px";
      fe.maskPosition = fe.webkitMaskPosition = -cam.view.ox + "px " + -cam.view.oy + "px";
    }
    if (this.gl) {
      const r = this.renderer;
      r.setSize(w, h, false);
      r.domElement.style.width = w + "px";
      r.domElement.style.height = h + "px";
      const c = this.camera;
      c.fov = cam.fov;
      c.position.set(...cam.pos);
      c.lookAt(...cam.target);
      c.aspect = cam.view.fw / cam.view.fh;
      c.setViewOffset(cam.view.fw, cam.view.fh, cam.view.ox, cam.view.oy, w, h);
      c.updateProjectionMatrix();
      c.updateMatrixWorld();
    }
    if (this.onResize) this.onResize(w, h);
    this.render();
    return true;
  };
  /** 그림 좌표(0~1) → 이 무대의 화면 좌표(px) */
  SP.uvToPx = function (u, v) {
    const vw = this.bc.view;
    return { x: u * vw.fw - vw.ox, y: v * vw.fh - vw.oy };
  };
  /** 설정의 자리(spots) → 땅 위 [x,z] */
  SP.spot = function (name) {
    const s = (this.def.spots && this.def.spots[name]) || [0.5, 0.75];
    return this.bc.ground(s[0], s[1]) || [0, -5];
  };
  /** 세상 점 → 화면(px, host 기준) — 3D 가 없으면 bgCam 계산으로 */
  const pv = { x: 0, y: 0, z: 0 };
  SP.project = function (x, y, z) {
    if (this.gl) {
      const v = (this._v = this._v || new THREE.Vector3()).set(x, y, z).project(this.camera);
      pv.x = ((v.x + 1) / 2) * this.w;
      pv.y = ((1 - v.y) / 2) * this.h;
      pv.z = v.z;
      return pv;
    }
    const uv = this.bc.uv(x, y, z), p = this.uvToPx(uv[0], uv[1]);
    pv.x = p.x;
    pv.y = p.y;
    pv.z = uv[2];
    return pv;
  };
  /** (x,z) 에 선 물체가 화면 높이의 frac 만큼 보이려면 세상 키가 얼마인가 */
  SP.fitH = function (x, z, frac) {
    const a = this.project(x, 0, z).y, b = this.project(x, 1, z).y;
    return (frac * this.h) / Math.max(1, a - b);
  };
  /** 화면 px 차이 → (x,z) 근처의 세상 가로 길이 */
  SP.pxToWorld = function (x, z, px) {
    const a = this.project(x, 0, z).x, b = this.project(x + 1, 0, z).x;
    return px / Math.max(1e-3, b - a);
  };
  /** 접촉 그림자 두 장 (발밑 + 햇빛 반대쪽 길게) — {contact, cast, set(x, z, w, h, lift)} */
  SP.shadow = function () {
    const contact = new THREE.Mesh(this.plane, this.contactM), cast = new THREE.Mesh(this.plane, this.castM);
    contact.renderOrder = cast.renderOrder = -1;
    this.scene.add(contact, cast);
    const sun = this.sunDir;
    return {
      contact,
      cast,
      set(x, z, w, h, lift = 0) {
        const sr = w * 0.62, k = 1 - Math.min(0.6, lift * 0.35);
        contact.position.set(x, 0.003, z + 0.02 * h);
        contact.scale.set(sr * k, 1, sr * 0.55 * k);
        const sl = Math.hypot(sun.x, sun.z) || 1, L = clamp(1.6 / Math.max(0.3, sun.y / sl), 0.6, 2.4) * 0.5 * h;
        cast.position.set(x - (sun.x / sl) * L * 0.55, 0.002, z - (sun.z / sl) * L * 0.55);
        cast.rotation.y = Math.atan2(-sun.x, -sun.z);
        cast.scale.set(sr * 0.95, 1, sr * 0.6 + L);
      },
      remove: () => this.scene && this.scene.remove(contact, cast),
    };
  };

  /* ---------- 화질 ---------- */
  /** 화질 단계: 0 고화질 · 1 해상도↓ · 2 더↓ · 3 최저 */
  SP.applyQ = function (q) {
    this.q = q;
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(dpr, [2, 1.5, 1.25, 1][q]));
    if (this.w) this.renderer.setSize(this.w, this.h, false);
  };
  /** 느린 기기면 화질을 한 단계씩 낮춤 (초당 약 28장 미만이 이어질 때) — 동물원과 같은 규칙 */
  SP.measure = function () {
    const now = performance.now();
    if (!this._warm) this._warm = now + 3000; // 처음 3초(불러오기)는 빼고
    const f = now - (this._lt || now);
    this._lt = now;
    if (now < this._warm || f <= 0 || f > 3000) return; // 3초 넘는 틈은 화면이 가려졌던 것
    this._fs = (this._fs || 0) + f;
    this._fn = (this._fn || 0) + 1;
    if (this._fs < 4000 || this._fn < 8) return; // 약 4초마다 판단
    const avg = this._fs / this._fn;
    this._fs = this._fn = 0;
    this.fps = Math.round(1000 / avg);
    if (avg > 36 && this.q < 3) {
      this.applyQ(this.q + 1);
      KP.store.set(this.qKey, { q: this.q, t: Date.now() });
      this._warm = now + 1500;
    } else if (this.q >= 3 && avg > 55) {
      // 가장 낮은 화질에서도 초당 18장도 안 나오면(두 번 연속) 그림으로 (놀이가 정함)
      this._slowN = (this._slowN || 0) + 1;
      if (this._slowN >= 2 && this.opt.onSlow && !this._slowTold) {
        this._slowTold = true;
        this._slowT = setTimeout(() => !this.dead && this.opt.onSlow(), 0);
      }
    } else this._slowN = 0;
  };

  /** 매 장면: 크기 확인 → 움직임 → 그리기 */
  SP.tick = function (dt) {
    if (this.dead || this.lost) return;
    // 칭찬 화면이 덮고 있는 동안은 한 장 걸러 그림 → 그래픽 힘을 앞의 축하 효과에 양보 (화질 판단에서도 뺌)
    if (KP.celebrating) {
      this._lt = 0;
      this._acc = (this._acc || 0) + dt;
      if ((this._skip = !this._skip)) return;
      dt = this._acc;
      this._acc = 0;
    } else {
      if (this._acc) dt += this._acc;
      this._acc = 0;
      if (this.gl) this.measure();
    }
    dt = Math.min(dt, 0.05);
    this.time += dt;
    // 크기 변화는 ResizeObserver 가 알려 줌 → 매 장면 재지 않고 가끔만 확인 (매번 재면 배치를 억지로 다시 계산)
    if (!this.ro || (this._rc = (this._rc || 0) + 1) % 60 === 0) this.resize();
    for (const f of this.updaters) f(dt, this.time);
    this.render();
  };
  SP.render = function () {
    if (!this.gl || this.lost || this.dead || !this.bc) return;
    this.renderer.render(this.scene, this.camera);
  };
  SP.dispose = function () {
    if (this.dead) return;
    this.dead = true;
    clearTimeout(this._lostT);
    clearTimeout(this._slowT);
    if (this.ro) this.ro.disconnect();
    this.updaters = [];
    if (this.onDispose) this.onDispose();
    if (this.gl) {
      for (const x of [this.grainT, this.blobT, this.contactM, this.castM, this.plane]) x.dispose();
      this.renderer.dispose();
      try {
        this.renderer.forceContextLoss(); // 그래픽 메모리를 바로 돌려줌 (iPad)
      } catch (e) {}
      this.renderer.domElement.remove();
    }
    this.bgEl.remove();
    this.frontEl.remove();
    this.ui.remove();
    this.host.classList.remove("csHost");
  };
})();

;

/* ==== js/games/_shared/doll-actor.js ==== */
/* =====================================================================
   🧸 인형 배우 (공용) — 아이가 칠한 3D 점토 인형(doll.js)을 놀이의 주인공으로
   - 동물원(zoo3d.js)과 같이 쓰는 것: 종 모양(kind) · 인형 재질(셰이더: 그림 + 얼굴 덧칠 + 부위 가중치 움직임) · 절차적 자세(pose)
     → 동물원 동작이 바뀌지 않게, 새로 넣은 움직임 값(팔 앞으로·한 팔 들기·고개 숙이기·부위 볼록/오목·부위 물들이기)은 0 이면 예전과 똑같음
   - 놀이용 배우(create): 칠한 인형(KP.db art, kind:"zoo", tid:"doll") 하나 또는 기본 색 인형 → 무대(clay-stage)에 세움
       act.place(x,z,키) · act.walkTo(x,z) · act.mood("sick"|"pain"|"happy"|"sleep"|"normal") · act.sick(0~1)
       act.react(부위) · act.poke(부위,세기) · act.bump(부위,세기) · act.glow(부위,색,세기) · act.happy() · act.hop() · act.wave(초) · act.hug(켜기)
       act.anchor(부위) → 화면 {x,y} (도구가 닿는 판정·스티커 따라가기) · act.box() · act.hit(x,y) → 가장 가까운 부위
       act.play = {fR,fL,uR,uL,nod,tilt,sway,bob} — 놀이가 매 장면 정하는 덧붙임 자세(악기 연주 등, 0 이면 그대로)
     부위: forehead·headTop·eyeR·eyeL·cheekR·cheekL·nose·mouth·chest·belly·handR·handL·armR·armL·kneeR·kneeL
   - 3D 가 안 되면 create2D: 정면 그림(thumb) 한 장으로 같은 이름의 함수들(움직임은 CSS)
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const T3 = () => KP.clayStage.THREE;
  const DA = (KP.dollActor = {});

  /* ================================================================
     1) 동물원과 같이 쓰는 것
  ================================================================ */
  /** 인형 종 등록: 같은 종 인형들이 모양·얼굴 텍스처를 같이 씀 (zoo3d 의 addKind 를 그대로 옮김) */
  DA.kind = function (id, model, B, hi) {
    const THREE = T3();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(model.POSITION, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(model.NORMAL, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(B.uv, 2));
    const nv = model.POSITION.length / 3, P = KP.DOLL.P;
    const ao = new Float32Array(nv), front = new Float32Array(nv);
    let x0 = 9, x1 = -9;
    for (let v = 0; v < nv; v++) {
      ao[v] = (model._AO ? model._AO[v] : 255) / 255;
      const nz = model.NORMAL[v * 3 + 2];
      // 얼굴 덧칠은 머리·주둥이 앞쪽만 (뒤통수에 눈이 비치지 않게)
      front[v] = B.part[v] === P.head || B.part[v] === P.snout ? clamp((nz - 0.05) / 0.3, 0, 1) : 0;
      x0 = Math.min(x0, model.POSITION[v * 3]);
      x1 = Math.max(x1, model.POSITION[v * 3]);
    }
    geo.setAttribute("aAO", new THREE.BufferAttribute(ao, 1));
    geo.setAttribute("aFront", new THREE.BufferAttribute(front, 1));
    geo.setAttribute("aWA", new THREE.BufferAttribute(B.weights.A, 4));
    geo.setAttribute("aWB", new THREE.BufferAttribute(B.weights.B, 4));
    geo.setIndex(new THREE.BufferAttribute(model.index, 1));
    geo.computeBoundingSphere();
    geo.boundingSphere.radius *= 1.3; // 움직임 여유
    const faceT = new THREE.CanvasTexture(KP.DOLL.faceCanvas(B.spec, hi ? 1024 : 512));
    faceT.colorSpace = THREE.SRGBColorSpace;
    faceT.anisotropy = 4;
    return { id, geo, B, spec: B.spec, faceT, w: x1 - x0, mv: B.spec.move, model };
  };

  /** 인형 재질: 그림 텍스처 + 절차적 움직임 (모든 종이 같은 셰이더 하나) — zoo3d 의 dollMat 를 옮기고 움직임 값을 더함 */
  DA.material = function (tex, k, grainT) {
    const THREE = T3();
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0, bumpMap: grainT, bumpScale: 0.35 });
    const v3 = (a) => new THREE.Vector3(...a);
    const p = k.spec.pivot, mv = k.mv;
    const Uf = {
      uPh: { value: 0 }, uAmp: { value: 0 }, uEar: { value: 0 }, uHead: { value: new THREE.Vector2() }, uTail: { value: 0 }, uArmUp: { value: 0 },
      uFace: { value: k.faceT }, uAOk: { value: 0.6 },
      uArmP: { value: v3(p.arm) }, uEarP: { value: v3(p.ear) }, uHeadP: { value: v3(p.head) }, uTailP: { value: v3(p.tail) },
      uEarAx: { value: v3(mv.earAx).normalize() }, uTailAx: { value: v3(mv.tailAx).normalize() }, uLegH: { value: p.leg || 0.2 },
      uLeg: { value: new THREE.Vector2(mv.legLift, mv.legStep) }, uArmSw: { value: mv.armSwing },
      uTailBlur: { value: k.spec.swing ? 0 : k.spec.merge && k.spec.merge.tail ? 5 : 2 },
      // 놀이용 움직임 (0 이면 동물원과 똑같음)
      uArmFwd: { value: 0 }, uArmR: { value: 0 }, uHeadDn: { value: 0 },
      uArmB: { value: new THREE.Vector2() }, uArmL: { value: 0 }, // 팔 하나씩: 앞으로(오른쪽, 왼쪽) · 왼팔 들기 (연주 동작)
      uPk0: { value: new THREE.Vector4(0, 0, 0, 1) }, uPk0K: { value: 0 }, uPk1: { value: new THREE.Vector4(0, 0, 0, 1) }, uPk1K: { value: 0 },
      uGlow: { value: new THREE.Vector4(0, 0, 0, 1) }, uGlowC: { value: new THREE.Vector4(0, 0, 0, 0) },
    };
    m.userData.U = Uf;
    m.customProgramCacheKey = () => "doll10";
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, Uf);
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uPh, uAmp, uEar, uTail, uArmUp, uLegH, uArmSw, uArmFwd, uArmR, uArmL, uHeadDn, uPk0K, uPk1K; uniform vec2 uHead, uLeg, uArmB;
uniform vec3 uArmP, uEarP, uHeadP, uTailP, uEarAx, uTailAx; uniform vec4 uPk0, uPk1;
attribute vec4 aWA; attribute vec4 aWB; attribute float aAO; attribute float aFront;
varying float vAO; varying float vFront; varying float vSide; varying float vBack; varying float vTail; varying vec3 vP0;
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
mat3 rA(vec3 a, float t){float c=cos(t),s=sin(t),C=1.-c;return mat3(
  c+a.x*a.x*C, a.y*a.x*C+a.z*s, a.z*a.x*C-a.y*s,
  a.x*a.y*C-a.z*s, c+a.y*a.y*C, a.z*a.y*C+a.x*s,
  a.x*a.z*C+a.y*s, a.y*a.z*C-a.x*s, c+a.z*a.z*C);}
float pkF(vec3 p, vec4 c){float d=1.0-smoothstep(0.0, c.w, distance(p, c.xyz)); return d*d*(3.0-2.0*d);}`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `vec3 dP = position; vec3 dN = normal;
{
  float s = sin(uPh);
  vec3 sh = uArmP, shL = sh * vec3(-1.,1.,1.);
  mat3 RaR = rZ(uArmUp + uArmR) * rX(-s * uArmSw * uAmp - uArmFwd - uArmB.x);
  mat3 RaL = rZ(-uArmUp - uArmL) * rX(s * uArmSw * uAmp - uArmFwd - uArmB.y);
  mat3 ReR = rA(uEarAx, uEar), ReL = rA(uEarAx * vec3(-1.,1.,1.), -uEar);
  vec3 ep = uEarP, epL = ep * vec3(-1.,1.,1.);
  mat3 Rt = rA(uTailAx, uTail);
  vec3 tp = uTailP;
  float lift = 1.0 - clamp(position.y / uLegH, 0.0, 1.0);
  vec3 dLR = vec3(0., max(0., s) * uLeg.x, s * uLeg.y) * uAmp * lift;
  vec3 dLL = vec3(0., max(0., -s) * uLeg.x, -s * uLeg.y) * uAmp * lift;
  vec3 p0 = position + normal * (uPk0K * pkF(position, uPk0) + uPk1K * pkF(position, uPk1));
  dP = p0
    + aWA.x * (RaR * (p0 - sh) + sh - p0) + aWA.y * (RaL * (p0 - shL) + shL - p0)
    + aWA.z * dLR + aWA.w * dLL
    + aWB.x * (ReR * (p0 - ep) + ep - p0) + aWB.y * (ReL * (p0 - epL) + epL - p0)
    + aWB.w * (Rt * (p0 - tp) + tp - p0);
  dN = normal
    + aWA.x * (RaR * normal - normal) + aWA.y * (RaL * normal - normal)
    + aWB.x * (ReR * normal - normal) + aWB.y * (ReL * normal - normal) + aWB.w * (Rt * normal - normal);
  mat3 Rh = rY(uHead.y) * rZ(uHead.x) * rX(uHeadDn);
  vec3 nk = uHeadP;
  dP = mix(dP, Rh * (dP - nk) + nk, aWB.z);
  dN = normalize(mix(dN, Rh * dN, aWB.z));
}
vAO = aAO; vFront = aFront; vSide = 1.0 - abs(normal.z); vBack = smoothstep(0.15, 0.6, -normal.z); vTail = aWB.w; vP0 = position;
vec3 objectNormal = dN;
#ifdef USE_TANGENT
  vec3 objectTangent = vec3( tangent.xyz );
#endif`
        )
        .replace("#include <begin_vertex>", "vec3 transformed = dP;");
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
uniform sampler2D uFace; uniform float uAOk; uniform float uTailBlur; uniform vec4 uGlow, uGlowC;
varying float vAO; varying float vFront; varying float vSide; varying float vBack; varying float vTail; varying vec3 vP0;`
        )
        .replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv, max(max(max(0.0, vSide - 0.35) * 4.0, vBack * 2.2), vTail * uTailBlur) );
  vec4 fc = texture2D( uFace, vMapUv );
  sampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, fc.rgb, fc.a * vFront );
  diffuseColor *= sampledDiffuseColor;
#endif
  diffuseColor.rgb = mix( diffuseColor.rgb, uGlowC.rgb, uGlowC.a * ( 1.0 - smoothstep( 0.0, uGlow.w, distance( vP0, uGlow.xyz ) ) ) );
  float aoF = mix(1.0, smoothstep(0.0, 0.85, vAO), uAOk);
  diffuseColor.rgb *= aoF;`
        );
    };
    return m;
  };

  /** 인형 자세 한 장면 (zoo3d 의 place 에서 인형 부분을 그대로 옮김)
      a: {x,z,tx,tz,state,look,yaw,seed,ph,sq,sqv,happy,hop,amp,M(움직임 값),size,root,mat} → a.bobY */
  DA.pose = function (a, dt, t) {
    const Uf = a.mat.userData.U, M = a.M, s = a.size;
    const moving = a.state === "walk";
    a.amp = moving ? Math.min(1, a.amp + dt * 4) : Math.max(0, a.amp - dt * 3);
    if (moving) {
      const want = clamp(Math.atan2(a.tx - a.x, a.tz - a.z), -0.72, 0.72);
      a.yaw += (want - a.yaw) * Math.min(1, dt * 5);
    } else if (a.look > 0) a.yaw += (0 - a.yaw) * Math.min(1, dt * 5);
    else a.yaw += (Math.sin(t * 0.4 + a.seed) * 0.25 - a.yaw) * Math.min(1, dt * 1.5);
    a.ph += dt * (M.gait + a.happy * 3) * Math.max(0.15, a.amp);
    a.sqv += (-a.sq * 90 - a.sqv * 9) * dt;
    a.sq += a.sqv * dt;
    a.happy = Math.max(0, a.happy - dt * 0.5);
    if (a.hop > 0) {
      a.hop += dt;
      if (a.hop > 0.5) a.hop = 0;
    }
    const hopPh = Math.max(0, Math.sin(a.ph));
    const bob = Math.abs(Math.sin(a.ph)) * M.bob * a.amp + M.hop * Math.pow(hopPh, 0.8) * a.amp + (a.hop > 0 ? Math.sin((a.hop / 0.5) * Math.PI) * 0.18 : 0);
    const land = M.hop ? Math.max(0, -Math.sin(a.ph)) * 0.08 * a.amp : 0;
    const sq = clamp(a.sq * 0.06 + land, -0.2, 0.2);
    a.root.position.set(a.x, bob * s, a.z);
    a.root.rotation.set(M.hop ? -0.12 * hopPh * a.amp : 0, a.yaw, Math.sin(a.ph) * M.roll * a.amp, "YXZ");
    a.root.scale.set(s * (1 + sq * 0.6), s * (1 - sq), s * (1 + sq * 0.6));
    Uf.uPh.value = a.ph;
    Uf.uAmp.value = a.amp;
    Uf.uEar.value = M.earBase + a.amp * M.ear * Math.sin(a.ph * 2 - 0.7) + a.happy * M.earHappy * Math.sin(t * 16) + Math.sin(t * 1.3 + a.seed) * 0.03 * (M.ear > 0 ? 1 : 0);
    Uf.uHead.value.set(Math.sin(a.ph) * 0.05 * a.amp + Math.sin(t * 0.9 + a.seed) * 0.05 * (1 - a.amp), a.happy * 0.25 * Math.sin(t * 5));
    Uf.uTail.value = Math.sin(t * (M.tailRate + a.happy * 10) + a.seed) * (M.tail + a.happy * 0.25);
    Uf.uArmUp.value = a.happy * 0.9;
    a.bobY = bob * s;
  };

  /* ================================================================
     2) 표정 · 기본 색 · 부위 기준점
  ================================================================ */
  /** 얼굴 덧칠 그림 (기분별): normal 그대로 · sick 걱정 눈썹 · pain 질끈 감은 눈 · happy 웃는 눈 · sleep 감은 눈 (+볼 빨강) */
  DA.faceCanvas = function (spec, size, mood, blush) {
    const D = KP.DOLL, c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    g.scale(size / 1024, size / 1024);
    D.drawFace(g, spec, "3d");
    const F = spec.face, X = (x) => spec.CX + x * spec.K, Y = (y) => spec.OY - y * spec.K, L = (l) => l * spec.K;
    const ink = "#1d1714";
    g.lineCap = g.lineJoin = "round";
    if (mood === "pain" || mood === "happy" || mood === "sleep") {
      // 눈 지우고 다시 그림
      g.save();
      g.globalCompositeOperation = "destination-out";
      for (const [x, y] of F.eyes) {
        g.beginPath();
        g.ellipse(X(x), Y(y), L(F.eyeR[0]) * 1.5, L(F.eyeR[1]) * 1.5, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
      g.strokeStyle = ink;
      g.lineWidth = Math.max(5, L(F.eyeR[1]) * 0.55);
      for (const [x, y] of F.eyes) {
        const ex = X(x), ey = Y(y), rx = L(F.eyeR[0]) * 1.15, ry = L(F.eyeR[1]) * 0.9, sd = x < 0 ? -1 : 1;
        g.beginPath();
        if (mood === "happy") {
          // ∩ 웃는 눈
          g.moveTo(ex - rx, ey + ry * 0.4);
          g.quadraticCurveTo(ex, ey - ry * 1.4, ex + rx, ey + ry * 0.4);
        } else if (mood === "sleep") {
          // ∪ 감은 눈
          g.moveTo(ex - rx, ey - ry * 0.2);
          g.quadraticCurveTo(ex, ey + ry * 1.1, ex + rx, ey - ry * 0.2);
        } else {
          // > < 질끈
          g.moveTo(ex - sd * rx, ey - ry);
          g.lineTo(ex + sd * rx * 0.6, ey);
          g.lineTo(ex - sd * rx, ey + ry);
        }
        g.stroke();
      }
    }
    if (mood === "sick" || mood === "pain") {
      // 걱정 눈썹: 안쪽 끝이 올라감
      g.strokeStyle = "#3b2a25";
      g.lineWidth = Math.max(5, L(F.eyeR[1]) * 0.5);
      for (const [x, y] of F.eyes) {
        const sd = x < 0 ? -1 : 1, ex = X(x), ey = Y(y) - L(F.eyeR[1]) * 2.6, w = L(F.eyeR[0]) * 1.5;
        g.beginPath();
        g.moveTo(ex - sd * w, ey - L(0.012));
        g.lineTo(ex + sd * w * 0.7, ey + L(0.012));
        g.stroke();
      }
    }
    if (blush || mood === "happy") {
      g.fillStyle = blush === "fever" ? "rgba(255,70,70,.45)" : "rgba(255,120,150,.38)";
      for (const [x, y] of F.eyes) {
        g.beginPath();
        g.ellipse(X(x * 1.18), Y(y - 0.055), L(F.eyeR[0]) * 1.9, L(F.eyeR[1]) * 1.2, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    return c;
  };

  // 기본 색 인형 (칠한 인형이 없을 때): [몸, 특징(귀·주둥이·갈기·뿔·꼬리)]
  const BASE_COL = {
    dog: ["#f2c98a", "#b97c4b"], cat: ["#ffbf7a", "#f59a4a"], bear: ["#c99266", "#f3dcc0"], rabbit: ["#ffd6e4", "#ff9fbf"],
    pig: ["#ffbfd0", "#ff8fab"], lion: ["#ffd36b", "#e48c3c"], elephant: ["#a9c4ea", "#86a9dc"], dino: ["#9fdf8f", "#ffc94d"],
  };
  DA.BASE_COL = BASE_COL;
  const texCache = {};
  /** 기본 색 텍스처 (종마다 한 번) — 부위별 색 + 실루엣 밖 번지기 (칠한 그림과 같은 방식) */
  DA.defaultTex = function (B, sp) {
    if (texCache[sp]) return texCache[sp];
    const D = KP.DOLL, P = D.P, S = B.S, c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d"), im = g.createImageData(S, S), d = new Uint32Array(im.data.buffer);
    const col = BASE_COL[sp] || ["#f6d7a7", "#e8a87c"];
    const v32 = (h) => {
      const n = parseInt(h.slice(1), 16);
      return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;
    };
    const a = v32(col[0]), b = v32(col[1]);
    const acc = new Set([P.earR, P.earL, P.snout, P.mane, P.spike, P.tail]);
    for (let i = 0; i < S * S; i++) if (B.label[i]) d[i] = acc.has(B.label[i]) ? b : a;
    const bl = D.bleedOf(B);
    for (let i = 0; i < S * S; i++) if (!B.label[i] && bl[i] >= 0) d[i] = d[bl[i]];
    g.putImageData(im, 0, 0);
    const o = document.createElement("canvas");
    o.width = o.height = 512;
    const og = o.getContext("2d");
    og.imageSmoothingQuality = "high";
    og.drawImage(c, 0, 0, 512, 512);
    return (texCache[sp] = o);
  };

  /** 부위 기준점 (모델 좌표, 키 1) — 종마다 한 번. 겉면 z 는 모델 점에서 찾음 → 도구가 몸 앞에 닿는 자리 */
  DA.anchorsOf = function (k) {
    if (k.anc) return k.anc;
    const D = KP.DOLL, P = D.P, B = k.B, spec = B.spec, F = spec.face, pv = spec.pivot;
    const pos = k.model.POSITION, part = B.part, nv = pos.length / 3;
    const HEAD = [P.head, P.snout, P.mane, P.earR, P.earL];
    const front = (x, y, parts, r = 0.035) => {
      for (const rr of [r, r * 2, r * 4]) {
        let best = -9;
        for (let v = 0; v < nv; v++) {
          if (parts && !parts.includes(part[v])) continue;
          if (Math.abs(pos[v * 3] - x) < rr && Math.abs(pos[v * 3 + 1] - y) < rr && pos[v * 3 + 2] > best) best = pos[v * 3 + 2];
        }
        if (best > -9) return best;
      }
      return 0.2;
    };
    const cen = (parts, f) => {
      let sx = 0, sy = 0, n = 0, mny = 9;
      for (let v = 0; v < nv; v++) if (parts.includes(part[v])) mny = Math.min(mny, pos[v * 3 + 1]);
      for (let v = 0; v < nv; v++) {
        if (!parts.includes(part[v]) || !f(pos[v * 3], pos[v * 3 + 1], mny)) continue;
        sx += pos[v * 3];
        sy += pos[v * 3 + 1];
        n++;
      }
      return n ? [sx / n, sy / n] : [0, 0.3];
    };
    let topY = 0;
    for (let v = 0; v < nv; v++) if (part[v] === P.head && Math.abs(pos[v * 3]) < 0.06) topY = Math.max(topY, pos[v * 3 + 1]);
    const eY = F.eyes[0][1], eX = Math.abs(F.eyes[0][0]);
    const noseY = F.nose && F.nose.type !== "none" ? F.nose.y : eY - 0.08;
    const mouthY = F.mouth && F.mouth.type !== "none" ? F.mouth.y : eY - 0.15;
    const A = {};
    const put = (name, x, y, g, parts) => (A[name] = { p: [x, y, front(x, y, parts) + 0.01], g });
    put("forehead", 0, eY + (topY - eY) * 0.5, "head", [P.head, P.mane]);
    put("headTop", 0.05, topY - 0.045, "head", [P.head, P.mane]);
    put("eyeR", eX, eY, "head", HEAD);
    put("eyeL", -eX, eY, "head", HEAD);
    put("cheekR", eX * 1.2, eY - 0.06, "head", HEAD);
    put("cheekL", -eX * 1.2, eY - 0.06, "head", HEAD);
    put("nose", 0, noseY, "head", HEAD);
    put("mouth", 0, mouthY, "head", HEAD);
    put("chest", 0, pv.arm[1] - 0.06, "body", [P.body]);
    put("belly", 0, (pv.arm[1] + pv.leg) / 2 - 0.05, "body", [P.body]);
    for (const [nm, pt, g] of [["R", P.armR, "armR"], ["L", P.armL, "armL"]]) {
      const h = cen([pt], (x, y, mny) => y < mny + 0.06);
      put("hand" + nm, h[0], h[1] + 0.02, g, [pt]);
      const m = cen([pt], () => true);
      put("arm" + nm, m[0], m[1], g, [pt]);
    }
    for (const [nm, pt] of [["R", P.legR], ["L", P.legL]]) {
      const c = cen([pt], () => true);
      put("knee" + nm, c[0], Math.max(c[1], 0.06), "body", [pt]);
    }
    A._topY = topY;
    return (k.anc = A);
  };

  // 작은 회전 (셰이더와 같은 식)
  const rotX = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a), y = v[1], z = v[2];
    v[1] = c * y - s * z;
    v[2] = s * y + c * z;
  };
  const rotY = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a), x = v[0], z = v[2];
    v[0] = c * x + s * z;
    v[2] = -s * x + c * z;
  };
  const rotZ = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a), x = v[0], y = v[1];
    v[0] = c * x - s * y;
    v[1] = s * x + c * y;
  };

  /* ================================================================
     3) 칠한 인형 고르기
  ================================================================ */
  /** 아이가 칠한 인형 목록 (안전한 그림만) */
  DA.painted = async function () {
    const D = KP.DOLL;
    try {
      return (await KP.db.all("art")).filter((x) => x && x.kind === "zoo" && x.tid === "doll" && D && D.ok(x.species) && KP.safeImg(x.img));
    } catch (e) {
      return [];
    }
  };

  /* ================================================================
     4) 3D 배우
  ================================================================ */
  const kinds = new WeakMap(); // 무대마다 종 모양 (무대를 정리하면 같이 정리)
  /** opts: {item(칠한 인형) | species, hi} */
  DA.create = async function (stage, opts) {
    const THREE = T3(), D = KP.DOLL;
    const sp = opts.item ? opts.item.species : opts.species;
    const { model, B } = await D.load(sp);
    if (stage.dead) return null;
    let ks = kinds.get(stage);
    if (!ks) {
      kinds.set(stage, (ks = {}));
      const prev = stage.onDispose;
      stage.onDispose = () => {
        prev && prev();
        for (const k of Object.values(ks)) {
          k.geo.dispose();
          k.faceT.dispose();
        }
      };
    }
    const hi = opts.hi != null ? opts.hi : Math.min(screen.width || 0, screen.height || 0) >= 600;
    const k = ks[sp] || (ks[sp] = DA.kind(sp, model, B, hi));
    let src = null;
    if (opts.item) {
      const im = await new Promise((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = KP.safeImg(opts.item.img);
      });
      if (im) {
        const ts = hi ? 768 : 512;
        src = im;
        if (Math.max(im.width, im.height) > ts) {
          src = document.createElement("canvas");
          src.width = src.height = ts;
          const g = src.getContext("2d");
          g.imageSmoothingQuality = "high";
          g.drawImage(im, 0, 0, ts, ts);
        }
      }
    }
    if (stage.dead) return null;
    const painted = !!src;
    if (!src) src = DA.defaultTex(B, sp);
    const tex = new THREE.Texture(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    return new Actor(stage, k, tex, sp, painted, hi);
  };

  function Actor(stage, k, tex, sp, painted, hi) {
    this.stage = stage;
    this.k = k;
    this.sp = sp;
    this.painted = painted;
    this.name = k.spec.name;
    this.tex = tex;
    this.mat = DA.material(tex, k, stage.grainT);
    this.U = this.mat.userData.U;
    this.root = new KP.clayStage.THREE.Mesh(k.geo, this.mat);
    this.sh = stage.shadow();
    stage.scene.add(this.root);
    this.anc = DA.anchorsOf(k);
    this.faces = {}; // 기분별 얼굴 텍스처
    this.faceSize = hi ? 1024 : 512;
    // 동물원 인형과 같은 움직임 값
    this.a = { x: 0, z: -5, tx: 0, tz: -5, state: "idle", look: 1e9, yaw: 0, seed: Math.random() * 100, ph: 0, sq: 0, sqv: 0, happy: 0, hop: 0, amp: 0, M: k.mv, size: 1, root: this.root, mat: this.mat };
    this.sickK = 0; // 아픔 정도 (고개 숙이고 느리게 흔들)
    this.fx = { pk0: 0, pk0T: 0, pk1: 0, pk1T: 0, glow: 0, glowT: 0, armFwd: 0, armFwdT: 0, wave: 0, dn: 0 };
    this.speed = 1;
    this.lift = 0; // 뛰어오를 때 높이
    this.lean = 0; // 앞으로 기울기 (꼭 안기)
    this.leanT = 0;
    // 놀이가 매 장면 직접 정하는 덧붙임 자세 (연주 동작): 팔 앞으로 fR·fL · 팔 들기 uR·uL · 고개 끄덕 nod · 고개 갸웃 tilt · 몸 좌우 sway · 들썩 bob(키 비율)
    this.play = { fR: 0, fL: 0, uR: 0, uL: 0, nod: 0, tilt: 0, sway: 0, bob: 0 };
    this._up = (dt, t) => this.update(dt, t);
    stage.updaters.push(this._up);
  }
  const AP = Actor.prototype;
  AP.place = function (x, z, h) {
    const a = this.a;
    a.x = a.tx = x;
    a.z = a.tz = z;
    if (h) this.setH(h);
    a.state = "idle";
  };
  AP.setH = function (h) {
    this.a.size = h; // 모델 키 1 → 세상 키 h (종마다 다른 크기 비율은 놀이가 정함)
    this.h = h;
    this.w = this.k.w * h;
  };
  /** 걸어가기 (도착하면 resolve) */
  AP.walkTo = function (x, z, speed = 1) {
    const a = this.a;
    a.tx = x;
    a.tz = z;
    a.state = "walk";
    a.look = 0;
    this.speed = speed;
    if (this._arrive) this._arrive(); // 앞선 걷기를 기다리던 쪽이 영영 멈추지 않게
    return new Promise((res) => (this._arrive = res));
  };
  /** 폴짝 뛰어 (x,z) 로 (dur 초, 높이 = 키 × hk) — 도착하면 resolve */
  AP.jumpTo = function (x, z, dur = 0.7, hk = 0.45) {
    const a = this.a;
    if (this._jump && this._jump.res) this._jump.res();
    return new Promise((res) => (this._jump = { x0: a.x, z0: a.z, x1: x, z1: z, t: 0, dur, hk, res }));
  };
  AP.stepJump = function (dt) {
    const j = this._jump, a = this.a;
    if (!j) return;
    j.t += dt;
    const k = Math.min(1, j.t / j.dur), e = k * k * (3 - 2 * k);
    a.x = a.tx = j.x0 + (j.x1 - j.x0) * e;
    a.z = a.tz = j.z0 + (j.z1 - j.z0) * e;
    this.lift = Math.sin(Math.PI * k) * j.hk * (this.h || 1);
    if (k >= 1) {
      this.lift = 0;
      this._jump = null;
      a.sqv = 6;
      j.res && j.res();
    }
  };
  AP.mood = function (m, blush) {
    const key = m + (blush || "");
    if (this._mood === key) return;
    this._mood = key;
    if (m === "normal" && !blush) {
      this.U.uFace.value = this.k.faceT;
      return;
    }
    if (!this.faces[key]) {
      const THREE = KP.clayStage.THREE, t = new THREE.CanvasTexture(DA.faceCanvas(this.k.spec, this.faceSize, m, blush));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      this.faces[key] = t;
    }
    this.U.uFace.value = this.faces[key];
  };
  AP.sick = function (k) {
    this.sickK = k;
  };
  /** 부위 모델 좌표 */
  AP.local = function (name) {
    const A = this.anc[name];
    return A ? A.p : [0, 0.5, 0.2];
  };
  /** 부위가 톡 반응 (볼록 + 몸 살짝 찌그러짐) */
  AP.react = function (name, k = 0.035) {
    this.poke(name, k);
    this.a.sqv = 4;
  };
  /** 순간 볼록(+)/오목(-) — 금방 돌아옴 */
  AP.poke = function (name, k = 0.04, r = 0.12) {
    const p = this.local(name);
    this.U.uPk0.value.set(p[0], p[1], p[2] - 0.01, r);
    this.fx.pk0 = k;
    this.fx.pk0T = 0;
  };
  /** 오래 남는 볼록 (혹) — k 로 천천히 바뀜 */
  AP.bump = function (name, k, r = 0.1) {
    const p = this.local(name);
    this.U.uPk1.value.set(p[0], p[1], p[2] - 0.03, r);
    this.fx.pk1T = k;
  };
  /** 부위 물들이기 (열 = 빨강) — k 로 천천히 바뀜 */
  AP.glow = function (name, col, k, r = 0.16) {
    const p = this.local(name);
    const c = new KP.clayStage.THREE.Color(col);
    this.U.uGlow.value.set(p[0], p[1], p[2] - 0.04, r);
    this.U.uGlowC.value.set(c.r, c.g, c.b, this.U.uGlowC.value.w);
    this.fx.glowT = k;
  };
  AP.happy = function () {
    this.a.sqv = 7;
    this.a.happy = 1;
    this.a.hop = 0.0001;
  };
  AP.hop = function () {
    this.a.hop = 0.0001;
    this.a.sqv = 5;
  };
  /** 오른팔 흔들어 인사 (초) */
  AP.wave = function (sec = 1.6) {
    this.fx.wave = sec;
  };
  /** 두 팔을 앞으로 (안기·꼭 안기) */
  AP.hug = function (on) {
    this.fx.armFwdT = on ? 1.1 : 0;
  };
  AP.update = function (dt, t) {
    const a = this.a, f = this.fx, Uf = this.U;
    if (a.state === "walk") {
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz), st = this.k.mv.speed * 1.6 * this.h * this.speed * dt;
      if (d < 0.01 || d <= st) {
        a.x = a.tx;
        a.z = a.tz;
        a.state = "idle";
        a.look = 1e9;
        const r = this._arrive;
        this._arrive = null;
        r && r();
      } else {
        a.x += (dx / d) * st;
        a.z += (dz / d) * st;
      }
    }
    this.stepJump(dt);
    DA.pose(a, dt, t);
    if (this._jump) {
      const j = this._jump;
      a.yaw += (Math.sign(j.x1 - j.x0) * 0.6 - a.yaw) * Math.min(1, dt * 8);
    }
    const pl = this.play;
    a.root.position.y += this.lift + pl.bob * (this.h || 1);
    this.lean += (this.leanT - this.lean) * Math.min(1, dt * 5);
    a.root.rotation.x += this.lean * 0.25;
    a.root.rotation.z += pl.sway;
    // 아플 때: 고개 숙이고 천천히 좌우로
    const sk = this.sickK;
    f.dn += (sk * 0.22 - f.dn) * Math.min(1, dt * 3);
    Uf.uHeadDn.value = f.dn + pl.nod;
    Uf.uHead.value.x += Math.sin(t * 1.3 + a.seed) * 0.07 * sk + pl.tilt;
    Uf.uArmB.value.set(pl.fR, pl.fL);
    Uf.uArmL.value = pl.uL;
    a.root.rotation.z += Math.sin(t * 1.1 + a.seed) * 0.035 * sk;
    // 순간 볼록: 0.5초 동안 줄어듦
    if (f.pk0) {
      f.pk0T += dt;
      const e = Math.max(0, 1 - f.pk0T / 0.5);
      Uf.uPk0K.value = f.pk0 * e * e;
      if (e <= 0) f.pk0 = 0;
    } else Uf.uPk0K.value = 0;
    f.pk1 += (f.pk1T - f.pk1) * Math.min(1, dt * 2.5);
    Uf.uPk1K.value = f.pk1;
    const gw = Uf.uGlowC.value;
    gw.w += (f.glowT - gw.w) * Math.min(1, dt * 2.5);
    if (gw.w < 0.002 && !f.glowT) gw.w = 0;
    f.armFwd += (f.armFwdT - f.armFwd) * Math.min(1, dt * 6);
    Uf.uArmFwd.value = f.armFwd;
    if (f.wave > 0) {
      f.wave -= dt;
      Uf.uArmR.value = (Math.min(1, f.wave * 3, (1.6 - f.wave) * 3 + 0.2)) * (1.9 + Math.sin(t * 12) * 0.35) + pl.uR;
    } else Uf.uArmR.value = pl.uR;
    this.sh.set(a.x, a.z, this.w || 0.5, this.h || 1, (a.bobY || 0) + this.lift);
  };
  /** 부위 → 화면 좌표 (host 기준 px) — 고개·팔 움직임을 셰이더와 같은 식으로 따라감 */
  AP.anchor = function (name) {
    const A = this.anc[name], THREE = KP.clayStage.THREE;
    const p = (A ? A.p : [0, 0.5, 0.2]).slice(), Uf = this.U, sp = this.k.spec.pivot;
    if (A && A.g === "head") {
      const nk = sp.head;
      p[0] -= nk[0]; p[1] -= nk[1]; p[2] -= nk[2];
      rotX(p, Uf.uHeadDn.value);
      rotZ(p, Uf.uHead.value.x);
      rotY(p, Uf.uHead.value.y);
      p[0] += nk[0]; p[1] += nk[1]; p[2] += nk[2];
    } else if (A && (A.g === "armR" || A.g === "armL")) {
      const R = A.g === "armR", sh = [sp.arm[0] * (R ? 1 : -1), sp.arm[1], sp.arm[2]];
      const s = Math.sin(Uf.uPh.value), sw = Uf.uArmSw.value * Uf.uAmp.value;
      p[0] -= sh[0]; p[1] -= sh[1]; p[2] -= sh[2];
      rotX(p, (R ? -s * sw : s * sw) - Uf.uArmFwd.value - (R ? Uf.uArmB.value.x : Uf.uArmB.value.y));
      rotZ(p, R ? Uf.uArmUp.value + Uf.uArmR.value : -Uf.uArmUp.value - Uf.uArmL.value);
      p[0] += sh[0]; p[1] += sh[1]; p[2] += sh[2];
    }
    this.root.updateMatrixWorld();
    const v = (this._v = this._v || new THREE.Vector3()).set(p[0], p[1], p[2]).applyMatrix4(this.root.matrixWorld);
    const s = this.stage.project(v.x, v.y, v.z);
    return { x: s.x, y: s.y };
  };
  /** 화면에서 인형이 차지하는 네모 (host 기준) */
  AP.box = function () {
    const a = this.a, st = this.stage, hw = (this.w || 0.5) / 2, y0 = (a.bobY || 0) + this.lift;
    const by = st.project(a.x, y0, a.z).y, ty = st.project(a.x, y0 + (this.h || 1), a.z).y;
    const l = st.project(a.x - hw, y0, a.z).x, r = st.project(a.x + hw, y0, a.z).x;
    return { l, r, t: ty, b: by, cx: (l + r) / 2, cy: (ty + by) / 2, w: r - l, h: by - ty };
  };
  /** 화면 점(host 기준) → 몸 위면 가장 가까운 부위 이름, 아니면 null */
  AP.hit = function (px, py, names) {
    const bx = this.box(), pad = Math.max(12, bx.w * 0.08);
    if (px < bx.l - pad || px > bx.r + pad || py < bx.t - pad || py > bx.b + pad) return null;
    let best = null, bd = 1e9;
    for (const n of names || Object.keys(this.anc)) {
      if (n[0] === "_") continue;
      const p = this.anchor(n), d = Math.hypot(p.x - px, p.y - py);
      if (d < bd) (bd = d), (best = n);
    }
    return best;
  };
  AP.dispose = function () {
    const st = this.stage;
    st.updaters = st.updaters.filter((f) => f !== this._up);
    if (st.scene) st.scene.remove(this.root);
    this.sh.remove();
    this.mat.dispose();
    this.tex.dispose();
    for (const t of Object.values(this.faces)) t.dispose();
    this.faces = {};
  };

  /* ================================================================
     5) 그림 배우 (3D 가 안 될 때) — 같은 함수 이름, 움직임은 CSS
  ================================================================ */
  KP.css(
    "dollActor2d",
    `.da2{position:absolute;left:0;top:0;transform-origin:50% 100%;pointer-events:none;z-index:0}
     .da2 img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 4px rgba(60,30,20,.25))}
     .da2.sick{animation:da2Sway 3s ease-in-out infinite}
     @keyframes da2Sway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
     .da2.hop{animation:da2Hop .5s ease-in-out}
     @keyframes da2Hop{50%{transform:translateY(-14%) scale(1.04)}}
     .da2.squish{animation:da2Sq .3s ease-out}
     @keyframes da2Sq{40%{transform:scale(1.06,.93)}}`
  );
  DA.create2D = async function (stage, opts) {
    const D = KP.DOLL, sp = opts.item ? opts.item.species : opts.species;
    const { model, B } = await D.load(sp);
    if (stage.dead) return null; // 불러오는 사이 놀이를 나갔으면 만들지 않음
    // 도안 실루엣 네모 = 정면 그림(thumb) 범위
    const S = B.S;
    let x0 = S, y0 = S, x1 = 0, y1 = 0;
    for (let i = 0; i < S * S; i += 1) {
      if (!B.label[i]) continue;
      const x = i % S, y = (i / S) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const k = { model, B, spec: B.spec, w: (x1 - x0) / (B.spec.K * B.f), mv: B.spec.move };
    return new Actor2D(stage, k, sp, opts.item, [x0, y0, x1 + 1, y1 + 1]);
  };
  function Actor2D(stage, k, sp, item, box) {
    this.stage = stage;
    this.k = k;
    this.sp = sp;
    this.name = k.spec.name;
    this.painted = !!(item && KP.safeImg(item.thumb));
    this.anc = DA.anchorsOf(k);
    this.boxS = box;
    this.el = U.el("div", "da2", '<img alt="" src="' + (KP.safeImg(item && item.thumb) || KP.DOLL.thumbUrl(sp)) + '">');
    stage.host.insertBefore(this.el, stage.ui);
    this.a = { x: 0, z: -5, tx: 0, tz: -5, state: "idle", bobY: 0 };
    this.speed = 1;
    this.lift = 0;
    this.lean = this.leanT = 0;
    this.play = { fR: 0, fL: 0, uR: 0, uL: 0, nod: 0, tilt: 0, sway: 0, bob: 0 }; // 3D 와 같은 이름 (그림 배우는 들썩·기울기만)
    this._up = (dt) => this.update(dt);
    this.setH(1); // place(x,z) 를 키 없이 불러도 크기가 비지 않게
    stage.updaters.push(this._up);
  }
  const A2 = Actor2D.prototype;
  A2.place = AP.place;
  A2.walkTo = AP.walkTo;
  A2.jumpTo = AP.jumpTo;
  A2.stepJump = AP.stepJump;
  A2.setH = function (h) {
    this.h = h;
    this.w = this.k.w * h;
  };
  A2.update = function (dt) {
    const a = this.a;
    if (a.state === "walk") {
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz), st = 0.8 * this.h * this.speed * dt;
      if (d <= st) {
        a.x = a.tx;
        a.z = a.tz;
        a.state = "idle";
        const r = this._arrive;
        this._arrive = null;
        r && r();
      } else {
        a.x += (dx / d) * st;
        a.z += (dz / d) * st;
      }
    }
    this.stepJump(dt);
    const [x0, y0, x1, y1] = this.boxS, B = this.k.B, sp = this.k.spec;
    const foot = Object.assign({}, this.stage.project(a.x, this.lift, a.z)), top = this.stage.project(a.x, this.h + this.lift, a.z);
    const pxPerS = (foot.y - top.y) / (sp.K * B.f); // 모델 1 = K·f 칸
    const footS = sp.OY * B.f;
    const w = (x1 - x0) * pxPerS, h = (y1 - y0) * pxPerS;
    const cxS = sp.CX * B.f;
    this.px = { k: pxPerS, ox: foot.x - (cxS - x0) * pxPerS, oy: foot.y - (footS - y0) * pxPerS };
    Object.assign(this.el.style, { width: w + "px", height: h + "px", left: this.px.ox + "px", top: this.px.oy + "px" });
    const pl = this.play;
    this.el.style.translate = pl.bob || pl.sway ? `0 ${-pl.bob * h}px` : "";
    this.el.style.rotate = pl.sway ? pl.sway * 57.3 + "deg" : "";
  };
  A2.anchor = function (name) {
    const A = this.anc[name], p = A ? A.p : [0, 0.5, 0], B = this.k.B;
    if (!this.px) this.update(0);
    const [x0, y0] = this.boxS;
    return { x: this.px.ox + (B.X(p[0]) - x0) * this.px.k, y: this.px.oy + (B.Y(p[1]) - y0) * this.px.k };
  };
  A2.box = function () {
    if (!this.px) this.update(0);
    const r = this.el.getBoundingClientRect(), hr = this.stage.host.getBoundingClientRect();
    const l = r.left - hr.left, t = r.top - hr.top;
    return { l, r: l + r.width, t, b: t + r.height, cx: l + r.width / 2, cy: t + r.height / 2, w: r.width, h: r.height };
  };
  A2.hit = AP.hit;
  A2.mood = function (m) {
    this.el.classList.toggle("sick", m === "sick" || m === "pain");
  };
  A2.sick = function () {};
  const css = (el, c) => {
    el.classList.remove(c);
    void el.offsetWidth;
    el.classList.add(c);
  };
  A2.react = function () {
    css(this.el, "squish");
  };
  A2.poke = A2.react;
  A2.bump = function () {};
  A2.glow = function () {};
  A2.happy = function () {
    css(this.el, "hop");
  };
  A2.hop = A2.happy;
  A2.wave = function () {};
  A2.hug = function (on) {
    if (on) css(this.el, "squish");
  };
  A2.local = AP.local;
  A2.dispose = function () {
    const st = this.stage;
    st.updaters = st.updaters.filter((f) => f !== this._up);
    this.el.remove();
  };
})();

;

/* ==== js/games/_shared/doll-follow.js ==== */
/* =====================================================================
   인형 따라가기 (공용) — 2D 그림(도구·악기·스티커·증상 꾸밈)을 인형의 부위 기준점에 붙여 매 장면 따라가게
   - 바깥 껍데기(cls, 기본 dfT)만 옮김 → 안쪽 그림은 회전·톡 튀기 같은 자기 효과를 마음대로 써도 됨
   - dx·dy 는 인형 화면 키(dh) 비율 → 기기 크기·인형 크기가 달라도 같은 자리
   const fw = KP.dollFollow(layer, act, { cls })
     fw.add(el, 부위, dx, dy, rot) → o (o.nm·o.dx·o.dy·o.rot 은 나중에 바꿔도 됨) · fw.find(el) · fw.remove(el)(따라가기만 멈춤)
     fw.kill(el)(지우기) · fw.update() 매 장면 (dh 를 돌려줌) · fw.clear()
===================================================================== */
"use strict";
(function () {
  KP.css(
    "dollFollow",
    `.dfT{position:absolute;left:0;top:0;pointer-events:none;will-change:transform}
     .dfT>*{position:relative;display:block}`
  );
  KP.dollFollow = function (layer, act, opt = {}) {
    const cls = opt.cls || "dfT";
    const list = [];
    const fw = {
      dh: 300,
      list,
      add(el, nm, dx = 0, dy = 0, rot = 0) {
        const w = KP.u.el("span", cls);
        w.appendChild(el);
        layer.appendChild(w);
        const o = { el: w, inner: el, nm, dx, dy, rot };
        list.push(o);
        if (act) fw.place(o);
        return o;
      },
      find(el) {
        return list.find((o) => o.inner === el || o.el === el) || null;
      },
      remove(el) {
        const i = list.findIndex((o) => o.inner === el || o.el === el);
        if (i >= 0) list.splice(i, 1);
      },
      kill(el) {
        const o = fw.find(el);
        fw.remove(el);
        (o ? o.el : el).remove();
      },
      clear() {
        list.splice(0).forEach((o) => o.el.remove());
      },
      place(o) {
        const p = act.anchor(o.nm), dh = fw.dh;
        o.el.style.transform = `translate(${p.x + o.dx * dh}px,${p.y + o.dy * dh}px) translate(-50%,-50%)` + (o.rot ? ` rotate(${o.rot}deg)` : "");
      },
      /** 매 장면: 인형 화면 키를 재고 붙은 것들을 옮김 */
      update() {
        fw.dh = Math.max(60, act.box().h);
        for (const o of list) fw.place(o);
        return fw.dh;
      },
    };
    return fw;
  };
})();

;

/* ==== js/games/_shared/face-crop.js ==== */
/* =====================================================================
   내 얼굴 사진 (공용) — 사진을 찍거나 골라서 얼굴만 동그랗게 맞춰 자르기
   const url = await KP.faceCrop.pick()   // 사진 고르기(기기가 '카메라/사진첩'을 물어봄) → 맞추기 화면 → JPEG dataURL(정사각형) / 취소면 null
   - 맞추기: 한 손가락으로 끌어 옮기기, 두 손가락으로 벌려 키우기, ➖ ➕ 버튼
   - 결과는 동그라미를 꼭 맞게 둘러싼 정사각형 (그릴 때 동그랗게 잘라 씀)
   - 사진은 이 기기 안에만 저장됨 (KP.db "photos") — 인터넷으로 보내지 않음
===================================================================== */
"use strict";
(function () {
  const OUT = 320; // 저장 크기(px)
  KP.css(
    "faceCrop",
    `.fcOv{position:fixed;inset:0;z-index:200;background:#1d2246;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
       padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));touch-action:none;user-select:none;-webkit-user-select:none}
     .fcTxt{color:#fff;font-size:clamp(18px,2.6vw,24px);text-align:center}
     .fcBox{position:relative;width:min(78vw,62vh);aspect-ratio:1;overflow:hidden;border-radius:24px;background:#000;touch-action:none}
     .fcBox img{position:absolute;left:0;top:0;transform-origin:0 0;max-width:none;pointer-events:none;will-change:transform}
     .fcRing{position:absolute;inset:8%;border-radius:50%;box-shadow:0 0 0 999px rgba(20,24,60,.62);border:4px solid #fff;pointer-events:none}
     .fcRow{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
     .fcRow .btn{min-width:64px}`
  );

  /** 파일 → Image (실패하면 null) */
  const loadFile = (file) =>
    new Promise((res) => {
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = rd.result;
      };
      rd.onerror = () => res(null);
      rd.readAsDataURL(file);
    });

  /** 사진 한 장 고르기 → File / 취소면 null */
  const pickFile = () =>
    new Promise((res) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "image/*";
      inp.style.display = "none";
      document.body.appendChild(inp);
      let done = false;
      const end = (f) => {
        if (done) return;
        done = true;
        inp.remove();
        res(f);
      };
      inp.addEventListener("cancel", () => end(null));
      // cancel 이벤트가 없는 기기: 창으로 돌아온 뒤에도 파일이 없으면 취소로 봄 (store.js pickPhotos 와 같은 방식)
      setTimeout(() => window.addEventListener("focus", () => setTimeout(() => !(inp.files && inp.files.length) && end(null), 3500), { once: true }), 300);
      inp.addEventListener("change", () => end((inp.files && inp.files[0]) || null));
      inp.click();
    });

  /** 맞추기 화면 → dataURL / 취소면 null */
  function crop(im) {
    return new Promise((res) => {
      const U = KP.u;
      const ov = U.el("div", "fcOv");
      const txt = U.el("div", "fcTxt", "얼굴이 동그라미 안에 꼭 맞게 옮겨 주세요");
      const box = U.el("div", "fcBox");
      const img = new Image();
      img.src = im.src;
      box.append(img, U.el("div", "fcRing"));
      const row = U.el("div", "fcRow");
      const bOut = U.btn(KP.E("➖"), "btn"),
        bIn = U.btn(KP.E("➕"), "btn"),
        bNo = U.btn(KP.E("✖") + " 그만", "btn"),
        bOk = U.btn(KP.E("✔️") + " 이 얼굴로", "btn primary");
      row.append(bOut, bIn, bNo, bOk);
      ov.append(txt, box, row);
      document.body.appendChild(ov);

      const B = () => box.clientWidth; // 상자 한 변(px)
      const iw = im.naturalWidth || im.width,
        ih = im.naturalHeight || im.height;
      // 처음: 사진 짧은 변이 동그라미(상자의 84%)를 꽉 채우게, 얼굴이 흔히 있는 위쪽(1/3)이 가운데 오게
      const minK = () => (B() * 0.84) / Math.min(iw, ih);
      let k = minK() * 1.15,
        x = 0,
        y = 0;
      const clampXY = () => {
        // 동그라미 안이 비지 않게 (사진이 동그라미 바깥으로 빠지지 않게)
        const b = B(),
          lo = b * 0.08,
          hi = b * 0.92;
        k = Math.max(minK(), Math.min(k, minK() * 6));
        x = Math.min(lo, Math.max(hi - iw * k, x));
        y = Math.min(lo, Math.max(hi - ih * k, y));
      };
      const show = () => {
        clampXY();
        img.style.transform = "translate(" + x + "px," + y + "px) scale(" + k + ")";
      };
      const centerOn = (fx, fy) => {
        x = B() / 2 - fx * iw * k;
        y = B() / 2 - fy * ih * k;
      };
      centerOn(0.5, ih > iw * 1.1 ? 0.36 : 0.45);
      show();
      const zoom = (f, cx = B() / 2, cy = B() / 2) => {
        const k0 = k;
        k = k * f;
        clampXY();
        const r = k / k0;
        x = cx - (cx - x) * r;
        y = cy - (cy - y) * r;
        show();
      };
      bIn.addEventListener("click", () => zoom(1.2));
      bOut.addEventListener("click", () => zoom(1 / 1.2));

      // 손가락: 하나는 옮기기, 둘은 키우기
      const pts = new Map();
      let last = null;
      const two = () => {
        const [a, b] = [...pts.values()];
        return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      };
      box.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        box.setPointerCapture(e.pointerId);
        const r = box.getBoundingClientRect();
        pts.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
        last = pts.size === 2 ? two() : null;
      });
      box.addEventListener("pointermove", (e) => {
        const p = pts.get(e.pointerId);
        if (!p) return;
        const r = box.getBoundingClientRect(),
          nx = e.clientX - r.left,
          ny = e.clientY - r.top;
        if (pts.size === 1) {
          x += nx - p.x;
          y += ny - p.y;
          p.x = nx;
          p.y = ny;
          show();
          return;
        }
        p.x = nx;
        p.y = ny;
        const t = two();
        if (last && last.d > 10) {
          x += t.cx - last.cx;
          y += t.cy - last.cy;
          zoom(t.d / last.d, t.cx, t.cy);
        }
        last = t;
      });
      const up = (e) => {
        pts.delete(e.pointerId);
        last = pts.size === 2 ? two() : null;
      };
      box.addEventListener("pointerup", up);
      box.addEventListener("pointercancel", up);
      const onResize = () => show();
      addEventListener("resize", onResize);

      const finish = (v) => {
        removeEventListener("resize", onResize);
        ov.remove();
        res(v);
      };
      bNo.addEventListener("click", () => finish(null));
      bOk.addEventListener("click", () => {
        // 동그라미(상자의 8%~92%)를 둘러싼 정사각형을 잘라 저장
        const b = B(),
          c = document.createElement("canvas");
        c.width = c.height = OUT;
        const g = c.getContext("2d");
        g.fillStyle = "#fff";
        g.fillRect(0, 0, OUT, OUT);
        const sx = (b * 0.08 - x) / k,
          sy = (b * 0.08 - y) / k,
          sw = (b * 0.84) / k;
        g.drawImage(im, sx, sy, sw, sw, 0, 0, OUT, OUT);
        let url = null;
        try {
          url = c.toDataURL("image/jpeg", 0.88);
        } catch (e) {}
        finish(url);
      });
    });
  }

  KP.faceCrop = {
    crop,
    async pick() {
      const f = await pickFile();
      if (!f) return null;
      const im = await loadFile(f);
      if (!im) {
        KP.toast && KP.toast("사진을 열지 못했어요. 다른 사진으로 해 주세요");
        return null;
      }
      return crop(im);
    },
  };
})();

;

/* ==== js/games/_shared/play-feedback.js ==== */
/* =====================================================================
   놀이 반응 (공용) — 입력 직후 눌림·소리, 닿은 자리의 작은 반짝·하트, 짧은 마무리
   - 정해진 시간(눌림 80~120ms, 반응 300~600ms, 마무리 0.8~1.2초)에 맞춘 작은 연출 모음
   - 소리는 KP.audio, 말은 KP.voice — 놀이를 나가면 ctx 타이머와 함께 정리되도록 ctx 를 넘기면 ctx.after 사용
   KP.pfx.press(el) · KP.pfx.burst(host, x, y, kind, n, ctx) · KP.pfx.ring(host, x, y, color, ctx)
   KP.pfx.hearts(host, x, y, n, ctx) · KP.pfx.sound(kind) · KP.pfx.float(host, x, y, html, cls, ms, ctx)
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  KP.css(
    "playFx",
    `.pfxPress{animation:pfxPress .11s ease-out}
     @keyframes pfxPress{50%{transform:scale(.9)}}
     .pfxP{position:absolute;pointer-events:none;line-height:1;z-index:20;left:0;top:0;will-change:transform,opacity}
     .pfxP.heart{font-size:var(--s,30px);animation:pfxUp 1.1s ease-out forwards}
     .pfxP.spark{width:var(--s,16px);height:var(--s,16px);border-radius:50%;background:radial-gradient(circle,#fff 0 25%,rgba(255,236,150,.95) 40%,rgba(255,200,80,0) 70%);animation:pfxOut .6s ease-out forwards}
     .pfxP.cool{width:var(--s,14px);height:var(--s,14px);border-radius:50%;background:radial-gradient(circle,#fff 0 30%,rgba(170,225,255,.95) 45%,rgba(120,200,255,0) 72%);animation:pfxOut .8s ease-out forwards}
     .pfxP.dust{width:var(--s,12px);height:var(--s,12px);border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 0 6px rgba(255,255,255,.9);animation:pfxOut .7s ease-out forwards}
     @keyframes pfxUp{0%{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.3);opacity:0}15%{opacity:1;transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(1.1)}100%{transform:translate(calc(var(--x) + var(--dx,0px)),calc(var(--y) - 90px)) translate(-50%,-50%) scale(1);opacity:0}}
     @keyframes pfxOut{0%{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.4);opacity:1}100%{transform:translate(calc(var(--x) + var(--dx,0px)),calc(var(--y) + var(--dy,0px))) translate(-50%,-50%) scale(1);opacity:0}}
     .pfxRing{position:absolute;left:0;top:0;width:var(--s,70px);height:var(--s,70px);border-radius:50%;border:5px solid var(--c,#ffc531);pointer-events:none;z-index:19;animation:pfxRing .55s ease-out forwards}
     @keyframes pfxRing{from{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.35);opacity:.95}to{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(1.35);opacity:0}}
     .pfxF{position:absolute;left:0;top:0;pointer-events:none;z-index:21;transform:translate(var(--x),var(--y)) translate(-50%,-50%)}`
  );
  const later = (ctx, ms, fn) => (ctx ? ctx.after(ms, fn) : setTimeout(fn, ms));
  const at = (el, x, y) => {
    el.style.setProperty("--x", x + "px");
    el.style.setProperty("--y", y + "px");
  };
  const P = (KP.pfx = {
    /** 눌림 (80~120ms 살짝 작아짐) */
    press(el) {
      if (el) U.replay(el, "pfxPress");
    },
    /** 닿은 자리 작은 입자: kind = heart | spark | cool | dust */
    burst(host, x, y, kind = "spark", n = 6, ctx) {
      for (let i = 0; i < n; i++) {
        const e = U.el("span", "pfxP " + kind, kind === "heart" ? KP.E(i % 2 ? "💖" : "❤️") : "");
        at(e, x + U.randf(-8, 8), y + U.randf(-8, 8));
        const a = (i / n) * Math.PI * 2 + U.randf(-0.3, 0.3), r = kind === "heart" ? 0 : U.randf(26, 56);
        e.style.setProperty("--dx", (kind === "heart" ? U.randf(-30, 30) : Math.cos(a) * r) + "px");
        e.style.setProperty("--dy", Math.sin(a) * r - (kind === "cool" ? 0 : 10) + "px");
        e.style.animationDelay = i * (kind === "heart" ? 90 : 25) + "ms";
        host.appendChild(e);
        later(ctx, 1300 + i * 90, () => e.remove());
      }
    },
    hearts(host, x, y, n = 4, ctx) {
      P.burst(host, x, y, "heart", n, ctx);
    },
    /** 닿은 자리 동그라미 퍼짐 (어디에 닿았는지 보여 줌) */
    ring(host, x, y, color, ctx, size) {
      const e = U.el("span", "pfxRing");
      at(e, x, y);
      if (color) e.style.setProperty("--c", color);
      if (size) e.style.setProperty("--s", size + "px");
      host.appendChild(e);
      later(ctx, 650, () => e.remove());
      return e;
    },
    /** 잠깐 떠 있는 그림·글자 (html) */
    float(host, x, y, html, cls = "", ms = 1200, ctx) {
      const e = U.el("span", "pfxF " + cls, html);
      at(e, x, y);
      host.appendChild(e);
      if (ms) later(ctx, ms, () => e.remove());
      return e;
    },
    move(el, x, y) {
      at(el, x, y);
    },
    /** 짧은 접촉 소리 */
    sound(kind) {
      const A = KP.audio;
      switch (kind) {
        case "touch":
          return A.note(U.pick(["C5", "E5", "G5"]), { inst: "marimba", dur: 0.2, vol: 0.18 });
        case "soft":
          return A.tone(260, { to: 420, dur: 0.12, vol: 0.12, type: "sine" });
        case "beep":
          return A.note("A6", { inst: "square", dur: 0.08, vol: 0.08 });
        case "thump":
          return A.tone(90, { to: 60, dur: 0.12, vol: 0.3, type: "sine" });
        case "cool":
          return A.noise({ dur: 0.4, vol: 0.1, bp: 3000, bpTo: 1800, q: 1.5 });
        case "sip":
          return A.noise({ bp: 1200, bpTo: 600, q: 1, dur: 0.45, vol: 0.12 });
        case "squish":
          return A.tone(330, { to: 200, dur: 0.14, vol: 0.14, type: "triangle" });
        default:
          return A.sfx(kind);
      }
    },
  });
})();

;

/* ==== js/games/_shared/sampler.js ==== */
/* =====================================================================
   🎻 샘플 재생기 (공용) — 실제 악기 녹음(assets/sounds, 오프라인 저장됨)을 음 높이 맞춰 재생
   - 악기마다 몇 개 음만 들어 있음 → 가장 가까운 음을 골라 playbackRate 로 음 높이 보정
   - 미리 불러와 디코딩해 두고(악기 묶음 단위) 같은 소리를 여러 번 겹쳐 재생 (동시에 많은 소리)
   - 오디오 컨텍스트·음량은 KP.audio 것을 그대로 씀(효과음 음량). 화면을 나가면 KP.audio.newScene 으로 같이 끊기고,
     stopAll() 로 바로 멈출 수도 있음
   - 못 불러온 악기는 ok(kit) 가 false → 놀이가 KP.audio 합성음으로 대신 냄
   - 소리 파일·출처: tools/make-sounds.js, assets/sounds/LICENSES.md (목록을 바꾸면 여기 KITS 도 같이)

   KP.sampler.load(["drums","piano"]) → Promise({ok:[...], fail:[...]})
   KP.sampler.ok("piano")
   KP.sampler.note("piano", "C4" | 60, { when, vol, dur, rel })   // when: 지금부터 몇 초 뒤 (KP.audio 와 같음)
   KP.sampler.hit("drums", "kick", { when, vol, rate, dur })       // 음 높이 없는 소리
   KP.sampler.stopAll()
===================================================================== */
"use strict";
(function () {
  const B = "assets/sounds/";
  // notes: 녹음된 실제 음(미디 번호) → 파일 / hits: 이름 → 파일 / rel: 놓은 뒤 사라지는 시간(초)
  const KITS = {
    drums: { base: B + "drums/", hits: { kick: "kick.mp3", kick2: "kick2.mp3", snare: "snare.mp3", snareSoft: "snare-soft.mp3", hat: "hat.mp3", hatOpen: "hat-open.mp3", crash: "crash.mp3" } },
    tamb: { base: B + "tamb/", hits: { hit: "hit.mp3", shake: "shake.mp3" } },
    shaker: { base: B + "shaker/", hits: { down: "down.mp3", up: "up.mp3" } },
    xylo: { base: B + "xylo/", notes: { 67: "G4.mp3", 72: "C5.mp3", 79: "G5.mp3", 84: "C6.mp3", 91: "G6.mp3" }, rel: 0.15 },
    piano: { base: B + "piano/", notes: { 48: "C3.mp3", 54: "Fs3.mp3", 60: "C4.mp3", 66: "Fs4.mp3", 72: "C5.mp3", 78: "Fs5.mp3" }, rel: 0.25 },
    guitar: { base: B + "guitar/", notes: { 43: "G2.mp3", 48: "C3.mp3", 52: "E3.mp3", 56: "Ab3.mp3", 60: "C4.mp3", 64: "E4.mp3", 68: "Ab4.mp3" }, rel: 0.2 },
    choir: { base: B + "choir/", notes: { 60: "C4.mp3", 64: "E4.mp3", 68: "Ab4.mp3", 72: "C5.mp3" }, rel: 0.35 },
  };
  const bufs = {}; // url → {buf, off} (off: 앞 무음 건너뛸 초)
  const kitState = {}; // kit → "loading" | "ok" | "fail"
  const kitWait = {}; // kit → Promise
  const voices = new Set();
  const MAXV = 40; // 동시에 너무 많으면 오래된 소리부터 끔 (저가 기기)
  let errors = [];

  const midiOf = (n) => (typeof n === "number" ? n : KP.audio.midiOf(n));
  const decode = (c, ab) =>
    new Promise((res, rej) => {
      // 옛 Safari 는 콜백 방식만 됨 → 둘 다 받음
      const p = c.decodeAudioData(ab, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  /** mp3 앞에 붙는 인코더 지연(약 25ms, 브라우저마다 다름)을 디코딩한 소리에서 직접 찾아 건너뜀 → 모든 소리가 박자에 딱 맞게 */
  function leadOf(buf) {
    const d = buf.getChannelData(0), n = Math.min(d.length, Math.floor(buf.sampleRate * 0.12));
    for (let i = 0; i < n; i++) if (Math.abs(d[i]) > 0.004) return Math.max(0, i / buf.sampleRate - 0.002);
    return 0;
  }
  async function loadOne(c, url) {
    if (bufs[url]) return bufs[url];
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status + " " + url);
    const buf = await decode(c, await r.arrayBuffer());
    return (bufs[url] = { buf, off: leadOf(buf) });
  }
  function filesOf(k) {
    const K = KITS[k];
    return Object.values(K.notes || K.hits).map((f) => K.base + f);
  }

  const S = (KP.sampler = {
    KITS,
    /** 악기 묶음들을 불러옴 (이미 불러온 건 바로) */
    load(kits) {
      const c = KP.audio.ctx();
      if (!c) return Promise.resolve({ ok: [], fail: kits.slice() });
      return Promise.all(
        kits.map((k) => {
          if (!KITS[k]) return Promise.resolve([k, false]);
          if (kitState[k] === "ok") return Promise.resolve([k, true]);
          if (kitState[k] !== "loading") {
            kitState[k] = "loading";
            kitWait[k] = Promise.all(filesOf(k).map((u) => loadOne(c, u)))
              .then(() => (kitState[k] = "ok"))
              .catch((e) => {
                kitState[k] = "fail"; // 다음에 다시 시도
                errors.push(String((e && e.message) || e));
                console.warn("소리 샘플을 못 불러왔어요", k, e && e.message);
              });
          }
          return kitWait[k].then(() => [k, kitState[k] === "ok"]);
        })
      ).then((rs) => ({ ok: rs.filter((r) => r[1]).map((r) => r[0]), fail: rs.filter((r) => !r[1]).map((r) => r[0]) }));
    },
    ok(k) {
      return kitState[k] === "ok";
    },
    /** 음 하나: 가장 가까운 녹음 음을 골라 음 높이 보정. 성공하면 true (못 내면 false → 합성음으로 대신) */
    note(k, n, o = {}) {
      const K = KITS[k];
      if (!K || !K.notes || kitState[k] !== "ok") return false;
      const m = midiOf(n);
      let best = null, bd = 1e9;
      for (const s in K.notes) {
        const d = Math.abs(m - s);
        if (d < bd || (d === bd && +s > m)) (bd = d), (best = +s); // 같으면 위 음을 내려서 (내린 소리가 덜 탁함)
      }
      return play(K.base + K.notes[best], Math.pow(2, (m - best) / 12), o, o.rel != null ? o.rel : K.rel);
    },
    /** 음 높이 없는 소리 (북·탬버린 …) — rate 로 살짝 음색 바꾸기 가능 */
    hit(k, name, o = {}) {
      const K = KITS[k];
      if (!K || !K.hits || !K.hits[name] || kitState[k] !== "ok") return false;
      return play(K.base + K.hits[name], o.rate || 1, o, o.rel != null ? o.rel : 0.08);
    },
    stopAll() {
      const c = KP.audio.ctx && KP.audio.ctx();
      for (const v of voices) {
        try {
          if (c) {
            v.g.gain.cancelScheduledValues(c.currentTime);
            v.g.gain.setTargetAtTime(0, c.currentTime, 0.02);
          }
          v.s.stop(c ? c.currentTime + 0.08 : 0);
        } catch (e) {}
      }
      voices.clear();
    },
    /** 점검용 */
    stats() {
      return { kits: Object.assign({}, kitState), files: Object.keys(bufs).length, voices: voices.size, errors: errors.slice() };
    },
  });

  function play(url, rate, o, rel) {
    const b = bufs[url], c = KP.audio.ctx(), dest = KP.audio.dest(o.bus);
    if (!b || !c || !dest) return false;
    if (voices.size >= MAXV) {
      // 가장 먼저 시작한 소리를 살짝 줄이며 끔
      const v = voices.values().next().value;
      voices.delete(v);
      try {
        v.g.gain.setTargetAtTime(0, c.currentTime, 0.015);
        v.s.stop(c.currentTime + 0.06);
      } catch (e) {}
    }
    const t = c.currentTime + Math.max(0, o.when || 0);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = b.buf;
    s.playbackRate.value = rate;
    const vol = o.vol == null ? 0.5 : o.vol;
    g.gain.setValueAtTime(vol, t);
    const len = (b.buf.duration - b.off) / rate; // 실제로 울리는 길이
    let end = t + len;
    if (o.dur && o.dur < len) {
      // 놓기: dur 뒤에 rel 동안 부드럽게 줄임
      const r = Math.max(0.03, rel);
      g.gain.setValueAtTime(vol, t + o.dur);
      g.gain.setTargetAtTime(0.0001, t + o.dur, r / 3);
      end = Math.min(end, t + o.dur + r + 0.05);
    }
    s.connect(g);
    g.connect(dest);
    s.start(t, b.off);
    s.stop(end + 0.02);
    const v = { s, g };
    voices.add(v);
    s.onended = () => {
      voices.delete(v);
      try {
        g.disconnect();
      } catch (e) {}
    };
    return true;
  }
})();
