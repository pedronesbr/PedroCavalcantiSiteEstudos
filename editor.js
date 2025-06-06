(function(){
  const editor = document.getElementById('editor');
  const exec = (cmd,val=null)=>{editor.focus();document.execCommand(cmd,false,val);};
  document.execCommand('styleWithCSS', false, true);

  let disc = 'Geral';
  let sub  = '00';
  let storageKey = `summary_${disc}_${sub}`;
  const storage = localStorage;

  function loadContent(){
    const saved = storage.getItem(storageKey);
    editor.innerHTML = saved ? saved : '<p></p>';
    editor.querySelectorAll('.hidden-text').forEach(span=>{
      span.classList.remove('revealed');
      span.onclick=()=>span.classList.toggle('revealed');
    });
    editor.querySelectorAll('.tarja').forEach(t=>t.style.backgroundColor='rgba(0,0,0,.95)');
    editor.querySelectorAll('img').forEach(makeResizable);
  }

  window.editorSetContext = function(d,s){
    disc = d || 'Geral';
    sub  = s || '00';
    storageKey = `summary_${disc}_${sub}`;
    loadContent();
  };
  window.editorSaveNow = function(){ storage.setItem(storageKey, editor.innerHTML); };

  const palette = document.getElementById('palette');
  const defaultColors=["#ffffff","#BF5BF3","#FF443B","#FF9F0C","#FFD60C","#0C84FE","#2DD158","#8E8D92"];
  const saveSel = ()=>{const s=window.getSelection();if(s.rangeCount)savedRange=s.getRangeAt(0).cloneRange();};
  const restoreSel=()=>{if(!savedRange)return;const s=window.getSelection();s.removeAllRanges();s.addRange(savedRange);} ;
  let savedRange=null;
  defaultColors.forEach(c=>{
    const sw=document.createElement('div');
    sw.className='swatch';sw.style.background=c;sw.dataset.color=c;
    let hold=null;
    sw.addEventListener('click',()=>{restoreSel();exec('foreColor',sw.dataset.color);palette.classList.remove('show');});
    sw.addEventListener('mousedown',()=>{hold=setTimeout(()=>{
      const novo=prompt('Hex (#rrggbb ou #rgb):',sw.dataset.color);
      if(novo && /^#([\da-f]{3}|[\da-f]{6})$/i.test(novo)){sw.style.background=novo;sw.dataset.color=novo;restoreSel();exec('foreColor',novo);palette.classList.remove('show');}
    },1000);});
    ['mouseup','mouseleave'].forEach(ev=>sw.addEventListener(ev,()=>clearTimeout(hold)));
    palette.appendChild(sw);
  });
  const colorBtn=document.getElementById('colorBtn');
  colorBtn.onclick = () => {
    if (palette.classList.contains('show')) {
      palette.classList.remove('show');
    } else {
      saveSel();
      const { left, bottom } = colorBtn.getBoundingClientRect();
      palette.style.left = `${left}px`;
      palette.style.top  = `${bottom}px`;
      palette.classList.add('show');
    }
  };
  document.addEventListener('click',e=>{if(!palette.contains(e.target)&&e.target!==colorBtn)palette.classList.remove('show');});

  const boldBtn=document.getElementById('boldBtn');
  const italicBtn=document.getElementById('italicBtn');
  const underlineBtn=document.getElementById('underlineBtn');
  const undoBtn=document.getElementById('undoBtn');
  const redoBtn=document.getElementById('redoBtn');
  const backBtn=document.getElementById('summaryBackBtn');
  const hideBtn=document.getElementById('hideBtn');
  const clearBtn=document.getElementById('clearBtn');
  const insertImgBtn=document.getElementById('insertImgBtn');
  const fileInput=document.getElementById('fileInput');
  const insertBtn=document.getElementById('insertBtn');
  const concluirBtn=document.getElementById('concluirBtn');
  const deleteTarjaBtn=document.getElementById('deleteTarjaBtn');
  const message=document.getElementById('message');

  backBtn.onclick      = ()=>{ closeSummary(); };
  boldBtn.onclick      = ()=>exec('bold');
  italicBtn.onclick    = ()=>exec('italic');
  underlineBtn.onclick = ()=>exec('underline');
  undoBtn.onclick      = ()=>exec('undo');
  redoBtn.onclick      = ()=>exec('redo');

  editor.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();
    if(e.ctrlKey && !e.shiftKey && k==='z'){exec('undo');e.preventDefault();}
    if(e.ctrlKey && (k==='y'||(e.shiftKey&&k==='z'))){exec('redo');e.preventDefault();}
  });

  hideBtn.onclick = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const commonAnc = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    const toReveal = Array.from(commonAnc.querySelectorAll('.hidden-text')).filter(span => range.intersectsNode(span));
    if (toReveal.length) { toReveal.forEach(span => { span.replaceWith(...span.childNodes); }); return; }
    const startParent = range.startContainer.parentNode;
    if (startParent.nodeType === 1 && startParent.classList.contains('hidden-text')) { startParent.replaceWith(...startParent.childNodes); return; }
    if (sel.isCollapsed) return;
    const span = document.createElement('span');
    span.className = 'hidden-text';
    span.setAttribute('spellcheck', 'false');
    span.addEventListener('click', () => { span.classList.toggle('revealed'); });
    const content = range.extractContents();
    span.appendChild(content);
    range.insertNode(span);
    range.setStartAfter(span);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  clearBtn.onclick = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    exec('removeFormat');
    const range   = sel.getRangeAt(0);
    const walker  = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      { acceptNode(node){ return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } }
    );
    const els = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) els.push(n);
    els.forEach(el => {
      el.style.removeProperty('background-color');
      el.style.removeProperty('background');
      if (el.tagName === 'MARK' || (el.tagName === 'SPAN' && !el.className && !el.attributes.length)) {
        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
        el.remove();
        return;
      }
      if (el.getAttribute && el.getAttribute('style') && !el.getAttribute('style').trim())
        el.removeAttribute('style');
    });
    const anc = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    anc.querySelectorAll('.hidden-text').forEach(span => { if (range.intersectsNode(span)) span.replaceWith(document.createTextNode(span.textContent)); });
  };

  insertImgBtn.onclick = ()=>{saveSel();fileInput.click();};
  fileInput.onchange=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=ev=>{insertImg(ev.target.result);fileInput.value='';};r.readAsDataURL(f);
  };
  editor.addEventListener('paste',e=>{
    for(const it of e.clipboardData.items){
      if(it.type.startsWith('image/')){
        const f=it.getAsFile();const r=new FileReader();
        r.onload=ev=>insertImg(ev.target.result);r.readAsDataURL(f);e.preventDefault();
      }
    }
  });
  editor.addEventListener('drop',e=>{
    for(const f of e.dataTransfer.files){
      if(f.type.startsWith('image/')){
        const r=new FileReader();r.onload=ev=>insertImg(ev.target.result);r.readAsDataURL(f);e.preventDefault();
      }
    }
  });
  function insertImg(src){
    const img=document.createElement('img');img.src=src;img.alt='imagem';makeResizable(img);
    const sel=window.getSelection();
    if(sel.rangeCount){
      const range=sel.getRangeAt(0);range.collapse(false);range.insertNode(img);
      const br=document.createElement('br');img.after(br);
      range.setStartAfter(br);range.collapse(true);sel.removeAllRanges();sel.addRange(range);
    }else{editor.appendChild(img);const p=document.createElement('p');p.innerHTML='<br>';editor.appendChild(p);}
  }

  let deleteTarjaMode = false;
  let editingTarjas=false,selectedImage=null;const tarjasMap=new Map();
  insertBtn.onclick=()=>{editingTarjas=true;message.textContent='Clique na imagem…';toggleTarjaBtns(true);} ;
  concluirBtn.onclick=endEditing;
  deleteTarjaBtn.onclick = () => {
    if (!selectedImage){
      message.textContent = 'Selecione antes a imagem.';
      return;
    }
    deleteTarjaMode = true;
    message.textContent = 'Clique na tarja que deseja apagar.';
  };
  function toggleTarjaBtns(on){
    insertBtn.style.display     = on ? 'none'         : 'inline-block';
    concluirBtn.style.display   = on ? 'inline-block' : 'none';
    deleteTarjaBtn.style.display= on ? 'inline-block' : 'none';
  }
  editor.addEventListener('click', e => {
    if (editingTarjas && deleteTarjaMode && e.target.classList.contains('tarja')){
      const tarja = e.target;
      tarja.remove();
      const arr = tarjasMap.get(selectedImage) || [];
      const idx = arr.indexOf(tarja);
      if (idx > -1) arr.splice(idx, 1);
      deleteTarjaMode = false;
      message.textContent = 'Tarja apagada.';
      return;
    }
    if (!editingTarjas && e.target.classList.contains('tarja')){
      e.stopPropagation();
      const t = e.target;
      const comp = getComputedStyle(t).backgroundColor;
      t.style.backgroundColor = comp === 'rgba(0, 0, 0, 0.4)' ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.4)';
      return;
    }
    if (editingTarjas && e.target.tagName === 'IMG'){
      selectImage(e.target);
    }
  });
  function selectImage(img){
    selectedImage=img;message.textContent='Desenhe a tarja…';
    if(!img._listeners)setupDrawing(img);
    (tarjasMap.get(img)||[]).forEach(t=>setupInteract(t));
  }
  function setupDrawing(img){
    const container=wrapImage(img);let startX,startY,drawing=false,newTarja;
    function mousedown(e){
      if(!editingTarjas||e.target!==img)return;drawing=true;
      const rect=container.getBoundingClientRect();startX=e.clientX-rect.left;startY=e.clientY-rect.top;
      newTarja=document.createElement('div');newTarja.className='tarja';
      Object.assign(newTarja.style,{left:startX+'px',top:startY+'px',background:'rgba(0,0,0,1)'});
      container.appendChild(newTarja);
      (tarjasMap.get(img)||tarjasMap.set(img,[]).get(img)).push(newTarja);
      setupInteract(newTarja);
    }
    function mousemove(e){
      if(!drawing)return;
      const rect=container.getBoundingClientRect();const x=e.clientX-rect.left,y=e.clientY-rect.top;
      Object.assign(newTarja.style,{width:Math.abs(x-startX)+'px',height:Math.abs(y-startY)+'px',left:Math.min(x,startX)+'px',top:Math.min(y,startY)+'px'});
    }
    function mouseup(){drawing=false;}
    container.addEventListener('mousedown',mousedown);
    container.addEventListener('mousemove',mousemove);
    document.addEventListener('mouseup',mouseup);
    img._listeners={mousedown,mousemove,mouseup,container};
  }
  function wrapImage(img){
    if(img.parentElement.classList.contains('image-container'))return img.parentElement;
    const wrap=document.createElement('div');wrap.className='image-container';wrap.contentEditable=false;
    img.replaceWith(wrap);wrap.appendChild(img);
    const p=document.createElement('p');p.innerHTML='<br>';wrap.after(p);
    return wrap;
  }
  function setupInteract(el){
    interact(el).draggable({listeners:{move(evt){
      if(!editingTarjas)return;const x=(+el.dataset.x||0)+evt.dx,y=(+el.dataset.y||0)+evt.dy;
      el.style.transform=`translate(${x}px,${y}px)`;el.dataset.x=x;el.dataset.y=y;
    }}})
    .resizable({edges:{left:true,right:true,top:true,bottom:true},listeners:{move(evt){
      if(!editingTarjas)return;let x=+el.dataset.x||0,y=+el.dataset.y||0;
      el.style.width=evt.rect.width+'px';el.style.height=evt.rect.height+'px';
      x+=evt.deltaRect.left;y+=evt.deltaRect.top;
      el.style.transform=`translate(${x}px,${y}px)`;el.dataset.x=x;el.dataset.y=y;
    }}});
  }
  function endEditing(){
    editingTarjas=false;message.textContent='';toggleTarjaBtns(false);
    document.querySelectorAll('.image-container img').forEach(img=>{
      if(img._listeners){
        const{mousedown,mousemove,mouseup,container}=img._listeners;
        container.removeEventListener('mousedown',mousedown);
        container.removeEventListener('mousemove',mousemove);
        document.removeEventListener('mouseup',mouseup);
        delete img._listeners;
      }
    });
    tarjasMap.forEach(arr=>arr.forEach(t=>interact(t).unset()));
    deleteTarjaMode = false;
    selectedImage=null;
  }

  function makeResizable(img){
    if(img._resizable)return;
    img.style.maxWidth='100%';img.style.height='auto';img.draggable=false;
    img.addEventListener('dragstart',e=>e.preventDefault());
    const setRatio=()=>{const r=(img.naturalWidth||img.width)/(img.naturalHeight||img.height)||1;img.dataset.ratio=r;};
    if(img.complete)setRatio();else img.addEventListener('load',setRatio,{once:true});
    interact(img).resizable({
      edges:{left:true,right:true,top:true,bottom:true},
      inertia:true,
      listeners:{move(evt){
        let r=parseFloat(evt.target.dataset.ratio);
        if(!r||!isFinite(r)){r=evt.target.offsetWidth/evt.target.offsetHeight||1;evt.target.dataset.ratio=r;}
        let w=evt.rect.width,h=w/r;
        if(Math.abs(evt.deltaRect.height)>Math.abs(evt.deltaRect.width)){h=evt.rect.height;w=h*r;}
        evt.target.style.width=w+'px';evt.target.style.height=h+'px';
      }}
    });
    img._resizable=true;
  }

  function isImageUrl(url){
    return /\.(jpe?g|png|gif|bmp|webp)$/i.test(url)||
           /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/.+\?alt=media.*$/.test(url);
  }
  function convertTextLinksToImages(){
    const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT,null,false);
    const toReplace=[];
    while(walker.nextNode()){
      const node=walker.currentNode;
      const m=node.nodeValue.match(/(https?:\/\/[^\s]+)/i);
      if(m&&isImageUrl(m[1]))toReplace.push({node,url:m[1]});
    }
    toReplace.forEach(({node,url})=>{
      const img=document.createElement('img');img.src=url;img.alt='imagem';makeResizable(img);
      const parts=node.nodeValue.split(url);
      const before=document.createTextNode(parts[0]);const after=document.createTextNode(parts[1]||'');
      const p=node.parentNode;p.insertBefore(before,node);p.insertBefore(img,node);p.insertBefore(after,node);p.removeChild(node);
    });
  }

  editor.addEventListener('input',()=>{
    window.editorSaveNow();
    setTimeout(convertTextLinksToImages,100);
  });
})();
