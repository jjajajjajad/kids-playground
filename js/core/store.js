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
    all: (s) =>
      tx(s, "readonly", (os) => os.getAll())
        .then((a) => (a || []).sort((x, y) => (x.t || 0) - (y.t || 0)))
        .catch(() => []),
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
      for (const s of STORES) data.db[s] = await KP.db.all(s);
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const a = document.createElement("a");
      const d = new Date();
      const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
      const name = "아이놀이터_백업_" + stamp + ".json";
      // iPad·iPhone 홈 화면 앱에서는 다운로드가 잘 안 되므로 '공유' 창(파일에 저장, 카톡 등)을 우선 사용
      try {
        const file = new File([blob], name, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "아이 놀이터 백업" });
          return;
        }
      } catch (e) {
        if (e && e.name === "AbortError") return; // 사용자가 취소
      }
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 60000);
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
              if (!data || data.app !== "kids-playground") return res(false);
              // 받아들일 값만 골라서 넣기 (조작된 파일 방어)
              const okKey = (k) => /^(settings|stickers|lastSticker|winCount|usage|lastGame)$/.test(k) || /^lv:[a-z0-9]+$/.test(k) || /^[a-z0-9]+:[\w:-]{1,40}$/.test(k);
              Object.entries(data.local && typeof data.local === "object" ? data.local : {}).forEach(([k, v]) => {
                if (okKey(k) && v !== null && JSON.stringify(v).length < 200000) store.set(k, v);
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
                  await KP.db.put(s, clean);
                }
              }
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
