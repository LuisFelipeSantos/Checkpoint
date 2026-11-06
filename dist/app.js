const defaultGames=[
 {id:"elden-ring",title:"Elden Ring",status:"Em andamento",progress:42,meta:"12 pendências · há 2 dias",cover:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85"},
 {id:"hollow-knight",title:"Hollow Knight",status:"Em andamento",progress:68,meta:"7 pendências · ontem",cover:"https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85"},
 {id:"control",title:"Control",status:"Na fila",progress:8,meta:"3 anotações · há 5 dias",cover:"https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=1200&q=85"},
 {id:"outer-wilds",title:"Outer Wilds",status:"Concluído",progress:100,meta:"24 descobertas · concluído",cover:"https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1200&q=85"}
];
const defaultFolders=[
 {id:"backtracking",name:"Lugares para voltar",color:"#c6f06f"},
 {id:"quests",name:"Quests pendentes",color:"#e9a35a"},
 {id:"builds",name:"Builds e atributos",color:"#77a8ff"},
 {id:"tips",name:"Dicas e lembretes",color:"#c68bff"}
];
const defaultSubfolders={
 backtracking:[{id:"limgrave",name:"Limgrave"},{id:"liurnia",name:"Liurnia dos Lagos"},{id:"volcano",name:"Mansão Vulcânica"}],
 quests:[{id:"main-quests",name:"História principal"},{id:"npc-quests",name:"Quests de NPCs"}],
 builds:[{id:"bleed-build",name:"Build de sangramento"}],
 tips:[{id:"merchants",name:"Mercadores e horários"}]
};
const defaultNotes={
 backtracking:[
  {id:1,title:"Portão selado no Castelo Tempesvéu",content:"Voltar com a Chave Enferrujada encontrada na sala do cavaleiro.",done:true,date:"Hoje",subfolder:"limgrave"},
  {id:2,title:"Estátua com névoa em Fringefolk",content:"Precisa de 2 Chaves de Espada de Pedra. Há um item visível no nível inferior.",done:false,date:"2 dias",subfolder:"limgrave"},
  {id:3,title:"Elevador quebrado na Mansão Vulcânica",content:"Procurar um caminho alternativo pelo lado leste do pátio.",done:false,date:"4 dias",subfolder:"volcano"}
 ],
 quests:[{id:4,title:"Encontrar Millicent no Planalto Altus",content:"Ela deve estar próxima à Colina da Contemplação.",done:false,date:"3 dias",subfolder:"npc-quests"}],
 builds:[{id:5,title:"Build de sangramento",content:"Testar Rivers of Blood com 45 Arcano e talismã Exultação do Lorde do Sangue.",done:false,date:"1 sem.",subfolder:"bleed-build"}],
 tips:[{id:6,title:"Mercador noturno em Limgrave",content:"Aparece apenas à noite perto da cabana do Mestre de Guerra.",done:true,date:"1 sem.",subfolder:"merchants"}]
};

let games=JSON.parse(localStorage.getItem("checkpoint-games")||"null")||defaultGames;
games.forEach(game=>{if(typeof game.isCompleted!=="boolean")game.isCompleted=game.status==="Concluído";if(typeof game.rating!=="number")game.rating=null});
let folders=JSON.parse(localStorage.getItem("checkpoint-folders")||"null")||defaultFolders;
let notes=JSON.parse(localStorage.getItem("checkpoint-notes")||"null")||defaultNotes;
let subfolders=JSON.parse(localStorage.getItem("checkpoint-subfolders")||"null")||defaultSubfolders;
let activeFilter="Todos",activeFolder="backtracking",activeSubfolder=null,activeGame=games[0];
let activeTypeFilter="all",activeStatusFilter="all";
let editingNoteId=null;
let expandedFolders=new Set(["backtracking"]);
let optimizedNoteImage=null,optimizedBannerImage=null;
const legacySubfolderMap={1:"limgrave",2:"limgrave",3:"volcano",4:"npc-quests",5:"bleed-build",6:"merchants"};
Object.values(notes).flat().forEach(note=>{if(!note.subfolder&&legacySubfolderMap[note.id])note.subfolder=legacySubfolderMap[note.id];if(!note.type)note.type="task"});
const $=selector=>document.querySelector(selector);

function statusClass(status){return status==="Em andamento"?"in-progress":status==="Concluído"?"done":"queue"}
function gameStatusLabel(game){return game.isCompleted?"Zerado":game.status}
function escapeHtml(value){const div=document.createElement("div");div.textContent=value;return div.innerHTML}
function normalizeHttpUrl(value){if(!value)return "";try{const url=new URL(value);return url.protocol==="http:"||url.protocol==="https:"?url.href:""}catch(error){return ""}}
function saveGames(){localStorage.setItem("checkpoint-games",JSON.stringify(games))}
function locationOptions(selectedFolder=activeFolder,selectedSubfolder=activeSubfolder){return folders.map(folder=>`<optgroup label="${escapeHtml(folder.name)}"><option value="${folder.id}|" ${folder.id===selectedFolder&&!selectedSubfolder?"selected":""}>${escapeHtml(folder.name)} (pasta principal)</option>${(subfolders[folder.id]||[]).map(child=>`<option value="${folder.id}|${child.id}" ${folder.id===selectedFolder&&child.id===selectedSubfolder?"selected":""}>↳ ${escapeHtml(child.name)}</option>`).join("")}</optgroup>`).join("")}
function renderGames(){
 const query=$("#game-search").value.trim().toLowerCase();
 const visible=games.filter(g=>(activeFilter==="Todos"||(activeFilter==="Concluído"?g.isCompleted:!g.isCompleted&&g.status===activeFilter))&&g.title.toLowerCase().includes(query));
 $("#count-all").textContent=games.length;
 $("#game-grid").innerHTML=visible.map(g=>`<button class="game-card" data-game="${g.id}" type="button"><img src="${g.cover}" alt="" loading="lazy"><div class="card-info"><div class="card-topline"><span class="status-pill ${statusClass(g.isCompleted?"Concluído":g.status)}">${gameStatusLabel(g)}</span>${g.rating!==null?`<span class="card-rating">★ ${g.rating}/100</span>`:""}</div><h2>${escapeHtml(g.title)}</h2><p>${escapeHtml(g.meta)}</p><div class="card-progress"><span style="width:${g.progress}%"></span></div></div></button>`).join("");
 $("#empty-state").hidden=visible.length>0;
 document.querySelectorAll("[data-game]").forEach(btn=>btn.addEventListener("click",()=>openGame(btn.dataset.game)));
}
function setView(name){
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`${name}-view`));
 document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===name));
 window.scrollTo({top:0,behavior:"smooth"});
}
function openGame(id){
 activeGame=games.find(g=>g.id===id)||games[0];activeSubfolder=null;
 $("#game-detail-title").textContent=activeGame.title;$("#hero-image").style.backgroundImage=`url("${activeGame.cover}")`;
 const pill=$(".hero-content .status-pill");pill.textContent=gameStatusLabel(activeGame);pill.className=`status-pill ${statusClass(activeGame.isCompleted?"Concluído":activeGame.status)}`;$("#game-completed").checked=activeGame.isCompleted;$("#completion-label").textContent=activeGame.isCompleted?"Jogo zerado":"Jogo não zerado";$("#game-rating").value=activeGame.rating??"";
 renderFolders();renderNotes();setView("game");
}
function folderItems(folderId){return notes[folderId]||[]}
function visibleItems(){const items=folderItems(activeFolder);return activeSubfolder?items.filter(n=>n.subfolder===activeSubfolder):items}
function renderFolders(){
 $("#folder-list").innerHTML=folders.map(f=>{
  const children=subfolders[f.id]||[],expanded=expandedFolders.has(f.id),items=folderItems(f.id);
  return `<div class="folder-group ${expanded?"expanded":""}"><div class="folder-row"><button class="expand-btn" type="button" data-expand="${f.id}" aria-label="${expanded?"Recolher":"Expandir"} ${escapeHtml(f.name)}"><span>›</span></button><button class="folder-item ${f.id===activeFolder&&!activeSubfolder?"active":""}" type="button" data-folder="${f.id}"><span class="folder-icon" style="--folder-color:${f.color}"></span><span class="folder-name">${escapeHtml(f.name)}</span><span class="folder-count">${items.length}</span></button></div><div class="subfolder-list">${children.map(child=>`<button class="subfolder-item ${f.id===activeFolder&&child.id===activeSubfolder?"active":""}" style="--subfolder-color:${child.color||f.color}" type="button" data-parent="${f.id}" data-subfolder="${child.id}"><span class="folder-name">${escapeHtml(child.name)}</span><span class="subfolder-count">${items.filter(n=>n.subfolder===child.id).length}</span></button>`).join("")}</div></div>`;
 }).join("");
 document.querySelectorAll("[data-expand]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.expand;expandedFolders.has(id)?expandedFolders.delete(id):expandedFolders.add(id);renderFolders()}));
 document.querySelectorAll("[data-folder]").forEach(btn=>btn.addEventListener("click",()=>{activeFolder=btn.dataset.folder;activeSubfolder=null;expandedFolders.add(activeFolder);renderFolders();renderNotes()}));
 document.querySelectorAll("[data-subfolder]").forEach(btn=>btn.addEventListener("click",()=>{activeFolder=btn.dataset.parent;activeSubfolder=btn.dataset.subfolder;expandedFolders.add(activeFolder);renderFolders();renderNotes()}));
}
function renderNotes(){
 const folder=folders.find(f=>f.id===activeFolder),child=(subfolders[activeFolder]||[]).find(s=>s.id===activeSubfolder),allItems=visibleItems(),tasks=allItems.filter(n=>n.type==="task"),done=tasks.filter(n=>n.done).length;
 const query=$("#content-search").value.trim().toLowerCase();
 const items=allItems.filter(item=>(activeTypeFilter==="all"||item.type===activeTypeFilter)&&(activeStatusFilter==="all"||(item.type==="task"&&(activeStatusFilter==="done"?item.done:!item.done)))&&(!query||`${item.title} ${item.content}`.toLowerCase().includes(query)));
 $("#folder-title").textContent=child?child.name:folder.name;$("#folder-eyebrow").textContent=child?`${folder.name.toUpperCase()} · SUBPASTA`:`PASTA · ${allItems.length} ITENS`;
 $("#progress-text").textContent=`${done} de ${tasks.length} tarefas concluídas`;$("#progress-bar").style.width=`${tasks.length?done/tasks.length*100:0}%`;
 $("#notes-list").innerHTML=items.length?items.map(n=>`<article class="note-item ${n.type==="note"?"plain-note":n.done?"completed":""}">${n.type==="note"?`<span class="note-symbol" aria-hidden="true">✎</span>`:`<button class="check-btn" type="button" data-note="${n.id}" aria-label="${n.done?"Marcar como pendente":"Marcar como concluído"}">${n.done?"✓":""}</button>`}<div class="note-copy"><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.content)}</p>${n.image?`<img class="note-attachment" src="${n.image}" alt="Imagem anexada a ${escapeHtml(n.title)}" />`:""}</div><div class="note-side"><span class="note-meta">${n.type==="note"?"ANOTAÇÃO · ":""}${n.date}</span><button class="note-action" type="button" data-edit-note="${n.id}" aria-label="Editar ${escapeHtml(n.title)}">•••</button></div></article>`).join(""):`<div class="empty-state"><span>⌁</span><h2>Nenhum item neste filtro</h2><p>Altere os filtros, a busca ou crie um novo item.</p></div>`;
 document.querySelectorAll("[data-note]").forEach(btn=>btn.addEventListener("click",()=>toggleNote(Number(btn.dataset.note))));
 document.querySelectorAll("[data-edit-note]").forEach(btn=>btn.addEventListener("click",()=>openNoteDialog(Number(btn.dataset.editNote))));
}
function toggleNote(id){const item=folderItems(activeFolder).find(n=>n.id===id);if(item){item.done=!item.done;saveNotes();renderNotes();showToast(item.done?"Anotação concluída!":"Anotação reaberta.")}}
function saveNotes(){localStorage.setItem("checkpoint-notes",JSON.stringify(notes))}
function saveSubfolders(){try{localStorage.setItem("checkpoint-subfolders",JSON.stringify(subfolders));return true}catch(error){showToast("Não foi possível salvar. Recarregue a página e tente novamente.");return false}}
function saveStructure(){try{localStorage.setItem("checkpoint-folders",JSON.stringify(folders));localStorage.setItem("checkpoint-subfolders",JSON.stringify(subfolders));localStorage.setItem("checkpoint-notes",JSON.stringify(notes));return true}catch(error){showToast("Não foi possível salvar a estrutura. Tente novamente.");return false}}
function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove("show"),2300)}
function slugify(value){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||`subpasta-${Date.now()}`}
function formatBytes(bytes){if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(0)} KB`;return `${(bytes/1024/1024).toFixed(1)} MB`}
function dataUrlBytes(dataUrl){const base64=dataUrl.split(",")[1]||"";return Math.max(0,Math.floor(base64.length*3/4)-(base64.endsWith("==")?2:base64.endsWith("=")?1:0))}
function optimizeImage(file,{maxWidth=1920,maxHeight=1920,quality=.84}={}){return new Promise((resolve,reject)=>{
 if(!file?.type.startsWith("image/")){reject(new Error("type"));return}
 const reader=new FileReader();reader.onerror=()=>reject(new Error("read"));reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error("image"));image.onload=()=>{
  const scale=Math.min(1,maxWidth/image.naturalWidth,maxHeight/image.naturalHeight),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext("2d",{alpha:true});context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.drawImage(image,0,0,canvas.width,canvas.height);
  let dataUrl=canvas.toDataURL("image/webp",quality);if(!dataUrl.startsWith("data:image/webp"))dataUrl=canvas.toDataURL("image/jpeg",quality);
  resolve({dataUrl,originalBytes:file.size,optimizedBytes:dataUrlBytes(dataUrl),width:canvas.width,height:canvas.height,format:dataUrl.startsWith("data:image/webp")?"WEBP":"JPEG"});
 };image.src=reader.result};reader.readAsDataURL(file)
})}
async function prepareImage(input,status,options){const file=input.files[0];if(!file){status.hidden=true;return null}if(file.size>15*1024*1024){input.value="";status.hidden=true;showToast("A imagem original deve ter no máximo 15 MB.");return null}status.hidden=false;status.textContent="Otimizando imagem...";try{const result=await optimizeImage(file,options),saved=Math.max(0,Math.round((1-result.optimizedBytes/result.originalBytes)*100));status.textContent=`Pronta: ${result.width}×${result.height} · ${result.format} · ${formatBytes(result.optimizedBytes)}${saved?` (${saved}% menor)`:""}`;return result}catch(error){input.value="";status.hidden=true;showToast("Não foi possível processar essa imagem.");return null}}

document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));
document.querySelectorAll(".close-modal").forEach(btn=>btn.addEventListener("click",()=>btn.closest("dialog").close()));
document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{activeFilter=btn.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===btn));renderGames()}));
document.querySelectorAll("[data-type-filter]").forEach(btn=>btn.addEventListener("click",()=>{activeTypeFilter=btn.dataset.typeFilter;if(activeTypeFilter==="note")activeStatusFilter="all";document.querySelectorAll("[data-type-filter]").forEach(x=>x.classList.toggle("active",x===btn));document.querySelectorAll("[data-status-filter]").forEach(x=>x.classList.toggle("active",x.dataset.statusFilter===activeStatusFilter));$("#status-filter-group").classList.toggle("disabled",activeTypeFilter==="note");renderNotes()}));
document.querySelectorAll("[data-status-filter]").forEach(btn=>btn.addEventListener("click",()=>{activeStatusFilter=btn.dataset.statusFilter;document.querySelectorAll("[data-status-filter]").forEach(x=>x.classList.toggle("active",x===btn));renderNotes()}));
$("#game-search").addEventListener("input",renderGames);
$("#content-search").addEventListener("input",renderNotes);
$("#open-add-game").addEventListener("click",()=>$("#game-dialog").showModal());
$("#cancel-game").addEventListener("click",()=>$("#game-dialog").close());
$("#game-form").addEventListener("submit",event=>{event.preventDefault();const title=$("#new-game-title").value.trim(),cover=$("#new-game-cover").value.trim()||"https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=85",status=$("#new-game-status").value;if(!title)return;games.unshift({id:`game-${Date.now()}`,title,status,cover,isCompleted:status==="Concluído",rating:null,progress:status==="Concluído"?100:0,meta:"Adicionado agora"});localStorage.setItem("checkpoint-games",JSON.stringify(games));$("#game-dialog").close();event.target.reset();activeFilter="Todos";document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter==="Todos"));renderGames();showToast("Jogo adicionado à biblioteca!")});
$("#game-completed").addEventListener("change",event=>{activeGame.isCompleted=event.target.checked;activeGame.status=activeGame.isCompleted?"Concluído":"Em andamento";saveGames();const pill=$(".hero-content .status-pill");pill.textContent=gameStatusLabel(activeGame);pill.className=`status-pill ${statusClass(activeGame.status)}`;$("#completion-label").textContent=activeGame.isCompleted?"Jogo zerado":"Jogo não zerado";renderGames();showToast(activeGame.isCompleted?"Jogo marcado como zerado!":"Jogo marcado como não zerado.")});
$("#game-rating").addEventListener("change",event=>{const raw=event.target.value.trim();if(raw===""){activeGame.rating=null;localStorage.setItem("checkpoint-games",JSON.stringify(games));showToast("Nota removida.");return}const rating=Math.max(0,Math.min(100,Math.round(Number(raw))));activeGame.rating=Number.isFinite(rating)?rating:null;event.target.value=activeGame.rating??"";localStorage.setItem("checkpoint-games",JSON.stringify(games));showToast(activeGame.rating===null?"Informe uma nota entre 0 e 100.":`Nota ${activeGame.rating}/100 salva!`)});
function openNoteDialog(id=null){editingNoteId=id;optimizedNoteImage=null;const item=id!==null?folderItems(activeFolder).find(note=>note.id===id):null;$("#note-form").reset();$("#note-dialog-title").textContent=item?"Editar item":"Nova anotação";$("#new-note-title").value=item?.title||"";$("#new-note-content").value=item?.content||"";$("#note-image-url").value=item?.image?.startsWith("http")?item.image:"";$("#note-location").innerHTML=locationOptions(activeFolder,item?.subfolder??activeSubfolder);if(item)document.querySelector(`#note-form input[name="item-type"][value="${item.type}"]`).checked=true;$("#delete-note").hidden=!item;$("#note-image-status").hidden=!item?.image;if(item?.image)$("#note-image-status").textContent="Este item possui uma imagem anexada. Uma nova URL ou arquivo substituirá a imagem atual.";$("#note-dialog").showModal();setTimeout(()=>$("#new-note-title").focus(),50)}
$("#new-note").addEventListener("click",()=>openNoteDialog());$("#new-note-hero").addEventListener("click",()=>openNoteDialog());$("#cancel-note").addEventListener("click",()=>$("#note-dialog").close());
$("#note-image").addEventListener("change",async event=>{optimizedNoteImage=await prepareImage(event.target,$("#note-image-status"),{maxWidth:1920,maxHeight:1920,quality:.82})});
$("#note-form").addEventListener("submit",async event=>{event.preventDefault();const title=$("#new-note-title").value.trim(),content=$("#new-note-content").value.trim(),type=event.target.elements["item-type"].value,file=$("#note-image").files[0],rawImageUrl=$("#note-image-url").value.trim(),imageUrl=normalizeHttpUrl(rawImageUrl),[targetFolder,targetSubfolder]=$("#note-location").value.split("|");if(!title)return;if(rawImageUrl&&!imageUrl){showToast("Use uma URL de imagem iniciada por http:// ou https://.");return}if(file&&!optimizedNoteImage){showToast("Aguarde a otimização da imagem.");return}const existing=editingNoteId!==null?folderItems(activeFolder).find(item=>item.id===editingNoteId):null;let image=optimizedNoteImage?.dataUrl||imageUrl||existing?.image||null;try{const saved=existing?{...existing,title,content:content||"Sem descrição adicional.",type,done:type==="task"?existing.done:false,subfolder:targetSubfolder||null,image,date:"Editado agora"}:{id:Date.now(),title,content:content||"Sem descrição adicional.",done:false,type,date:"Agora",subfolder:targetSubfolder||null,image};if(existing)notes[activeFolder]=folderItems(activeFolder).filter(item=>item.id!==editingNoteId);(notes[targetFolder]||=[]).unshift(saved);saveStructure();activeFolder=targetFolder;activeSubfolder=targetSubfolder||null;expandedFolders.add(targetFolder);$("#note-dialog").close();renderFolders();renderNotes();showToast(existing?"Item atualizado!":type==="task"?"Tarefa com checkbox criada!":"Anotação de texto criada!")}catch(error){showToast("Não foi possível salvar. Use uma imagem menor.")}});
$("#delete-note").addEventListener("click",()=>{if(editingNoteId===null||!confirm("Excluir este item? Esta ação não pode ser desfeita."))return;notes[activeFolder]=folderItems(activeFolder).filter(item=>item.id!==editingNoteId);saveNotes();$("#note-dialog").close();renderFolders();renderNotes();showToast("Item excluído.")});

function updateFolderDialog(){const isSubfolder=$("#folder-kind").value==="subfolder";$("#folder-parent-wrap").hidden=!isSubfolder;$("#folder-submit").textContent=isSubfolder?"Criar subpasta":"Criar pasta"}
$("#new-folder").addEventListener("click",()=>{$("#subfolder-form").reset();$("#folder-kind").value="folder";$("#folder-color").value="#c6f06f";$("#folder-color-value").textContent="#C6F06F";$("#subfolder-parent").innerHTML=folders.map(f=>`<option value="${f.id}" ${f.id===activeFolder?"selected":""}>${escapeHtml(f.name)}</option>`).join("");updateFolderDialog();$("#subfolder-dialog").showModal();setTimeout(()=>$("#subfolder-name").focus(),50)});
$("#folder-kind").addEventListener("change",updateFolderDialog);
$("#folder-color").addEventListener("input",event=>$("#folder-color-value").textContent=event.target.value.toUpperCase());
$("#cancel-subfolder").addEventListener("click",()=>$("#subfolder-dialog").close());
$("#subfolder-form").addEventListener("submit",event=>{event.preventDefault();const kind=$("#folder-kind").value,parent=$("#subfolder-parent").value,name=$("#subfolder-name").value.trim(),color=$("#folder-color").value;if(!name){showToast("Digite um nome para a pasta.");return}const id=`${slugify(name)}-${Date.now().toString().slice(-5)}`;if(kind==="folder"){if(folders.some(item=>item.name.toLowerCase()===name.toLowerCase())){showToast("Já existe uma pasta com esse nome.");return}folders.push({id,name,color});notes[id]=[];subfolders[id]=[];if(!saveStructure()){folders.pop();delete notes[id];delete subfolders[id];return}activeFolder=id;activeSubfolder=null;expandedFolders.add(id);showToast("Pasta criada com a cor escolhida!")}else{const list=(subfolders[parent]||=[]);if(list.some(item=>item.name.toLowerCase()===name.toLowerCase())){showToast("Já existe uma subpasta com esse nome.");return}list.push({id,name,color});if(!saveStructure()){list.pop();return}activeFolder=parent;activeSubfolder=id;expandedFolders.add(parent);showToast("Subpasta criada com a cor escolhida!")}$("#subfolder-dialog").close();event.target.reset();renderFolders();renderNotes()});

$("#edit-game").addEventListener("click",()=>{$("#edit-game-title").value=activeGame.title;$("#edit-game-status").value=activeGame.status;$("#edit-game-dialog").showModal()});
$("#cancel-edit-game").addEventListener("click",()=>$("#edit-game-dialog").close());
$("#edit-game-form").addEventListener("submit",event=>{event.preventDefault();activeGame.title=$("#edit-game-title").value.trim();activeGame.status=$("#edit-game-status").value;activeGame.isCompleted=activeGame.status==="Concluído";saveGames();$("#edit-game-dialog").close();openGame(activeGame.id);renderGames();showToast("Jogo atualizado!")});
$("#delete-game").addEventListener("click",()=>{if(!confirm(`Excluir ${activeGame.title} da biblioteca? Os dados locais relacionados a este jogo serão removidos.`))return;games=games.filter(game=>game.id!==activeGame.id);saveGames();$("#edit-game-dialog").close();activeGame=games[0]||null;renderGames();setView("library");showToast("Jogo excluído da biblioteca.")});

$("#edit-folder").addEventListener("click",()=>{const child=(subfolders[activeFolder]||[]).find(item=>item.id===activeSubfolder),folder=folders.find(item=>item.id===activeFolder),target=child||folder;$("#edit-folder-name").value=target.name;$("#edit-folder-color").value=target.color||folder.color;$("#edit-folder-color-value").textContent=$("#edit-folder-color").value.toUpperCase();$("#edit-folder-dialog").showModal()});
$("#edit-folder-color").addEventListener("input",event=>$("#edit-folder-color-value").textContent=event.target.value.toUpperCase());
$("#cancel-edit-folder").addEventListener("click",()=>$("#edit-folder-dialog").close());
$("#edit-folder-form").addEventListener("submit",event=>{event.preventDefault();const child=(subfolders[activeFolder]||[]).find(item=>item.id===activeSubfolder),folder=folders.find(item=>item.id===activeFolder),target=child||folder;target.name=$("#edit-folder-name").value.trim();target.color=$("#edit-folder-color").value;saveStructure();$("#edit-folder-dialog").close();renderFolders();renderNotes();showToast("Pasta atualizada!")});
$("#delete-folder").addEventListener("click",()=>{const isChild=Boolean(activeSubfolder),child=(subfolders[activeFolder]||[]).find(item=>item.id===activeSubfolder),folder=folders.find(item=>item.id===activeFolder),name=(child||folder).name,count=isChild?folderItems(activeFolder).filter(item=>item.subfolder===activeSubfolder).length:folderItems(activeFolder).length;if(!confirm(`Excluir ${name} e ${count} item(ns) relacionado(s)? Esta ação não pode ser desfeita.`))return;if(isChild){subfolders[activeFolder]=subfolders[activeFolder].filter(item=>item.id!==activeSubfolder);notes[activeFolder]=folderItems(activeFolder).filter(item=>item.subfolder!==activeSubfolder);activeSubfolder=null}else{if(folders.length===1){showToast("Mantenha pelo menos uma pasta principal.");return}folders=folders.filter(item=>item.id!==activeFolder);delete subfolders[activeFolder];delete notes[activeFolder];activeFolder=folders[0].id;activeSubfolder=null}saveStructure();$("#edit-folder-dialog").close();renderFolders();renderNotes();showToast("Pasta excluída.")});

function backupPayload(){return{app:"checkpoint",version:2,exportedAt:new Date().toISOString(),games,folders,subfolders,notes}}
$("#export-data").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(backupPayload(),null,2)],{type:"application/json"}),link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`checkpoint-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(link.href);showToast("Backup exportado!")});
$("#import-data").addEventListener("change",async event=>{const file=event.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.app!=="checkpoint"||!Array.isArray(data.games)||!Array.isArray(data.folders)||typeof data.notes!=="object")throw new Error("invalid");if(!confirm("Importar este backup substituirá os dados atuais deste navegador. Continuar?"))return;games=data.games;folders=data.folders;subfolders=data.subfolders||{};notes=data.notes;saveGames();saveStructure();activeGame=games[0]||null;activeFolder=folders[0]?.id||null;activeSubfolder=null;renderGames();updateDataSummary();showToast("Backup importado com sucesso!")}catch(error){showToast("Arquivo de backup inválido ou corrompido.")}finally{event.target.value=""}});
function updateDataSummary(){$("#data-summary").textContent=`${games.length} jogo(s), ${folders.length} pasta(s) e ${Object.values(notes).flat().length} item(ns) salvos neste navegador.`}
document.querySelector('[data-view="activity"]').addEventListener("click",updateDataSummary);

$("#change-banner").addEventListener("click",()=>{optimizedBannerImage=null;$("#banner-url").value=activeGame.cover;$("#banner-file").value="";$("#banner-file-status").hidden=true;$("#banner-dialog").showModal();setTimeout(()=>$("#banner-url").focus(),50)});
$("#cancel-banner").addEventListener("click",()=>$("#banner-dialog").close());
$("#banner-file").addEventListener("change",async event=>{optimizedBannerImage=await prepareImage(event.target,$("#banner-file-status"),{maxWidth:1920,maxHeight:1080,quality:.85})});
$("#banner-form").addEventListener("submit",async event=>{event.preventDefault();const file=$("#banner-file").files[0],url=$("#banner-url").value.trim();if(!file&&!url){showToast("Informe uma URL ou selecione uma imagem.");return}if(file&&!optimizedBannerImage){showToast("Aguarde a otimização da imagem.");return}const submit=event.submitter;submit.disabled=true;submit.textContent="Salvando...";try{const newCover=optimizedBannerImage?.dataUrl||url,oldCover=activeGame.cover;activeGame.cover=newCover;try{localStorage.setItem("checkpoint-games",JSON.stringify(games))}catch(error){activeGame.cover=oldCover;throw error}$("#hero-image").style.backgroundImage=`url("${newCover}")`;$("#banner-dialog").close();renderGames();showToast(file?"Imagem otimizada e banner atualizado!":"Banner atualizado pela URL!")}catch(error){showToast("Não foi possível salvar essa imagem. Tente um arquivo menor.")}finally{submit.disabled=false;submit.textContent="Salvar banner"}});
renderGames();

