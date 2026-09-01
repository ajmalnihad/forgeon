/**
 * Approved loyalty rules (display only — no reward management).
 * Milestones are every 10th valid PAID daily purchase: 10th, 20th, 30th ...
 * Backend remains the source of truth.
 */
export const MILESTONE_STEP = 10;

export function nextMilestone(paidCount) {
  return (Math.floor(Number(paidCount || 0) / MILESTONE_STEP) + 1) * MILESTONE_STEP;
}

export function milestoneProgress(paidCount) {
  const count = Number(paidCount || 0);
  const target = nextMilestone(count);
  const base = target - MILESTONE_STEP;
  return {
    count,
    target,
    inCycle: count - base,
    percent: Math.round(((count - base) / MILESTONE_STEP) * 100),
  };
}

/** Purchase number the sale currently being created would occupy. */
export function upcomingPurchaseNumber(paidCount) {
  return Number(paidCount || 0) + 1;
}

export function isMilestoneNumber(purchaseNumber) {
  return Number(purchaseNumber) > 0 && Number(purchaseNumber) % MILESTONE_STEP === 0;
}
