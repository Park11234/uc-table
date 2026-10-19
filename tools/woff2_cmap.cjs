/* WOFF2 글꼴의 글자표(cmap)에서 글자 목록을 읽는다(v1.12.0). 추가 패키지 없이 Node 내장 brotli만 쓴다.
   WOFF2: 머리(48바이트) → 표 목록(UIntBase128 길이) → 모든 표를 한 번에 brotli로 압축한 덩어리. cmap은 변환되지 않은 채 들어 있다.
   cmap 하위 표 형식 4(BMP)·12(전체)를 읽어, 글리프가 0이 아닌 글자만 모은다.
     node tools/woff2_cmap.cjs src/brand/uc-table-sans.woff2        글자 수 */
const fs=require('fs'), zlib=require('zlib');
function woff2Chars(buf){
  if(buf.readUInt32BE(0)!==0x774F4632) throw new Error('WOFF2 아님');
  const numTables=buf.readUInt16BE(12), totalCompressed=buf.readUInt32BE(20);
  const TAGS=["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill"];
  let o=48; const ub128=()=>{let v=0; for(let i=0;i<5;i++){const b=buf[o++]; v=(v*128)+(b&0x7f); if(!(b&0x80)) return v} throw new Error('ub128')};
  const tabs=[];
  for(let i=0;i<numTables;i++){const flags=buf[o++]; let tag; if((flags&0x3f)===0x3f){tag=buf.toString('latin1',o,o+4); o+=4} else tag=TAGS[flags&0x3f];
    const ver=(flags>>6)&3; const orig=ub128(); let len=orig;
    const transformed=(tag==='glyf'||tag==='loca')?ver!==3:ver!==0; if(transformed) len=ub128();
    tabs.push({tag,len})}
  const data=zlib.brotliDecompressSync(buf.subarray(o,o+totalCompressed));
  let off=0, cmap=null; for(const t of tabs){ if(t.tag==='cmap') cmap=data.subarray(off,off+t.len); off+=t.len }
  if(!cmap) throw new Error('cmap 없음');
  const n=cmap.readUInt16BE(2); const set=new Set();
  for(let i=0;i<n;i++){const sub=cmap.readUInt32BE(4+i*8+4); const fmt=cmap.readUInt16BE(sub);
    if(fmt===4){const segX2=cmap.readUInt16BE(sub+6), seg=segX2/2, ends=sub+14, starts=ends+segX2+2, deltas=starts+segX2, ranges=deltas+segX2;
      for(let s=0;s<seg;s++){const end=cmap.readUInt16BE(ends+s*2), start=cmap.readUInt16BE(starts+s*2), delta=cmap.readInt16BE(deltas+s*2), ro=cmap.readUInt16BE(ranges+s*2);
        for(let c=start;c<=end&&c!==0xFFFF;c++){let g; if(ro===0) g=(c+delta)&0xFFFF; else {const gi=ranges+s*2+ro+(c-start)*2; g=cmap.readUInt16BE(gi); if(g) g=(g+delta)&0xFFFF} if(g) set.add(c)}}}
    else if(fmt===12){const ng=cmap.readUInt32BE(sub+12); for(let k=0;k<ng;k++){const b=sub+16+k*12, st=cmap.readUInt32BE(b), en=cmap.readUInt32BE(b+4), g0=cmap.readUInt32BE(b+8); for(let c=st;c<=en;c++) if(g0+(c-st)) set.add(c)}}}
  return set}
module.exports={woff2Chars};
if(require.main===module) console.log('글자 수', woff2Chars(fs.readFileSync(process.argv[2])).size);
