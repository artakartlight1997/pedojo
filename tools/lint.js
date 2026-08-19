const fs=require('fs');
global.window=global;
global.document={createElement:()=>({}),getElementById:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}};
global.localStorage={getItem:()=>null,setItem:()=>{}};
function load(p){ eval(fs.readFileSync(p,'utf8')); }
load('assets/md.js'); load('data/curriculum.js'); load('assets/loader.js');
load('data/glossary.js');
for(const f of fs.readdirSync('data/lectures')) load('data/lectures/'+f);
for(const f of fs.readdirSync('data/quiz')) load('data/quiz/'+f);

const all=DOJO.allQuestions(); const problems=[];
const badPatterns=[/上記のすべて/,/すべて正しい/,/A(と|、)B(の)?両方/,/以下のすべて/,/選択肢[ABCD]/,/次のうち二つ/];
// 日本語のはずの箇所に紛れ込んだキリル文字・ハングルを検出する
// （生成時に「резерв」「монイタリング」のような混入が実際に起きたため、恒久的に検査する）
const foreign=/[Ѐ-ӿ가-힯]|[组变说们电买卖场读习证实资评价视频讲两见时对开关问经济]/;
all.forEach(q=>{
  [['q',q.q],['exp',q.exp],...q.choices.map((c,i)=>['choice'+i,c])].forEach(([k,s])=>{
    const m=s.match(new RegExp('.{0,10}'+foreign.source+'+.{0,10}'));
    if(m) problems.push(q.id+' 非日本語文字の混入 ('+k+'): '+m[0]);
  });
  q.choices.forEach(c=>{ badPatterns.forEach(re=>{ if(re.test(c)) problems.push(q.id+' order-dependent choice: '+c); }); });
  if(q.choices.length<3) problems.push(q.id+' too few choices');
  if(!/[。？?]$/.test(q.q.trim())) problems.push(q.id+' q lacks terminal punctuation: '+q.q.slice(-20));
  if(q.exp.length<80) problems.push(q.id+' short exp ('+q.exp.length+')');
});
// per topic/level counts
console.log('total questions:', all.length, '| glossary:', DOJO.GLOSSARY.length);
let rows=[];
DOJO.TOPICS.forEach(t=>{
  const c=DOJO.LEVELS.map(l=>DOJO.questionsOf(t.id,l.id).length);
  const lec=DOJO.LECTURES[t.id]||{};
  const lecOk=['b','i','a'].every(k=>lec[k]&&lec[k].length>1500);
  rows.push([t.id.padEnd(8), String(c[0]).padStart(3), String(c[1]).padStart(3), String(c[2]).padStart(3), String(c[0]+c[1]+c[2]).padStart(4), lecOk?'lect OK':'LECTURE MISSING/SHORT'].join(' '));
});
console.log('topic   b   i   a  tot');
console.log(rows.join('\n'));
const lecChars = DOJO.TOPICS.reduce((s,t)=>s+['b','i','a'].reduce((a,k)=>a+((DOJO.LECTURES[t.id]||{})[k]||'').length,0),0);
console.log('total lecture characters:', lecChars.toLocaleString());
console.log(problems.length? 'PROBLEMS:\n'+problems.slice(0,40).join('\n')+(problems.length>40?`\n...(${problems.length} total)`:'') : 'lint clean');
