import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={window:{}};
runInNewContext(file('aulas-zero-1.js'),ctx,{filename:'aulas-zero-1.js'});
runInNewContext(file('aulas-zero-2.js'),ctx,{filename:'aulas-zero-2.js'});
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
   assert.ok(typeof value==='string'&&value.length>=15,'Texto insuficiente ('+name+'): '+title);
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
const beginner=file('index.html'),advanced=file('curso-completo.html'),sw=file('sw.js');
for(const path of ['aulas-zero-1.js','aulas-zero-2.js','app-zero.js','zero.css']){
 assert.ok(beginner.includes(path),'Página inicial não carrega '+path);
 assert.ok(sw.includes(path),'Offline não inclui '+path);
}
assert.ok(advanced.includes('bootstrap.js')&&advanced.includes('firebase-tutor-setup.js'),'Tutor do curso original não preservado');
assert.ok(sw.includes('curso-completo.html'),'Curso original não disponível offline');
console.log('OK:',modules.length,'módulos;',lessons.length,'aulas;',codeTasks,'atividades de código; curso original e offline preservados.');
