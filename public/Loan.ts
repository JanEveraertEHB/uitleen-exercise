import { escapeHtml } from "./Tool.js";

export default class Loan {
  firstName: string;
  lentAt: string;
  returnedAt: string | null;

  constructor(firstName: string, lentAt: string, returnedAt: string | null) {
    this.firstName = firstName;
    this.lentAt = lentAt;
    this.returnedAt = returnedAt;
  }

  renderHtmlString(): string {
    let duration = "Still lent out";
    if (this.returnedAt) {
      const durationMs = Math.max(0, new Date(this.returnedAt).getTime() - new Date(this.lentAt).getTime());
      const days = Math.floor(durationMs / 86_400_000);
      const hours = Math.floor(durationMs / 3_600_000);
      const minutes = Math.floor(durationMs / 60_000);
      if (days > 0) {
        duration = `${days} day${days === 1 ? "" : "s"}`;
      } else if (hours > 0) {
        duration = `${hours} hour${hours === 1 ? "" : "s"}`;
      } else if (minutes > 0) {
        duration = `${minutes} minute${minutes === 1 ? "" : "s"}`;
      } else {
        duration = "Less than a minute";
      }
    }

    return `<tr><td>${escapeHtml(this.firstName)}</td><td>${escapeHtml(new Date(this.lentAt).toLocaleString())}</td><td>${duration}</td></tr>`;
  }
}