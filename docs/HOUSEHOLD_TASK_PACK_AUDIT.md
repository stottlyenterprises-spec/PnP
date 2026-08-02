# Household Complete Task Pack Audit

Progress, Not Perfection

**Status:** Deferred add-on specification  
**Sequence:** Build after the iOS and Android applications and the Task Packs framework  
**Source:** Genericized audit of the household task import tested during D.E.E.D.S. development  
**Privacy:** This document contains no names, addresses, private notes, or account data

## 1. Purpose

This document turns the household import into a clean candidate for a future **Household Complete** add-on.

The original import proved that detailed household routines are useful, but it also exposed three problems:

1. Individual tasks lost their context after being separated from headings.
2. Supplies and tools were imported as if they were tasks.
3. Some maintenance tasks appeared more than once under different headings.

The product version must install clear, editable tasks without duplication.

## 2. Audit result

The reviewed import contained **154 raw items**:

- 103 room and deep-cleaning actions
- 23 monthly, quarterly, and semiannual maintenance entries
- 20 supplies or tools
- 8 daily maintenance entries

The audit found:

- 3 exact duplicate titles
- 8 overlapping or semantically duplicate maintenance entries
- 3 shower supplies incorrectly treated as tasks
- 20 supply and tool entries that belong in pack reference data
- many action titles that were understandable only while their original heading was visible

After normalization, the proposed pack contains:

- **179 canonical task templates** after the back-patio, pool, and garage audits
- **1 supplies inventory task**
- **1 reusable supplies and tools reference list**
- no duplicate task identifiers

### Back-patio photo audit

Four reference photos showed that the former `Exterior back` section was underspecified. The space contains several distinct maintenance systems:

- a covered outdoor dining and seating area
- storage shelving and household supplies
- a grill and outdoor cooking area
- a screened pool enclosure or lanai
- a pool, attached spa or ledge, and surrounding deck
- outdoor furniture, lighting, planters, and an umbrella
- a children's playhouse and outdoor toys
- safety boundaries, including screens, fencing, gates, and clear walking paths

The former catalog represented this with only six broad tasks. The revised catalog below replaces those six tasks with 38 clear, independently schedulable templates. These are optional modules, not a recommendation to install every task.

The photos also contain temporary clutter. D.E.E.D.S. should create a reusable reset task rather than turning each visible loose object into its own task.

### Garage reevaluation

The original garage section also used only five broad tasks. A useful garage module needs to distinguish routine resets, deep cleaning, storage, door safety, chemicals, tools, charging equipment, pests, moisture, and utility clearances. The revised garage catalog replaces those five tasks with 29 independently schedulable templates.

No garage photos were used in this pass. These are configurable household defaults; a future photo audit can remove irrelevant tasks and add tasks for the user's actual equipment and layout.

## 3. Naming rule

Every installed task uses:

> **Area: Action**

Examples:

- `Refrigerator: Toss expired food`
- `Bathroom shower: Clean tracks`
- `Bedroom windows: Clean blinds`
- `Office paperwork: Shred unneeded documents`
- `Exterior front: Pressure-wash driveway`

The title must remain understandable when it appears in Today, Calendar, D.E.E.D.S., notifications, search, or a report without its category heading.

## 4. Duplicate-resolution rules

### Exact duplicates

| Raw entries | Canonical treatment |
|---|---|
| `Scrubbing Bubbles` appeared twice | Keep once in the supplies reference; never install it as a task |
| `Replace HVAC filter` appeared twice | Install one `HVAC: Replace filter` task with quarterly recurrence |
| `Organize cables` appeared twice | Retain two location-specific actions: `Living-room electronics: Organize cables` and `Computer: Organize cables` |

### Semantic overlaps

| Raw entries | Canonical treatment |
|---|---|
| `Check expiration dates` and `Pantry check` | `Pantry: Check expiration dates and organization` |
| `Wash with warm water and dish soap`, `Refrigerator shelves`, and `Deep clean refrigerator` | Keep the detailed refrigerator actions; assign recurrence to them and remove the generic parent |
| `Coffee maker` and `Descale coffee maker` | `Coffee maker: Clean and descale` |
| `Clean disposal` and `Garbage disposal cleaning` | `Garbage disposal: Clean and deodorize` |
| `Oven` and `Deep clean oven` | `Oven: Deep-clean interior and racks` |
| `Washer cleaning cycle` and `Clean washing machine` | `Washing machine: Run cleaning cycle` |
| `Dryer vent` and `Clean dryer vent` | `Dryer: Deep-clean exhaust vent` |
| `Replace HVAC filter` in Utility and Quarterly | One quarterly `HVAC: Replace filter` task |

### Similar actions that remain separate

These are not duplicates once their context is restored:

- `Kitchen floors: Clean baseboards` and `Whole house: Clean baseboards`
- `Bedroom windows: Clean tracks` and `Whole house: Clean window tracks`
- `Bathroom: Empty trash` and `Daily reset: Empty trash if full`
- `Exterior front: Pressure-wash driveway`, `Exterior back: Wash pool deck`, and `Exterior: Pressure-wash surfaces`
- `Computer: Dust intake vents` and `Whole house: Clean air vents`

Users may omit either the detailed or whole-house version during pack customization.

## 5. Canonical task catalog

### Kitchen: Refrigerator

- Refrigerator: Empty completely
- Refrigerator: Toss expired food
- Refrigerator: Remove shelves and drawers
- Refrigerator: Wash shelves and drawers with warm water and dish soap
- Refrigerator: Wipe door seals
- Refrigerator: Vacuum condenser coils if accessible

Suggested recurrence:

- expiration check: monthly
- shelves, drawers, and seals: quarterly
- condenser coils: semiannual

### Kitchen: Pantry

- Pantry: Check expiration dates and organization
- Pantry: Wipe shelves
- Pantry: Group similar items
- Pantry: Label bins if useful

Suggested recurrence: monthly review, quarterly shelf cleaning.

### Kitchen: Cabinets

- Kitchen cabinets: Wipe doors inside and out
- Kitchen cabinets: Clean handles
- Kitchen drawers: Vacuum crumbs

Suggested recurrence: monthly or quarterly.

### Kitchen: Appliances

- Microwave: Steam-clean with lemon water
- Oven: Deep-clean interior and racks
- Stovetop: Clean surface and controls
- Hood vent: Clean filter and exterior
- Dishwasher: Clean filter
- Dishwasher: Run cleaning cycle
- Coffee maker: Clean and descale
- Toaster: Empty and clean crumb tray

Suggested recurrence varies by appliance. The installer should propose monthly for the microwave, coffee maker, dishwasher filter, dishwasher cleaning cycle, and toaster; quarterly for the oven and hood filter.

### Kitchen: Sink

- Kitchen sink: Scrub basin
- Garbage disposal: Clean and deodorize
- Kitchen faucet: Clean and polish
- Kitchen sink: Sanitize sponge holder

Suggested recurrence: weekly or monthly depending on user preference.

### Kitchen: Floors

- Kitchen floors: Vacuum thoroughly
- Kitchen floors: Mop behind trash can
- Kitchen floors: Clean baseboards

### Bathrooms: Shower

- Bathroom shower: Clean tracks
- Bathroom shower: Wash doors
- Bathroom shower: Polish fixtures

The original entries `Scrubbing Bubbles`, `Soft scrub brush`, and `Magic Eraser for stubborn marks` are supply or method notes, not tasks.

### Bathrooms: Toilet

- Toilet: Clean bowl
- Toilet: Clean rim
- Toilet: Clean base
- Toilet: Clean behind toilet
- Toilet: Wipe tank top

### Bathrooms: Vanity

- Bathroom vanity: Clean sink
- Bathroom vanity: Clean faucet
- Bathroom vanity: Clean counter
- Bathroom vanity: Clean mirror
- Bathroom vanity: Wipe cabinet fronts

### Bathrooms: Finishing

- Bathroom: Wash rugs
- Bathroom: Replace towels
- Bathroom: Empty trash
- Bathroom: Dust exhaust fan

### Bedrooms: Bedding

- Bedroom bedding: Wash sheets
- Bedroom bedding: Wash pillowcases
- Bedroom bedding: Wash comforter when needed

### Bedrooms: Furniture

- Bedroom furniture: Dust from top to bottom
- Bedroom furniture: Wipe nightstands
- Bedroom furniture: Vacuum under bed
- Bedroom mattresses: Rotate

Suggested recurrence: mattress rotation quarterly; other tasks monthly or quarterly according to the room and user preference.

### Bedrooms: Closets

- Bedroom closet: Donate unused clothing
- Bedroom closet: Organize shoes
- Bedroom closet: Vacuum floor

### Bedrooms: Windows

- Bedroom windows: Clean glass
- Bedroom windows: Clean tracks
- Bedroom windows: Clean blinds

### Living Spaces: Furniture

- Living-room furniture: Vacuum upholstery
- Living-room furniture: Rotate cushions
- Living-room furniture: Spot-clean stains

### Living Spaces: Electronics

- Living-room electronics: Dust television
- Living-room electronics: Dust speakers
- Living-room electronics: Dust consoles
- Living-room electronics: Organize cables

### Living Spaces: Floors

- Living-room floors: Vacuum edges
- Living-room floors: Move furniture and clean underneath
- Living-room floors: Mop hard surfaces

### Office: Desk

- Office desk: Remove everything
- Office desk: Wipe surfaces
- Office desk: Clean keyboard
- Office desk: Clean mouse
- Office desk: Clean monitor

### Office: Computer

- Computer: Dust intake vents
- Computer: Blow out or clean filters
- Computer: Organize cables

### Office: Paperwork

- Office paperwork: File retained documents
- Office paperwork: Scan needed documents
- Office paperwork: Shred unneeded documents

### Utility: Laundry

- Washing machine: Run cleaning cycle
- Dryer: Deep-clean exhaust vent
- Dryer: Clean lint trap and housing

Suggested recurrence: washing-machine cleaning quarterly, dryer exhaust vent semiannually, lint-trap housing monthly or according to use.

### Utility: Home Systems

- Water heater: Inspect visible condition
- HVAC: Replace filter
- Utility area: Organize cleaning supplies

Suggested recurrence: HVAC filter quarterly by default, then adjusted for the actual filter, equipment, household, and manufacturer guidance. Other tasks are quarterly or semiannual.

### Garage

#### Reset and Storage

- Garage: Return loose items to their assigned storage
- Garage: Clear floor, doors, and walking paths
- Garage shelving: Organize by use and hazard type
- Garage storage: Label bins and containers
- Garage: Identify items to donate, recycle, or dispose of
- Garage tools: Inventory and return tools to storage
- Garage cleaning supplies: Inventory and restock
- Garage trash and recycling: Reset collection area

Suggested recurrence: quick reset weekly, shelving and bins quarterly, donation and disposal review semiannually.

#### Cleaning

- Garage floor: Sweep or vacuum debris
- Garage floor: Wash surface when appropriate
- Garage floor: Safely address fresh spills and stains
- Garage shelving: Dust exposed surfaces
- Garage: Remove cobwebs from corners and ceiling edges
- Garage windows and door panels: Clean accessible surfaces
- Garage perimeter: Clear leaves and debris from edges

Suggested recurrence: floor and perimeter monthly, shelving and windows quarterly, spills immediately using product and disposal guidance.

#### Garage Doors and Entries

- Garage-door tracks: Clear loose debris without adjusting hardware
- Garage door: Visually inspect panels, rollers, cables, and springs
- Garage-door opener: Test automatic reversal according to manufacturer guidance
- Garage-door photo eyes: Clean and test alignment response
- Garage-door seals: Inspect bottom and perimeter weather seals
- Garage entry door: Clean threshold and inspect visible condition

Suggested recurrence: debris and photo eyes monthly; safety response, seals, and visible condition quarterly or according to manufacturer guidance.

Garage-door springs, cables, tension hardware, and electrical faults require qualified service. The task pack must never instruct a user to adjust or repair them.

#### Safety, Utilities, and Environment

- Garage chemicals: Confirm labels, closed containers, and safe separation
- Garage fire extinguisher: Check presence and visible status if installed
- Garage charging area: Clear clutter and inspect visible battery and cord condition
- Garage: Check for visible pests or nesting activity
- Garage: Check for moisture, leaks, or water intrusion
- Garage utilities: Maintain required clearance around installed equipment
- Garage overhead storage: Visually inspect condition and avoid overloading
- Garage seasonal storage: Rotate frequently needed equipment into accessible positions

Suggested recurrence: charging area and utility clearance monthly; chemicals, extinguisher, pests, moisture, and overhead storage quarterly; seasonal rotation twice yearly.

The installer should ask which systems are actually present. It must omit irrelevant tasks and direct hazardous disposal, structural, electrical, fuel, pest, and utility concerns to applicable local or professional guidance.

### Exterior: Front

- Exterior front: Pressure-wash driveway
- Exterior front: Sweep porch
- Exterior front: Wash windows
- Exterior front: Clean light fixtures
- Exterior front: Trim bushes
- Exterior front: Weed flower beds
- Exterior surfaces: Pressure-wash appropriate areas
- Gutters: Clean and inspect
- Roof: Perform ground-level or professionally appropriate visual inspection

Suggested recurrence: general exterior pressure washing, gutter service, and roof review semiannually or seasonally. Tasks involving height, roof access, or unsafe equipment require an appropriate professional.

### Back Patio: Reset, Surfaces, and Storage

- Back patio: Return loose items to their homes
- Back patio table: Wipe and sanitize surface
- Back patio chairs: Wipe seats, arms, and backs
- Back patio floor: Sweep or vacuum loose debris
- Back patio floor: Wash hard surfaces
- Back patio storage: Wipe and organize shelving
- Back patio windows: Clean exterior glass, frames, and sills
- Back patio: Remove cobwebs from walls, corners, and eaves
- Back patio lighting: Clean and inspect string lights and fixtures
- Back patio trash: Empty and wash receptacle when needed
- Back patio planters: Remove debris and tidy pots

Suggested recurrence:

- reset loose items and clear walking paths: daily or weekly
- table, chairs, and loose debris: weekly
- floor washing, storage, windows, cobwebs, lighting, trash receptacle, and planters: monthly or quarterly

### Back Patio: Grill

- Outdoor grill: Clean cooking grates
- Outdoor grill: Clean exterior, grease tray, and surrounding surface
- Outdoor grill: Visually inspect fuel connection and condition before use

Suggested recurrence: grates after use or weekly; deep cleaning monthly; condition check before use. Any gas-system concern requires qualified service rather than an in-app repair instruction.

### Lanai and Screen Enclosure

- Lanai screens: Brush or vacuum loose debris
- Lanai screens and frames: Wash gently
- Lanai tracks and drainage channels: Clear debris
- Lanai enclosure: Inspect screens, doors, fasteners, and visible tears
- Lanai enclosure: Treat visible mildew or algae with an appropriate surface-safe method

Suggested recurrence: debris monthly, washing quarterly, inspection semiannually and after storms, mildew or algae as observed.

### Pool and Spa Care

- Pool: Skim surface debris
- Pool: Brush waterline and tile
- Pool and spa: Brush steps, walls, and ledges
- Pool: Vacuum floor
- Pool: Empty skimmer and pump baskets
- Pool: Check water level
- Pool: Test and record water chemistry
- Pool equipment: Inspect visible condition and check for leaks
- Pool equipment area: Clear debris and maintain safe access
- Pool filter: Clean according to equipment guidance
- Pool toys and floats: Rinse, dry, and store
- Pool deck: Remove toys, tools, and trip hazards

Suggested recurrence:

- skim, inspect the deck, and check water level: several times per week or as needed
- chemistry, baskets, brushing, and vacuuming: weekly, adjusted to season and professional guidance
- visible equipment inspection: weekly
- filter cleaning: based on pressure, equipment type, and manufacturer or pool-professional guidance
- toy and float reset: after use or weekly

D.E.E.D.S. may remind the user to test and record chemistry, but the public task pack must not prescribe chemical quantities. Treatment depends on pool volume, current readings, equipment, product instructions, and professional guidance.

### Pool Deck, Furniture, and Safety

- Pool deck: Wash surface
- Outdoor furniture: Clean and inspect condition
- Patio umbrella: Clean fabric and inspect frame and base
- Pool boundary: Inspect fence, screen doors, gates, and latches

Suggested recurrence: furniture and deck monthly, umbrella quarterly and before severe weather, safety boundary monthly and after storms.

### Outdoor Play Area

- Outdoor play area: Gather and organize toys
- Playhouse: Wash exterior and accessible interior surfaces
- Playhouse and outdoor toys: Inspect for loose parts, sharp edges, insects, and other visible hazards

Suggested recurrence: reset after use or weekly, washing monthly, safety inspection monthly and after severe weather.

### Whole House

- Whole house: Dust ceiling fans
- Whole house: Clean air vents
- Whole house: Clean baseboards
- Whole house: Clean window tracks
- Whole house: Clean under furniture
- Whole house curtains: Wash or clean
- Whole house carpets: Steam-clean
- Whole house wood furniture: Clean and polish

Suggested recurrence: ceiling fans, vents, baseboards, window tracks, and under-furniture cleaning monthly; curtains quarterly; carpets and wood-furniture care semiannually.

These tasks belong to the `Whole House` area. Their cadence is metadata, not a separate task list.

### Daily Maintenance

- Daily reset: Make beds
- Daily reset: Empty dishwasher
- Daily reset: Wipe kitchen counters
- Daily reset: Complete one load of laundry if needed
- Daily reset: Return items to their proper place
- Daily reset: Perform quick bathroom wipe-down
- Daily reset: Complete five-minute floor pickup
- Daily reset: Empty trash if full

These tasks install only when the user chooses the Daily Maintenance module.

### Supplies

Install one recurring action:

- Cleaning supplies: Inventory and restock

Attach the following as its editable reference checklist rather than creating 20 separate tasks:

- Scrubbing Bubbles
- The Pink Stuff
- Dawn Powerwash
- Bar Keepers Friend
- CLR
- Windex
- disinfecting spray
- glass cleaner
- toilet-bowl cleaner
- microfiber cloths
- Magic Erasers
- Scrub Daddy
- detail brushes
- old toothbrushes
- extension duster
- mop with washable pads
- vacuum with crevice tool
- bucket
- rubber gloves
- step stool

Brand names should be optional and replaceable with generic equivalents before public release.

## 6. Pack modules

Household Complete should not install all 179 tasks automatically. It should offer area-based modules:

- Daily Maintenance
- Kitchen
- Bathrooms
- Bedrooms
- Living Spaces
- Office
- Laundry and Utility
- Garage
- Exterior
- Back Patio and Lanai
- Pool and Spa
- Outdoor Play Area
- Whole House
- Supplies

The setup interview enables only the area modules that fit the user's home. Monthly, quarterly, and semiannual are recurrence rules inside those areas, never separate lists or installation modules.

## 7. Scheduling behavior

The pack installer must:

- install one canonical task per action
- store area, subarea, recurrence, and next-due date independently
- keep every task in its area when its recurrence or next-due date changes
- show cadence as supporting information, such as `Kitchen · Monthly`, rather than as the task's location
- allow cadence filters without creating cadence-based lists
- attach one recurrence rule to that task
- avoid a second copy when multiple modules reference the same action
- let users change every suggested schedule
- stagger monthly and quarterly work so it does not all appear on one day
- respect user-selected recovery days
- calculate an estimated weekly workload before installation
- allow optional seasonal scheduling for exterior work

## 8. Installation safeguards

Before installation:

- compare normalized titles and pack task identifiers with existing tasks
- show potential matches to the user
- default to keeping the existing user task
- offer to apply the pack's note or recurrence without replacing the title
- never add a second task silently

After installation:

- show every added, matched, skipped, and updated task
- provide one-step Undo Installation
- retain task provenance for future pack updates

## 9. Product status

This is a documented future add-on, not an active store product.

Implementation begins only after:

- iOS and Android builds are stable
- D.E.E.D.S. accounts and cross-device sync are reliable
- the Task Packs framework passes its free-pack release gates
- installation and undo are dependable
- Apple and Google purchase restoration is ready
