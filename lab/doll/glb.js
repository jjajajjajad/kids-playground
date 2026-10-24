/* 아주 작은 GLB 읽기 (한 메시·한 프리미티브, 압축 없음) — GLTFLoader 를 들이지 않으려고 직접 읽음
   models/<종>.glb 는 lab/doll/pipeline/clean.js 가 만든 파일: POSITION, NORMAL, _AO(정점 그늘, 0~255) */
const CT = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
export async function loadGLB(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("모델을 못 읽었어요: " + url);
  const buf = await r.arrayBuffer();
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("GLB 가 아니에요");
  const jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const binOff = 20 + jl + 8;
  const acc = (i) => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView];
    const T = CT[a.componentType], n = a.count * NC[a.type];
    const s = binOff + (bv.byteOffset || 0) + (a.byteOffset || 0);
    return new T(buf.slice(s, s + n * T.BYTES_PER_ELEMENT));
  };
  const p = json.meshes[0].primitives[0];
  const out = { index: acc(p.indices), extras: json.meshes[0].extras || {} };
  for (const k in p.attributes) out[k] = acc(p.attributes[k]);
  return out;
}
