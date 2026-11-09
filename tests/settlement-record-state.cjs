const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),root=path.resolve(__dirname,'..'),ts=require(root+'/node_modules/typescript');
let slots=[],cursor=0,fetchImpl;
const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value}]},useRef(value){const i=cursor++;return slots[i]||=( {current:value})},useCallback:fn=>fn,useEffect:()=>{}};
const out={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/use-settlement-records.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:out,exports:out.exports,require:key=>key==='react'?react:{authenticatedFetch:(...args)=>fetchImpl(...args)},window:{dispatchEvent:()=>{}},Event:class{}});
function render(){cursor=0;return out.exports.useSettlementRecords('trip')}
const response=(data,ok=true)=>({ok,json:async()=>data});
(async()=>{let hook=render(),resolveOld;fetchImpl=()=>new Promise(resolve=>{resolveOld=resolve});const stale=hook.refresh();
fetchImpl=async()=>response({id:'payment',kind:'payment',data:{expenseId:'expense',fromId:'b',toId:'a',amount:10000,currency:'KRW',date:'2026-11-08'}});
await hook.mutate({id:'payment',kind:'payment'});hook=render();assert.equal(hook.records.payments.length,1);assert.equal(hook.records.payments[0].expenseId,'expense');assert.equal(hook.loading,false);
resolveOld(response({splits:[],payments:[]}));await stale;assert.equal(render().records.payments.length,1);
fetchImpl=async()=>response({error:'permission denied'},false);await assert.rejects(()=>render().mutate({id:'next'}),/permission denied/);assert.equal(render().records.payments.length,1);
fetchImpl=async()=>response({ok:true});await render().mutate({id:'payment'},true);assert.equal(render().records.payments.length,0);
react.useEffect=effect=>effect();let disabledFetches=0;fetchImpl=()=>{disabledFetches++;return Promise.resolve(response({splits:[],payments:[]}))};cursor=0;out.exports.useSettlementRecords('trip',false);assert.equal(disabledFetches,0);
console.log('PASS: server-confirmed settlement applies immediately, stale GET cannot revert it, rejected write preserves state, successful undo removes record');})().catch(error=>{console.error(error);process.exitCode=1});
