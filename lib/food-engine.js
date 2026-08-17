// Phase 2: deterministic dietary compatibility engine.
// This is intentionally separated from the UI so it can later be replaced
// or augmented by the secure Anthropic backend without changing the frontend.

const NORMALIZATION = {
  peanuts: "peanut",
  peanut: "peanut",
  milk: "milk",
  dairy: "milk",
  cheese: "milk",
  butter: "milk",
  gluten: "gluten",
  wheat: "gluten",
  fish: "fish",
  salmon: "fish",
  shellfish: "shellfish",
  shrimp: "shellfish",
  eggs: "egg",
  egg: "egg",
};

const CONSTRAINT_RULES = {
  "Peanut allergy": ["peanut"],
  "Dairy-free": ["milk"],
  "Gluten-free": ["gluten"],
  "Vegetarian": ["meat", "chicken", "beef", "pork", "fish", "shellfish"],
  "Vegan": ["meat", "chicken", "beef", "pork", "fish", "shellfish", "egg", "milk"],
  "Low-sodium": [],
  "Halal": ["pork"],
  "Kosher": ["pork", "shellfish"],
};

function normalize(value) {
  const key = String(value || "").trim().toLowerCase();
  return NORMALIZATION[key] || key;
}

function tokenize(values = []) {
  return values.flatMap(value => String(value || "").toLowerCase().split(/[^a-z0-9-]+/).filter(Boolean));
}

export function evaluateMeal(meal, profile = {}) {
  const ingredients = tokenize(meal.ingredients || []);
  const allergens = tokenize(meal.allergens || []).map(normalize);
  const detected = new Set([...ingredients.map(normalize), ...allergens]);
  const conflicts = [];

  for (const constraint of profile.constraints || []) {
    const rules = CONSTRAINT_RULES[constraint] || [];
    const hit = rules.find(rule => detected.has(rule) || ingredients.includes(rule));
    if (hit) conflicts.push({ constraint, ingredient: hit, severity: constraint.includes("allergy") ? "hard" : "hard" });
  }

  // Nutrition goals are soft preferences. They never override a hard conflict.
  const goal = profile.goal || "General wellness";
  const nutrition = meal.nutrition || {};
  const protein = Number.parseFloat(String(nutrition.protein || "0"));
  const sodium = Number.parseFloat(String(nutrition.sodium || "0"));
  let score = 100;
  if (conflicts.length) score = 0;
  else {
    if (goal === "High protein") score += protein >= 30 ? 0 : -12;
    if (goal === "Heart health") score += sodium <= 600 ? 0 : -10;
    if (goal === "Weight management") score += Number(nutrition.calories || 0) <= 650 ? 0 : -8;
    if (goal === "Athletic performance") score += protein >= 25 ? 0 : -8;
    score = Math.max(0, Math.min(100, score));
  }

  return {
    compatible: conflicts.length === 0,
    score,
    conflicts,
    decision: conflicts.length ? "REJECT" : "ALLOW",
    reason: conflicts.length ? "One or more hard dietary constraints conflict with detected meal attributes." : "No hard dietary conflicts detected.",
  };
}

export function evaluateMeals(meals, profile) {
  return meals.map(meal => ({ ...meal, compatibility: evaluateMeal(meal, profile) }));
}

export function parseMenuText(text = "") {
  const lower = text.toLowerCase();
  const terms = Object.keys(NORMALIZATION).filter(term => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "i").test(lower));
  const allergens = [...new Set(terms.map(normalize).filter(x => ["peanut", "milk", "gluten", "fish", "shellfish", "egg"].includes(x)))];
  return {
    sourceText: text,
    detectedIngredients: [...new Set(terms)],
    allergens,
    status: "parsed",
  };
}
