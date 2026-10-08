/* Código Zero: trilha introdutória. Sem bibliotecas, sem login, salva no aparelho.
 * Ensino progressivo: teoria -> exemplo -> pergunta -> prática -> próximo passo.
 * O verificador de escrita confere elementos, não executa Python/HTML.
 */
(()=>{'use strict';
const KEY='codigoZeroFundamentosV1';
const modules=window.ZERO_MODULOS||[];
const lessons=[];
modules.forEach((m,mi)=>m.aulas.forEach((a,li)=>lessons.push({id:'z'+lessons.length,mod:mi,index:li,raw:a})));
const count=lessons.length;
// O APK Capacitor pode desenhar sob a barra de status do Android.
if(window.Capacitor?.isNativePlatform?.()) document.documentElement.classList.add('native-app');
const $=id=>document.getElementById(id);
const el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);return n};
const link=(label,href,cls='secondary')=>{const a=el('a',cls,label);a.href=href;a.style.textDecoration='none';a.style.display='inline-flex';a.style.alignItems='center';a.style.justifyContent='center';return a};
let state={done:[],quiz:{},code:{},answers:{},attempts:{},current:0,theme:'light',zoom:1,notes:{},introSeen:false};
try{
 const saved=JSON.parse(localStorage.getItem(KEY)||'null');
 if(saved&&typeof saved==='object'&&!Array.isArray(saved))state={...state,...saved};
}catch(e){console.warn('O progresso anterior não pôde ser lido.',e)}
state.done=Array.isArray(state.done)?state.done.filter(v=>typeof v==='string'): [];
for(const key of ['quiz','code','answers','attempts','notes'])if(!state[key]||typeof state[key]!=='object'||Array.isArray(state[key]))state[key]={};
state.current=Number.isInteger(state.current)?Math.max(0,Math.min(count-1,state.current)):0;
state.zoom=Number.isFinite(state.zoom)?Math.max(.9,Math.min(1.45,state.zoom)):1;
state.theme=state.theme==='dark'?'dark':'light';
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(err){console.warn('Sem espaço para salvar o progresso',err)}};
const hasCode=l=>Boolean(l.raw[9]&&typeof l.raw[9]==='object');
const complete=l=>Boolean(state.quiz[l.id]&&(!hasCode(l)||state.code[l.id]));
const firstLocked=()=>{for(let i=0;i<count;i++){if(!complete(lessons[i]))return i}return count};
const available=i=>i>=0&&i<count&&(i<=firstLocked()||complete(lessons[i]));
const btn=(name,cls,fn)=>{const b=el('button',cls,name);b.type='button';b.addEventListener('click',fn);return b};
function styleSetup(){
 document.documentElement.classList.toggle('dark',state.theme==='dark');
 document.documentElement.style.setProperty('--zoom',String(state.zoom));document.documentElement.style.fontSize=(16*state.zoom)+'px';
 $('themeBtn').textContent=state.theme==='dark'?'☀ Tema claro':'☾ Tema escuro';
}
function refreshProgress(){
 let done=0;for(const l of lessons)if(complete(l))done++;
 $('progressText').textContent=done+' de '+count+' aulas';
 $('progressBar').style.width=(count?100*done/count:0)+'%';
 $('progressBar').parentElement.setAttribute('aria-valuenow',String(done));
 $('progressBar').parentElement.setAttribute('aria-valuemax',String(count));
 $('progressBar').parentElement.setAttribute('aria-valuemin','0');
 const next=firstLocked();
 $('nextRecommended').textContent=next<count?'Próxima etapa: '+lessons[next].raw[0]:'Você terminou os fundamentos! Agora vá ao curso completo.';
}
function navRender(){
 const nav=$('lessonMenu');nav.replaceChildren();
 modules.forEach((m,mi)=>{
  const label=el('div','module-label',m.nome+' · '+m.aulas.filter((_,li)=>complete(lessons.find(x=>x.mod===mi&&x.index===li))).length+'/'+m.aulas.length);
  nav.append(label);
  lessons.filter(l=>l.mod===mi).forEach(l=>{
    const b=el('button','lesson-link'+(complete(l)?' completed':'')+(l===lessons[state.current]?' current':'')+(!available(lessons.indexOf(l))?' locked':''));
    b.type='button';b.setAttribute('aria-current',l===lessons[state.current]?'step':'false');
    const symbol=el('span','marker',complete(l)?'✓':available(lessons.indexOf(l))?'•':'🔒');symbol.setAttribute('aria-hidden','true');
    b.append(symbol,el('span','',l.raw[0]));
    b.addEventListener('click',()=>{const i=lessons.indexOf(l);if(!available(i)){alert('Vamos por partes: conclua as aulas anteriores primeiro.');return}go(i)});
    nav.append(b);
  });
 });
}
function notice(box,type,heading,body){
 box.replaceChildren();
 box.className='feedback '+(type||'');
 if(heading)box.append(el('strong','',heading));
 if(body)box.append(el('span','',body));
 box.setAttribute('role','status');
}
let chosen=-1;
function render(){
 const l=lessons[state.current];if(!l)return;
 chosen=Number.isInteger(state.answers[l.id])?state.answers[l.id]:-1;
 $('stepLabel').textContent='Aula '+(state.current+1)+'/'+count+' · '+modules[l.mod].nome;
 $('sectionName').textContent=modules[l.mod].descricao;
 const body=$('lessonContent');body.replaceChildren();
 const header=el('div','lesson-header');
 header.append(el('div','eyebrow',complete(l)?'✓ Aula concluída':'Aprendizado passo a passo'),el('h1','',l.raw[0]),el('p','goal','Objetivo: '+l.raw[1]));
 body.append(header);
 const concept=el('section');
 concept.append(sectionTitle('1','Entenda a ideia'));
 concept.append(el('p','',l.raw[1]));
 concept.append(sectionTitle('2','Veja um exemplo'));
 const ex=el('div','example');ex.append(el('strong','','Exemplo explicado'),el('p','',l.raw[2]));concept.append(ex);
 const videoRow=el('div','action-row video-link-row');
 videoRow.append(btn('▶ Buscar videoaula deste assunto','secondary',openVideoForCurrent));
 concept.append(videoRow,el('p','mini-note','Vídeo opcional em português: abre uma busca no YouTube. A seleção ainda não é individualmente verificada.'));
 concept.append(sectionTitle('3','Ligue as ideias'));
 concept.append(el('div','story',l.raw[3]));
 if(hasCode(l)){
  const codeBlock=el('div','');
  codeBlock.append(sectionTitle('4','Leia o exemplo de código'));
  codeBlock.append(el('p','mini-note','Leia cada linha com calma. Não precisa decorar tudo agora.'));
  codeBlock.append(el('pre','',l.raw[9].codigo));
  concept.append(codeBlock);
 }
 body.append(concept);
 const quiz=el('section','quiz-section');quiz.append(sectionTitle(hasCode(l)?'5':'4','Agora é sua vez'));
 quiz.append(el('p','quiz-question',l.raw[4]));
 const options=el('div','options'),feedback=el('div','feedback');
 const letters=['A','B','C','D'];
 l.raw[5].forEach((o,i)=>{
  const b=el('button','option'+(chosen===i?' selected':''));b.type='button';
  b.setAttribute('aria-pressed',chosen===i?'true':'false');
  b.append(el('b','',letters[i]),el('span','',o));
  b.addEventListener('click',()=>{
   chosen=i;state.answers[l.id]=i;save();
   [...options.children].forEach((c,j)=>{c.classList.toggle('selected',j===i);c.setAttribute('aria-pressed',j===i?'true':'false')});
  });
  options.append(b);
 });
 quiz.append(options);
 if(state.quiz[l.id])notice(feedback,'success','Você entendeu!','Resposta correta. '+l.raw[7]);
 else notice(feedback,'','','Escolha uma resposta. Se precisar, peça uma dica.');
 quiz.append(feedback);
 const actions=el('div','action-row');
 actions.append(btn('Conferir resposta','primary',()=>{
  if(chosen===-1){notice(feedback,'error','Falta escolher','Toque em uma alternativa antes de conferir.');return}
  if(chosen===l.raw[6]){
   state.quiz[l.id]=true;save();
   notice(feedback,'success','Boa! Você acertou.',l.raw[7]);
   afterSuccess(l);
  }else{
   state.attempts[l.id]=(state.attempts[l.id]||0)+1;save();
   notice(feedback,'error','Ainda não. Vamos entender.',state.attempts[l.id]>1?'Dica: '+l.raw[8]:'Releia o exemplo acima e tente mais uma vez.');
  }
 }));
 actions.append(btn('Quero uma dica','secondary',()=>notice(feedback,'','Dica para pensar',l.raw[8])));
 quiz.append(actions);
 body.append(quiz);
 if(hasCode(l))makePractice(l,body);
 const notes=el('section','');notes.append(sectionTitle('✎','Meu resumo'));
 notes.append(el('p','helper','Escreva com suas palavras o que você entendeu. Isso ajuda mais do que copiar.'));
 const textarea=el('textarea','editor');textarea.style.minHeight='95px';textarea.style.background='var(--card)';textarea.style.color='var(--ink)';textarea.style.border='1px solid var(--line)';
 textarea.setAttribute('aria-label','Meu resumo desta aula');textarea.placeholder='Hoje aprendi que...';textarea.value=state.notes[l.id]||'';
 textarea.addEventListener('input',()=>{state.notes[l.id]=textarea.value;save()});notes.append(textarea);body.append(notes);
 $('previousBtn').disabled=state.current===0;
 $('nextBtn').disabled=!complete(l)||state.current===count-1;
 $('nextBtn').textContent=state.current===count-1?'Trilha concluída':'Próxima aula →';
 $('statusLine').textContent=complete(l)?'✓ Aula aprendida. Você pode avançar.':'Para seguir, responda à pergunta'+(hasCode(l)?' e pratique o código':'')+'.';
 refreshProgress();navRender();
}
function sectionTitle(mark,title){const h=el('h2','section-label');h.append(el('span','',mark),document.createTextNode(title));return h}
function afterSuccess(l){
 if(complete(l)){if(!state.done.includes(l.id))state.done.push(l.id);save()}
 $('statusLine').textContent=complete(l)?'✓ Aula aprendida. Você pode avançar.':'Falta só conferir a atividade prática.';
 $('nextBtn').disabled=!complete(l)||state.current===count-1;
 refreshProgress();navRender();
}
function makePractice(l,root){
 const data=l.raw[9],pr=el('section','practice');
 pr.append(sectionTitle('6','Vamos praticar sem copiar'));
 pr.append(el('p','',data.desafio));
 const code=el('textarea','editor');code.setAttribute('aria-label','Escreva sua tentativa de código');
 code.spellcheck=false;code.placeholder='Escreva seu próprio código aqui, linha por linha...';
 code.value=state['draft']?.[l.id]||'';
 code.addEventListener('input',()=>{state.draft=state.draft||{};state.draft[l.id]=code.value;save()});
 pr.append(code);
 const fb=el('div','feedback');
 if(state.code[l.id])notice(fb,'success','Atividade conferida','Os elementos essenciais foram encontrados. O teste final do funcionamento deverá ser feito em um ambiente da linguagem.');
 else notice(fb,'','','Não se preocupe com a velocidade. Primeiro tente escrever sozinho.');
 pr.append(fb);
 const act=el('div','action-row');
 act.append(btn('Conferir minha tentativa','primary',()=>{
   const normalized=code.value.normalize('NFC').toLowerCase().replace(/\r/g,'');
   const missing=(data.regras||[]).filter(s=>!normalized.includes(s.toLowerCase()));
   if(missing.length){notice(fb,'error','Tem algo para revisar','Confira o enunciado. Talvez falte: '+missing.slice(0,2).map(x=>'"'+x+'"').join(' e ')+'.');return}
   state.code[l.id]=true;save();notice(fb,'success','Boa tentativa!','Você incluiu as partes essenciais. Esta ferramenta não executa Python/HTML e não prova que o programa funciona; confira o comportamento no laboratório do curso completo.');
   afterSuccess(l);
 }));
 act.append(btn('Ver exemplo novamente','secondary',()=>{const example=root.querySelector('pre');if(example)example.scrollIntoView({behavior:'smooth',block:'center'})}));
 pr.append(act,el('p','mini-note','Verificação introdutória de estrutura: não substitui executar o programa, encontrar erros e testar o resultado.'));
 root.append(pr);
}
function hideWelcome(){
 state.introSeen=true;
 $('welcome').hidden=true;
 $('welcome').classList.add('hidden');
}
function go(i){
 if(!available(i))return;
 state.current=i;
 hideWelcome();save();render();window.scrollTo({top:0,behavior:'instant'});$('sidebar').classList.remove('open');
}
function firstVisit(){
 const shouldShow=!state.introSeen&&state.current===0&&!Object.keys(state.quiz).some(k=>state.quiz[k]);
 $('welcome').hidden=!shouldShow;
 $('welcome').classList.toggle('hidden',!shouldShow);
}
function openVideoForCurrent(){
 const l=lessons[state.current];
 const subject=l.raw[0];
 const prefix=l.mod===2||l.mod===10?'matemática básica do zero':l.mod===3||l.mod===4||l.mod===5||l.mod===6?'Curso em Vídeo Python iniciantes':l.mod===0?'informática básica para iniciantes':'programação para iniciantes';
 const url='https://www.youtube.com/results?search_query='+encodeURIComponent(prefix+' '+subject+' explicação português');
 window.open(url,'_blank','noopener,noreferrer');
}
function installButtons(){
 $('menuBtn').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
 $('themeBtn').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';save();styleSetup()});
 $('fontPlus').addEventListener('click',()=>{state.zoom=Math.min(1.45,Math.round((state.zoom+.1)*10)/10);save();styleSetup()});
 $('fontMinus').addEventListener('click',()=>{state.zoom=Math.max(.9,Math.round((state.zoom-.1)*10)/10);save();styleSetup()});
 $('previousBtn').addEventListener('click',()=>go(state.current-1));
 $('nextBtn').addEventListener('click',()=>go(state.current+1));
 $('resumeBtn').addEventListener('click',()=>go(firstLocked()<count?firstLocked():state.current));
 $('introBtn').addEventListener('click',()=>{const welcome=$('welcome');welcome.hidden=false;welcome.classList.remove('hidden');$('sidebar').classList.remove('open');welcome.scrollIntoView({behavior:'smooth',block:'start'})});
 $('reviewBtn').addEventListener('click',()=>{
   const pending=lessons.findIndex(l=>(state.attempts[l.id]||0)>0&&!complete(l));
   if(pending>=0)go(pending);else alert('Não há erros pendentes de revisão. Você pode rever as aulas pelo menu.');
 });
 $('videoBtn').addEventListener('click',openVideoForCurrent);
 $('exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({course:'codigo-zero-fundamentos',version:1,exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='codigo-zero-meu-progresso.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
 });
 $('importInput').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{
   const imported=JSON.parse(await f.text());
   if(imported.course!=='codigo-zero-fundamentos'||!imported.data||typeof imported.data!=='object')throw new Error('Este arquivo não é um progresso da trilha inicial.');
   const d=imported.data;
   if(!Array.isArray(d.done)||!d.quiz||typeof d.quiz!=='object'||!d.code||typeof d.code!=='object')throw new Error('Dados incompletos.');
   if(!confirm('Importar este progresso? O progresso atual dos fundamentos será substituído.'))return;
   state={...state,...d};state.current=0;save();styleSetup();render();firstVisit();alert('Progresso importado.');
  }catch(err){alert('Falha ao importar: '+String(err.message||err))}
  e.target.value='';
 });
 $('aiBtn').addEventListener('click',async()=>{
  const l=lessons[state.current].raw;
  const context='Estou começando a aprender programação do zero. Aula: '+l[0]+'. Explicação: '+l[1]+'. Pergunta: '+l[4]+'. Explique em português simples, dê dicas graduais e não entregue a resposta imediatamente.';
  try{await navigator.clipboard.writeText(context);alert('Copiei o contexto da aula. Abra o Tutor Gemini no curso completo e cole a mensagem.');}
  catch(_){alert('No curso completo, abra Tutor IA e diga que está estudando: '+l[0]);}
  location.href='curso-completo.html';
 });
}
function start(){
 if(!count){document.body.textContent='Não foi possível abrir as aulas. Atualize a página.';return}
 const safe=firstLocked();if(state.current>safe&&!complete(lessons[state.current]))state.current=safe;
 styleSetup();installButtons();render();firstVisit();
}
start();
})();