// Every page of the site, in reading order. Used by the nav, footer, home
// question cards and the "next page" link at the bottom of each page.
export const ROUTES = [
  { href: "/live-map", id: "live", label: "Live map", question: "Where is it burning today?", blurb: "Live map of every detection this week, state by state." },
  { href: "/near-me", id: "near", label: "Near me", question: "Is there fire near me?", blurb: "Check any place in India against today's satellite passes." },
  { href: "/fire-seasons", id: "seasons", label: "Fire seasons", question: "When is fire season in my state?", blurb: "Eight years of data turned into a month-by-month calendar." },
  { href: "/trends", id: "trends", label: "Trends", question: "Is it getting better or worse?", blurb: "2018 → 2025, for India, your state and each season." },
  { href: "/satellites", id: "satellites", label: "Satellites", question: "Why do the numbers not match?", blurb: "Two satellites count very differently — and a calculator to convert." },
  { href: "/solutions", id: "solutions", label: "Solutions", question: "What can I actually do?", blurb: "Practical steps for farmers, families and officials." },
  { href: "/data", id: "data", label: "Data", question: "Where do the numbers come from?", blurb: "Sources, method, downloads and limits." },
];
export const routeById = (id) => ROUTES.find((r) => r.id === id);
