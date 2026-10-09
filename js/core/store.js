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

  const store = (KP.store = {
    ok: true,
    get(k, def) {
      try {
        const v = localStorage.getItem(PFX + k);
        return v == null ? (k in mem ? mem[k] : def) : JSON.parse(v);
      } catch (e) {
        return k in mem ? mem[k] : def;
      }
    },
    set(k, v) {
      mem[k] = v;
      try {
        localStorage.setItem(PFX + k, JSON.stringify(v));
        return true;
      } catch (e) {
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
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) {
        rej(e);
      }
    });
    return dbp;
  }
  function tx(s, mode, fn) {
    return open().then(
      (db) =>
        new Promise((res, rej) => {
          const t = db.transaction(s, mode);
          const os = t.objectStore(s);
          const r = fn(os);
          t.oncomplete = () => res(r && r.result);
          t.onerror = () => rej(t.error);
        })
    );
  }
  KP.db = {
    /** 항목 저장: {id, ...} */
    put: (s, obj) => tx(s, "readwrite", (os) => os.put(obj)).catch(() => false),
    get: (s, id) => tx(s, "readonly", (os) => os.get(id)).catch(() => null),
    del: (s, id) => tx(s, "readwrite", (os) => os.delete(id)).catch(() => false),
    /** 전체 목록 (등록 순) */
    all: (s) =>
      tx(s, "readonly", (os) => os.getAll())
        .then((a) => (a || []).sort((x, y) => (x.t || 0) - (y.t || 0)))
        .catch(() => []),
    clear: (s) => tx(s, "readwrite", (os) => os.clear()).catch(() => false),
  };
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
      }, 1500), { once: true }), 300);
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
      for (const s of STORES) data.db[s] = await KP.db.all(s);
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const a = document.createElement("a");
      const d = new Date();
      const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
      a.href = URL.createObjectURL(blob);
      a.download = "아이놀이터_백업_" + stamp + ".json";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 2000);
    },
    import() {
      return new Promise((res) => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = "application/json,.json";
        inp.style.display = "none";
        document.body.appendChild(inp);
        inp.addEventListener("change", () => {
          const f = inp.files && inp.files[0];
          inp.remove();
          if (!f) return res(false);
          const rd = new FileReader();
          rd.onload = async () => {
            try {
              const data = JSON.parse(rd.result);
              if (data.app !== "kids-playground") return res(false);
              Object.entries(data.local || {}).forEach(([k, v]) => store.set(k, v));
              for (const s of STORES) for (const it of (data.db && data.db[s]) || []) await KP.db.put(s, it);
              res(true);
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
