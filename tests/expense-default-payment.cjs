const fs=require("fs"),vm=require("vm"),assert=require("assert/strict"),path=require("path");
const root=path.resolve(__dirname,".."),ts=require(root+"/node_modules/typescript");
let authenticated=true,fail=false;
const rows=[{payment_method:null},{payment_method:""},{payment_method:"현금"},{payment_method:"송금"},{payment_method:"카드"}];
const client={from(table){assert.equal(table,"expenses");return {update(values,options){assert.equal(values.payment_method,"카드");assert.equal(options.count,"exact");return {async or(filter){assert.equal(filter,'payment_method.is.null,payment_method.eq.""');if(fail)return {error:{message:"Database unavailable"}};let count=0;for(const row of rows)if(row.payment_method==null||row.payment_method===""){row.payment_method=values.payment_method;count++;}return {count,error:null};}};}};}};
const moduleResult={exports:{}};
const dependencies={"next/server":{NextResponse:{json:(data,options)=>({data,status:options?.status||200})}},"@/lib/supabase-request":{requireRequestUser:async()=>authenticated?{client}:{error:"Unauthorized"}}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+"/app/api/expenses/default-payment/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:moduleResult,exports:moduleResult.exports,require:name=>dependencies[name]});
(async()=>{
 const post=moduleResult.exports.POST;
 authenticated=false;assert.equal((await post({})).status,401);
 authenticated=true;let result=await post({});assert.equal(result.status,200);assert.equal(result.data.updated,2);
 assert.deepEqual(rows.map(row=>row.payment_method),["카드","카드","현금","송금","카드"]);
 result=await post({});assert.equal(result.data.updated,0);
 fail=true;assert.equal((await post({})).status,400);
 console.log("PASS: authenticated backfill, null/empty converted, assigned methods preserved, repeat-safe update, database failure");
})().catch(error=>{console.error(error);process.exitCode=1;});
