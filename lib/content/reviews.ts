// TODO: replace with real reviews pulled from Google / Facebook once we have them.
export type Review = {
  id: string;
  name: string;
  location: string;
  rating: number; // 1–5
  quote: string;
  service: string; // human-readable
  date: string;   // ISO yyyy-mm-dd
};

export const reviews: Review[] = [
  {
    id: "r1",
    name: "Sarah M.",
    location: "Petawawa, ON",
    rating: 5,
    quote:
      "PVS LawnPros has been mowing for us all season. They show up exactly when they say they will and the lawn has never looked better. Worth every dollar.",
    service: "Lawn Mowing",
    date: "2026-04-12",
  },
  {
    id: "r2",
    name: "Dan R.",
    location: "Pembroke, ON",
    rating: 5,
    quote:
      "Booked ClearView for windows and gutters. Streak-free, fast, and they cleaned up everything before leaving. Already rebooked for fall.",
    service: "Window & Gutter Cleaning",
    date: "2026-03-28",
  },
  {
    id: "r3",
    name: "Karen L.",
    location: "Deep River, ON",
    rating: 5,
    quote:
      "Our seasonal snow contract with SnowLand is the best decision we made all winter. Driveway is always cleared before we wake up.",
    service: "Seasonal Snow Contract",
    date: "2026-02-15",
  },
  {
    id: "r4",
    name: "Mike T.",
    location: "Petawawa, ON",
    rating: 5,
    quote:
      "Hired them for a spring cleanup and aeration. Crew was friendly, professional, and the lawn looked transformed. Highly recommend.",
    service: "Spring Cleanup + Aeration",
    date: "2026-05-02",
  },
  {
    id: "r5",
    name: "Janelle P.",
    location: "Pembroke, ON",
    rating: 5,
    quote:
      "Pressure washing on the driveway and patio — looks brand new. Booking was easy and the quote was exactly what we paid.",
    service: "Pressure Washing",
    date: "2026-05-18",
  },
  {
    id: "r6",
    name: "Rob G.",
    location: "Chalk River, ON",
    rating: 5,
    quote:
      "Used PVS for a full property cleanout when we sold the cottage. Done in a day. Saved us so much time and stress.",
    service: "Property Cleanout",
    date: "2026-04-05",
  },
  {
    id: "r7",
    name: "Erin H.",
    location: "Petawawa, ON",
    rating: 4,
    quote:
      "Reliable lawn service all season. Easy to communicate with and respectful of the property. Great local option.",
    service: "Lawn Mowing",
    date: "2026-05-22",
  },
  {
    id: "r8",
    name: "Greg B.",
    location: "Pembroke, ON",
    rating: 5,
    quote:
      "Window cleaning made a massive difference — house feels brighter inside. The streak-free guarantee is the real deal.",
    service: "Window Cleaning",
    date: "2026-05-09",
  },
];

export function averageRating(): number {
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
