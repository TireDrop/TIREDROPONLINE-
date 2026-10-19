# City facts: 7 thin pages filled, 6 pages added, 2026-10-18

Branch `preview/seo-city-pages`, by Mapper (local SEO content). This is the source list for every ZIP, road, neighbourhood and local fact added to `src/data/cityPages.js` on 2026-10-18. One line per fact, with its source. Nothing on these pages was taken from memory.

## What changed

1. The 7 batch 2 pages that had no ZIPs, areas or roads (Pembroke Pines, Hollywood, Miramar, Pompano Beach, Lauderhill, Oakland Park, Hialeah) now carry ZIPs, neighbourhoods, roads, a road-based route line, a second "where we work" paragraph, "Roads and areas around {city}", extra local FAQs and a new meta description. The thin list was confirmed from the data: before this change `cityPages.test.mjs` asserted `zips`, `areas` and `roads` were all empty on exactly these 7 slugs.
2. Six pages were added: Miami, Doral and Homestead (Miami-Dade) and Boca Raton, West Palm Beach and Boynton Beach (Palm Beach). The city list is now 20 pages, 3 of them in Palm Beach and 4 in Miami-Dade.
3. The overlap test (`cityPages.test.mjs`, 5-word shingles, 60% floor) got tighter, not looser. The new text pushed Plantation and Fort Lauderdale to 59.2% and 59.9% on the first pass; the shared phrases were reworded (in the new text only, existing pages were not edited) and the floor is unchanged. Final: every page is at 60.5% or more (Plantation 60.5, Fort Lauderdale 60.6, Sunrise 63.0, the 13 filled or new pages 62.7 to 69.7).
4. `cityPages.test.mjs` was rewritten for the new state: 20 slugs, "filled pages" check (at least 4 ZIPs, 4 areas, 3 roads, every ZIP named in the copy, no PO Box ZIP), county and nearby-link checks for the six new pages. The Hialeah no-language/no-demographics check stays.
5. Hialeah's nearby list now links Miami and Doral (it linked two Broward pages "across the county line" because no Miami-Dade page existed). Its old comment calling it "the first Miami-Dade page" was removed.

## Rules applied

- **ZIPs:** a ZIP is listed only when it appears in BOTH the Wikipedia infobox for the city and the zip-codes.com city page (as a Standard ZIP, not PO Box or Unique). Each ZIP also passes `isInServiceArea()` (test). PO Box and single-organisation ZIPs are named in copy only to tell the shopper not to use them, never listed as chips.
- **Neighbourhoods and roads:** only names that appear in the city's own site, the Wikipedia article for the city or the Wikipedia article for the road (route, termini and intersecting roads), or the I-95 exit table.
- **Not claimed anywhere:** drive times, distances, arrival times, traffic, languages or demographics, other companies, landmarks that no source names.
- **Directory aliases** ("33023 also lists Miramar") come from the Alias Names column of zip-codes.com. That site marks no primary city per ZIP, so the copy says "directories list" and never "this ZIP belongs to".

## Sources by page

Short names: **WP** = Wikipedia, **ZC** = zip-codes.com city page `https://www.zip-codes.com/city/fl-<city>.asp`, **I-95** = https://en.wikipedia.org/wiki/Interstate_95_in_Florida (exit table), **NHTSA** = https://www.nhtsa.gov/vehicle-safety/tires.

### Pembroke Pines
- ZIPs 33023 to 33029; each lists Pembroke Pines as an alias, and 33023, 33025, 33027, 33029 are shared with Miramar, 33024 and 33026 with Cooper City: https://en.wikipedia.org/wiki/Pembroke_Pines,_Florida and https://www.zip-codes.com/city/fl-pembroke-pines.asp (33330 to 33332 are in the infobox only, so left out).
- West Pines (west of I-75), Chapel Trail, Silver Lakes, C.B. Smith Park: https://en.wikipedia.org/wiki/Pembroke_Pines,_Florida
- Pembroke Shores Park: https://www.ppines.com/
- Pines Blvd (SR 820): begins at US 27 (Okeechobee Rd), crosses I-75, Flamingo Rd (SR 823) and University Dr (SR 817), becomes Hollywood Blvd at SW 60th Ave in Hollywood; Florida's Turnpike: https://en.wikipedia.org/wiki/Pines_Boulevard and https://en.wikipedia.org/wiki/Hollywood_Boulevard_(Florida)
- Pembroke Rd (SR 824) starts at University Dr on the Miramar and Pembroke Pines boundary: https://en.wikipedia.org/wiki/Florida_State_Road_824
- University Dr runs south through Sunrise, Plantation, Davie, Pembroke Pines, Miramar (route line): https://en.wikipedia.org/wiki/Florida_State_Road_817

### Hollywood
- ZIPs 33019, 33020, 33021, 33023, 33024; 33021 also Pembroke Park, 33023 Miramar, Pembroke Pines and West Park, 33024 Cooper City and Pembroke Pines: https://en.wikipedia.org/wiki/Hollywood,_Florida and https://www.zip-codes.com/city/fl-hollywood.asp
- Hollywood Beach, Downtown Hollywood, Washington Park industrial area, Harry Berry Park, Anne Kolb Nature Center, king tide flooding in low-lying coastal areas: https://www.hollywoodfl.org/
- Young Circle (US 1 meets Hollywood Blvd), Hollywood Blvd crossing Florida's Turnpike, US 441, I-95, Dixie Hwy and ending at A1A: https://en.wikipedia.org/wiki/Hollywood_Boulevard_(Florida)
- Pembroke Rd runs east to US 1 at the Hollywood and Hallandale Beach boundary: https://en.wikipedia.org/wiki/Florida_State_Road_824
- Johnson St reaches the Broadwalk; Sheridan St, Dixie Hwy named on the city's site: https://www.hollywoodfl.org/

### Miramar
- ZIPs 33023, 33025, 33027, 33029; all four shared with Pembroke Pines, 33023 also West Park and Pembroke Park: https://en.wikipedia.org/wiki/Miramar,_Florida and https://www.zip-codes.com/city/fl-miramar.asp
- Miramar Regional Park and its amphitheatre, Miramar Town Center (a college campus): https://en.wikipedia.org/wiki/Miramar,_Florida
- Historic Miramar, Sunset Lakes (community centre), Country Club Ranches (park at 4700 SW 143rd Ave, 33025), Silver Shores Park, Miramar Blvd (Ansin Sports Complex address), water tower beside Florida's Turnpike: https://www.miramarfl.gov/ , https://www.miramarfl.gov/Parks and https://www.miramarfl.gov/Parks/Silver-Shores-Park
- Miramar Pkwy (CR 858) crossed by University Dr and Flamingo Rd (SR 823): https://en.wikipedia.org/wiki/Florida_State_Road_823 and https://en.wikipedia.org/wiki/Florida_State_Road_817
- Pembroke Rd begins at University Dr beside North Perry Airport: https://en.wikipedia.org/wiki/Florida_State_Road_824

### Pompano Beach
- ZIPs 33060, 33062, 33064, 33066, 33069; 33062 also Hillsboro Beach and Lauderdale-by-the-Sea, 33064 Deerfield Beach and Lighthouse Point, 33066 Coconut Creek; PO Box ZIPs 33061, 33075, 33097 (not listed): https://en.wikipedia.org/wiki/Pompano_Beach,_Florida and https://www.zip-codes.com/city/fl-pompano-beach.asp
- Old Pompano, Cresthaven, Collier City, Palm Aire, Garden Isles (Wikipedia neighbourhood list); Downtown Pompano Beach and the Pompano Beach Pier: https://en.wikipedia.org/wiki/Pompano_Beach,_Florida and https://www.pompanobeachfl.gov/
- Atlantic Blvd (SR 814) enters Pompano Beach and ends at A1A, crosses I-95, Dixie Hwy and US 1: https://en.wikipedia.org/wiki/Florida_State_Road_814
- I-95 exits at Atlantic Blvd (36), Copans Rd (38), Sample Rd (39, on the Pompano Beach and Deerfield Beach line): https://www.aaroads.com/guides/i-095-north-pompano-bch-fl and the I-95 exit table
- Powerline Rd (SR 845) crosses Atlantic Blvd in Pompano Beach: https://en.wikipedia.org/wiki/Florida_State_Road_845
- Sawgrass Expressway links Oakland Park Blvd (exit 3) to Atlantic Blvd (exit 8): https://en.wikipedia.org/wiki/Florida_State_Road_816 and https://www.aaroads.com/guides/fl-869-north (as used in docs/audits/2026-10-04-city-depth.md)

### Tamarac (ZIPs added 2026-10-18, branch `preview/seo-tech-leftovers`)
- ZIPs 33309, 33319, 33321, 33351. Wikipedia infobox for Tamarac lists "33309, 33319, 33320, 33321, 33351, 33359": https://en.wikipedia.org/wiki/Tamarac,_Florida . zip-codes.com (the Fort Lauderdale page, which says "Tamarac, FL is an Alias Name for the city of Fort Lauderdale, FL") lists six ZIPs with Tamarac as an alias: 33309, 33319, 33321, 33351 Standard, and 33320, 33359 P.O. Box: https://www.zip-codes.com/city/fl-tamarac.asp . The four Standard ZIPs are on both lists, so they are listed; the two PO Box ZIPs are named in the copy only to tell the shopper to skip them. The list we had before (33319, 33321, 33351) is confirmed; 33309 is added by the same two-source rule.
- Directory aliases in the copy ("33309 with Lauderdale Lakes and Oakland Park", "33319 with Lauderhill and Sunrise", "33321 and 33351 with Lauderhill", 33351 also Sunrise) come from the Alias Names column of zip-codes.com, worded as "directories list". All four are Broward ZIPs, so they pass `isInServiceArea()`.
- The City of Tamarac's own site and USPS were not fetched (USPS's lookup is an interactive form), so no ZIP rests on them.

### Lauderhill
- ZIPs 33311, 33313, 33319, 33351 (33312 and 33321 list Lauderhill in ZC but not in the infobox, so left out); Fort Lauderdale is an accepted name on all four: https://en.wikipedia.org/wiki/Lauderhill,_Florida and https://www.zip-codes.com/city/fl-lauderhill.asp
- Inverrary is "north of Oakland Park Boulevard and east of University Drive": https://en.wikipedia.org/wiki/Lauderhill,_Florida
- City hall at 5581 W. Oakland Park Blvd, "the northeast corner of Inverrary and Oakland Park Blvd": https://www.lauderhill-fl.gov/about-lauderhill/location
- Central Lauderhill (HOA listing), West Ken Lark Park, Westwind Park: https://www.lauderhill-fl.gov/ ; Central Broward Regional Park: https://www.lauderhill-fl.gov/Home/Components/FacilityDirectory/FacilityDirectory/20/1576
- Oakland Park Blvd (SR 816) passes Sunrise, Lauderhill, Lauderdale Lakes; University Dr (SR 817) runs Sunrise, Lauderhill, Tamarac; Sunrise Blvd (SR 838) meets US 441 at the Plantation and Lauderhill border: https://en.wikipedia.org/wiki/Florida_State_Road_816 , https://en.wikipedia.org/wiki/Florida_State_Road_817 , https://en.wikipedia.org/wiki/Florida_State_Road_838
- US 441 (SR 7) passes through Lauderhill: https://en.wikipedia.org/wiki/Florida_State_Road_7

### Oakland Park
- ZIPs 33306, 33308, 33309, 33311, 33334; Fort Lauderdale uses each; city hall at 1100 Park Lane East, 33334 (33304 and 33305 are also on both lists and were left off to keep the list to the five the copy discusses): https://en.wikipedia.org/wiki/Oakland_Park,_Florida , https://www.zip-codes.com/city/fl-oakland-park.asp and https://www.oaklandparkfl.gov/
- Downtown Oakland Park, Harlem McBride, North Andrews Gardens, Lloyd Estates, Prospect Gardens, West Side (West Oakland Park Blvd corridor), Floranada as the earlier name: https://www.oaklandparkfl.gov/ and Wikipedia
- Twin Lakes South; borders Wilton Manors; US 1 as the approximate eastern boundary; Dixie Hwy beside the Florida East Coast Railway through downtown; Prospect Rd, Cypress Creek Blvd: https://en.wikipedia.org/wiki/Oakland_Park,_Florida
- I-95 exit at Oakland Park Blvd on the Wilton Manors, Oakland Park and Fort Lauderdale line; exit at Commercial Blvd in Oakland Park: https://www.aaroads.com/guides/i-095-north-pompano-bch-fl
- Commercial Blvd (SR 870) runs through Oakland Park; Powerline Rd (SR 845) crosses into Oakland Park: https://en.wikipedia.org/wiki/Commercial_Boulevard and https://en.wikipedia.org/wiki/Florida_State_Road_845
- The shop address (7712 West Oakland Park Blvd, Sunrise, 33351) is `src/data/business.js`.

### Hialeah
- ZIPs 33010, 33012, 33013, 33014, 33015, 33016, 33018 (PO Box 33002, 33011, 33017 not listed); 33010, 33016, 33018 also Hialeah Gardens, 33014, 33015, 33016, 33018 also Miami Lakes, 33015 also Palm Springs North: https://en.wikipedia.org/wiki/Hialeah,_Florida and https://www.zip-codes.com/city/fl-hialeah.asp
- Leah Arts district, Amelia Earhart Park, Milander Park: https://en.wikipedia.org/wiki/Hialeah,_Florida ; Plaza Park, Bright Park: https://www.hialeahfl.gov/
- Palmetto Expressway (SR 826) "into Hialeah proper", Gratigny Pkwy (SR 924), I-75, Homestead Extension of Florida's Turnpike, US 27 (Okeechobee Rd): https://en.wikipedia.org/wiki/Hialeah,_Florida and https://en.wikipedia.org/wiki/Florida_State_Road_826
- Red Rd (SR 823) begins at US 27 in Hialeah, West 4th Avenue in Hialeah's grid; Flamingo Rd in Broward, ending at Oakland Park Blvd in Sunrise (route line): https://en.wikipedia.org/wiki/Florida_State_Road_823

### Miami (new)
- Population 442,241 (2020 Census): https://en.wikipedia.org/wiki/Miami
- ZIPs 33125, 33127, 33128, 33129, 33130, 33131, 33132, 33133, 33135, 33136, 33137: in the Wikipedia infobox ranges and Standard on https://www.zip-codes.com/city/fl-miami.asp (64 Standard, 32 PO Box, 6 Unique); 33133 also lists Coconut Grove and Coral Gables, as does 33134; 33101 and 33102 are PO Box. Doral-alias ZIPs (33122, 33126, 33166, 33172, 33178, 33182) were left to the Doral page.
- City Hall on Pan American Drive, 33133; homeowners association list names Allapattah, Coconut Grove, Coral Way, Flagami, Little Haiti, Little Havana, Model City, Overtown, Upper Eastside, Wynwood / Edgewater, Downtown / Brickell: https://www.miami.gov/Home
- Brickell, Midtown, Edgewater, Wynwood, Little Havana, Coconut Grove, Allapattah, Flagami, Little Haiti, Overtown; Coral Way "built in 1922 between Downtown and Coral Gables"; MacArthur Causeway to PortMiami: https://en.wikipedia.org/wiki/Miami
- I-95 passes through Hollywood, Fort Lauderdale, Oakland Park in Broward and North Miami, Miami in Miami-Dade; exit to US 41 (SW 8th St) and Brickell Ave, exit to US 1 (Biscayne Blvd): the I-95 article and its exit table
- SR 836 (Dolphin Expressway) is signed I-395 between I-95 and the MacArthur Causeway; passes the southern end of Miami International Airport; Midtown Interchange where I-395 begins; Dolphin-Palmetto Interchange with SR 826: https://en.wikipedia.org/wiki/Florida_State_Road_836
- NHTSA: check all tires including the spare monthly, check spare tread, no full-size spare in place of worn tires except in an emergency.

### Doral (new)
- Population 75,874: https://en.wikipedia.org/wiki/Doral,_Florida
- ZIPs 33122, 33126, 33166, 33172, 33178 (Wikipedia infobox, and each lists Doral as an alias on the Miami ZC page); 33166 also Medley, Miami Springs, Virginia Gardens; 33172 Sweetwater and West Miami; 33178 Medley; 33126 is a Miami ZIP too: https://www.zip-codes.com/city/fl-miami.asp (33182 lists Doral on that page but is not in the infobox, so it is left off).
- Bordered by the Palmetto Expressway (east), Ronald Reagan Turnpike (west), Dolphin Expressway (south), town of Medley (north): https://en.wikipedia.org/wiki/Doral,_Florida
- Palmetto Expressway runs from the Golden Glades Interchange (I-95, Florida's Turnpike, US 441) and "forms Doral's eastern boundary"; NW 36th St (SR 948) in the Doral area; NW 107th Ave (SR 985) at the Fontainebleau and Doral line: https://en.wikipedia.org/wiki/Florida_State_Road_826 and https://en.wikipedia.org/wiki/Florida_State_Road_836
- Incorporated January 28, 2003; land bought in the late 1950s bounded by NW 36th St, NW 74th St, NW 79th Ave to NW 117th Ave; Downtown Doral Arts District north of Downtown Doral; Doral Décor District; Doral Central Park: https://www.cityofdoral.com/
- Downtown Doral, Doral Estates, Doral Park, Doral Legacy Park: https://en.wikipedia.org/wiki/Doral,_Florida
- NHTSA: TPMS only warns when a tire is "significantly underinflated" and is not a substitute for maintenance; pressure label on the driver's door edge. The van's TPMS service is `src/data/services.js`.

### Homestead (new)
- Population 80,737: https://en.wikipedia.org/wiki/Homestead,_Florida
- ZIPs 33030 to 33035 (infobox and Standard on https://www.zip-codes.com/city/fl-homestead.asp); aliases 33030 Leisure City, Modello; 33031 Redland; 33032 Naranja, Princeton, Redland; 33033 Leisure City, Naranja; 33034 Florida City; PO Box 33090, 33092; 33039 (air base, Unique) not listed.
- US 1 is "Homestead Boulevard" in the city; Homestead Extension of Florida's Turnpike to US 1 in Florida City; SR 997 (Krome Ave); SW 137th Ave (Speedway Blvd); SW 304th St (Kings Hwy), 312th (Campbell Dr), 320th (Mowry Dr), 328th (North Canal Dr), 344th (Palm Dr); South Miami-Dade Busway; Historic Downtown District; Harris Field Park, Losner Park, Bayfront Park and Marina; Florida City at the south end; Homestead Air Reserve Base shares a border along SW 137th Ave; Leisure City, Naranja, Princeton, Redland unincorporated: https://en.wikipedia.org/wiki/Homestead,_Florida
- The Turnpike extension leaves the mainline near the Miramar and Miami Gardens line and ends at US 1 in Florida City: https://en.wikipedia.org/wiki/Florida%27s_Turnpike
- NHTSA: pressure can drop suddenly after a pothole or a curb, keep a gauge in the car.
- Homestead's own site (cityofhomestead.com) refused the fetch and homesteadfl.gov errored, so nothing here relies on a Homestead city site.

### Boca Raton (new)
- Population 97,422: https://en.wikipedia.org/wiki/Boca_Raton,_Florida
- ZIPs 33428, 33431, 33432, 33433, 33434, 33486, 33487, 33496, 33498 (infobox and the 9 Standard on https://www.zip-codes.com/city/fl-boca-raton.asp); 33487 also Highland Beach; PO Box 33427, 33429, 33481, 33488, 33497 (not listed); 33464 and 33499 Unique (not listed). City Hall on West Palmetto Park Road, 33432: https://www.myboca.us/
- Mizner Park and its amphitheatre, Gumbo Limbo Nature Center, Patch Reef Park: https://www.myboca.us/
- Pearl City, Old Floresta, West Boca Raton, Sandalfoot Cove, Camino Gardens, Spanish Village, Sugar Sand Park, Red Reef Park, Spanish River Park; Glades Rd, Palmetto Park Rd, Yamato Rd, Military Trail, Jog Rd / Powerline Rd (SR 845), Federal Hwy (US 1), A1A, Turnpike Glades Rd interchange: https://en.wikipedia.org/wiki/Boca_Raton,_Florida
- I-95 exits at Palmetto Park Rd (CR 798), Glades Rd (SR 808), Spanish River Blvd (SR 800), Yamato Rd (SR 794), Congress Ave (CR 807); Boca Raton is the first Palm Beach County city on the list after Deerfield Beach: the I-95 exit table
- NHTSA penny test: "If you can see the top of Lincoln's head, replace your tires"; 2/32 inch.

### West Palm Beach (new)
- Population 117,415: https://en.wikipedia.org/wiki/West_Palm_Beach,_Florida
- ZIPs 33401, 33405, 33406, 33407, 33409, 33415, 33417 (infobox 33401 to 33422 and Standard on https://www.zip-codes.com/city/fl-west-palm-beach.asp); 33406 also Lake Clarke Shores, Palm Springs, Glen Ridge, Cloud Lake; 33407 Riviera Beach and Mangonia Park; 33409 and 33417 Haverhill; 33415 Greenacres and Haverhill; PO Box 33402, 33416.
- "First and largest city in Palm Beach County"; Downtown Core, Historic Northwest, Northwood / Pleasant City, Northwood Village, Brelsford Park / Providencia Park, Clearlake District, Okeechobee Corridor; Clematis Street, South Dixie Highway, North Flagler Drive; Grassy Waters Preserve: https://www.wpb.org/
- Old Northwood, El Cid, Flamingo Park, Grandview Heights, Prospect Park, Pleasant City; Dreher Park, Flagler Park; US 1, I-95, Florida's Turnpike, SR 80, SR 7, Tamarind Ave, Palm Beach Lakes Blvd: https://en.wikipedia.org/wiki/West_Palm_Beach,_Florida
- I-95 exits at Forest Hill Blvd (SR 882), Southern Blvd (US 98 / SR 80), Belvedere Rd, Okeechobee Blvd (SR 704), Palm Beach Lakes Blvd (CR 716): the I-95 exit table
- NHTSA: manufacturers recommend replacing tires "six to 10 years old, regardless of treadwear" (the copy spells it "six to ten" because the house-rule test bans "N years"); the last four digits of the tire identification number are the week and year.

### Boynton Beach (new)
- Population 80,380: https://en.wikipedia.org/wiki/Boynton_Beach,_Florida
- ZIPs 33426, 33435, 33436, 33437 (infobox and Standard on https://www.zip-codes.com/city/fl-boynton-beach.asp); 33435 also Briny Breezes and Ocean Ridge; 33436 Village of Golf; 33472 and 33473 are on ZC only, so named in the copy but not listed; PO Box 33424, 33425, 33474. City address 100 East Ocean Avenue, 33435: https://www.boynton-beach.org/
- Downtown, Boynton Beach Oceanfront Park, Renaissance Commons, Lake Boynton Estates, Hampshire Gardens, Leisureville, Sterling Village, Quantum Corporate Park; neighbours Delray Beach (north), Hypoluxo and Lantana (south), Golf (west), Briny Breezes, Gulf Stream, Manalapan, Ocean Ridge (east across the Intracoastal); Boynton Beach Blvd (SR 804), Woolbright Rd also "15th Avenue", Gateway Blvd, Congress Ave, Seacrest Blvd, Ocean Ave, Federal Hwy, Dixie Hwy, US 441, A1A: https://en.wikipedia.org/wiki/Boynton_Beach,_Florida
- I-95 exits at Woolbright Rd (CR 792), Boynton Beach Blvd (SR 804), Gateway Blvd; Boynton Beach follows Boca Raton and Delray Beach: the I-95 exit table
- NHTSA: rotate every 5,000 to 8,000 miles when the manufacturer recommends it, sooner if uneven wear appears; some vehicles should not be rotated; check the owner's manual.

## Left out on purpose

- Pembroke Pines: ZIPs 33330 to 33332; the Wikipedia list of Pembroke Lakes Mall, Miami-Hollywood Motorsports Park and other venues (named places, but not needed and some are historic).
- Hollywood: a neighbourhood-association list (the city's page refused the fetch), so no named residential neighbourhoods beyond the city site's districts; Hollywood Hills (only a school and a rehab centre name it).
- Miramar: "Monarch Lakes" and "Vizcaya Park" (named by search snippets, not by a page that places them).
- Lauderhill: Pine Island Rd and Commercial Blvd (no source puts either through Lauderhill), Lauderhill Mall.
- Miami: neighbourhood-by-neighbourhood ZIP maps (no source ties a ZIP to a neighbourhood); Fisher Island, Miami Beach and the Doral-alias ZIPs.
- Doral: any ZIP list from the city's site (it lists none); NW 87th Ave (an interchange, not placed in Doral by the source).
- Homestead: Coral Castle, Fruit and Spice Park and the national parks as "areas" (attractions, not neighbourhoods; a landmark we cannot place inside the city lines); 33039.
- Boca Raton: "Royal Palm Polo" and gated communities by name; Deerfield Beach as a neighbour (Wikipedia does not describe it as bordering).
- West Palm Beach: unincorporated neighbourhoods (Westgate, Century Village and others); Okeeheelee Park (county park).
- Boynton Beach: Boynton Beach Mall and Boynton Town Center (shopping centres), Ocean Ridge as a former part of the town.
- Everywhere: distances, minutes, and "nearest" claims; the Keys, Martin and Hendry counties; competitor names.

## Checks run

See the commit message and the hand-back for the final results of `npm run test:data`, `npm run verify` and `AUDIT_CHROME=/opt/pw-browsers/chromium npm run check:prerender`.
