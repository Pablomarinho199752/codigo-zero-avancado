import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={window:{},document:{getElementById:()=>null}};
runInNewContext(file('aulas-zero-1.js'),ctx,{filename:'aulas-zero-1.js'});
runInNewContext(file('aulas-zero-2.js'),ctx,{filename:'aulas-zero-2.js'});
runInNewContext(file('cloud-sync.js'),ctx,{filename:'cloud-sync.js'});
const merge=ctx.window.CodigoZeroCloudSync.mergeStates;
const merged=merge({current:1,savedAt:'2026-10-08T10:00:00.000Z',editAt:'2026-10-08T10:00:00.000Z',quiz:{z0:true},notes:{z2:'rascunho antigo'},draft:{z3:'print(1)'}},{current:3,savedAt:'2026-10-09T10:00:00.000Z',editAt:'2026-10-09T10:00:00.000Z',quiz:{z1:true},notes:{z2:'rascunho novo'},draft:{z4:'print(2)'}});
assert.equal(merged.current,3,'A mesclagem deve manter a aula mais avançada');
assert.ok(merged.quiz.z0&&merged.quiz.z1,'A mesclagem deve preservar conclusões de ambos os aparelhos');
assert.equal(merged.notes.z2,'rascunho novo','A anotação mais recente deve prevalecer');
assert.equal(merged.draft.z3,'print(1)','A mesclagem deve preservar rascunhos exclusivos do aparelho local');
assert.equal(merged.draft.z4,'print(2)','A mesclagem deve preservar rascunhos exclusivos da nuvem');
const modules=ctx.window.ZERO_MODULOS;
assert.ok(Array.isArray(modules),'Os módulos precisam existir');
const lessons=modules.flatMap(m=>m.aulas);
assert.equal(lessons.length,79,'Esperamos 79 aulas introdutórias reais');
const titles=new Set();
let codeTasks=0;
for(const [mi,m] of modules.entries()){
 assert.ok(typeof m.nome==='string'&&m.nome.length>6,'Módulo com nome inválido');
 assert.ok(m.aulas.length>=6,'Módulo curto demais: '+mi);
 for(const [li,a] of m.aulas.entries()){
  assert.ok(a.length===9||a.length===10,'Aula sem campos necessários: '+mi+'/'+li);
  const [title,idea,analogy,walk,question,choices,answer,why,hint,practice]=a;
  for(const [name,value] of Object.entries({title,idea,analogy,walk,question,why,hint})){
   assert.ok(typeof value==='string'&&value.length>=({title:6,idea:20,analogy:12,walk:12,question:8,why:10,hint:10}[name]),'Texto insuficiente ('+name+'): '+title);
  }
  assert.ok(!titles.has(title),'Aula duplicada: '+title);titles.add(title);
  assert.ok(Array.isArray(choices)&&choices.length>=3,'Alternativas insuficientes: '+title);
  assert.ok(choices.every(c=>typeof c==='string'&&c.length>0),'Alternativa vazia: '+title);
  assert.ok(Number.isInteger(answer)&&answer>=0&&answer<choices.length,'Resposta errada: '+title);
  if(practice){
   codeTasks++;
   assert.ok(typeof practice.codigo==='string'&&practice.codigo.length>5,'Exemplo de código vazio');
   assert.ok(typeof practice.desafio==='string'&&practice.desafio.length>12,'Falta enunciado prático');
   assert.ok(Array.isArray(practice.regras)&&practice.regras.length>=2,'Faltam verificações');
  }
 }
}
assert.ok(codeTasks>=10,'Pouca prática de código');
const beginner=file('index.html'),advanced=file('curso-completo.html'),sw=file('sw.js'),cloud=file('cloud-sync.js'),rules=file('firestore.rules');
for(const path of ['aulas-zero-1.js','aulas-zero-2.js','app-zero.js','zero.css']){
 assert.ok(beginner.includes(path),'Página inicial não carrega '+path);
 assert.ok(sw.includes(path),'Offline não inclui '+path);
}
assert.ok(advanced.includes('bootstrap.js')&&advanced.includes('firebase-tutor-setup.js'),'Tutor do curso original não preservado');
assert.ok(beginner.includes('cloud-sync.js')&&beginner.includes('syncBtn')&&beginner.includes('syncDialog'),'Tela de sincronização não integrada');
assert.ok(sw.includes('cloud-sync.js'),'Service worker não inclui a sincronização');
assert.ok(cloud.includes('signInWithEmailAndPassword')&&cloud.includes('createUserWithEmailAndPassword'),'Login e criação de conta ausentes');
assert.ok(cloud.includes("collection('users').doc(uid).collection('progress').doc('fundamentals')"),'Caminho do progresso na nuvem ausente');
assert.ok(rules.includes('request.auth.uid == userId')&&rules.includes("progressId == 'fundamentals'"),'Regras não restringem o progresso ao dono da conta');
assert.ok(sw.includes('curso-completo.html'),'Curso original não disponível offline');
console.log('OK:',modules.length,'módulos;',lessons.length,'aulas;',codeTasks,'atividades de código; sincronização e regras Firebase verificadas.');
