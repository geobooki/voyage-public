const fs=require("fs"),vm=require("vm"),assert=require("assert/strict");
const root=require("path").resolve(__dirname,"..");
const ts=require(root+"/node_modules/typescript");
function compile(path, deps={}) {
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+"/"+path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,require:(name)=>deps[name],Intl,URLSearchParams,AbortSignal,Date,process,fetch:(...args)=>global.fetch(...args)});
 return module.exports;
}
const destinations=compile("lib/destinations.ts"),helpers=compile("lib/weather-destination.ts");
assert.equal(destinations.destinationCountryCode("한국"),"KR");
assert.equal(destinations.destinationCountryCode("South Korea"),"KR");
assert(destinations.popularDestinationCities("대한민국").includes("서귀포"));
assert(!destinations.popularDestinationCities("일본").includes("서울"));
const today=new Date().toISOString().slice(0,10);
const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
const stay={id:"hotel",title:"Test hotel",type:"stay",location:"16.0125892,108.2637747",date:today,end_date:tomorrow};
assert.equal(helpers.stayForWeatherDate([stay],today).id,"hotel");
assert.equal(helpers.stayForWeatherDate([stay],tomorrow),undefined);
let trip={city:"다낭",country:"베트남",start_date:today,end_date:today}, reservations=[stay],saved;
const client={from(table){const chain={select(){return chain},eq(){return chain},order(){return chain},limit(){return Promise.resolve({data:reservations})},single(){return Promise.resolve({data:trip})},upsert(rows){saved=rows;return Promise.resolve({error:null})}};return chain;}};
const knownLocations={};
const route=compile("app/api/trips/[tripId]/weather/auto/route.ts",{
 "next/server":{NextResponse:{json:(data,init)=>({data,status:init?.status||200})}},
 "@/lib/supabase-request":{requireRequestUser:async()=>({client})},
 "@/lib/trip-id":{resolveTripIdForRequest:async(id)=>id},
 "@/lib/destinations":destinations,"@/lib/destination-locations.json":{default:knownLocations},"@/lib/weather-destination":helpers
});
const context={params:Promise.resolve({tripId:"test"})};
const forecast={daily:{time:[today],temperature_2m_max:[28],weather_code:[1]}};
(async()=>{
 let calls=[];
 global.fetch=async(url)=>{calls.push(url);if(url.includes("geocoding-api"))return {ok:true,json:async()=>({results:[{latitude:16.06778,longitude:108.22083,country_code:"VN",feature_code:"PPL",timezone:"Asia/Ho_Chi_Minh"}]})};return {ok:true,json:async()=>forecast};};
 let result=await route.GET({},context);
 assert.equal(result.status,200);assert.equal(result.data.weather[0].locationSource,"city");assert.equal(calls.length,2);assert(calls[0].includes("countryCode=VN"));
 let forecasts=0;
 global.fetch=async(url)=>{if(url.includes("geocoding-api"))return {ok:true,json:async()=>({results:[{latitude:16,longitude:108,country_code:"VN",feature_code:"PPL"}]})};forecasts++;return forecasts===1?{ok:false}:{ok:true,json:async()=>forecast};};
 result=await route.POST({},context);
 assert.equal(result.status,200);assert.equal(result.data.weather[0].locationSource,"stay");assert.equal(forecasts,2);assert.equal(saved[0].locationSource,undefined);
 global.fetch=async(url)=>url.includes("geocoding-api")?{ok:true,json:async()=>({results:[{latitude:1,longitude:2,country_code:"US",feature_code:"PPL"}]})}:{ok:true,json:async()=>forecast};
 result=await route.GET({},context);assert.equal(result.data.weather[0].locationSource,"stay");
 knownLocations["VN:다낭"]={latitude:16,longitude:108,country_code:"VN"};
 let cachedCalls=0;global.fetch=async(url)=>{assert(!url.includes("geocoding-api"));cachedCalls++;return {ok:true,json:async()=>forecast};};
 result=await route.GET({},context);assert.equal(result.data.weather[0].locationSource,"city");assert.equal(cachedCalls,1);
 trip={...trip,start_date:"2030-01-01",end_date:"2030-01-02"};
 result=await route.GET({},context);assert.equal(result.status,200);assert.equal(result.data.weather.length,0);
 console.log("PASS: country/city catalog, country filtering, city priority, hotel fallback after forecast failure or wrong country, save payload, forecast date limits");
})().catch(error=>{console.error(error);process.exitCode=1});
