/* fix.js — 修正が必要な問題について、伸ばすべき誤答だけを出す */
const fs=require('fs'); global.window=global;
global.document={createElement:()=>({}),getElementById:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}};
global.localStorage={getItem:()=>null,setItem:()=>{}};
function load(p){eval(fs.readFileSync(p,'utf8'));}
load('assets/md.js');load('data/curriculum.js');load('assets/loader.js');
for(const f of fs.readdirSync('data/quiz')) load('data/quiz/'+f);
const isNum=q=>q.choices.every(c=>/^[\d,.\s%〜~\-+xX×倍億万千円年か月日以上未満約程度]+$/.test(c));
const want=process.argv[2]||'';
DOJO.allQuestions().filter(q=>q.id.indexOf(want)===0&&!isNum(q)).forEach(q=>{
  const L=q.choices.map(c=>c.length), cl=L[q.a];
  const s=L.slice().sort((a,b)=>b-a);
  const needLong = cl===s[0] && cl>s[1]*1.10;
  const short = q.choices.map((c,i)=>i!==q.a&&s[0]/L[i]>1.35?i:-1).filter(i=>i>=0);
  if(!needLong && !short.length) return;
  console.log('■'+q.id+' 正解'+cl+'字: '+q.choices[q.a]);
  if(needLong){
    // 最長の誤答を伸ばす（目標 = 正解+3字以上）
    let bi=-1,bl=-1; q.choices.forEach((c,i)=>{if(i!==q.a&&L[i]>bl){bl=L[i];bi=i;}});
    console.log('  → ['+bi+'] を '+(cl+3)+'字以上に伸ばす: '+q.choices[bi]);
  }
  short.forEach(i=>{ if(L[i]<cl) console.log('  → ['+i+'] を '+Math.ceil(s[0]/1.35)+'字以上に伸ばす: '+q.choices[i]); });
});
