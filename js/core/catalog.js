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
