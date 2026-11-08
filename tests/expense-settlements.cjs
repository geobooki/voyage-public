const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),root=path.resolve(__dirname,'..'),ts=require(root+'/node_modules/typescript');
function load(file,deps={}){const out={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:out,exports:out.exports,Intl,require:key=>deps[key]});return out.exports;}
const {expenseSettlements}=load('lib/expense-settlements.ts',{'./settlement':load('lib/settlement.ts')});
const travelers=[{id:'a',name:'민지'},{id:'b',name:'친구'}],expense={id:'lunch',name:'점심',amount:50000,currency:'KRW',payerId:'a',participantIds:['a','b'],date:'2026-11-08',time:'12:00',category:'식비',memo:''};
const records={splits:[{expenseId:'lunch',amounts:{a:10000,b:40000}}],payments:[{id:'partial',expenseId:'lunch',fromId:'b',toId:'a',amount:10000,currency:'KRW',date:'2026-11-08'}]};
let items=expenseSettlements([expense,{...expense,id:'dinner',name:'저녁'}],travelers,records);let lunch=items.find(x=>x.expense.id==='lunch'),dinner=items.find(x=>x.expense.id==='dinner');assert.equal(lunch.partial,true);assert.equal(lunch.transfers[0].amount,30000);assert.equal(dinner.transfers[0].amount,25000);assert.equal(dinner.payments.length,0);
records.payments.push({...records.payments[0],id:'rest',amount:30000});items=expenseSettlements([expense],travelers,records);assert.equal(items[0].complete,true);assert.equal(items[0].transfers.length,0);
records.payments.pop();assert.equal(expenseSettlements([expense],travelers,records)[0].partial,true);
records.payments=[{...records.payments[0],expenseId:undefined}];assert.equal(expenseSettlements([expense],travelers,records)[0].transfers[0].amount,40000);
records.payments=[{...records.payments[0],expenseId:'lunch',currency:'USD'}];assert.equal(expenseSettlements([expense],travelers,records)[0].valid,false);
console.log('PASS: per-expense partial amounts, no spillover to another expense, completion, undo, legacy unassigned payments and changed-currency warning');
