(()=>{
const $=s=>document.querySelector(s);
const CATS={"Food delivery":["swiggy","zomato","doordash","ubereats","deliveroo"],"Groceries":["grocery","bigbasket","dmart","walmart","tesco","blinkit","zepto","supermarket"],"Eating out":["restaurant","cafe","coffee","starbucks","mcdonald","kfc","domino","pizza"],"Transport":["uber","ola ","fuel","petrol","metro","bus","rapido","taxi"],"Shopping":["amazon","flipkart","myntra","mall","store"],"Subscriptions":["netflix","spotify","prime","hotstar","youtube","subscription"],"Bills":["rent","electric","water","internet","wifi","recharge","bill","insurance"],"Health":["pharmacy","doctor","hospital","gym","medic"],"Fun":["movie","cinema","game","concert"],"Other":[]};
const NAMES=Object.keys(CATS);
let S={tx:[],budget:0,cur:"₹"},sel="";
try{Object.assign(S,JSON.parse(localStorage.getItem("tally")||"{}"))}catch(e){}
const save=()=>{try{localStorage.setItem("tally",JSON.stringify(S))}catch(e){}};
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const mkey=d=>ymd(d).slice(0,7);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>S.cur+Math.round(n).toLocaleString(S.cur==="₹"?"en-IN":"en-US");
const parts=m=>m.split("-").map(Number);
const prevM=m=>{const [y,mo]=parts(m);return mkey(new Date(y,mo-2,1))};
const label=m=>{const [y,mo]=parts(m);return new Date(y,mo-1,1).toLocaleString("en",{month:"long",year:"numeric"})};
const guess=t=>{const l=t.toLowerCase()+" ";for(const c of NAMES)if(CATS[c].some(k=>l.includes(k)))return c;return"Other"};
const inM=m=>S.tx.filter(t=>t.date.slice(0,7)===m);
const byCat=(m,lim=32)=>{const o={};inM(m).filter(t=>+t.date.slice(8,10)<=lim).forEach(t=>o[t.cat]=(o[t.cat]||0)+t.amount);return o};
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const msg=t=>{$("#msg").textContent=t};

function ctx(m){const now=new Date(),isCur=m===mkey(now);return{isCur,day:now.getDate(),cur:byCat(m),prv:byCat(prevM(m),isCur?now.getDate():32),ref:isCur?"at this point last month":"last month"}}

function insights(m){
  const {isCur,day,cur,prv,ref}=ctx(m),tc=sum(cur),tp=sum(prv),out=[];
  if(!tc)return out;
  const mv=[];
  for(const c of new Set([...Object.keys(cur),...Object.keys(prv)])){
    const a=cur[c]||0,b=prv[c]||0,d=a-b;
    if(b>0&&Math.abs(d)>=Math.max(.03*tc,100)&&Math.abs(d/b)>=.2)mv.push({c,a,b,d,p:Math.round(Math.abs(d/b)*100)});
  }
  mv.sort((x,y)=>Math.abs(y.d)-Math.abs(x.d));
  mv.filter(x=>x.d>0).forEach(x=>out.push({t:"up",x:`You spent ${x.p}% more on ${x.c.toLowerCase()} this month (${fmt(x.a)} vs ${fmt(x.b)} ${ref}). Matching last month would save you ${fmt(x.d)}.`}));
  if(tp>0){const p=Math.round((tc-tp)/tp*100);
    out.push({t:p>5?"up":p<-5?"down":"info",x:Math.abs(p)<=5?`Your spending is about the same as ${ref} (${fmt(tc)} vs ${fmt(tp)}).`:`Overall you spent ${Math.abs(p)}% ${p>0?"more":"less"} than ${ref} (${fmt(tc)} vs ${fmt(tp)}).`});}
  mv.filter(x=>x.d<0).forEach(x=>out.push({t:"down",x:`Nice work: ${x.c.toLowerCase()} is down ${x.p}% (${fmt(x.a)} vs ${fmt(x.b)} ${ref}).`}));
  const top=Object.entries(cur).sort((a,b)=>b[1]-a[1])[0];
  out.push({t:"info",x:`${top[0]} is your biggest slice at ${Math.round(top[1]/tc*100)}% of everything you spent.`});
  const big=inM(m).sort((a,b)=>b.amount-a.amount)[0];
  out.push({t:"info",x:`Your biggest single expense was ${esc(big.desc)} at ${fmt(big.amount)}.`});
  if(isCur&&day>=7){const dim=new Date(parts(m)[0],parts(m)[1],0).getDate(),pr=tc/day*dim;
    out.push({t:S.budget&&pr>S.budget?"up":"info",x:`At this pace you'll spend about ${fmt(pr)} by the end of the month.`});}
  if(S.budget>0){const left=S.budget-tc;
    out.push(left>=0?{t:"info",x:`You've used ${Math.round(tc/S.budget*100)}% of your budget. ${fmt(left)} left.`}:{t:"up",x:`You're over budget by ${fmt(-left)}.`});}
  return out;
}

function render(){
  const months=[...new Set([mkey(new Date()),...S.tx.map(t=>t.date.slice(0,7))])].sort().reverse();
  if(!sel||!months.includes(sel))sel=months.find(m=>inM(m).length)||months[0];
  $("#month").innerHTML=months.map(m=>`<option value="${m}"${m===sel?" selected":""}>${label(m)}</option>`).join("");
  $("#cur").value=S.cur;$("#fBud").value=S.budget||"";
  const {cur,prv}=ctx(sel),tc=sum(cur),tpFull=sum(byCat(prevM(sel))),ins=insights(sel);
  $("#headline").textContent=ins.length?ins[0].x:"Add a few expenses and I'll tell you where your money goes.";
  $("#sub").textContent=ins.length?`Here's what stands out in ${label(sel)}.`:"Load the sample data to see how Tally talks.";
  $("#sSpent").textContent=fmt(tc);$("#sPrev").textContent=tpFull?fmt(tpFull):"–";
  $("#sBudL").textContent=S.budget&&S.budget<tc?"Over budget by":"Budget left";
  $("#sBud").textContent=S.budget?fmt(Math.abs(S.budget-tc)):"Not set";
  const cats=Object.entries(cur).sort((a,b)=>b[1]-a[1]),max=cats.length?cats[0][1]:1;
  $("#bars").innerHTML=cats.length?cats.map(([c,a])=>{const b=prv[c]||0,p=b?Math.round((a-b)/b*100):0,
    chip=b&&Math.abs(p)>=5?`<span class="chip ${p>0?"up":"down"}">${p>0?"+":""}${p}%</span>`:"";
    return`<div class="row"><div class="l"><span>${c}</span><span>${fmt(a)}${chip}</span></div><div class="track"><i style="width:${a/max*100}%"></i></div></div>`}).join(""):`<p class="empty">Nothing here yet. Add an expense or load the sample data.</p>`;
  $("#notes").innerHTML=ins.length?ins.map(i=>`<li class="${i.t}">${i.x}</li>`).join(""):`<li class="info empty">Your notes will show up here once you add expenses.</li>`;
  const rows=inM(sel).sort((a,b)=>b.date.localeCompare(a.date));
  $("#tx").innerHTML=rows.length?rows.map(t=>`<li><span class="d">${new Date(t.date+"T00:00").toLocaleDateString("en",{day:"numeric",month:"short"})}</span><span>${esc(t.desc)}<small>${t.cat}</small></span><span class="a">${fmt(t.amount)}</span><button data-id="${t.id}" aria-label="Delete ${esc(t.desc)}">✕</button></li>`).join(""):`<li class="empty">No expenses in ${label(sel)}.</li>`;
}

function parseCSV(t){const rows=[];let r=[],c="",q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
    else if(ch=='"')q=true;else if(ch==","){r.push(c);c=""}
    else if(ch=="\n"||ch=="\r"){if(ch=="\r"&&t[i+1]=="\n")i++;r.push(c);rows.push(r);r=[];c=""}else c+=ch}
  if(c||r.length){r.push(c);rows.push(r)}return rows.filter(x=>x.some(v=>v.trim()))}
function pd(s){s=s.trim();const m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  const d=m?new Date(+(m[3].length==2?"20"+m[3]:m[3]),m[2]-1,+m[1]):new Date(s);return isNaN(d)?null:d}

function demo(){const d=new Date(),td=d.getDate(),
  mk=(off,rows)=>rows.map(([day,desc,amount,cat])=>({id:uid(),date:ymd(new Date(d.getFullYear(),d.getMonth()+off,off===0?Math.min(day,td):day)),desc,amount,cat}));
  S.tx=[...mk(-1,[[2,"Rent",12000,"Bills"],[3,"Swiggy",450,"Food delivery"],[6,"BigBasket",1800,"Groceries"],[9,"Zomato",520,"Food delivery"],[11,"Uber",380,"Transport"],[14,"Netflix",649,"Subscriptions"],[16,"Zomato",610,"Food delivery"],[18,"Cafe",420,"Eating out"],[21,"Amazon",1900,"Shopping"],[24,"Swiggy",520,"Food delivery"],[26,"DMart",1700,"Groceries"],[28,"Movie",600,"Fun"]]),
  ...mk(0,[[1,"Rent",12000,"Bills"],[2,"Swiggy",700,"Food delivery"],[3,"BigBasket",1900,"Groceries"],[4,"Zomato",640,"Food delivery"],[5,"Uber",520,"Transport"],[6,"Netflix",649,"Subscriptions"],[7,"Zomato",820,"Food delivery"],[8,"Cafe",380,"Eating out"],[9,"Swiggy",590,"Food delivery"],[10,"Amazon",1200,"Shopping"],[11,"DMart",1500,"Groceries"]])];
  S.budget=S.budget||30000;save();sel="";render();msg("Sample data loaded.")}

$("#fCat").innerHTML='<option value="">Auto-detect</option>'+NAMES.map(c=>`<option>${c}</option>`).join("");
$("#fDate").value=ymd(new Date());
$("#month").onchange=e=>{sel=e.target.value;render()};
$("#cur").onchange=e=>{S.cur=e.target.value;save();render()};
$("#add").onsubmit=e=>{e.preventDefault();const desc=$("#fDesc").value.trim(),amount=parseFloat($("#fAmt").value);
  if(!desc||!(amount>0))return;S.tx.push({id:uid(),date:$("#fDate").value,desc,amount,cat:$("#fCat").value||guess(desc)});
  sel=$("#fDate").value.slice(0,7);save();$("#fDesc").value="";$("#fAmt").value="";render();msg("Expense added.")};
$("#bud").onsubmit=e=>{e.preventDefault();S.budget=Math.max(0,parseFloat($("#fBud").value)||0);save();render();msg("Budget saved.")};
$("#tx").onclick=e=>{const id=e.target.dataset&&e.target.dataset.id;if(!id)return;S.tx=S.tx.filter(t=>t.id!==id);save();render();msg("Expense deleted.")};
$("#demo").onclick=()=>{if(!S.tx.length||confirm("This replaces your current expenses with sample data. Continue?"))demo()};
$("#clear").onclick=()=>{if(confirm("Delete all expenses and your budget from this browser?")){S.tx=[];S.budget=0;save();sel="";render();msg("All data cleared.")}};
$("#file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{const rows=parseCSV(String(r.result));if(rows.length<2)return msg("That file looks empty.");
    const h=rows[0].map(x=>x.trim().toLowerCase()),ix=re=>h.findIndex(x=>re.test(x));
    const di=ix(/date/),ni=ix(/desc|narration|merchant|detail|payee|name|particular/),ai=ix(/amount|debit|withdraw|spent/),ci=ix(/categ/);
    if(di<0||ai<0)return msg("The first row needs columns named date and amount. Description and category are optional.");
    let n=0;rows.slice(1).forEach(x=>{const d=pd(x[di]||""),a=Math.abs(parseFloat(String(x[ai]||"").replace(/[^0-9.\-]/g,"")));
      if(!d||!a)return;const desc=((ni>=0?x[ni]:"")||"Expense").trim();
      S.tx.push({id:uid(),date:ymd(d),desc,amount:a,cat:ci>=0&&NAMES.includes((x[ci]||"").trim())?x[ci].trim():guess(desc)});n++});
    save();sel="";render();msg(`Imported ${n} expenses.`)};
  r.readAsText(f);e.target.value=""};
$("[for=file]").onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();$("#file").click()}};
render();
})();
