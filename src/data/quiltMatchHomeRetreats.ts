import retreat1 from "@/assets/quilt-match-home/retreat-1.jpg";
import retreat2 from "@/assets/quilt-match-home/retreat-2.jpg";
import retreat3 from "@/assets/quilt-match-home/retreat-3.jpg";
import retreat4 from "@/assets/quilt-match-home/retreat-4.jpg";

export type Creator = {
  name: string;
  initials: string;
  bio: string;
  yearsTeaching: number;
  specialty: string;
  basedIn: string;
};

export type VenueProfile = {
  name: string;
  initials: string;
  location: string;
  capacity: number;
  amenities: string[];
  description: string;
  image: string;
};

export type Retreat = {
  id: string;
  venue: string;
  title: string;
  instructor: string;
  dates: string;
  year: number;
  price: string;
  priceNumber: number;
  image: string;
  location: string;
  state: string;
  region: RegionSlug;
  skill: string;
  season: Season;
  spotsLeft: number;
  creator: Creator;
  venueProfile: VenueProfile;
};

export type Season = "Spring" | "Summer" | "Fall" | "Winter";

export type RegionSlug =
  | "northeast"
  | "south"
  | "midwest"
  | "mountain"
  | "west-coast";

export const regions: Record<
  RegionSlug,
  { label: string; description: string; states: string }
> = {
  northeast: {
    label: "Northeast",
    description:
      "Quilt retreats across Vermont, Maine, New Hampshire and the Hudson Valley — fall foliage, coastal inns, and historic farmhouses.",
    states: "VT, ME, NH, NY, MA, CT, RI",
  },
  south: {
    label: "South",
    description:
      "Quilt retreats across the Carolinas, Tennessee, Georgia and Texas — Blue Ridge cabins, hill country inns, and lakeside lodges.",
    states: "NC, SC, TN, GA, TX, FL, AL",
  },
  midwest: {
    label: "Midwest",
    description:
      "Quilt retreats across Indiana, Ohio, Michigan and Wisconsin — Amish country, lakeshore retreats, and small-town quilt shop weekends.",
    states: "IN, OH, MI, WI, IL, MN, IA",
  },
  mountain: {
    label: "Mountain",
    description:
      "Quilt retreats across Montana, Colorado, Utah and Idaho — alpine lodges, prairie inns, and high-desert studios.",
    states: "MT, CO, UT, ID, WY, NM",
  },
  "west-coast": {
    label: "West Coast",
    description:
      "Quilt retreats across Oregon, Washington and California — coastal studios, redwood lodges, and Columbia River gorges.",
    states: "OR, WA, CA",
  },
};

const creators: Record<string, Creator> = {
  "Sarah Hennessy": { name: "Sarah Hennessy", initials: "SH", bio: "Modern quilter and pattern designer focused on bold geometric forms and color theory.", yearsTeaching: 12, specialty: "Modern geometrics & improv", basedIn: "Burlington, VT" },
  "Elena Roux": { name: "Elena Roux", initials: "ER", bio: "Natural dyer and appliqué artist drawing from Pacific Northwest botanicals.", yearsTeaching: 8, specialty: "Natural dyeing & appliqué", basedIn: "Portland, OR" },
  "Martha King": { name: "Martha King", initials: "MK", bio: "Third-generation quilter teaching traditional heirloom methods passed down from her grandmother.", yearsTeaching: 22, specialty: "Heirloom hand quilting", basedIn: "Asheville, NC" },
  "Julia Chen": { name: "Julia Chen", initials: "JC", bio: "Scrap quilt evangelist known for her improvisational approach to color and waste-not piecing.", yearsTeaching: 10, specialty: "Scrap & improv quilting", basedIn: "Austin, TX" },
  "Anna Beck": { name: "Anna Beck", initials: "AB", bio: "Prairie-style quilter blending heritage star patterns with contemporary palettes.", yearsTeaching: 15, specialty: "Star quilts & traditional blocks", basedIn: "Bozeman, MT" },
  "Margot Lin": { name: "Margot Lin", initials: "ML", bio: "Coastal Maine artist whose improv quilts capture light, fog, and tide.", yearsTeaching: 9, specialty: "Improv & landscape quilting", basedIn: "Camden, ME" },
  "Ruth Yoder": { name: "Ruth Yoder", initials: "RY", bio: "Amish-trained quilter teaching classic sampler blocks and hand-finishing techniques.", yearsTeaching: 30, specialty: "Amish sampler & hand quilting", basedIn: "Shipshewana, IN" },
  "Diane Park": { name: "Diane Park", initials: "DP", bio: "High-desert quilter exploring slow stitch and natural textures from the Wasatch range.", yearsTeaching: 14, specialty: "Hand quilting & slow stitch", basedIn: "Park City, UT" },
  "Hattie Brennan": { name: "Hattie Brennan", initials: "HB", bio: "Log cabin specialist whose scrappy palettes have appeared in Quiltfolk three times running.", yearsTeaching: 18, specialty: "Log cabin & string quilts", basedIn: "Madison, WI" },
  "Inez Castillo": { name: "Inez Castillo", initials: "IC", bio: "Curved-piecing teacher blending Mexican folk patterns with modern color blocking.", yearsTeaching: 11, specialty: "Curved piecing & color", basedIn: "Santa Fe, NM" },
  "Patricia Owens": { name: "Patricia Owens", initials: "PO", bio: "Long-arm artist and machine-quilting instructor known for her feathered border work.", yearsTeaching: 20, specialty: "Long-arm machine quilting", basedIn: "Charleston, SC" },
  "Yumi Tanaka": { name: "Yumi Tanaka", initials: "YT", bio: "Sashiko and boro teacher bringing Japanese mending traditions to American quilters.", yearsTeaching: 13, specialty: "Sashiko & boro", basedIn: "Seattle, WA" },
};

const venuesMap: Record<string, VenueProfile> = {
  "Spruce Hollow Lodge": { name: "Spruce Hollow Lodge", initials: "SH", location: "Stowe, VT", capacity: 14, amenities: ["Long-arm room", "Cutting tables for 14", "All meals included", "Wood-burning common room"], description: "A timber-framed lodge tucked into Vermont's Green Mountains. Sunlight all day, cast-iron breakfast, and a long-arm corner that overlooks the valley.", image: retreat1 },
  "The Loomery Studio": { name: "The Loomery Studio", initials: "LS", location: "Hood River, OR", capacity: 12, amenities: ["Natural light studio", "Dye garden access", "Vegetarian kitchen", "River views"], description: "A working textile studio above the Columbia River with a dye garden, walking paths, and an intimate twelve-seat workroom.", image: retreat2 },
  "Cedar Creek Hall": { name: "Cedar Creek Hall", initials: "CC", location: "Asheville, NC", capacity: 22, amenities: ["22 cutting stations", "Three long-arms", "Chef-prepared meals", "Mountain trail access"], description: "A restored Blue Ridge hall with high ceilings, three long-arms, and a wraparound porch for evening hand stitching.", image: retreat3 },
  "The Grange Attic": { name: "The Grange Attic", initials: "GA", location: "Fredericksburg, TX", capacity: 16, amenities: ["Hill country views", "Family-style dining", "Outdoor design wall", "Quiet wing for hand work"], description: "A converted 1920s grange in Texas hill country. Big windows, big tables, and a wide oak shading the design wall outside.", image: retreat4 },
  "Wildflower Plains Inn": { name: "Wildflower Plains Inn", initials: "WP", location: "Bozeman, MT", capacity: 16, amenities: ["Prairie views", "Barn studio", "Farm-to-table meals", "Stargazing patio"], description: "A working ranch inn with a converted barn studio and uninterrupted Montana sky from the stitching tables.", image: retreat1 },
  "Riverbend Studio": { name: "Riverbend Studio", initials: "RB", location: "Camden, ME", capacity: 12, amenities: ["Harbor-view studio", "Lobster dinners", "Coastal walks", "Ironing for 12"], description: "A coastal Maine studio steps from the harbor with morning fog, fresh seafood, and twelve north-facing workstations.", image: retreat2 },
  "Shipshewana Stitchworks": { name: "Shipshewana Stitchworks", initials: "SS", location: "Shipshewana, IN", capacity: 18, amenities: ["Amish-built studio", "Quilt shop on-site", "Family-style meals", "Buggy tour included"], description: "Set in the heart of Indiana Amish country with an on-site fabric shop and home-cooked meals from a neighboring family.", image: retreat3 },
  "Pine Needles Lodge": { name: "Pine Needles Lodge", initials: "PN", location: "Park City, UT", capacity: 14, amenities: ["High-altitude studio", "Hot tub", "Trail access", "Continental kitchen"], description: "A modern alpine lodge above Park City with a glass-walled studio and trail access right from the front door.", image: retreat4 },
  "Lakeside Quilt Barn": { name: "Lakeside Quilt Barn", initials: "LQ", location: "Madison, WI", capacity: 20, amenities: ["Restored dairy barn", "Lake swimming dock", "Long-arm rental", "Local cheese boards"], description: "A turn-of-the-century dairy barn converted into a twenty-station quilting studio on the shore of Lake Mendota.", image: retreat1 },
  "Adobe Stitchhouse": { name: "Adobe Stitchhouse", initials: "AS", location: "Santa Fe, NM", capacity: 12, amenities: ["Adobe studio", "Courtyard kiln", "Vegetarian + green chile", "Sunset rooftop"], description: "A handbuilt adobe with twelve workstations around a sunlit courtyard, set against the Sangre de Cristo mountains.", image: retreat2 },
  "Magnolia House": { name: "Magnolia House", initials: "MH", location: "Charleston, SC", capacity: 16, amenities: ["Historic piazza", "Two long-arms", "Lowcountry kitchen", "Garden cutting room"], description: "A restored 1840s Charleston single house with sixteen seats spread across two airy parlors and a garden cutting room.", image: retreat3 },
  "Cascade Stitch Studio": { name: "Cascade Stitch Studio", initials: "CS", location: "Seattle, WA", capacity: 14, amenities: ["Skylit studio", "Sashiko station", "Pacific seafood meals", "Ferry-to-island day"], description: "A north-facing skylit studio in Ballard with sashiko stations, a quiet hand-stitching wing, and ferry access to the islands.", image: retreat4 },
};

export const allRetreats: Retreat[] = [
  { id: "modern-geometrics-2026", venue: "Spruce Hollow Lodge", title: "Modern Geometrics Intensive", instructor: "Sarah Hennessy", dates: "Oct 12 — 16, 2026", year: 2026, price: "$1,250", priceNumber: 1250, image: retreat1, location: "Stowe, VT", state: "VT", region: "northeast", skill: "Intermediate", season: "Fall", spotsLeft: 3, creator: creators["Sarah Hennessy"], venueProfile: venuesMap["Spruce Hollow Lodge"] },
  { id: "natural-dyeing-2026", venue: "The Loomery Studio", title: "Natural Dyeing & Appliqué", instructor: "Elena Roux", dates: "Nov 04 — 07, 2026", year: 2026, price: "$675", priceNumber: 675, image: retreat2, location: "Hood River, OR", state: "OR", region: "west-coast", skill: "All levels", season: "Fall", spotsLeft: 6, creator: creators["Elena Roux"], venueProfile: venuesMap["The Loomery Studio"] },
  { id: "heirloom-foundations-2027", venue: "Cedar Creek Hall", title: "Heirloom Quilting Foundations", instructor: "Martha King", dates: "Jan 15 — 19, 2027", year: 2027, price: "$890", priceNumber: 890, image: retreat3, location: "Asheville, NC", state: "NC", region: "south", skill: "Beginner", season: "Winter", spotsLeft: 8, creator: creators["Martha King"], venueProfile: venuesMap["Cedar Creek Hall"] },
  { id: "winter-scrap-2027", venue: "The Grange Attic", title: "Winter Scrap Masterclass", instructor: "Julia Chen", dates: "Feb 10 — 12, 2027", year: 2027, price: "$550", priceNumber: 550, image: retreat4, location: "Fredericksburg, TX", state: "TX", region: "south", skill: "Advanced", season: "Winter", spotsLeft: 2, creator: creators["Julia Chen"], venueProfile: venuesMap["The Grange Attic"] },
  { id: "prairie-star-2027", venue: "Wildflower Plains Inn", title: "Prairie Star Workshop", instructor: "Anna Beck", dates: "Apr 22 — 25, 2027", year: 2027, price: "$780", priceNumber: 780, image: retreat1, location: "Bozeman, MT", state: "MT", region: "mountain", skill: "Intermediate", season: "Spring", spotsLeft: 5, creator: creators["Anna Beck"], venueProfile: venuesMap["Wildflower Plains Inn"] },
  { id: "coastal-improv-2027", venue: "Riverbend Studio", title: "Coastal Improv Quilts", instructor: "Margot Lin", dates: "May 03 — 07, 2027", year: 2027, price: "$1,100", priceNumber: 1100, image: retreat2, location: "Camden, ME", state: "ME", region: "northeast", skill: "All levels", season: "Spring", spotsLeft: 4, creator: creators["Margot Lin"], venueProfile: venuesMap["Riverbend Studio"] },
  { id: "amish-sampler-2026", venue: "Shipshewana Stitchworks", title: "Amish Country Sampler", instructor: "Ruth Yoder", dates: "Sept 14 — 18, 2026", year: 2026, price: "$820", priceNumber: 820, image: retreat3, location: "Shipshewana, IN", state: "IN", region: "midwest", skill: "All levels", season: "Fall", spotsLeft: 7, creator: creators["Ruth Yoder"], venueProfile: venuesMap["Shipshewana Stitchworks"] },
  { id: "high-desert-hand-2026", venue: "Pine Needles Lodge", title: "High Desert Hand Quilting", instructor: "Diane Park", dates: "Oct 06 — 10, 2026", year: 2026, price: "$960", priceNumber: 960, image: retreat4, location: "Park City, UT", state: "UT", region: "mountain", skill: "Intermediate", season: "Fall", spotsLeft: 6, creator: creators["Diane Park"], venueProfile: venuesMap["Pine Needles Lodge"] },
  { id: "lake-log-cabin-2027", venue: "Lakeside Quilt Barn", title: "Lakeside Log Cabin Weekend", instructor: "Hattie Brennan", dates: "Jun 09 — 13, 2027", year: 2027, price: "$720", priceNumber: 720, image: retreat1, location: "Madison, WI", state: "WI", region: "midwest", skill: "All levels", season: "Summer", spotsLeft: 9, creator: creators["Hattie Brennan"], venueProfile: venuesMap["Lakeside Quilt Barn"] },
  { id: "adobe-curves-2027", venue: "Adobe Stitchhouse", title: "Curves of the High Desert", instructor: "Inez Castillo", dates: "Mar 18 — 22, 2027", year: 2027, price: "$985", priceNumber: 985, image: retreat2, location: "Santa Fe, NM", state: "NM", region: "mountain", skill: "Intermediate", season: "Spring", spotsLeft: 4, creator: creators["Inez Castillo"], venueProfile: venuesMap["Adobe Stitchhouse"] },
  { id: "magnolia-longarm-2026", venue: "Magnolia House", title: "Long-Arm Feathers Intensive", instructor: "Patricia Owens", dates: "Nov 10 — 14, 2026", year: 2026, price: "$1,180", priceNumber: 1180, image: retreat3, location: "Charleston, SC", state: "SC", region: "south", skill: "Advanced", season: "Fall", spotsLeft: 3, creator: creators["Patricia Owens"], venueProfile: venuesMap["Magnolia House"] },
  { id: "sashiko-cascade-2027", venue: "Cascade Stitch Studio", title: "Sashiko & Boro Immersion", instructor: "Yumi Tanaka", dates: "Jul 14 — 18, 2027", year: 2027, price: "$840", priceNumber: 840, image: retreat4, location: "Seattle, WA", state: "WA", region: "west-coast", skill: "All levels", season: "Summer", spotsLeft: 5, creator: creators["Yumi Tanaka"], venueProfile: venuesMap["Cascade Stitch Studio"] },
];

export const retreatsByRegion = (slug: RegionSlug) =>
  allRetreats.filter((r) => r.region === slug);

export const retreatsByYear = (year: number) =>
  allRetreats.filter((r) => r.year === year);
