const fs=require("fs"),vm=require("vm"),assert=require("assert/strict"),path=require("path");
const root=path.resolve(__dirname,".."),ts=require(root+"/node_modules/typescript");
let authorized=true,calls=[],relatedExpenses=[];
const client={from(table){
 const query={select(fields){calls.push(["select",table,fields]);return query;},eq(key,value){calls.push(["eq",table,key,value]);return query;},upsert(row){calls.push(["upsert",table,row]);return query;},insert(row){calls.push(["insert",table,row]);return query;},update(row){calls.push(["update",table,row]);return query;},delete(){calls.push(["delete",table]);return query;},single(){return Promise.resolve({data:{id:"saved"},error:null});},then(resolve){return Promise.resolve({data:table==="expenses"?relatedExpenses:[],error:null}).then(resolve);}};return query;
}};
function load(file){
 const module={exports:{}};
 const deps={"next/server":{NextResponse:{json:(data,options)=>({data,status:options?.status||200})}},"@/lib/supabase-request":{requireRequestUser:async()=>authorized?{client}:{error:"Unauthorized"}},"@/lib/trip-id":{resolveTripIdForRequest:async()=>"trip-id"}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,require:key=>deps[key],URL,Date});
 return module.exports;
}
const expenses=load("app/api/trips/[tripId]/expenses/route.ts"),travelers=load("app/api/trips/[tripId]/travelers/route.ts");
const context={params:Promise.resolve({tripId:"my-trip"})},id="11111111-1111-4111-8111-111111111111";
const request=(body={},query="")=>({url:"https://example.test/api?"+query,json:async()=>body});
(async()=>{
 authorized=false;
 assert.equal((await expenses.POST(request(),context)).status,401);
 assert.equal((await travelers.PATCH(request(),context)).status,401);
 authorized=true;calls=[];
 const payload={id,date:"2026-11-07",time:"12:30",amount:350000,currency:"VND",paymentMethod:"카드",placeId:"place-id",payerId:"person",participantIds:["person"]};
 assert.equal((await expenses.POST(request(payload),context)).status,201);
 const inserted=calls.find(x=>x[0]==="upsert")[2];
 assert.equal(inserted.spent_at,"2026-11-07T12:30:00");assert.equal(inserted.payment_method,"카드");assert.equal(inserted.place_id,"place-id");assert.equal(inserted.participant_ids[0],"person");
 calls=[];
 assert.equal((await expenses.PATCH(request(payload),context)).status,200);
 assert(calls.some(x=>x[0]==="eq"&&x[2]==="id"&&x[3]===id));assert(calls.some(x=>x[0]==="eq"&&x[2]==="trip_id"&&x[3]==="trip-id"));
 assert.equal(calls.find(x=>x[0]==="update")[2].place_id,"place-id");
 assert.equal((await travelers.POST(request({name:"민지"}),context)).status,201);
 assert.equal((await travelers.PATCH(request({id,name:"수정한 이름"}),context)).status,200);
 relatedExpenses=[{payer_id:id,participant_ids:[]}];calls=[];
 assert.equal((await travelers.DELETE(request({},"id="+id),context)).status,409);assert(!calls.some(x=>x[0]==="delete"));
 relatedExpenses=[{payer_id:null,participant_ids:[id]}];
 assert.equal((await travelers.DELETE(request({},"id="+id),context)).status,409);
 relatedExpenses=[];
 assert.equal((await travelers.DELETE(request({},"id="+id),context)).status,200);
 console.log("PASS: authenticated writes, selected date/time, payment method, activity place link, expense editing by body id, trip scope, traveler rename and referenced traveler protection");
})().catch(error=>{console.error(error);process.exitCode=1;});
