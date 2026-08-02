export const PERSONAL_HOUSEHOLD_MIGRATION = "personal-household-areas-v1";

type RepeatUnit = "day" | "week" | "month" | "year";
type TaskLike = {id:string;title:string;notes?:string;section:string;listId?:string;categoryId?:string;scheduledDate?:string;recurring?:boolean;recurringDays?:string[];repeatInterval?:number;repeatUnit?:RepeatUnit;repeatAnchor?:string;done:boolean;created:string;completed?:string;[key:string]:unknown};
type CategoryLike = {id:string;title:string;section:string;listId?:string;order:number};
type ListLike = {id:string;title:string};
type Cadence = "weekly"|"monthly"|"quarterly"|"semiannual";
type Seed = {title:string;area:string;cadence:Cadence;notes?:string};

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
 const householdIds=new Set(household.map(list=>list.id)),oldCategories=new Map(input.categories.map(category=>[category.id,category]));
 const categories=input.categories.filter(category=>!category.listId||!householdIds.has(category.listId)) as C[];
 const categoryIds=new Map<string,string>();
 household.forEach(list=>areas.forEach((area,order)=>{const id=`household-${slug(list.id)}-${slug(area)}`;categoryIds.set(`${list.id}:${area}`,id);categories.push({id,title:area,section:"custom",listId:list.id,order} as C)}));
 let tasks=input.tasks.map(task=>{if(task.section!=="custom"||!task.listId||!householdIds.has(task.listId))return task;const category=task.categoryId?oldCategories.get(task.categoryId):undefined,title=legacyTitles[key(task.title)]||task.title,area=areaFor(title,category?.title),cadence=cadenceFromCategory(category?.title),anchor=task.repeatAnchor||task.scheduledDate||input.today;return{...task,title,categoryId:categoryIds.get(`${task.listId}:${area}`),recurring:cadence?true:task.recurring,repeatUnit:cadence?.unit||task.repeatUnit,repeatInterval:cadence?.interval||task.repeatInterval,repeatAnchor:cadence?anchor:task.repeatAnchor,scheduledDate:cadence?undefined:task.scheduledDate} as T});
 household.forEach(list=>{const existing=new Set(tasks.filter(task=>task.listId===list.id).map(task=>key(task.title)));seeds.forEach((seed,index)=>{if(existing.has(key(seed.title)))return;const unit=seed.cadence==="weekly"?"week":"month",interval=seed.cadence==="quarterly"?3:seed.cadence==="semiannual"?6:1,offset=seed.cadence==="weekly"?(index%6)+1:seed.cadence==="monthly"?(index%24)+7:seed.cadence==="quarterly"?(index%45)+30:(index%60)+90,anchor=addDays(input.today,offset);tasks.push({id:`personal-${slug(list.id)}-${slug(seed.title)}`,title:seed.title,notes:seed.notes,section:"custom",listId:list.id,categoryId:categoryIds.get(`${list.id}:${seed.area}`),recurring:true,repeatUnit:unit,repeatInterval:interval,repeatAnchor:anchor,recurringDays:unit==="week"?[weekday(anchor)]:undefined,done:false,created:`${input.today}T12:00:00.000Z`} as T);existing.add(key(seed.title))})});
 return{...input,tasks,categories,migrations:[...input.migrations,PERSONAL_HOUSEHOLD_MIGRATION]};
}
