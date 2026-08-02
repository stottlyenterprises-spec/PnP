export const PERSONAL_HOUSEHOLD_MIGRATION = "personal-household-areas-v2";
const PREVIOUS_PERSONAL_HOUSEHOLD_MIGRATION = "personal-household-areas-v1";

type RepeatUnit = "day" | "week" | "month" | "year";
type TaskLike = {id:string;title:string;notes?:string;section:string;listId?:string;categoryId?:string;scheduledDate?:string;recurring?:boolean;recurringDays?:string[];repeatInterval?:number;repeatUnit?:RepeatUnit;repeatAnchor?:string;done:boolean;created:string;completed?:string;[key:string]:unknown};
type CategoryLike = {id:string;title:string;section:string;listId?:string;order:number};
type ListLike = {id:string;title:string};
type Cadence = "weekly"|"monthly"|"quarterly"|"semiannual";
type Seed = {title:string;area:string;cadence:Cadence;notes?:string};
type Timing = {cadence?:Cadence|"daily";notes:string};

const areas=["Kitchen","Bathrooms","Bedrooms","Living Spaces","Office","Laundry & Utility","Garage","Exterior","Back Patio & Lanai","Pool & Spa","Outdoor Play Area","Whole House","Other Household"];
const weekdays=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const key=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const slug=(value:string)=>key(value).replace(/ /g,"-");
const addDays=(date:string,count:number)=>{const value=new Date(`${date}T12:00:00`);value.setDate(value.getDate()+count);return value.toISOString().slice(0,10)};
const weekday=(date:string)=>{const value=new Date(`${date}T12:00:00`);return weekdays[(value.getDay()+6)%7]};

const legacyTitles:Record<string,string>={
 "exterior back clean patio":"Back patio floor: Wash hard surfaces",
 "exterior back clean grill":"Outdoor grill: Clean exterior, grease tray, and surrounding surface",
 "exterior back wash pool deck":"Pool deck: Wash surface",
 "exterior back wipe outdoor furniture":"Outdoor furniture: Clean and inspect condition",
 "exterior back inspect fence":"Pool boundary: Inspect fence, screen doors, gates, and latches",
 "exterior back clean pool equipment area":"Pool equipment area: Clear debris and maintain safe access",
 "garage sweep floor":"Garage floor: Sweep or vacuum debris",
 "garage pressure wash floor if needed":"Garage floor: Wash surface when appropriate",
 "garage organize shelves":"Garage shelving: Organize by use and hazard type",
 "garage dispose of chemicals properly":"Garage chemicals: Review for safe disposal",
 "garage inventory tools":"Garage tools: Inventory and return tools to storage",
};

const clearerTitles:Record<string,string>={
 "deep clean kitchen air fryer":"Air fryer: Deep-clean basket and accessible surfaces",
 "deep clean kitchen refrigerator":"Refrigerator: Deep clean interior",
 "deep clean kitchen pantry":"Pantry: Deep clean shelves and storage",
 "deep clean kitchen cabinets":"Kitchen cabinets: Wipe fronts and organize interiors",
 "deep clean kitchen appliances":"Kitchen appliances: Clean accessible exterior surfaces",
 "deep clean kitchen sink":"Kitchen sink: Deep clean basin, drain, and fixtures",
 "deep clean kitchen floors":"Kitchen floor: Deep clean edges and under movable items",
 "toss expired food":"Refrigerator: Toss expired food",
 "remove shelves and drawers":"Refrigerator: Remove shelves and drawers",
 "wash with warm water and dish soap":"Refrigerator: Wash shelves and drawers with warm soapy water",
 "wipe door seals":"Refrigerator: Wipe door seals",
 "vacuum condenser coils if accessible":"Refrigerator: Vacuum condenser coils if accessible",
 "ceiling fans":"Whole house: Dust ceiling fans",
 "air vents":"Whole house: Clean accessible air vents",
 "baseboards":"Whole house: Clean baseboards",
 "window tracks":"Whole house: Clean window tracks",
 "under furniture":"Whole house: Clean under movable furniture",
 "refrigerator shelves":"Refrigerator: Clean shelves",
 "pantry check":"Pantry: Check expiration dates and organization",
 "descale coffee maker":"Coffee maker: Descale according to manufacturer guidance",
 "dishwasher cleaning cycle":"Dishwasher: Run cleaning cycle and clean filter",
 "garbage disposal cleaning":"Garbage disposal: Clean and deodorize safely",
 "replace hvac filter":"HVAC: Replace filter",
 "wash curtains":"Whole house: Wash or clean curtains",
 "rotate mattresses":"Bedrooms: Rotate mattresses",
 "deep clean oven":"Oven: Deep clean interior",
 "deep clean refrigerator":"Refrigerator: Deep clean interior",
 "clean washing machine":"Washing machine: Run cleaning cycle",
 "vacuum behind appliances":"Kitchen: Vacuum behind accessible appliances",
 "pressure wash exterior":"Exterior: Pressure wash appropriate surfaces",
 "clean gutters":"Exterior: Clean gutters",
 "inspect roof":"Exterior: Visually inspect roof from a safe location",
 "clean dryer vent":"Dryer exhaust: Clean accessible vent path",
 "steam clean carpets":"Whole house: Steam clean carpets",
 "polish wood furniture":"Whole house: Polish wood furniture",
};

const cadenceDetails:Record<Cadence|"daily",string>={
 daily:"Suggested timing: daily.",weekly:"Suggested timing: weekly.",monthly:"Suggested timing: monthly.",quarterly:"Suggested timing: every 3 months.",semiannual:"Suggested timing: every 6 months."
};
const timingFor=(title:string):Timing=>{const value=key(title);
 if(/make beds|empty dishwasher|wipe kitchen counters|one load of laundry|return items to their proper place|quick bathroom|five minute floor|empty trash if full/.test(value))return{cadence:"daily",notes:cadenceDetails.daily};
 if(/toss expired|refrigerator clean shelves|pantry check expiration|coffee maker|dishwasher|garbage disposal|ceiling fan|air vent|baseboard|window track|under movable furniture|air fryer|kitchen cabinets|kitchen appliances|kitchen sink|kitchen floor|cleaning supplies|photo eyes|charging area|floor sweep|cobweb|pool equipment area|pool filter|pool deck wash|outdoor furniture|back patio floor wash|back patio storage|lanai tracks/.test(value))return{cadence:"monthly",notes:cadenceDetails.monthly};
 if(/condenser coil|dryer exhaust|steam clean carpet|polish wood|pressure wash exterior|clean gutter|inspect roof|seasonal storage|identify items to donate|lanai enclosure inspect/.test(value))return{cadence:"semiannual",notes:cadenceDetails.semiannual};
 if(/remove shelves|wash shelves|wipe door seals|deep clean refrigerator|deep clean shelves|wash curtains|rotate mattress|deep clean oven|washing machine|vacuum behind|hvac|garage shelving|garage storage|garage tools|garage door visually|garage door seals|garage entry|garage chemicals|fire extinguisher|visible pests|water intrusion|overhead storage|back patio windows|back patio lighting|lanai screens and frames|mildew|patio umbrella/.test(value))return{cadence:"quarterly",notes:cadenceDetails.quarterly};
 if(/back patio return|back patio table|back patio chairs|back patio floor sweep|outdoor grill clean cooking|pool skim|pool brush|pool and spa brush|pool vacuum|pool empty|pool check water|pool test|pool equipment inspect|pool toys|pool deck remove|pool boundary|outdoor play|garage return|garage clear|garage trash/.test(value))return{cadence:"weekly",notes:cadenceDetails.weekly};
 return{notes:"Suggested timing: schedule as needed."};
};
const appendTiming=(notes:string|undefined,timing:string)=>{const current=(notes||"").trim();if(/suggested timing:/i.test(current))return current;return[current,timing].filter(Boolean).join("\n")};
const repeatFor=(cadence:Timing["cadence"])=>cadence?{unit:cadence==="daily"?"day" as const:cadence==="weekly"?"week" as const:"month" as const,interval:cadence==="quarterly"?3:cadence==="semiannual"?6:1}:null;
const suggestedAnchor=(title:string,cadence:Timing["cadence"],today:string)=>{if(cadence==="daily")return today;const hash=[...key(title)].reduce((total,char)=>total+char.charCodeAt(0),0),span=cadence==="weekly"?7:cadence==="monthly"?28:cadence==="quarterly"?75:150,minimum=cadence==="weekly"?1:cadence==="monthly"?3:cadence==="quarterly"?14:30;return addDays(today,minimum+(hash%span))};

const monthlyMoves:Record<string,{title:string;area:string;cadence?:Cadence;notes?:string}>={
 "clear ac line":{title:"HVAC drain line: Clear and inspect",area:"Laundry & Utility",cadence:"monthly"},
 "paint bedroom":{title:"Bedroom: Paint planned room",area:"Bedrooms",notes:"One-time household project. Schedule a date when ready."},
 "downstairs bathroom":{title:"Downstairs bathroom: Complete planned work",area:"Bathrooms",notes:"One-time household project. Add the specific work to this note."},
 "paint door":{title:"Door: Paint planned door",area:"Other Household",notes:"One-time household project. Note which door before scheduling."},
 "pool black algae hunt":{title:"Pool: Address visible black algae",area:"Pool & Spa",notes:"Condition-based task. Follow pool professional and product guidance."},
 "bug spray":{title:"Exterior perimeter: Apply pest treatment as appropriate",area:"Exterior",cadence:"quarterly",notes:"Follow product, safety, weather, pet, and professional guidance."},
 "tree and bush trim":{title:"Exterior landscaping: Trim trees and bushes as appropriate",area:"Exterior",cadence:"quarterly",notes:"Use qualified help for height, power lines, or hazardous limbs."},
};

const seeds:Seed[]=[
 {title:"Back patio: Return loose items to their homes",area:"Back Patio & Lanai",cadence:"weekly"},
 {title:"Back patio table: Wipe and sanitize surface",area:"Back Patio & Lanai",cadence:"weekly"},
 {title:"Back patio chairs: Wipe seats, arms, and backs",area:"Back Patio & Lanai",cadence:"weekly"},
 {title:"Back patio floor: Sweep or vacuum loose debris",area:"Back Patio & Lanai",cadence:"weekly"},
 {title:"Back patio floor: Wash hard surfaces",area:"Back Patio & Lanai",cadence:"monthly"},
 {title:"Back patio storage: Wipe and organize shelving",area:"Back Patio & Lanai",cadence:"monthly"},
 {title:"Back patio windows: Clean exterior glass, frames, and sills",area:"Back Patio & Lanai",cadence:"quarterly"},
 {title:"Back patio: Remove cobwebs from walls, corners, and eaves",area:"Back Patio & Lanai",cadence:"monthly"},
 {title:"Back patio lighting: Clean and inspect string lights and fixtures",area:"Back Patio & Lanai",cadence:"quarterly"},
 {title:"Back patio trash: Empty and wash receptacle when needed",area:"Back Patio & Lanai",cadence:"monthly"},
 {title:"Back patio planters: Remove debris and tidy pots",area:"Back Patio & Lanai",cadence:"monthly"},
 {title:"Outdoor grill: Clean cooking grates",area:"Back Patio & Lanai",cadence:"weekly"},
 {title:"Outdoor grill: Clean exterior, grease tray, and surrounding surface",area:"Back Patio & Lanai",cadence:"monthly"},
 {title:"Outdoor grill: Visually inspect fuel connection and condition before use",area:"Back Patio & Lanai",cadence:"monthly",notes:"Visual check only. Qualified service handles any gas-system concern."},
 {title:"Lanai screens: Brush or vacuum loose debris",area:"Back Patio & Lanai",cadence:"monthly"},
 {title:"Lanai screens and frames: Wash gently",area:"Back Patio & Lanai",cadence:"quarterly"},
 {title:"Lanai tracks and drainage channels: Clear debris",area:"Back Patio & Lanai",cadence:"monthly"},
 {title:"Lanai enclosure: Inspect screens, doors, fasteners, and visible tears",area:"Back Patio & Lanai",cadence:"semiannual"},
 {title:"Lanai enclosure: Treat visible mildew or algae with a surface-safe method",area:"Back Patio & Lanai",cadence:"quarterly"},
 {title:"Pool: Skim surface debris",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool: Brush waterline and tile",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool and spa: Brush steps, walls, and ledges",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool: Vacuum floor",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool: Empty skimmer and pump baskets",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool: Check water level",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool: Test and record water chemistry",area:"Pool & Spa",cadence:"weekly",notes:"Record results. Follow equipment, product, and professional guidance for treatment quantities."},
 {title:"Pool equipment: Inspect visible condition and check for leaks",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool equipment area: Clear debris and maintain safe access",area:"Pool & Spa",cadence:"monthly"},
 {title:"Pool filter: Clean according to equipment guidance",area:"Pool & Spa",cadence:"monthly"},
 {title:"Pool toys and floats: Rinse, dry, and store",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool deck: Remove toys, tools, and trip hazards",area:"Pool & Spa",cadence:"weekly"},
 {title:"Pool deck: Wash surface",area:"Pool & Spa",cadence:"monthly"},
 {title:"Outdoor furniture: Clean and inspect condition",area:"Pool & Spa",cadence:"monthly"},
 {title:"Patio umbrella: Clean fabric and inspect frame and base",area:"Pool & Spa",cadence:"quarterly"},
 {title:"Pool boundary: Inspect fence, screen doors, gates, and latches",area:"Pool & Spa",cadence:"monthly"},
 {title:"Outdoor play area: Gather and organize toys",area:"Outdoor Play Area",cadence:"weekly"},
 {title:"Playhouse: Wash exterior and accessible interior surfaces",area:"Outdoor Play Area",cadence:"monthly"},
 {title:"Playhouse and outdoor toys: Inspect for loose parts, sharp edges, insects, and other visible hazards",area:"Outdoor Play Area",cadence:"monthly"},
 {title:"Garage: Return loose items to their assigned storage",area:"Garage",cadence:"weekly"},
 {title:"Garage: Clear floor, doors, and walking paths",area:"Garage",cadence:"weekly"},
 {title:"Garage shelving: Organize by use and hazard type",area:"Garage",cadence:"quarterly"},
 {title:"Garage storage: Label bins and containers",area:"Garage",cadence:"quarterly"},
 {title:"Garage: Identify items to donate, recycle, or dispose of",area:"Garage",cadence:"semiannual"},
 {title:"Garage tools: Inventory and return tools to storage",area:"Garage",cadence:"quarterly"},
 {title:"Garage cleaning supplies: Inventory and restock",area:"Garage",cadence:"monthly"},
 {title:"Garage trash and recycling: Reset collection area",area:"Garage",cadence:"weekly"},
 {title:"Garage floor: Sweep or vacuum debris",area:"Garage",cadence:"monthly"},
 {title:"Garage floor: Wash surface when appropriate",area:"Garage",cadence:"quarterly"},
 {title:"Garage floor: Safely address fresh spills and stains",area:"Garage",cadence:"monthly"},
 {title:"Garage shelving: Dust exposed surfaces",area:"Garage",cadence:"quarterly"},
 {title:"Garage: Remove cobwebs from corners and ceiling edges",area:"Garage",cadence:"monthly"},
 {title:"Garage windows and door panels: Clean accessible surfaces",area:"Garage",cadence:"quarterly"},
 {title:"Garage perimeter: Clear leaves and debris from edges",area:"Garage",cadence:"monthly"},
 {title:"Garage-door tracks: Clear loose debris without adjusting hardware",area:"Garage",cadence:"monthly"},
 {title:"Garage door: Visually inspect panels, rollers, cables, and springs",area:"Garage",cadence:"quarterly",notes:"Visual check only. Do not adjust springs, cables, or tension hardware."},
 {title:"Garage-door opener: Test automatic reversal according to manufacturer guidance",area:"Garage",cadence:"quarterly"},
 {title:"Garage-door photo eyes: Clean and test alignment response",area:"Garage",cadence:"monthly"},
 {title:"Garage-door seals: Inspect bottom and perimeter weather seals",area:"Garage",cadence:"quarterly"},
 {title:"Garage entry door: Clean threshold and inspect visible condition",area:"Garage",cadence:"quarterly"},
 {title:"Garage chemicals: Confirm labels, closed containers, and safe separation",area:"Garage",cadence:"quarterly"},
 {title:"Garage fire extinguisher: Check presence and visible status if installed",area:"Garage",cadence:"quarterly"},
 {title:"Garage charging area: Clear clutter and inspect visible battery and cord condition",area:"Garage",cadence:"monthly"},
 {title:"Garage: Check for visible pests or nesting activity",area:"Garage",cadence:"quarterly"},
 {title:"Garage: Check for moisture, leaks, or water intrusion",area:"Garage",cadence:"quarterly"},
 {title:"Garage utilities: Maintain required clearance around installed equipment",area:"Garage",cadence:"monthly"},
 {title:"Garage overhead storage: Visually inspect condition and avoid overloading",area:"Garage",cadence:"quarterly"},
 {title:"Garage seasonal storage: Rotate frequently needed equipment into accessible positions",area:"Garage",cadence:"semiannual"},
];

const areaFor=(title:string,category="")=>{const value=key(`${category} ${title}`);if(/playhouse|outdoor play|outdoor toys/.test(value))return"Outdoor Play Area";if(/pool|spa|skimmer/.test(value))return"Pool & Spa";if(/back patio|lanai|outdoor grill|patio table|patio chair/.test(value))return"Back Patio & Lanai";if(/garage/.test(value))return"Garage";if(/refrigerator|pantry|kitchen|dishwasher|garbage disposal|microwave|oven|stovetop|hood vent|coffee maker|toaster/.test(value))return"Kitchen";if(/bathroom|toilet|vanity|shower/.test(value))return"Bathrooms";if(/bedroom|mattress|bedding|make beds/.test(value))return"Bedrooms";if(/living room/.test(value))return"Living Spaces";if(/office|computer/.test(value))return"Office";if(/washing machine|dryer|laundry|water heater|hvac|utility/.test(value))return"Laundry & Utility";if(/exterior|gutter|roof|driveway|porch|flower bed/.test(value))return"Exterior";if(/whole house|ceiling fan|air vent|baseboard|window track|under furniture|curtain|carpet|wood furniture|return items|floor pickup|empty trash/.test(value))return"Whole House";return"Other Household"};
const cadenceFromCategory=(title="")=>{const value=key(title);if(/daily/.test(value))return{unit:"day" as const,interval:1};if(/quarter|every 3/.test(value))return{unit:"month" as const,interval:3};if(/semi|every 6|biannual/.test(value))return{unit:"month" as const,interval:6};if(/month/.test(value))return{unit:"month" as const,interval:1};return null};

export function upgradePersonalHousehold<T extends TaskLike,C extends CategoryLike,L extends ListLike>(input:{tasks:T[];categories:C[];lists:L[];migrations:string[];today:string}){
 if(input.migrations.includes(PERSONAL_HOUSEHOLD_MIGRATION))return input;
 const household=input.lists.filter(list=>/household/i.test(list.title));
 if(!household.length)return input;
 const householdIds=new Set(household.map(list=>list.id)),oldCategories=new Map(input.categories.map(category=>[category.id,category])),alreadyOrganized=input.migrations.includes(PREVIOUS_PERSONAL_HOUSEHOLD_MIGRATION);
 const categories=(alreadyOrganized?input.categories:input.categories.filter(category=>!category.listId||!householdIds.has(category.listId))) as C[];
 const categoryIds=new Map<string,string>();
 household.forEach(list=>areas.forEach((area,order)=>{const existing=categories.find(category=>category.listId===list.id&&key(category.title)===key(area)),id=existing?.id||`household-${slug(list.id)}-${slug(area)}`;categoryIds.set(`${list.id}:${area}`,id);if(!existing)categories.push({id,title:area,section:"custom",listId:list.id,order} as C)}));
 const primaryHousehold=household[0];
 let tasks=input.tasks.map(task=>{const monthly=task.section==="month"?monthlyMoves[key(task.title)]:undefined;if(monthly&&primaryHousehold){const cadence=monthly.cadence,repeat=repeatFor(cadence),anchor=task.repeatAnchor||task.scheduledDate||suggestedAnchor(monthly.title,cadence,input.today);return{...task,title:monthly.title,notes:appendTiming([task.notes,monthly.notes].filter(Boolean).join("\n"),cadence?cadenceDetails[cadence]:"Suggested timing: schedule as needed."),section:"custom",listId:primaryHousehold.id,categoryId:categoryIds.get(`${primaryHousehold.id}:${monthly.area}`),recurring:Boolean(cadence),repeatUnit:repeat?.unit,repeatInterval:repeat?.interval,repeatAnchor:repeat?anchor:undefined,scheduledDate:repeat?undefined:task.scheduledDate} as T}if(task.section!=="custom"||!task.listId||!householdIds.has(task.listId))return task;const category=task.categoryId?oldCategories.get(task.categoryId):undefined,title=clearerTitles[key(task.title)]||legacyTitles[key(task.title)]||task.title,area=areaFor(title,category?.title),categoryCadence=cadenceFromCategory(category?.title),timing=timingFor(title),repeat=categoryCadence||repeatFor(timing.cadence),cadence=categoryCadence?(categoryCadence.interval===6?"semiannual":categoryCadence.interval===3?"quarterly":categoryCadence.unit==="month"?"monthly":"daily") as Timing["cadence"]:timing.cadence,anchor=task.repeatAnchor||task.scheduledDate||suggestedAnchor(title,cadence,input.today);return{...task,title,notes:appendTiming(task.notes,timing.notes),categoryId:categoryIds.get(`${task.listId}:${area}`),recurring:repeat?true:task.recurring,repeatUnit:repeat?.unit||task.repeatUnit,repeatInterval:repeat?.interval||task.repeatInterval,repeatAnchor:repeat?anchor:task.repeatAnchor,scheduledDate:repeat?undefined:task.scheduledDate} as T});
 household.forEach(list=>{const existing=new Set(tasks.filter(task=>task.listId===list.id).map(task=>key(task.title)));seeds.forEach((seed,index)=>{if(existing.has(key(seed.title)))return;const unit=seed.cadence==="weekly"?"week":"month",interval=seed.cadence==="quarterly"?3:seed.cadence==="semiannual"?6:1,offset=seed.cadence==="weekly"?(index%6)+1:seed.cadence==="monthly"?(index%24)+7:seed.cadence==="quarterly"?(index%45)+30:(index%60)+90,anchor=addDays(input.today,offset);tasks.push({id:`personal-${slug(list.id)}-${slug(seed.title)}`,title:seed.title,notes:seed.notes,section:"custom",listId:list.id,categoryId:categoryIds.get(`${list.id}:${seed.area}`),recurring:true,repeatUnit:unit,repeatInterval:interval,repeatAnchor:anchor,recurringDays:unit==="week"?[weekday(anchor)]:undefined,done:false,created:`${input.today}T12:00:00.000Z`} as T);existing.add(key(seed.title))})});
 const seen=new Map<string,T>();tasks=tasks.filter(task=>{if(task.section!=="custom"||!task.listId||!householdIds.has(task.listId))return true;const identity=`${task.listId}:${key(task.title)}`,prior=seen.get(identity);if(!prior){seen.set(identity,task);return true}prior.notes=[prior.notes,task.notes].filter(Boolean).filter((value,index,array)=>array.indexOf(value)===index).join("\n");prior.done=prior.done||task.done;if(!prior.completed&&task.completed)prior.completed=task.completed;return false});
 return{...input,tasks,categories,migrations:[...input.migrations,PERSONAL_HOUSEHOLD_MIGRATION]};
}
