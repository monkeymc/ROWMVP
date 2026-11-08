(() => {
  'use strict';
  const DATA = window.RO_DATA, TEX = window.RO_TEX;
  const SLOTS = ['Weapon','Armor','Off-hand','Garment','Headgear','Face','Mouth','Back','Accessory','Shoes'];
  const EL_COLOR = {Neutral:'#abb6c8', Water:'#77b8ea', Earth:'#d2ac78', Fire:'#ec8d6c', Wind:'#83c596', Poison:'#bf8fd4', Holy:'#f2d577', Shadow:'#b39ce2', Ghost:'#a7bfcb', Undead:'#94b591'};
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const elIcon = e => TEX['el_'+e] ? `<img src="${TEX['el_'+e]}" alt="">` : '✧';
  const fmt = v => (v > 0 ? '+' : '') + (+v.toFixed(1));
  const scoreText = c => c.lo === c.hi ? `${fmt(c.lo)}%` : `${fmt(c.lo)}–${+c.hi.toFixed(1)}%`;
  const $ = id => document.getElementById(id);
  // A slot holds 2 cards and the same card may be used twice, so each slot's top card counts ×2.
  // Armor-element cards are the exception: a second copy changes nothing, so the armor slot
  // counts its top element card once plus the best non-element card, if any.
  const isConv = c => c.why.some(t => t.startsWith('armor→'));
  function planSlot(list) {
    const good = list.filter(c => c.tier !== 'bad').sort((a, b) => b.hi - a.hi || b.lo - a.lo);
    for (const c of good) { c.tier = 'alt'; c.n = 0; }
    const top = good[0];
    if (top && isConv(top)) { top.tier = 'best'; top.n = 1; const next = good.find(c => !isConv(c)); if (next) { next.tier = 'best'; next.n = 1; } }
    else if (top) { top.tier = 'best'; top.n = 2; }
    const T = { best: 0, alt: 1, bad: 2 };
    list.sort((a, b) => T[a.tier] - T[b.tier] || b.hi - a.hi || b.lo - a.lo);
  }
  for (const b of DATA) {
    let lo = b.el_bonus || 0, hi = lo;
    for (const list of Object.values(b.slots || {})) { planSlot(list); for (const c of list) if (c.tier === 'best') { lo += c.lo * c.n; hi += c.hi * c.n; } }
    if (!b.pending) { b.sum_lo = +lo.toFixed(1); b.sum_hi = +hi.toFixed(1); }
  }
  const home=$('home'), search=$('search'), level=$('level'), element=$('element'), backBtn=$('backBtn');
  const regions=[
    ['Poring Meadows',[40],-77,26,'#a4cf89'],['Hive Forest',[60],-84,-21,'#6ca582'],
    ['Orc Highlands',[80],-27,-50,'#c0a270'],['Sunken Desert',[100,110],31,-34,'#edbb7a'],
    ['Glast Ruins',[120],-17,2,'#ab99c4'],['Abyss Coast',[130],12,49,'#71c5bd'],
    ['Clockwork Wastes',[140],61,18,'#c19784'],['Frost Peaks',[150],85,-35,'#c4e5e8'],
    ['Apocalypse',[],58,-96,'#b48a68','S1'],['Apocalypse',[],88,-96,'#4f9396','S2']
  ];
  // A detached island holds one Apocalypse season: it lists bosses by season instead of level and has no sea route.
  const inRegion=(b,i)=>regions[i][5]?b.season===regions[i][5]:!b.region&&regions[i][1].includes(b.lv);
  const regionName=i=>regions[i][5]?regions[i][0]+' '+regions[i][5]:regions[i][0];
  const APOC_COLOR='#d8655c';
  let selected=-1, enteredHere=false;
  [...new Set(DATA.filter(b=>b.lv!=null).map(b=>b.lv))].forEach(n=>level.add(new Option('Lv. '+n,n)));
  [...new Set(DATA.filter(b=>b.el).map(b=>b.el))].sort().forEach(e=>element.add(new Option(e,e)));
  function renderIndex(){
    const q=search.value.trim().toLowerCase();
    const found=DATA.filter(b=>(selected<0||inRegion(b,selected))&&(!level.value||level.value==b.lv)&&(!element.value||element.value===b.el)&&[b.name,b.th,b.race,b.el,b.lv,b.region].filter(v=>v!=null).some(v=>String(v).toLowerCase().includes(q)));
    $('bossList').innerHTML=found.map(b=>`<button class="entry" data-id="${b.id}"><span class="bicon"><img src="${TEX[b.img]}" alt=""></span><span><strong>${b.name}</strong><small>${b.pending?`<i style="background:${APOC_COLOR}"></i>${b.region} · ${b.season} · data pending`:`<i style="background:${EL_COLOR[b.el]}"></i>${b.el}${b.lv?` · Lv. ${b.lv}`:''}${b.region?` · ${b.region} ${b.season}`:''}`}</small></span><b class="chev">›</b></button>`).join('') || '<p class="no-results">No bosses match these filters.</p>';
    $('bossList').scrollTop=0;
    $('count').textContent=found.length+' of '+DATA.length+' bosses';
    $('regionTitle').textContent=selected<0?'All regions':regionName(selected);$('clear').hidden=!(selected>=0||q||level.value||element.value);
    document.querySelectorAll('.pin').forEach((el,i)=>el.setAttribute('aria-pressed',i===selected));
  }
  function choose(i){selected=i;level.value=element.value=search.value='';renderIndex();if(matchMedia('(max-width:720px)').matches)document.querySelector('.guide').scrollIntoView({block:'start'});}
  $('clear').onclick=()=>{selected=-1;search.value=level.value=element.value='';renderIndex();};
  search.oninput=level.onchange=element.onchange=renderIndex;
  function selectBoss(b){if(b){enteredHere=true;location.hash='boss='+b.id;}}
  $('bossList').onclick=e=>{const row=e.target.closest('[data-id]');if(row){lastCard=row;selectBoss(DATA.find(b=>b.id==row.dataset.id));}};
  function route(){const m=/^#boss=(\d+)$/.exec(location.hash);const b=m&&DATA.find(b=>b.id==m[1]);if(b)openLair(b);else closeLair();}
  function back(){if(enteredHere)history.back();else location.replace(location.href.split('#')[0]+'#');}
  function initChart() {
    const vp=$('mapViewport'), surface=$('mapSurface'), labels=$('markers');
    const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-120,120,75,-75,.1,1000);
    const verts=[], colors=[], faces=[], light=new THREE.Vector3(-.5,1,.45).normalize();
    let seed=4187;
    const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    const vector=a=>new THREE.Vector3(...a);
    function face(a,b,c,color,variation=0){
      const normal=vector(b).sub(vector(a)).cross(vector(c).sub(vector(a))).normalize();
      if(normal.y<0)normal.negate();
      const shade=.85+.19*normal.dot(light)+variation;
      const col=new THREE.Color(color).multiplyScalar(shade);
      verts.push(...a,...b,...c);for(let i=0;i<3;i++)colors.push(col.r,col.g,col.b);
      faces.push({p:[a,b,c].map(vector),color:'#'+col.getHexString(),depth:(a[1]+b[1]+c[1])*.76+(a[2]+b[2]+c[2])*.65});
    }
    // Make a faceted solid from horizontal polygon rings. The GPU and print-view renderer share the mesh.
    function solid(x,z,rings,n,palette,phase=.2,outline=null){
      const loops=rings.map(([y,rx,rz,shift=0])=>Array.from({length:n},(_,j)=>{
        const a=j*2*Math.PI/n+phase, r=outline?outline[j]:1;
        return [x+shift+Math.cos(a)*rx*r,y,z+Math.sin(a)*rz*r];
      }));
      for(let k=1;k<loops.length;k++)for(let j=0;j<n;j++){
        const m=(j+1)%n,A=loops[k-1],B=loops[k],color=palette[k-1],variation=(random()-.5)*.09;
        face(A[j],B[j],A[m],color,variation);if(rings[k][1])face(A[m],B[j],B[m],color,variation);
      }
      const top=loops.at(-1),r=rings.at(-1);
      if(r[1])for(let j=0;j<n;j++)face([x+(r[3]||0),r[0]+.08,z],top[(j+1)%n],top[j],palette.at(-1),(random()-.5)*.09);
    }
    function tower(x,z,h=10,roof='#556c86'){
      solid(x,z,[[4,2.5,2.5],[h+4,2.1,2.1],[h+5,2.8,2.8],[h+11,0,0]],6,['#dcd3b4','#b4a885',roof]);
    }
    function pine(x,z,s,color){solid(x,z,[[4,.45,.45],[5.5,.45,.45]],5,['#796346']);for(let i=0;i<2;i++)solid(x,z,[[5+i*s*2,s*(2.2-i*.4),s*(2.2-i*.4)],[5+(i+1)*s*3.5,0,0]],6,[color]);}
    function peak(x,z,s){solid(x,z,[[4,6*s,5*s],[10*s+4,2.4*s,2*s,1.2],[15*s+4,0,0,1.8]],6,['#8da9af','#f3f8e9']);}
    function hut(x,z,s){solid(x,z,[[4,s*2,s*2],[4+s*3,s*2,s*2],[4+s*3.2,s*2.8,s*2.8],[4+s*6.5,0,0]],4,['#eee1ad','#ae8f6f','#be7661'],Math.PI/4);}
    const pins=[], bossGroups=[], islands=[];
    const compactCenters=[[-28,-69],[28,-69],[28,-23],[-28,-23],[-28,23],[28,23],[28,69],[-28,69],[-32,115],[32,115]];
    const head=document.querySelector('.chart-head');
    let compactLayout=false;
    regions.forEach(([name,levels,x,z,grass,detached],i)=>{
      const firstVertex=verts.length/3, firstFace=faces.length;
      const n=19, shape=Array.from({length:n},(_,j)=>.95+.09*Math.cos(j*1.33+i)+random()*.09);
      solid(x,z,[[-1,18,13],[-.8,17.4,12.4],[-.5,16,11.1],[.5,14.8,10.4],[2.1,14.4,10],[4,13.5,9.2]],n,[...({S1:['#3c2f3f','#4c3a48','#9b8580','#7a5f52'],S2:['#0c1d2e','#12293f','#2c5a6e','#21495c']}[detached]||['#426f76','#528183','#b5c7ac','#a49174']),grass,grass],.12,shape);
      if(i===0){hut(x-3,z,1.3);hut(x+3,z+2,.9);tower(x+3,z-3,5,'#bd7368');}
      if(i===1){for(let j=0;j<12;j++)pine(x+(random()-.5)*17,z+(random()-.5)*9,.8+random()*.9,j%2?'#578c65':'#759e70');}
      if(i===2){for(let j=0;j<3;j++)solid(x-5+j*4,z+j%2*2,[[4,3.8,3],[9+j*1.6,2.6,2.5],[12+j,1.3,1.1]],6,['#a58a67','#e5b381']);}
      if(i===3){for(const [dx,dz,r] of [[-4,0,6],[4,-3,4],[5,4,2.8]])solid(x+dx,z+dz,[[4,r,r],[4+r*1.65,0,0]],4,['#efca85'],.77);}
      if(i===4){solid(x,z,[[4,6,4],[10,6,4]],4,['#b5abad'],.78);tower(x-5,z,8,'#705986');tower(x+4,z+2,7,'#856d96');tower(x+1,z-3,11,'#765f90');}
      if(i===5){for(const [dx,dz,s] of [[-4,1,1],[1,-1,1.5],[5,2,.8]])solid(x+dx,z+dz,[[4,1.7*s,1.5*s],[10*s+2,1.6*s,1.4*s,1],[13*s+2,0,0,1.5]],5,['#68aeac','#a1e2cc']);}
      if(i===6){hut(x-4,z+1,1.25);solid(x+2,z-1,[[4,3,3],[13,2.3,2.3],[13.6,3,3],[16,2.4,2.4],[18,0,0]],6,['#ad8565','#d1a46a','#c6a681','#71848a']);}
      if(i===7){peak(x-4,z,.9);peak(x+2,z-2,1.4);peak(x+7,z+1,.65);}
      if(i===8){
        // Cursed tomb: a stepped pyramid, twin obelisks and broken pillars.
        solid(x+1,z-1,[[4,7,7],[7,5.6,5.6],[7,5,5],[10,3.6,3.6],[10,3,3],[14,0,0]],4,['#c49a5c','#b38b52','#a87f4b','#97703f','#e2c071'],Math.PI/4);
        for(const dx of [-8,-4.5])solid(x+dx,z+2,[[4,1.1,1.1],[12,.7,.7],[14,0,0]],4,['#5b4a63','#d6b46a'],Math.PI/4);
        for(const [dx,dz,h] of [[7,3,4],[9.5,0,6.5],[6,-4,3]])solid(x+dx,z+dz,[[4,.8,.8],[4+h,.8,.8]],6,['#cdb9a0']);
      }
      if(i===9){
        // Deep-sea isle: rising kraken tentacles, coral, kelp, glowing anemones and a wreck's mast.
        // Decor sits toward the back so the portrait row in front does not hide it.
        for(const [dx,dz,dir,h] of [[-6.5,-4.5,-1,.95],[6.5,-5,1,1.05],[.5,-7,.35,.85]])
          solid(x+dx,z+dz,[[4,1.7,1.7],[7*h,1.3,1.3,dir*.8],[10*h,.95,.95,dir*2.1],[12.6*h,.6,.6,dir*3.7],[14.2*h,0,0,dir*5]],6,['#7c4796','#8f57aa','#a56cbd','#c08ad2']);
        solid(x+2,z-2.5,[[4,4.4,1.8],[6,5,2.2]],4,['#5f4230'],.2);
        solid(x+2.5,z-2.5,[[6,.3,.3],[14,.24,.24,-1.8]],5,['#4d3526']);
        solid(x+1.2,z-2.5,[[11,1.8,.12,-1.2],[13.4,1.5,.12,-1.4]],4,['#d9cdb0']);
        for(const [dx,dz,h,lean,col] of [[-10.5,-1,4.5,.6,'#ef7a91'],[-9.5,-5.2,3.5,-.5,'#f39a62'],[10.6,-1.5,5,-.7,'#ef7a91'],[9.6,-5.6,3.5,.5,'#ffb35c']])
          solid(x+dx,z+dz,[[4,.7,.7],[4+h,.4,.4,lean],[4+h+.8,0,0,lean*1.3]],5,[col,'#ffd1dc']);
        for(const [dx,dz,h] of [[-3.2,-6.5,7],[-2,-7.5,5.5],[3.6,-7.8,6]])solid(x+dx,z+dz,[[4,.35,.35],[4+h*.6,.28,.28,.5],[4+h,0,0,-.2]],5,['#2f9a74','#4cc08f']);
        for(const [dx,dz] of [[-4.5,-1.5],[-1.5,-3.5],[5.5,-1],[8,-3]])solid(x+dx,z+dz,[[4,.65,.65],[5.3,.24,.24],[5.9,0,0]],6,['#5ff2dc','#b9fff4']);
      }
      for(let j=0;j<5&&i<8;j++){let a=random()*6.28;const xx=x+Math.cos(a)*9,zz=z+Math.sin(a)*5;
        if([0,2,4,7].includes(i))pine(xx,zz,.5+random()*.48,i===7?'#82a7a0':'#699168');
        else solid(xx,zz,[[4,1.1,1],[5.3,.55,.6]],5,['#c3b49a']);}
      islands.push({x,z,firstVertex,endVertex:verts.length/3,faces:faces.slice(firstFace)});
      const group=document.createElement('div');
      group.className='island-bosses';
      group.setAttribute('role','group');
      group.setAttribute('aria-label',regionName(i)+' bosses');
      if(detached)group.classList.add('detached',detached.toLowerCase());
      for(const boss of DATA.filter(b=>inRegion(b,i))){
        const button=document.createElement('button');
        button.className='boss-marker';
        button.setAttribute('aria-label','Open '+boss.name+' guide');
        button.innerHTML=`<img src="${TEX[boss.img]}" alt=""><span class="marker-name" aria-hidden="true">${esc(boss.name)}</span>`;
        button.onclick=()=>{lastCard=button;selectBoss(boss);};
        group.append(button);
      }
      bossGroups.push(group);labels.append(group);
      const pin=document.createElement('button');pin.className='pin';pin.setAttribute('aria-label',regionName(i)+' — show bosses');pin.innerHTML='<i>'+(detached||String(i+1).padStart(2,'0'))+'</i><span>'+name+'</span>';if(detached)pin.classList.add('detached',detached.toLowerCase());pin.onclick=()=>choose(i);labels.append(pin);pins.push(pin);
    });
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    scene.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide})));
    // Translucent ripples sit just above the chart, below every island.
    const seaMaterial = new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,
      uniforms:{tide:{value:0}},
      vertexShader:`varying vec2 chart; void main(){chart=position.xy;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec2 chart;uniform float tide;
        void main(){vec2 p=chart*.24;
          float crest=sin(p.y*3.2+sin(p.x*1.3+tide*.42)*.8+tide*.75);
          float fleck=smoothstep(.90,.995,crest)*smoothstep(.42,.92,sin(p.x*.91+sin(p.y*.6-tide*.16)));
          gl_FragColor=vec4(.58,.82,.80,.15*fleck);}`
    });
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(520,420),seaMaterial);
    sea.rotation.x=-Math.PI/2;sea.position.y=-1.2;scene.add(sea);
    let renderer, ctx, canvas=document.createElement('canvas');surface.append(canvas);
    const fallback=()=>{canvas.remove();canvas=document.createElement('canvas');surface.append(canvas);ctx=canvas.getContext('2d');renderer=null;};
    try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();draw();},{once:true});}catch{fallback();}
    faces.sort((a,b)=>a.depth-b.depth);
    const routeLine=document.createElementNS('http://www.w3.org/2000/svg','svg');routeLine.classList.add('routes');surface.prepend(routeLine);
    let zoom=1,dx=0,dz=0,span=240,width=0,height=0,drag;
    function project(v){const p=v.clone().project(camera);return [(p.x+1)*width/2,(1-p.y)*height/2];}
    function moveIsland(i,x,z){
      const island=islands[i],positions=geometry.getAttribute('position');
      const shiftX=x-island.x,shiftZ=z-island.z;
      for(let v=island.firstVertex;v<island.endVertex;v++){
        positions.setX(v,positions.getX(v)+shiftX);positions.setZ(v,positions.getZ(v)+shiftZ);
      }
      for(const f of island.faces){
        for(const point of f.p){point.x+=shiftX;point.z+=shiftZ;}
        f.depth+=3*shiftZ*.65;
      }
      island.x=x;island.z=z;
    }
    function settleMesh(){faces.sort((a,b)=>a.depth-b.depth);geometry.getAttribute('position').needsUpdate=true;geometry.computeBoundingSphere();}
    function arrangeIslands(compact){
      if(compact===compactLayout)return;
      compactLayout=compact;
      islands.forEach((island,i)=>{const [x,z]=compact?compactCenters[i]:regions[i].slice(2,4);moveIsland(i,x,z);});
      settleMesh();
      dx=dz=0;zoom=1;
    }
    // Ground point under a viewport pixel.
    function ground(sx,sy){
      const v=new THREE.Vector3(sx/width*2-1,1-sy/height*2,0).unproject(camera),dir=new THREE.Vector3();
      camera.getWorldDirection(dir);const t=-v.y/dir.y;return [v.x+dir.x*t,v.z+dir.z*t];
    }
    // Detached islands sit side by side in the free space to the right of the map title, with
    // portraits shrunk to as little as 70% to fit there. Returns the portrait size they use.
    function placeDetached(headH,bossSize,gap){
      const ids=regions.flatMap((r,i)=>r[5]?[i]:[]);if(!ids.length)return bossSize;
      const vpLeft=vp.getBoundingClientRect().left;
      const textRight=Math.max(...[...head.querySelectorAll('h1,p')].map(el=>el.getBoundingClientRect().right))-vpLeft;
      const counts=ids.map(i=>bossGroups[i].childElementCount),n=counts.reduce((a,c)=>a+c,0),free=width-textRight;
      // A row of n portraits in k groups, k-1 group gaps of .8 portrait: size*(n+.8(k-1)) + gap*(n-k).
      const fit=Math.min(bossSize,Math.floor((free-28-gap*(n-ids.length))/(n+.8*(ids.length-1))));
      const size=fit>=bossSize*.7?fit:bossSize,groupW=counts.map(c=>c*size+(c-1)*gap),between=size*.8;
      const totalW=groupW.reduce((a,w)=>a+w,0)+between*(ids.length-1);
      let left,sy;
      if(size===fit){left=textRight+(free-totalW)/2;sy=Math.max(headH*.72,size*2.1);}
      else{left=width-totalW-14;sy=headH+size*.6;}
      let moved=false;
      ids.forEach((i,k)=>{
        const [x,z]=ground(left+groupW[k]/2,sy);left+=groupW[k]+between;
        if(Math.hypot(x-islands[i].x,z-7-islands[i].z)>.3){moveIsland(i,x,z-7);moved=true;}
      });
      if(moved)settleMesh();
      return size;
    }
    function draw(){
      width=vp.clientWidth;height=vp.clientHeight;if(!width||!height)return;
      const headH=Math.min(head.offsetHeight,height*.45), mapH=height-headH;
      arrangeIslands(width<640 && mapH/width>.72);
      span=(compactLayout?Math.max(150,196*width/mapH):Math.max(218,123*width/mapH))/zoom;
      const mapScale = width / span;
      const bossSize = compactLayout
        ? Math.max(25, Math.min(36, mapScale * 7.5))
        : Math.max(30, Math.min(64, Math.round(mapScale * 12)));
      const markerGap = compactLayout || mapScale < 4 ? 2 : 4;
      vp.style.setProperty('--boss-size', bossSize + 'px');
      vp.style.setProperty('--boss-gap', markerGap + 'px');
      const half=span/2,unit=span/width,cz=compactLayout?23:0;
      camera.left=-half;camera.right=half;camera.top=(mapH/2+headH)*unit;camera.bottom=-mapH/2*unit;
      camera.position.set(dx,165,dz+cz+145);camera.lookAt(dx,0,dz+cz);camera.updateProjectionMatrix();camera.updateMatrixWorld();
      const detachedSize=!compactLayout&&zoom===1?placeDetached(headH,bossSize,markerGap):bossSize;
      if(renderer){renderer.setSize(width,height,false);renderer.render(scene,camera);}
      else{const d=Math.min(devicePixelRatio,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=.45;
        for(const f of faces){const [a,b,c]=f.p.map(project);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...c);ctx.closePath();ctx.fillStyle=ctx.strokeStyle=f.color;ctx.fill();ctx.stroke();}}
      const anchors=islands.map((island,i)=>{
        const anchor=project(new THREE.Vector3(island.x,0,island.z));
        const [x,y]=project(new THREE.Vector3(island.x,1,island.z+7));
        const group = bossGroups[i];
        const count = group.childElementCount, size = regions[i][5] ? detachedSize : bossSize;
        group.style.setProperty('--boss-size', size + 'px');
        // Leave room for the outer portrait to grow on hover in the overview.
        const margin = (count * size + (count - 1) * markerGap) / 2 + size * .325 + 2;
        const groupX = zoom === 1 ? Math.min(width - margin, Math.max(margin, x)) : x;
        group.style.left = groupX + 'px';
        group.style.top = y + 'px';
        pins[i].style.left=x+'px';pins[i].style.top=(y+size/2+5)+'px';
        return anchor;
      });
      let route='';anchors.filter((a,i)=>!regions[i][5]).forEach(([x,y],i,anchors)=>{if(!i){route='M'+x+' '+y;return;}const [u,v]=anchors[i-1];route+=' Q '+((x+u)/2+(y-v)*.16)+' '+((y+v)/2-(x-u)*.16)+' '+x+' '+y;});
      routeLine.innerHTML='<path d="'+route+'"/>';
      $('zoomOut').disabled=zoom<=1;$('zoomIn').disabled=zoom>=2.6;
    }
    function changeZoom(f){zoom=Math.max(1,Math.min(2.6,zoom*f));if(zoom===1)dx=dz=0;draw();}
    $('zoomIn').onclick=()=>changeZoom(1.3);$('zoomOut').onclick=()=>changeZoom(1/1.3);$('fit').onclick=()=>{zoom=1;dx=dz=0;draw();};
    vp.onpointerdown=e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,dx,dz};vp.setPointerCapture(e.pointerId);};
    vp.onpointermove=e=>{if(!drag||zoom===1)return;dx=Math.max(-75,Math.min(75,drag.dx-(e.clientX-drag.x)*span/width));dz=Math.max(-52,Math.min(52,drag.dz-(e.clientY-drag.y)*span/width/.75));draw();};
    vp.onpointerup=e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6){const r=vp.getBoundingClientRect();for(let i=0;i<regions.length;i++){const v=islands[i],p=project(new THREE.Vector3(v.x,4,v.z));if(Math.hypot(e.clientX-r.left-p[0],(e.clientY-r.top-p[1])*1.15)<16*width/span){choose(i);break;}}}drag=null;};
    vp.onpointercancel=()=>{drag=null;};
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let lastFrame=0;
    function animate(t){
      if (!renderer) return;
      if (!motion.matches && !document.hidden && !home.inert && t-lastFrame>50) {
        seaMaterial.uniforms.tide.value=t/1000;renderer.render(scene,camera);lastFrame=t;
      }
      requestAnimationFrame(animate);
    }
    new ResizeObserver(draw).observe(vp);draw();
    if(renderer)requestAnimationFrame(animate);
  }

  // ---------- lair ----------
  const lair = document.getElementById('lair');
  let lairOpen = false, cur = null, slotIdx = 0, lastCard = null;
  function reason(tag, b, c) {
    const R = b.race, S = b.size, E = b.el;
    const map = { race: `More damage vs ${R}`, size: `More damage vs ${S}`, 'vs element': `More damage vs ${E}-element`, 'all races': 'More damage vs every race',
      'vs Boss': 'More damage vs Boss / MVP', 'Sovereign': 'Sovereign damage vs Boss', 'race taken': `Less damage from ${R}`, 'size taken': `Less damage from ${S}`,
      'element taken': `Less ${E} damage taken`, 'Sovereign taken': 'Less Boss damage taken', 'monster taken': 'Less damage from monsters' };
    if (map[tag]) return map[tag];
    if (tag.endsWith(' dmg')) return `Boosts your ${tag.slice(0, -4)} attacks`;
    if (tag.startsWith('armor→')) { const e = tag.slice(6); return `Armor turns ${e}: boss hits ×${+(1 - c.lo / 100).toFixed(2)}`; }
    if (tag === 'neutral rule') return b.el === 'Neutral' ? 'Neutral damage taken −30%' : 'Non-Neutral damage taken +10%';
    if (tag.startsWith('vs ')) return `Extra damage vs ${tag.slice(3)}`;
    return tag;
  }
  // Advantage SUM split: defensive = best cards that cut damage taken (incl. armor element
  // and the neutral rule); attack = the other best cards plus the attack-element bonus.
  const isDef = c => c.why.length && c.why.every(t => t.endsWith(' taken') || t.startsWith('armor→') || t === 'neutral rule');
  function sums(b) {
    const atk = [b.el_bonus || 0, b.el_bonus || 0], def = [0, 0];
    for (const list of Object.values(b.slots || {})) for (const c of list) if (c.tier === 'best') { const t = isDef(c) ? def : atk; t[0] += c.lo * c.n; t[1] += c.hi * c.n; }
    return { atk, def };
  }
  const SUM_SCALE = Math.max(...DATA.filter(b => !b.pending).map(b => { const s = sums(b); return Math.max(s.atk[1], s.def[1]); })) * 1.1;
  function setSums(b) {
    const s = b ? sums(b) : null;
    for (const k of ['atk', 'def']) {
      const fill = document.getElementById(k + 'Fill');
      fill.style.width = '0%';
      document.getElementById(k + 'Text').textContent = s ? `${fmt(s[k][0])}% ~ ${fmt(s[k][1])}%` : 'No data yet';
      if (s) requestAnimationFrame(() => { fill.style.width = Math.min(100, s[k][1] / SUM_SCALE * 100) + '%'; });
    }
    document.getElementById('sumNote').textContent = s
      ? `Top card ×2 per slot (armor element ×1), lowest ~ highest roll. Attack includes the element bonus. Total ${fmt(b.sum_lo)}% ~ ${fmt(b.sum_hi)}%.`
      : '';
  }
  function orb(e, v, cls) {
    return `<div class="orb ${cls}"><span class="ic">${elIcon(e)}</span><span>×${v.toFixed(2)}<small>${e}</small></span></div>`;
  }
  function openPending(b) {
    lair.style.setProperty('--el', APOC_COLOR);
    document.getElementById('lairTags').innerHTML = `<span class="tag">${b.season} Season</span><span class="tag">${b.region}</span>`;
    document.getElementById('useEl').innerHTML = '<div class="orb none">Element data not available yet</div>';
    document.getElementById('avoidEl').innerHTML = '<div class="orb none">Element data not available yet</div>';
    setSums(null);
    document.getElementById('loadout').innerHTML = '';
    document.getElementById('slotTitle').textContent = 'Guide pending';
    document.getElementById('slotSub').textContent = `${b.region} · ${b.season} season`;
    document.getElementById('hand').innerHTML = `<div class="card freecard q3"><div><b>Data pending</b>${esc(b.name)}'s element, race, size and card scores are not in the source dataset yet.<br><br>This guide will fill in once the data is added.</div></div>`;
    document.getElementById('scrollhint').textContent = '';
    lair.classList.add('pending');
  }
  function openLair(b) {
    cur = b; lairOpen = true; slotIdx = 0;
    document.getElementById('lairImg').src = TEX[b.img];
    document.getElementById('lairName').textContent = b.name;
    lair.classList.remove('pending');
    if (b.pending) openPending(b); else {
    lair.style.setProperty('--el', EL_COLOR[b.el]);
    document.getElementById('lairImg').src = TEX[b.img];
    document.getElementById('lairName').textContent = b.name;
    document.getElementById('lairTags').innerHTML = `<div class="tag-row"><span class="tag">${b.lv?`Lv${b.lv} `:''}MVP</span>${b.region?`<span class="tag">${b.season} ${b.region}</span>`:''}</div>
      <div class="tag-row"><span class="tag">${elIcon(b.el)}${b.el}</span><span class="tag">${b.race}</span><span class="tag">${b.size}</span></div>`;
    const col = Object.entries(b.col);
    const up = col.filter(([, v]) => v > 1).sort((a, c) => c[1] - a[1]), down = col.filter(([, v]) => v < 1).sort((a, c) => a[1] - c[1]);
    document.getElementById('useEl').innerHTML = up.length ? up.map(([e, v]) => orb(e, v, 'up')).join('')
      : `<div class="orb none">No element beats ${b.el} — any element is ×1 except the red ones</div>`;
    document.getElementById('avoidEl').innerHTML = down.map(([e, v]) => orb(e, v, 'down')).join('');
    setSums(b);
    renderLoadout(); renderSlot();
    }
    lair.classList.remove('hidden'); lair.setAttribute('aria-hidden', 'false');
    document.body.classList.add('in-lair');
    document.querySelector('.lair-grid').scrollTop = 0;
    home.inert = true;

    backBtn.focus();
  }
  function closeLair() {
    if (!lairOpen) return;
    lairOpen = false; lair.classList.add('hidden'); lair.setAttribute('aria-hidden', 'true'); document.body.classList.remove('in-lair');
    home.inert = false;
    (lastCard || search).focus({preventScroll:true});
  }
  function renderLoadout() {
    document.getElementById('loadout').innerHTML = SLOTS.map((s, i) => {
      const best = (cur.slots[s] || []).filter(c => c.tier === 'best').flatMap(c => Array(c.n).fill(c));
      const n = (cur.slots[s] || []).filter(c => c.tier !== 'bad').length;
      const ics = best.length ? best.map(c => `<img src="${window.RO_CARD_ART[c.icon]}" alt="">`).join('') : '<span class="free">ANY</span>';
      return `<button class="slotbtn ${i === slotIdx ? 'on' : ''}" data-i="${i}"><span class="ics">${ics}</span>${s}<small>${n} card${n === 1 ? '' : 's'}</small></button>`;
    }).join('');
  }
  document.getElementById('loadout').addEventListener('click', e => { const t = e.target.closest('.slotbtn'); if (t) { slotIdx = +t.dataset.i; renderLoadout(); renderSlot(); } });
  function cardHTML(c, b) {
    const label = { best: c.n === 2 ? 'BEST ×2' : 'BEST', alt: 'ALSO HELPS', bad: 'AVOID' }[c.tier];
    return `<div class="card ${c.tier} q${c.q}"><div class="badge">${label}</div><div class="art"><img src="${window.RO_CARD_ART[c.icon]}" alt=""></div>
      <div class="cname">${esc(c.name)}</div><div class="score">${scoreText(c)}</div>
      <ul>${c.why.map(t => `<li>${esc(reason(t, b, c))}</li>`).join('')}</ul>
      <div class="effect">${c.effect.map(esc).join('<br>')}</div></div>`;
  }
  function renderSlot() {
    const s = SLOTS[slotIdx], list = cur.slots[s] || [];
    const good = list.filter(c => c.tier !== 'bad').length;
    document.getElementById('slotTitle').textContent = s;
    let sub = list.length ? `${good} card${good === 1 ? '' : 's'} help vs ${cur.name} · max 2 per slot` : 'No card targets this boss';
    if (s === 'Armor' && list.filter(c => c.why.some(t => t.startsWith('armor→')) && c.tier !== 'bad').length > 1) sub += ' · armor-element cards don\'t stack — use one';
    document.getElementById('slotSub').textContent = sub;
    const hand = document.getElementById('hand');
    hand.innerHTML = list.length ? list.map(c => cardHTML(c, cur)).join('')
      : `<div class="card freecard q3"><div><b>Free slot</b>No card targets ${esc(cur.name)}'s element, race or size.<br><br>Use any card you like.</div></div>`;
    layoutHand();
    const hint = document.getElementById('scrollhint');
    requestAnimationFrame(() => { hint.textContent = hand.scrollHeight > hand.clientHeight + 20 ? `▼ scroll for all ${list.length} cards` : ''; });
  }
  function layoutHand() {
    // deal-in animation: cards fly up from the deck one by one
    [...document.getElementById('hand').children].forEach((el, i) => { el.style.animationDelay = (i * 45) + 'ms'; });
    document.getElementById('hand').scrollTop = 0;
  }
  const moveSlot = d => { if (cur && cur.pending) return; slotIdx = (slotIdx + d + SLOTS.length) % SLOTS.length; renderLoadout(); renderSlot(); };
  document.getElementById('prevSlot').onclick = () => moveSlot(-1);
  document.getElementById('nextSlot').onclick = () => moveSlot(1);
  document.getElementById('backBtn').onclick = back;
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && lairOpen) back();
    if (lairOpen && e.key === 'ArrowRight') moveSlot(1);
    if (lairOpen && e.key === 'ArrowLeft') moveSlot(-1);
  });


  initChart(); renderIndex();
  addEventListener('hashchange', route); route();
  window.__atlas = { selectBoss: id => selectBoss(DATA.find(b => b.id == id)), closeLair: back, setSlot: i => { if(cur && !cur.pending) { slotIdx = i; renderLoadout(); renderSlot(); } } };
})();
