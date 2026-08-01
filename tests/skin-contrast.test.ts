import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";

const css=readFileSync(join(process.cwd(),"app/globals.css"),"utf8");
const page=readFileSync(join(process.cwd(),"app/page.tsx"),"utf8");
const skins=["signature","forest","midnight","coastal","stage","focus","aurora","solstice","nebula","kintsugi","blueprint","velvet"] as const;

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

test("every atmosphere has readable text across panels, controls, navigation, and semantic states",()=>{
 const defaults=declarations("main[data-skin]");
 for(const skin of skins){
  const tokens={...defaults,...(skin==="signature"?{}:declarations(`main[data-skin="${skin}"]`))};
  for(const token of ["--skin-panel-solid","--skin-panel-elevated","--skin-control-solid","--skin-side-a","--skin-side-b"]){
   assert.ok(tokens[token],`${skin} needs ${token} as an opaque contrast reference`);
  }
  for(const surface of ["--skin-panel-solid","--skin-panel-elevated","--skin-control-solid"]){
   assert.ok(contrast(tokens["--skin-ink"],tokens[surface])>=4.5,`${skin} primary copy fails on ${surface}`);
   assert.ok(contrast(tokens["--skin-muted"],tokens[surface])>=4.5,`${skin} supporting copy fails on ${surface}`);
  }
  for(const surface of ["--skin-panel-solid","--skin-panel-elevated"]){
   assert.ok(contrast(tokens["--skin-accent"],tokens[surface])>=4.5,`${skin} linked/accent copy fails on ${surface}`);
   assert.ok(contrast(tokens["--skin-warm-text"],tokens[surface])>=4.5,`${skin} warm/status copy fails on ${surface}`);
  }
  for(const surface of ["--skin-side-a","--skin-side-b"]){
   assert.ok(contrast(tokens["--skin-dark-copy"],tokens[surface])>=4.5,`${skin} navigation copy fails on ${surface}`);
   assert.ok(contrast(tokens["--skin-dark-muted"],tokens[surface])>=4.5,`${skin} supporting navigation copy fails on ${surface}`);
  }
  assert.ok(contrast(tokens["--skin-accent"],tokens["--skin-on-accent"])>=4.5,`${skin} accent button copy fails WCAG AA`);
 }
});

test("adaptive atmosphere stages are all represented by audited skins",()=>{
 const adaptive=page.match(/const adaptiveSkin:SkinId=([^;]+);/)?.[1]||"";
 for(const skin of ["midnight","coastal","signature","stage"]){
  assert.ok(adaptive.includes(`"${skin}"`),`${skin} is missing from the adaptive atmosphere schedule`);
  assert.ok(skins.includes(skin),`${skin} is not included in the contrast matrix`);
 }
});

test("placeholders, disabled controls, focus, and navigation use readable theme tokens",()=>{
 const contract=css.slice(css.indexOf("/* Readability contract"));
 assert.ok(contract.length>0,"Missing final readability contract");
 assert.match(contract,/::placeholder[\s\S]+var\(--skin-muted\)!important[\s\S]+opacity:1!important/);
 assert.match(contract,/button:disabled[\s\S]+var\(--skin-muted\)!important[\s\S]+opacity:1!important/);
 assert.match(contract,/nav button[\s\S]+var\(--skin-dark-muted\)/);
 assert.match(contract,/:focus-visible[\s\S]+outline:3px solid/);
});

test("legacy feature surfaces are covered by the atmosphere contract",()=>{
 const contract=css.slice(css.indexOf("/* Atmosphere contrast contracts"));
 for(const selector of [".reportHeader",".journalIntro",".taskCommandIntro",".relationshipRecommendation",".deedsWorkspaceStatus",".priorityEmpty",".listManager",".repeatBuilder",".deedsRefineOverlay"]){
  assert.ok(contract.includes(selector),`${selector} is not protected by the atmosphere contrast contract`);
 }
 assert.match(contract,/\.onboardingInterview[\s\S]+fixed light/i);
});

test("the app defines one cohesive surface hierarchy",()=>{
 for(const token of ["--surface-line","--surface-radius","--surface-inset-radius","--surface-shadow","--surface-inset-shadow"]){
  assert.ok(css.includes(token),`Missing shared surface token ${token}`);
 }
 const hierarchy=css.slice(css.indexOf("/* Cohesive surface hierarchy"));
 for(const selector of [".card",".reportHeader",".relationshipIntro",".dataProtectionCard",".relationshipActions button",".taskCategoryGroup"]){
  assert.ok(hierarchy.includes(selector),`${selector} is outside the shared surface hierarchy`);
 }
 assert.match(hierarchy,/border:1px solid var\(--surface-line\)!important/);
});

test("nested forms and empty inboxes keep the compact layout contract",()=>{
 const hierarchy=css.slice(css.indexOf("/* Cohesive surface hierarchy"),css.indexOf("/* Nested layout wrappers"));
 for(const selector of [".journalForm",".reviewForm",".businessIncome",".pipeline",".everyday"]){
  assert.ok(!hierarchy.includes(`${selector},`),`${selector} must not become a second card inside its parent`);
 }
 const nested=css.slice(css.indexOf("/* Nested layout wrappers"));
 for(const selector of [".goalCreate",".journalForm",".reviewForm",".businessIncome",".pipeline",".everyday"]){
  assert.ok(nested.includes(selector),`${selector} is missing the nested-layout reset`);
 }
 assert.match(nested,/\.mailInbox>\.empty[\s\S]+min-height:112px[\s\S]+padding:24px 20px/);
});

test("reported compact-layout controls keep explicit app styling",()=>{
 for(const selector of [".accountAccessActions",".calendarIntro>.primary",".goalMeasureRow",".goalCheckIn"]){
  assert.ok(css.includes(selector),`${selector} is missing its compact-layout treatment`);
 }
 assert.match(css,/\.stockTicker article\.up[\s\S]+#39a56e/);
 assert.match(css,/\.stockTicker article\.down[\s\S]+#d85864/);
});

test("the mobile journal keeps every entry field in normal document flow",()=>{
 assert.match(css,/\.journalForm>\.primary\{position:static;[\s\S]+min-height:50px/);
 assert.match(css,/@media\(max-width:600px\)\{\.journalForm\{[^}]*padding-bottom:18px\}\.journalForm textarea\{min-height:170px\}/);
 const journal=page.slice(page.indexOf('{view==="journal"'));
 const body=journal.indexOf('What is here today?');
 const tags=journal.indexOf('>Tags<input');
 const save=journal.indexOf('Save journal entry');
 assert.ok(body>=0&&tags>body&&save>tags,"Journal fields must render body, tags, then Save");
});

test("selected controls never rely on a subtle color shift alone",()=>{
 const selection=css.slice(css.indexOf("/* High-clarity selection language"));
 assert.ok(selection.length>0,"Missing shared selection language");
 for(const signal of [
  "border:2px solid",
  "background:var(--skin-accent)!important",
  "color:var(--skin-on-accent)!important",
  "0 0 0 3px",
  'content:"●"',
  "font-weight:800",
 ]){
  assert.ok(selection.includes(signal),`Selected controls are missing ${signal}`);
 }
 for(const selector of [".modeSwitch button.active",".calendarToolbar>div button.active",".tap.selected",".skinGallery button.selected"]){
  assert.ok(selection.includes(selector),`${selector} is outside the shared selected-state treatment`);
 }
});

test("the signed-in restoring screen follows the active atmosphere",()=>{
 const restore=css.slice(css.indexOf("/* Account restoration belongs to the active atmosphere"));
 assert.ok(restore.length>0,"Missing themed account restoration");
 for(const token of ["--skin-side-a","--skin-side-b","--skin-panel-strong","--skin-panel-solid","--skin-ink","--skin-muted","--skin-accent"]){
  assert.ok(restore.includes(`var(${token})`),`Restore screen does not use ${token}`);
 }
 assert.ok(restore.includes(".accountGatewayLayer.restoring"));
 assert.ok(restore.includes(".accountRestoreOrbit"));
});

test("semantic phase variation survives the shared surface system",()=>{
 const atmosphere=css.slice(css.indexOf("/* Semantic atmosphere"));
 for(const phase of ["direction","explore","enable","drive","sustain"]){
  assert.ok(atmosphere.includes(`--phase-${phase}`),`Missing ${phase} tone`);
  assert.ok(atmosphere.includes(`.${phase}Section`),`Missing ${phase} D.E.E.D.S. surface`);
 }
});

test("every selectable skin has tokens, artwork, launch treatment, and a preview",()=>{
 for(const skin of skins){
  assert.ok(page.includes(`{id:"${skin}"`),`${skin} is missing from the selector`);
  if(skin!=="signature")assert.ok(css.includes(`main[data-skin="${skin}"]{`),`${skin} is missing theme tokens`);
  assert.ok(css.includes(`main[data-skin="${skin}"]:before`),`${skin} is missing backdrop artwork`);
  if(skin!=="signature")assert.ok(css.includes(`main[data-skin="${skin}"] .osLaunch`),`${skin} is missing command center artwork`);
  if(skin!=="signature")assert.ok(css.includes(`.skin-${skin} .skinPreview`),`${skin} is missing its gallery preview`);
 }
});
