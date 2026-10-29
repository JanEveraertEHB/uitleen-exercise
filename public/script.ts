import Tool from "./Tool.js";
import Loan from "./Loan.js";

const API_URI = "http://localhost:3000";

function init() {
  document.getElementById("submitForm")?.addEventListener("click", (event) => {
    event.preventDefault();
    addTool();
  });
  getToolListAndDisplay();
}

function getToolListAndDisplay() {
  const container = document.getElementById("toolList") as HTMLDivElement;
  container.innerHTML = "";

  fetch(API_URI + "/api/tools")
    .then((response) => response.json())
    .then((data) => {
      // turn every plain object from the API into a Tool instance and render it
      data.forEach((element: Tool) => {
        const toolInstance = new Tool(element.id, element.name, element.description, element.lentToStudentId);
        container.insertAdjacentHTML("beforeend", toolInstance.renderHtmlString());
      });

      // the buttons only exist after rendering, so add the listeners now
      addClickListeners("lend-button", "tool-lend-", lendTool);
      addClickListeners("return-button", "tool-return-", returnTool);
      addClickListeners("history-button", "tool-history-", showHistory);
      addClickListeners("delete-button", "tool-delete-", deleteTool);
    })
    .catch((e) => {
      console.error(e);
    });
}

// gives every button with this class a click listener that calls the handler with the tool id
function addClickListeners(className: string, idPrefix: string, handler: (id: string) => void) {
  document.querySelectorAll("." + className).forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.id.replace(idPrefix, "");
      handler(id);
    });
  });
}

function showMessage(text: string) {
  const messageElement = document.getElementById("message") as HTMLParagraphElement;
  messageElement.textContent = text;
}

// sends a request to the API. When something went wrong the message of the API is shown,
// when it worked the list of tools is loaded again.
function sendRequest(path: string, method: string, body?: object) {
  fetch(API_URI + path, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
    .then((response) => {
      return response.json().then((data) => {
        if (!response.ok) {
          showMessage(data.error);
          return;
        }
        showMessage("");
        getToolListAndDisplay();
      });
    })
    .catch((e) => {
      console.error(e);
    });
}

function lendTool(id: string) {
  const studentNumberElement = document.getElementById("studentNumber") as HTMLInputElement;
  const firstNameElement = document.getElementById("firstName") as HTMLInputElement;

  sendRequest("/api/tools/" + id + "/lend", "POST", {
    studentNumber: studentNumberElement.value,
    firstName: firstNameElement.value,
  });
}

function returnTool(id: string) {
  sendRequest("/api/tools/" + id + "/return", "POST");
}

function showHistory(id: string) {
  fetch(API_URI + "/api/tools/" + id + "/history")
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        showMessage(data.error);
        return;
      }

      const loans = data.map((loan: Loan) => new Loan(loan.firstName, loan.lentAt, loan.returnedAt));
      const historyElement = document.getElementById("tool-history-content-" + id) as HTMLDivElement;
      const times = loans.length === 1 ? "time" : "times";
      historyElement.innerHTML = `
        <p>Lent out ${loans.length} ${times}</p>
        <table>
          <thead><tr><th>First name</th><th>Lent on</th><th>For how long</th></tr></thead>
          <tbody>${loans.map((loan: Loan) => loan.renderHtmlString()).join("")}</tbody>
        </table>`;
    })
    .catch((e) => {
      console.error(e);
      showMessage("Could not load loan history");
    });
}

function deleteTool(id: string) {
  sendRequest("/api/tools/" + id, "DELETE");
}

function addTool() {
  const nameElement = document.getElementById("toolName") as HTMLInputElement;
  const descriptionElement = document.getElementById("toolDescription") as HTMLInputElement;
  // id -1: the database will give the tool its real id
  const tool = new Tool(-1, nameElement.value, descriptionElement.value, null);

  sendRequest("/api/tools", "POST", tool);
}

init();


// Test Comment