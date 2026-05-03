export type Decision = { id: string; question: string; options: { key: "A" | "B" | "C"; label: string }[] };

export type Scenario = {
  id: number;
  name: string;
  short: string;
  setup: string;
  productType: "single" | "dual";
  pricePerItem?: number; // single
  unitLabel?: string; // e.g., cups, cookies, cars
  costItems: { name: string; amount: number }[];
  decisions: Decision[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    name: "Lemonade Stand",
    short: "Hot Saturday at the park",
    setup:
      "It is a hot Saturday at the park. You set up a lemonade stand. You bought supplies before the day started and now it is time to sell.",
    productType: "single",
    pricePerItem: 1,
    unitLabel: "cups",
    costItems: [
      { name: "Lemons", amount: 2 },
      { name: "Sugar", amount: 2 },
      { name: "Cups", amount: 3 },
      { name: "Sign and tape", amount: 1 },
    ],
    decisions: [
      {
        id: "d1",
        question: "How many cups do you make to start?",
        options: [
          { key: "A", label: "10 cups" },
          { key: "B", label: "15 cups" },
          { key: "C", label: "20 cups" },
        ],
      },
      {
        id: "d2",
        question: "Where do you set up?",
        options: [
          { key: "A", label: "Near the playground" },
          { key: "B", label: "Near the parking lot" },
          { key: "C", label: "Near the picnic tables" },
        ],
      },
      {
        id: "d3",
        question: "Do you offer a deal?",
        options: [
          { key: "A", label: "No deal — $1 each" },
          { key: "B", label: "Buy 2 get 1 free" },
          { key: "C", label: "Half price after 2pm" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Bake Sale",
    short: "Friday at school",
    setup:
      "Your school is hosting a bake sale on Friday. You baked cookies at home and now you are selling them at a table in the hallway.",
    productType: "single",
    pricePerItem: 1,
    unitLabel: "cookies",
    costItems: [
      { name: "Flour and butter", amount: 3 },
      { name: "Sugar and eggs", amount: 2 },
      { name: "Chocolate chips", amount: 3 },
      { name: "Bags and labels", amount: 2 },
    ],
    decisions: [
      {
        id: "d1",
        question: "How many cookies do you bake?",
        options: [
          { key: "A", label: "12 cookies" },
          { key: "B", label: "24 cookies" },
          { key: "C", label: "36 cookies" },
        ],
      },
      {
        id: "d2",
        question: "How do you package them?",
        options: [
          { key: "A", label: "One cookie per bag" },
          { key: "B", label: "Three cookies per bag for $3" },
          { key: "C", label: "Sell individually only" },
        ],
      },
      {
        id: "d3",
        question: "Do you make a sign?",
        options: [
          { key: "A", label: "Yes — big colorful sign" },
          { key: "B", label: "No sign" },
          { key: "C", label: "Small sign, quick to make" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Car Wash",
    short: "Sunday afternoon in the neighborhood",
    setup:
      "You and a friend are running a neighborhood car wash on a Sunday afternoon. You got permission to use the driveway and split costs equally. These are YOUR half of the costs.",
    productType: "single",
    pricePerItem: 5,
    unitLabel: "cars",
    costItems: [
      { name: "Soap and sponges", amount: 3 },
      { name: "Buckets", amount: 2 },
      { name: "Flyers", amount: 1 },
      { name: "Towels", amount: 2 },
    ],
    decisions: [
      {
        id: "d1",
        question: "How do you get customers?",
        options: [
          { key: "A", label: "Hand out flyers the day before" },
          { key: "B", label: "Post on the neighborhood app" },
          { key: "C", label: "Both — flyers and app" },
        ],
      },
      {
        id: "d2",
        question: "What hours do you work?",
        options: [
          { key: "A", label: "10am to 12pm" },
          { key: "B", label: "10am to 3pm" },
          { key: "C", label: "Only when people show up" },
        ],
      },
      {
        id: "d3",
        question: "Do you offer extra services?",
        options: [
          { key: "A", label: "Basic wash only — $5" },
          { key: "B", label: "Wash and dry for $7" },
          { key: "C", label: "Wash, dry, and windows for $10" },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Bookmarks and Cards",
    short: "Family night at school",
    setup:
      "You made handmade bookmarks and greeting cards at home and are selling them at a table during your school's family night event.",
    productType: "dual",
    costItems: [
      { name: "Cardstock and paper", amount: 2 },
      { name: "Markers and stickers", amount: 4 },
      { name: "Plastic sleeves", amount: 2 },
      { name: "Display stand", amount: 2 },
    ],
    decisions: [
      {
        id: "d1",
        question: "What do you make more of?",
        options: [
          { key: "A", label: "Mostly bookmarks (20) and a few cards (5)" },
          { key: "B", label: "Mostly cards (20) and a few bookmarks (5)" },
          { key: "C", label: "Equal amounts — 12 of each" },
        ],
      },
      {
        id: "d2",
        question: "How do you display them?",
        options: [
          { key: "A", label: "Lay flat on the table" },
          { key: "B", label: "Stand them up so people can see from far away" },
          { key: "C", label: "Put them in a basket" },
        ],
      },
      {
        id: "d3",
        question: "Do you bundle them?",
        options: [
          { key: "A", label: "No — sell separately" },
          { key: "B", label: "2 bookmarks and 1 card for $3" },
          { key: "C", label: "Discount after 7pm" },
        ],
      },
    ],
  },
];

export const PRINCIPLES = ["Revenue", "Cost", "Profit", "Customer", "Strategy"] as const;
export type Principle = (typeof PRINCIPLES)[number];

export const getScenario = (id: number) => SCENARIOS.find((s) => s.id === id)!;
export const totalCost = (s: Scenario) => s.costItems.reduce((a, b) => a + b.amount, 0);
