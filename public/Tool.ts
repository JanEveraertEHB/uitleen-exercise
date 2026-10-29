// values typed by visitors must be escaped before they go into an HTML string
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default class Tool {
  id: number;
  name: string;
  description: string;
  // null = available, otherwise the id of the student who has the tool
  lentToStudentId: number | null;

  constructor(id: number, name: string, description: string, lentToStudentId: number | null) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.lentToStudentId = lentToStudentId;
  }

  renderHtmlString(): string {
    // an available tool can be lent out, a lent out tool can be returned
    let statusAndButton = `
        <p>Available</p>
        <button class="lend-button" id="tool-lend-${this.id}">Lend</button>`;
    if (this.lentToStudentId !== null) {
      statusAndButton = `
        <p>Lent out</p>
        <button class="return-button" id="tool-return-${this.id}">Return</button>`;
    }

    const htmlString = `
      <article id="tool-${this.id}">
        <h2>${escapeHtml(this.name)}</h2>
        <p>${escapeHtml(this.description ?? "")}</p>${statusAndButton}
        <button class="history-button" id="tool-history-${this.id}">History</button>
        <div id="tool-history-content-${this.id}"></div>
        <button class="delete-button" id="tool-delete-${this.id}">Delete</button>
      </article>
    `;

    return htmlString;
  }
}
