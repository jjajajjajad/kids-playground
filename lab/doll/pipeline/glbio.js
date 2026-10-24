// 아주 작은 GLB 읽기/쓰기 (한 메시, 한 프리미티브)
const fs = require("fs");
const CT = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
exports.read = (f) => {
  const b = fs.readFileSync(f);
  const L = b.readUInt32LE(12);
  const j = JSON.parse(b.slice(20, 20 + L));
  const binOff = 20 + L + 8;
  const bin = b.buffer.slice(b.byteOffset + binOff, b.byteOffset + b.length);
  const acc = (i) => {
    const a = j.accessors[i], bv = j.bufferViews[a.bufferView];
    const T = CT[a.componentType], n = a.count * NC[a.type];
    const s = (bv.byteOffset || 0) + (a.byteOffset || 0);
    return new T(bin.slice(s, s + n * T.BYTES_PER_ELEMENT));
  };
  const p = j.meshes[0].primitives[0];
  const out = { index: acc(p.indices), extras: j.meshes[0].extras };
  for (const k in p.attributes) out[k] = acc(p.attributes[k]);
  return out;
};
// attrs: {NAME: [TypedArray, "VEC3"]}; index Uint16/32
exports.write = (f, attrs, index, extras = {}) => {
  const views = [], accessors = [], parts = [];
  let off = 0;
  const add = (arr, type, target, minmax, norm) => {
    const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    const pad = (4 - (buf.length % 4)) % 4;
    views.push({ buffer: 0, byteOffset: off, byteLength: buf.length, target });
    parts.push(buf, Buffer.alloc(pad));
    off += buf.length + pad;
    const ct = arr instanceof Float32Array ? 5126 : arr instanceof Uint32Array ? 5125 : arr instanceof Uint16Array ? 5123 : 5121;
    const a = { bufferView: views.length - 1, componentType: ct, count: arr.length / NC[type], type };
    if (norm) a.normalized = true;
    if (minmax) {
      const n = NC[type], mn = Array(n).fill(Infinity), mx = Array(n).fill(-Infinity);
      for (let i = 0; i < arr.length; i++) { const k = i % n; mn[k] = Math.min(mn[k], arr[i]); mx[k] = Math.max(mx[k], arr[i]); }
      a.min = mn; a.max = mx;
    }
    accessors.push(a);
    return accessors.length - 1;
  };
  const ii = add(index, "SCALAR", 34963);
  const at = {};
  for (const k in attrs) {
    const [arr, type] = attrs[k];
    at[k] = add(arr, type, 34962, k === "POSITION", arr instanceof Uint8Array);
  }
  const json = {
    asset: { version: "2.0", generator: "kids-playground lab/doll (tools/out/doll/clean.js)" },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: "dog", mesh: 0 }],
    meshes: [{ name: "dog", primitives: [{ attributes: at, indices: ii, mode: 4 }], extras }],
    accessors, bufferViews: views, buffers: [{ byteLength: off }],
  };
  let js = Buffer.from(JSON.stringify(json));
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const bin = Buffer.concat(parts);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const ch = (len, t) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(t, 4); return h; };
  fs.writeFileSync(f, Buffer.concat([head, ch(js.length, 0x4e4f534a), js, ch(bin.length, 0x004e4942), bin]));
};
