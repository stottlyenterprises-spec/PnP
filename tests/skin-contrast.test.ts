import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";

const css=readFileSync(join(process.cwd(),"app/globals.css"),"utf8");
const skins=["signature","forest","midnight","coastal","stage","focus"] as const;

function declarations(selector:string){
 const start=css.indexOf(`${selector}{`);
 assert.ok(start>=0,`Missing ${selector}`);
 const body=css.slice(start+selector.length+1,css.indexOf("}",start));
 return Object.fromEntries([...body.matchAll(/(--[\w-]+):([^;]+)/g)].map(([,name,value])=>[name,value.trim()]));
}

function rgb(value:string){
 const hex=value.slice(1);
 const expanded=hex.length===3?[...hex].map(character=>character.repeat(2)).join(""):hex;
 assert.match(expanded,/^[0-9a-f]{6}$/i,`Expected an opaque hex color, received ${value}`);
 return [0,2,4].map(offset=>Number.parseInt(expanded.slice(offset,offset+2),16)/255);
}

function luminance(value:string){
 const [red,green,blue]=rgb(value).map(channel=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4);
 return .2126*red+.7152*green+.0722*blue;
}

function contrast(first:string,second:string){
 const [light,dark]=[luminance(first),luminance(second)].sort((a,b)=>b-a);
 return (light+.05)/(dark+.05);
}

test("every atmosphere has readable primary, supporting, and button text",()=>{
 const defaults=declarations("main[data-skin]");
 for(const skin of skins){
  const tokens={...defaults,...(skin==="signature"?{}:declarations(`main[data-skin="${skin}"]`))};
  assert.ok(tokens["--skin-panel-solid"],`${skin} needs an opaque contrast reference`);
  assert.ok(tokens["--skin-panel-elevated"],`${skin} needs an elevated contrast layer`);
  assert.ok(contrast(tokens["--skin-ink"],tokens["--skin-panel-solid"])>=4.5,`${skin} primary copy fails WCAG AA`);
  assert.ok(contrast(tokens["--skin-muted"],tokens["--skin-panel-solid"])>=4.5,`${skin} supporting copy fails WCAG AA`);
  assert.ok(contrast(tokens["--skin-ink"],tokens["--skin-panel-elevated"])>=4.5,`${skin} primary copy fails on elevated cards`);
  assert.ok(contrast(tokens["--skin-muted"],tokens["--skin-panel-elevated"])>=4.5,`${skin} supporting copy fails on elevated cards`);
  assert.ok(contrast(tokens["--skin-accent"],tokens["--skin-on-accent"])>=4.5,`${skin} accent button copy fails WCAG AA`);
 }
});

test("legacy feature surfaces are covered by the atmosphere contract",()=>{
 const contract=css.slice(css.indexOf("/* Atmosphere contrast contracts"));
 for(const selector of [".reportHeader",".journalIntro",".taskCommandIntro",".relationshipRecommendation",".deedsWorkspaceStatus",".priorityEmpty",".listManager",".repeatBuilder",".deedsRefineOverlay"]){
  assert.ok(contract.includes(selector),`${selector} is not protected by the atmosphere contrast contract`);
 }
 assert.match(contract,/\.onboardingInterview[\s\S]+fixed light/i);
});
