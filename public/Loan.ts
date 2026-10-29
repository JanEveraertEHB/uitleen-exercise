

export default class Loan {
  id: number;
  firstName: string;
  toolName: string;
  lentAt: Date;
  returnedAt: Date;

  loanLength: string;


  constructor(id: number, firstName: string, name: string, lentAt: string, returnedAt: string) {
    this.id = id;
    this.firstName = firstName;
    this.toolName = name;
    this.lentAt = new Date(lentAt);
    this.returnedAt = new Date(returnedAt);
    this.loanLength = "";



    const loanLengthMillis: number = this.returnedAt.getTime() - this.lentAt.getTime();

    const seconds = Math.floor(loanLengthMillis / 1000)
    const minutes = Math.floor(loanLengthMillis / 1000 / 60);
    const hours = Math.floor(loanLengthMillis / 1000 / 60 / 60);
    const days = Math.floor(loanLengthMillis / 1000 / 60 / 60 / 24);


    let units: string;

    if(this.returnedAt == null) {
      this.loanLength = "Not returned yet";
    }


    if(days != 0) { this.loanLength = days + " days"; }
    else if(hours != 0) { this.loanLength = hours + " hours"; }
    else if(minutes != 0) { this.loanLength = minutes + " minutes"; }
    else if(seconds != 0) { this.loanLength = seconds + " seconds"; }

    console.log(this.loanLength)
  }

  renderHTMLString(): string {
    const htmlString = `
      <tr><td>${this.firstName}</td><td>${this.lentAt}</td><td>${this.loanLength}</td></tr>
    `;

    return htmlString;
  }

}