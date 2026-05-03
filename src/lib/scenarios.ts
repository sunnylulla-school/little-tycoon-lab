export type Decision = { id: string; question: string; options: { key: "A" | "B" | "C"; label: string }[] };

export type Scenario = {
  id: number;
  name: string;
  short: string;
  setup: string;
  productType: "single";
  pricePerItem: number;
  unitLabel: string;
  costItems: { name: string; amount: number }[];
  decisions: Decision[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    name: "Lemonade Stand",
    short: "Hot Saturday at the park",
    setup: "It is a hot Saturday at the park. You set up a lemonade stand. You bought supplies before the day started and now it is time to sell.",
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
    setup: "Your school is hosting a bake sale on Friday. You baked cookies at home and now you are selling them at a table in the hallway.",
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
    name: "Bookmarks",
    short: "Art fair at school",
    setup: "You made handmade bookmarks at home and are selling them at a table during your school's art fair.",
    productType: "single",
    pricePerItem: 1,
    unitLabel: "bookmarks",
    costItems: [
      { name: "Cardstock and paper", amount: 2 },
      { name: "Markers", amount: 2 },
      { name: "Plastic sleeves", amount: 2 },
      { name: "Display stand", amount: 2 },
    ],
    decisions: [
      {
        id: "d1",
        question: "How many bookmarks do you make?",
        options: [
          { key: "A", label: "10 bookmarks" },
          { key: "B", label: "20 bookmarks" },
          { key: "C", label: "30 bookmarks" },
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
        question: "Do you offer a deal?",
        options: [
          { key: "A", label: "No deal — $1 each" },
          { key: "B", label: "Buy 3 get 1 free" },
          { key: "C", label: "Discount after 3pm" },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Greeting Cards",
    short: "Family night at school",
    setup: "You made handmade greeting cards at home and are selling them at a table during your school's family night event.",
    productType: "single",
    pricePerItem: 2,
    unitLabel: "cards",
    costItems: [
      { name: "Cardstock and paper", amount: 2 },
      { name: "Markers and stickers", amount: 3 },
      { name: "Envelopes", amount: 1 },
      { name: "Display stand", amount: 2 },
    ],
    decisions: [
      {
        id: "d1",
        question: "How many cards do you make?",
        options: [
          { key: "A", label: "5 cards" },
          { key: "B", label: "10 cards" },
          { key: "C", label: "15 cards" },
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
        question: "Do you offer a deal?",
        options: [
          { key: "A", label: "No deal — $2 each" },
          { key: "B", label: "Buy 2 get 1 free" },
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

export type DecisionPoints = Record<string, Record<"A" | "B" | "C", number>>;

export const SCENARIO_POINTS: Record<number, DecisionPoints> = {
  1: {
    d1: { A: 1, B: 2, C: 0 },
    d2: { A: 2, B: 0, C: 1 },
    d3: { A: 1, B: 0, C: 2 },
  },
  2: {
    d1: { A: 1, B: 2, C: 0 },
    d2: { A: 1, B: 2, C: 0 },
    d3: { A: 2, B: 0, C: 1 },
  },
  3: {
    d1: { A: 1, B: 2, C: 0 },
    d2: { A: 0, B: 2, C: 1 },
    d3: { A: 1, B: 0, C: 2 },
  },
  4: {
    d1: { A: 1, B: 2, C: 0 },
    d2: { A: 0, B: 2, C: 1 },
    d3: { A: 1, B: 0, C: 2 },
  },
};

const UNITS_BY_POINTS: Record<number, number[]> = {
  1: [4, 4, 8, 8, 12, 12, 15],
  2: [5, 5, 10, 10, 18, 18, 24],
  3: [4, 4, 8, 8, 12, 12, 15],
  4: [2, 2, 4, 4, 6, 6, 8],
};

export type OutcomeResult = { type: "single"; unitsSold: number; revenue: number; price: number };

export function calcOutcome(
  scenario: Scenario,
  decisions: Record<string, "A" | "B" | "C">
): OutcomeResult {
  const points = SCENARIO_POINTS[scenario.id];
  const totalPts =
    (points.d1?.[decisions.d1] ?? 0) +
    (points.d2?.[decisions.d2] ?? 0) +
    (points.d3?.[decisions.d3] ?? 0);
  const unitsSold = UNITS_BY_POINTS[scenario.id][Math.min(totalPts, 6)];
  const price = scenario.pricePerItem;
  return { type: "single", unitsSold, revenue: unitsSold * price, price };
}
