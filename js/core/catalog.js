/* =====================================================================
   홈 화면에 보이는 놀이 순서 (카테고리 안에서 이 순서대로)
   여기에 없는 놀이는 각 카테고리 맨 뒤에 붙는다.
===================================================================== */
"use strict";
(function (KP) {
  KP.ORDER_HINT = [
    // 신나는 놀이
    "firework", "balloon", "bubble", "mole", "fish", "fruit", "rocket", "race", "egg", "peekaboo", "light", "colorpop", "candle", "croc", "rps",
    // 만들기
    "zoo", "zoopaint", "draw", "wipe", "paintbook", "face", "icecream", "grow",
    // 음악
    "piano", "xylo", "drum", "musicbox", "simon", "inst",
    // 똑똑 놀이
    "count", "color", "shape", "animals", "listen", "feed", "odd", "shadow", "size", "more", "memory", "dots", "numbers", "hangul", "abc", "mix", "candy",
    // 형아 도전
    "maze", "jigsaw", "sorter", "trace", "dotdot", "pattern", "sort", "missing", "sequence", "train", "connect", "spatial", "emotion", "dress",
  ];
  KP.sortGames = function () {
    const idx = (id) => {
      const i = KP.ORDER_HINT.indexOf(id);
      return i < 0 ? 9999 : i;
    };
    KP.ORDER.sort((a, b) => idx(a) - idx(b));
  };
})(window.KP);
