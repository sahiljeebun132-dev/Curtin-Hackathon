// Demo caseload. Lifted to app state so a completed check-in can write the
// new risk level back. Names are initials only (privacy). Nothing real stored.
export const INITIAL_CASELOAD = [
  { id: 1, initials: "A.R.", area: "Roche Bois",   level: "High",   days: 23, missed: 2, next: "in 3 days" },
  { id: 2, initials: "K.M.", area: "Mahebourg",    level: "Medium", days: 48, missed: 0, next: "in 9 days" },
  { id: 3, initials: "S.B.", area: "Plaine Verte", level: "Crisis", days: 4,  missed: 5, next: "today" },
  { id: 4, initials: "J.P.", area: "Bambous",      level: "Low",    days: 96, missed: 0, next: "in 21 days" },
  { id: 5, initials: "R.D.", area: "Cite La Cure", level: "High",   days: 14, missed: 1, next: "in 2 days" },
];
