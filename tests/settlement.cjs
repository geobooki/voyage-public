const fs=require("fs"),vm=require("vm"),assert=require("assert/strict"),path=require("path");
const root=path.resolve(__dirname,".."),ts=require(root+"/node_modules/typescript"),out={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+"/lib/settlement.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:out,exports:out.exports,Intl});
const {calculateSettlements,currencyDigits}=out.exports;
const people=[{id:"a",name:"민지"},{id:"b",name:"동행"},{id:"c",name:"동행"}];
let next=0;
const expense=(amount,currency="KRW",payerId="a",participantIds=["a","b","c"])=>({id:String(next++),amount,currency,payerId,participantIds,category:"식비",date:"2026-11-07",time:"12:00",memo:""});
function balanced(group){
 const factor=10**group.digits,remaining=new Map(group.balances.map(p=>[p.id,Math.round(p.balance*factor)]));
 assert.equal(group.balances.reduce((sum,p)=>sum+Math.round(p.paid*factor),0),group.balances.reduce((sum,p)=>sum+Math.round(p.owed*factor),0));
 for(const t of group.transfers){assert(t.amount>0);const units=Math.round(t.amount*factor);remaining.set(t.fromId,remaining.get(t.fromId)+units);remaining.set(t.toId,remaining.get(t.toId)-units);}
 for(const amount of remaining.values())assert.equal(amount,0);
}
let result=calculateSettlements([expense(10000)],people),group=result.groups[0];
assert.equal(group.transfers.length,2);assert.equal(group.balances[0].owed,3334);assert.equal(group.transfers[0].amount,3333);balanced(group);
result=calculateSettlements([expense(10,"USD"),expense(900,"JPY"),expense(120000,"VND")],people);
assert.equal(result.groups.length,3);for(const g of result.groups)balanced(g);
assert.equal(currencyDigits("USD"),2);assert.equal(currencyDigits("JPY"),0);assert.equal(currencyDigits("KRW"),0);assert.equal(currencyDigits("VND"),0);
group=result.groups.find(g=>g.currency==="USD");assert.equal(group.balances[0].owed,3.34);
result=calculateSettlements([expense(100,"KRW","a",["b","c"])],people);assert.equal(result.groups[0].balances[0].owed,0);balanced(result.groups[0]);
result=calculateSettlements([expense(100,"KRW",undefined,[]),expense(100,"KRW","missing",["a"]),expense(100,"KRW","a",[]),expense(100,"KRW","a",["a","removed"]),expense(NaN)],people);
assert.equal(result.excluded.length,5);assert.equal(result.includedCount,0);assert.equal(result.groups.length,0);
group=calculateSettlements([expense(100,"KRW","a",["a","b","b"])],people).groups[0];assert.equal(group.balances[1].owed,50);balanced(group);
group=calculateSettlements([expense(100),expense(-100)],people).groups[0];assert.equal(group.transfers.length,0);balanced(group);
assert.equal(calculateSettlements([],[]).includedCount,0);
assert.equal(calculateSettlements([expense(1.005,"USD")],people).groups[0].total,1.01);
assert.equal(calculateSettlements([expense(10.075,"USD")],people).groups[0].total,10.08);
assert.equal(calculateSettlements([expense(1e-7,"USD")],people).groups[0].total,0);
assert.equal(calculateSettlements([{...expense(10),payerId:undefined}],people).excluded[0].reason,"payer");
// Across uneven cent amounts, applying the suggested transfers must clear every balance.
for(let amount=1;amount<120;amount++){group=calculateSettlements([expense(amount/100,"USD","c")],people).groups[0];balanced(group);}
console.log("PASS: equal shares, exact remainder allocation, currency precision, multiple currencies, payer outside participants, missing details, duplicate names/ids, refunds and transfer conservation");
