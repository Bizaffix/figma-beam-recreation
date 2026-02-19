// Retreater Personality Quiz data: questions, options, personality types, and scoring logic

// ---- Quiz Questions ----

export interface QuizOption {
  id: string;
  emoji: string;
  title: string;
  description: string;
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  number: number;
  emoji: string;
  title: string;
  subtitle: string;
  multiSelect?: boolean;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "creative_energy",
    number: 1,
    emoji: "\u{1F305}",
    title: "Your creative energy",
    subtitle: "When do you do your best creative work?",
    options: [
      {
        id: "morning",
        emoji: "\u{1F305}",
        title: "Morning Maker",
        description: "I want to start sewing at sunrise, finish strong by afternoon",
        tags: ["morning", "structured", "productive"],
      },
      {
        id: "night",
        emoji: "\u{1F319}",
        title: "Night Owl Quilter",
        description: "My best work happens after 9pm \u2014 give me late-night sewing freedom",
        tags: ["night", "flexible", "creative"],
      },
      {
        id: "flow",
        emoji: "\u{1F3A8}",
        title: "Flow State Finisher",
        description: "I lose track of time when I'm creating \u2014 just let me sew",
        tags: ["flow", "focused", "immersive"],
      },
      {
        id: "restorative",
        emoji: "\u{1F9D8}",
        title: "Restorative Retreater",
        description: "I need gentle pacing, breaks, and time to breathe",
        tags: ["restorative", "gentle", "mindful"],
      },
    ],
  },
  {
    id: "sleeping",
    number: 2,
    emoji: "\u{1F6CF}\uFE0F",
    title: "Your sleeping sanctuary",
    subtitle: "Where do you recharge best?",
    options: [
      {
        id: "private",
        emoji: "\u{1F6CF}\uFE0F",
        title: "Private Haven",
        description: "Private room is non-negotiable \u2014 I need my own space to recharge",
        tags: ["private", "solo", "quiet"],
      },
      {
        id: "paired",
        emoji: "\u{1F46F}",
        title: "Paired Up",
        description: "Roommate is fine if we vibe \u2014 I like the connection",
        tags: ["shared", "social", "connection"],
      },
      {
        id: "community",
        emoji: "\u{1F465}",
        title: "Community Bunks",
        description: "Bunk-style nostalgia \u2014 I'm here for the group energy",
        tags: ["community", "social", "fun"],
      },
      {
        id: "own_nest",
        emoji: "\u{1F3E1}",
        title: "My Own Nest",
        description: "I'll book my own nearby lodging \u2014 just give me studio access",
        tags: ["independent", "flexible", "solo"],
      },
    ],
  },
  {
    id: "heart_sing",
    number: 3,
    emoji: "\u{1F4AB}",
    title: "What makes your heart sing at a retreat?",
    subtitle: "Select all that apply",
    multiSelect: true,
    options: [
      {
        id: "learning",
        emoji: "\u{1F4A1}",
        title: "Learning new techniques",
        description: "Structured classes",
        tags: ["learning", "structured", "growth"],
      },
      {
        id: "friends",
        emoji: "\u{1F91D}",
        title: "Meeting quilting friends",
        description: "Social, collaborative vibe",
        tags: ["social", "community", "connection"],
      },
      {
        id: "quiet_time",
        emoji: "\u{1F9D8}",
        title: "Quiet, restorative time",
        description: "Solo creative flow",
        tags: ["quiet", "solo", "restorative"],
      },
      {
        id: "late_night",
        emoji: "\u{1F389}",
        title: "Late-night sewing sessions",
        description: "No bedtime, just finishing seams",
        tags: ["night", "fun", "immersive"],
      },
      {
        id: "meals",
        emoji: "\u{1F37D}\uFE0F",
        title: "Delicious shared meals",
        description: "Food as connection",
        tags: ["meals", "social", "comfort"],
      },
      {
        id: "finishing",
        emoji: "\u{1F3C6}",
        title: "Finishing a project",
        description: "Accountability & celebration",
        tags: ["productive", "finishing", "achievement"],
      },
      {
        id: "beautiful_space",
        emoji: "\u{1F4F8}",
        title: "Beautiful, inspiring space",
        description: "Natural light, views, aesthetic",
        tags: ["aesthetic", "inspiring", "quiet"],
      },
      {
        id: "creative_freedom",
        emoji: "\u{1F3A8}",
        title: "Creative freedom",
        description: "No rules, just possibility",
        tags: ["creative", "flexible", "flow"],
      },
    ],
  },
  {
    id: "budget",
    number: 4,
    emoji: "\u{1F4B0}",
    title: "Your budget comfort zone",
    subtitle: "What feels right for this retreat?",
    options: [
      {
        id: "shoestring",
        emoji: "\u{1F45F}",
        title: "Shoestring",
        description: "DIY venue rental, bring your own meals \u2014 $200\u2013$400",
        tags: ["budget", "diy"],
      },
      {
        id: "worth_it",
        emoji: "\u{2728}",
        title: "Worth It",
        description: "Most weekend retreats with meals & lodging \u2014 $400\u2013$700",
        tags: ["mid-range", "value"],
      },
      {
        id: "treat_myself",
        emoji: "\u{1F380}",
        title: "Treat Myself",
        description: "Instruction + gourmet meals + spa vibes \u2014 $700\u2013$1,200",
        tags: ["premium", "luxury-lite"],
      },
      {
        id: "skys_the_limit",
        emoji: "\u{1F451}",
        title: "Sky's the Limit",
        description: "Luxury retreat center, all-inclusive \u2014 $1,200+",
        tags: ["luxury", "all-inclusive"],
      },
      {
        id: "no_filter",
        emoji: "\u{1F30D}",
        title: "Just show me everything",
        description: "No budget filter \u2014 surprise me",
        tags: ["flexible"],
      },
    ],
  },
];

// ---- Personality Types ----

export interface PersonalityType {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  tagline: string;
  description: string;
  needsInRetreat: string[];
  retreatsFeelLikeHome: string;
  searchBoost: string[];
}

export const PERSONALITY_TYPES: PersonalityType[] = [
  {
    id: "sunrise_stitcher",
    name: "The Sunrise Stitcher",
    emoji: "\u{1F305}",
    gradient: "from-amber-400 via-orange-300 to-yellow-200",
    tagline: "First one at the sewing table, last one to leave the morning light",
    description:
      "You thrive on early mornings and golden light streaming through studio windows. Structure feeds your creativity \u2014 you love knowing what's ahead so you can dive deep. You're the one who quietly gets more done by noon than most do all day.",
    needsInRetreat: [
      "Early studio access (6am+)",
      "Well-lit workspace with natural light",
      "Structured schedule with clear learning goals",
    ],
    retreatsFeelLikeHome: "Mountain retreats with sunrise views and focused workshops",
    searchBoost: ["morning", "structured", "private", "learning", "productive"],
  },
  {
    id: "moonlight_maker",
    name: "The Moonlight Maker",
    emoji: "\u{1F319}",
    gradient: "from-indigo-500 via-purple-400 to-blue-300",
    tagline: "When the world gets quiet, your creativity gets loud",
    description:
      "You come alive after dark. The hum of your machine at midnight is your meditation. You love retreats that let you sew until 2am without judgment, surrounded by fellow night owls who understand that creativity doesn't punch a clock.",
    needsInRetreat: [
      "24-hour or late-night studio access",
      "Flexible, self-paced schedule",
      "Social energy and late-night camaraderie",
    ],
    retreatsFeelLikeHome: "Laid-back retreats with open studios and midnight sewing sessions",
    searchBoost: ["night", "flexible", "social", "fun", "community"],
  },
  {
    id: "zen_quilter",
    name: "The Zen Quilter",
    emoji: "\u{1F9D8}",
    gradient: "from-emerald-400 via-teal-300 to-cyan-200",
    tagline: "Quilting is your meditation \u2014 the retreat is the exhale",
    description:
      "For you, a retreat is restoration. You need space to breathe between stitches, quiet mornings, and the kind of beauty that makes your soul sigh. You don't need to be busy \u2014 you need to be refilled.",
    needsInRetreat: [
      "Private room for decompressing",
      "Gentle, unhurried pace",
      "Beautiful, inspiring natural surroundings",
    ],
    retreatsFeelLikeHome: "Waterside or garden retreats with spa-like calm and solo studio time",
    searchBoost: ["restorative", "quiet", "private", "aesthetic", "solo"],
  },
  {
    id: "social_stitcher",
    name: "The Social Stitcher",
    emoji: "\u{1F389}",
    gradient: "from-pink-400 via-rose-300 to-red-200",
    tagline: "The best quilts are made with friends, laughter, and shared pizza",
    description:
      "You're here for the people as much as the projects. Group energy fuels you. You love potluck dinners, swapping fabric, show-and-tell, and finding your quilting tribe. The retreat is the party \u2014 the quilt is the souvenir.",
    needsInRetreat: [
      "Community spaces and shared meals",
      "Group activities and show-and-tell",
      "Fun, welcoming social atmosphere",
    ],
    retreatsFeelLikeHome: "Guild-style retreats with shared rooms, big tables, and lots of laughter",
    searchBoost: ["social", "community", "meals", "fun", "connection"],
  },
  {
    id: "focused_finisher",
    name: "The Focused Finisher",
    emoji: "\u{1F3C6}",
    gradient: "from-blue-500 via-sky-400 to-cyan-300",
    tagline: "You came here to finish that quilt \u2014 and you will",
    description:
      "You have a stack of UFOs and a plan. A retreat is your accountability partner. You love focused sewing time, minimal distractions, and the pure satisfaction of binding that last edge. You leave with finished quilts and a full heart.",
    needsInRetreat: [
      "Uninterrupted sewing time blocks",
      "Dedicated workspace you can leave set up",
      "Optional instruction for tricky techniques",
    ],
    retreatsFeelLikeHome: "Sew-at-your-own-pace retreats with big tables and no mandatory classes",
    searchBoost: ["flow", "focused", "finishing", "productive", "immersive"],
  },
  {
    id: "creative_explorer",
    name: "The Creative Explorer",
    emoji: "\u{1F3A8}",
    gradient: "from-violet-500 via-fuchsia-400 to-pink-300",
    tagline: "Rules are for rulers \u2014 you'd rather play with color and curves",
    description:
      "You're drawn to the unexpected. Modern quilting, improv piecing, art quilts, bold color \u2014 that's your language. You want a retreat that says \"try anything\" and a space that makes you feel like an artist, not a student.",
    needsInRetreat: [
      "Creative freedom and open-ended projects",
      "Inspiring, aesthetic workspace",
      "Exposure to new styles and modern techniques",
    ],
    retreatsFeelLikeHome: "Modern quilt retreats with art-studio vibes and innovative instructors",
    searchBoost: ["creative", "flexible", "aesthetic", "inspiring", "growth"],
  },
];

// ---- Scoring Logic ----

export type QuizAnswers = Record<string, string | string[]>;

export function computePersonality(answers: QuizAnswers): PersonalityType {
  const tagCounts: Record<string, number> = {};

  for (const [questionId, answer] of Object.entries(answers)) {
    const question = QUIZ_QUESTIONS.find((q) => q.id === questionId);
    if (!question) continue;

    const selectedIds = Array.isArray(answer) ? answer : [answer];
    for (const optId of selectedIds) {
      const option = question.options.find((o) => o.id === optId);
      if (option) {
        for (const tag of option.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
  }

  let bestScore = -1;
  let bestType = PERSONALITY_TYPES[0];

  for (const pType of PERSONALITY_TYPES) {
    let score = 0;
    for (const boostTag of pType.searchBoost) {
      score += tagCounts[boostTag] || 0;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = pType;
    }
  }

  return bestType;
}

export function quizAnswersToSearchContext(
  answers: QuizAnswers,
  personality: PersonalityType,
): { searchAdditions: string; budgetRange: string } {
  const parts: string[] = [];

  const energy = answers.creative_energy as string;
  if (energy === "morning") parts.push("morning schedule");
  if (energy === "night") parts.push("late-night sewing");
  if (energy === "restorative") parts.push("gentle pacing, restorative");

  const sleeping = answers.sleeping as string;
  if (sleeping === "private") parts.push("private room");
  if (sleeping === "paired") parts.push("shared room");
  if (sleeping === "community") parts.push("bunk-style, group");

  const heartSing = (answers.heart_sing as string[]) || [];
  if (heartSing.includes("learning")) parts.push("classes, instruction");
  if (heartSing.includes("friends")) parts.push("social, meet quilters");
  if (heartSing.includes("quiet_time")) parts.push("quiet, solo time");
  if (heartSing.includes("late_night")) parts.push("late-night sewing");
  if (heartSing.includes("meals")) parts.push("meals included");
  if (heartSing.includes("finishing")) parts.push("finish projects, UFOs");
  if (heartSing.includes("beautiful_space")) parts.push("beautiful space, natural light");
  if (heartSing.includes("creative_freedom")) parts.push("creative freedom, modern");

  let budgetRange = "";
  const budget = answers.budget as string;
  if (budget === "shoestring") budgetRange = "under $400";
  if (budget === "worth_it") budgetRange = "$400-$700";
  if (budget === "treat_myself") budgetRange = "$700-$1200";
  if (budget === "skys_the_limit") budgetRange = "over $1200";

  return {
    searchAdditions: parts.join(", "),
    budgetRange,
  };
}

// Dream input placeholders (rotate every 3 seconds)
export const DREAM_PLACEHOLDERS = [
  "A cozy mountain retreat where I can finally tackle free motion quilting without judgment...",
  "Somewhere quiet near Asheville with private rooms and great natural light...",
  "A weekend workshop for modern quilters who love bold colors and late-night sewing...",
  "A healing space near water where I can finish UFOs and exhale...",
  "Guild retreat with big tables, good coffee, and friends who get it...",
];
