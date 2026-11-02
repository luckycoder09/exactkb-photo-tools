
let curImg=null, curFile=null, curBlob=null, targetKB=50;
function fmtKB(b){return (b/1024).toFixed(1)+' KB'}
function setTarget(kb, el){
  targetKB=kb;
  document.querySelectorAll('.preset').forEach(p=>p.classList.remove('active'));
  if(el) el.classList.add('active');
  const sel=document.getElementById('targetKB'); if(sel) sel.value=String(kb);
}
function handleFile(file){
  if(!file) return;
  if(!file.type.startsWith('image/')){ showErr('Please choose an image file (JPG or PNG).'); return; }
  curFile=file;
  const url=URL.createObjectURL(file);
  const img=new Image();
  img.onload=()=>{
    curImg=img;
    const pw=document.getElementById('previewWrap'); if(pw) pw.classList.add('show');
    const pv=document.getElementById('preview'); if(pv) pv.src=url;
    const m=document.getElementById('origMeta'); if(m) m.innerHTML='Original: <b>'+fmtKB(file.size)+'</b> &nbsp;|&nbsp; '+img.width+' x '+img.height+' px &nbsp;|&nbsp; '+file.name;
    const r=document.getElementById('result'); if(r){r.classList.remove('show');}
  };
  img.src=url;
}
function showErr(msg){
  const r=document.getElementById('result'); r.className='result show err'; r.innerHTML='<strong>Could not do that.</strong> '+msg;
}
function showMsg(msg){
  const r=document.getElementById('result'); r.className='result show'; r.innerHTML=msg;
}
async function canvasBlob(canvas,q){ return new Promise(res=>canvas.toBlob(b=>res(b),'image/jpeg',q)); }
async function runResize(){
  if(!curImg){ showErr('Choose a photo first, using the box above.'); return; }
  const btn=document.getElementById('goBtn'); btn.disabled=true; btn.textContent='Resizing…';
  showMsg('Working in your browser… your photo is not uploaded anywhere.');
  await new Promise(r=>setTimeout(r,30));
  try{
    const maxW=parseInt((document.getElementById('maxW')||{value:'2000'}).value,10);
    const scale=Math.min(1, maxW/curImg.width);
    let w=Math.round(curImg.width*scale), h=Math.round(curImg.height*scale), best=null;
    for(let attempt=0; attempt<28; attempt++){
      const c=document.createElement('canvas'); c.width=w; c.height=h;
      const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(curImg,0,0,w,h);
      for(const q of [0.92,0.85,0.78,0.70,0.60,0.50,0.40]){
        const b=await canvasBlob(c,q); best=b;
        if(b.size <= targetKB*1024){ finishResize(b,w,h,false); btn.disabled=false; btn.textContent='Resize photo'; return; }
      }
      w=Math.round(w*0.88); h=Math.round(h*0.88); if(w<80||h<80) break;
    }
    finishResize(best,w,h,true);
  }catch(e){ showErr('Something went wrong with this image. Try a different photo or a JPEG file.'); }
  btn.disabled=false; btn.textContent='Resize photo';
}
function finishResize(blob,w,h,over){
  curBlob=blob; const url=URL.createObjectURL(blob);
  const saved=Math.max(0, Math.round((1-blob.size/curFile.size)*100));
  const pct=Math.min(100, Math.round(blob.size/(targetKB*1024)*100));
  showMsg('<strong>Done. Your resized photo is ready.</strong><br>Before: '+fmtKB(curFile.size)+' &nbsp;→&nbsp; After: <b>'+fmtKB(blob.size)+'</b> &nbsp;|&nbsp; '+w+' x '+h+' px &nbsp;|&nbsp; Saved about '+saved+'%<div class="bar"><i style="width:'+pct+'%"></i></div>'+(over?'<p class="small">This is the smallest practical size at this quality. Try a larger target, or a smaller original photo.</p>':'')+'<a href="'+url+'" download="'+(curFile.name.replace(/\.[^.]+$/,'')+'-'+targetKB+'kb.jpg')+'"><button type="button" class="btn" style="margin-top:8px">Download resized photo</button></a><p class="small" style="margin-top:10px">Check the downloaded size before uploading it to your form. Processed only in your browser.</p>');
  const pv=document.getElementById('preview'); if(pv){ /* keep original preview, result is the download */ }
}
function runPassport(mode){
  if(!curImg){ showErr('Choose a photo first, using the box above.'); return; }
  const ratio = mode==='2x2' ? 1 : 35/45;
  const ow=curImg.width, oh=curImg.height; let cw,ch;
  if(ow/oh > ratio){ ch=oh; cw=Math.round(oh*ratio); } else { cw=ow; ch=Math.round(ow/ratio); }
  const sx=Math.round((ow-cw)/2), sy=Math.round((oh-ch)/2);
  const tw = mode==='2x2' ? 600 : 413, th = mode==='2x2' ? 600 : 531;
  const c=document.createElement('canvas'); c.width=tw; c.height=th;
  const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,tw,th); ctx.drawImage(curImg,sx,sy,cw,ch,0,0,tw,th);
  c.toBlob(b=>{
    const url=URL.createObjectURL(b);
    showMsg('<strong>Done. Your passport photo is ready.</strong><br>'+tw+' x '+th+' px ('+(mode==='2x2'?'2 x 2 inch':'35 x 45 mm')+')<br><img src="'+url+'" alt="Cropped passport preview" style="max-width:220px;border:1px solid #e2e8f0;border-radius:12px;margin-top:10px"><br><a href="'+url+'" download="passport-photo.jpg"><button type="button" class="btn" style="margin-top:10px">Download passport photo</button></a><p class="small" style="margin-top:10px">Centre-cropped. For official use, also check background, lighting, and head-size rules for your application.</p>');
  },'image/jpeg',0.92);
}
document.addEventListener('DOMContentLoaded',()=>{
  const drop=document.getElementById('drop'); const inp=document.getElementById('fileInput');
  if(drop && inp){
    drop.addEventListener('click',()=>inp.click());
    drop.addEventListener('dragover',e=>{e.preventDefault(); drop.classList.add('drag');});
    drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
    drop.addEventListener('drop',e=>{e.preventDefault(); drop.classList.remove('drag'); handleFile(e.dataTransfer.files[0]);});
    inp.addEventListener('change',()=>handleFile(inp.files[0]));
  }
});
