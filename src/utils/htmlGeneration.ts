// import { ReportElement, Report } from "../../index";
import { NewEmailDataModel } from "@/database/EmailDataTable";
import { ReportElement, Report } from "./ReportGenerator";

const checkIfAllValuesAreNull = (obj: any) => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== null) {
      return false;
    }
  }
  return true;
};

const hasNotNullValues = (obj: any) => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== null) {
      return true;
    }
  }
  return false;
};

const checkForNull = (value: any) => {
  if (value !== null) return value;
  else return "";
};

export const generateHtmlFromJson = (data: Report) => {
  let html = `
  <h1>${data.name}'s report for ${data.date}</h1>
  <table>
  <thead>
  <tr>
      <th colspan="1">Activity</th>
      <th colspan="2">Address</th>
      <th colspan="2">Arrived</th>
      <th colspan="2">Departed</th>
      <th colspan="2">Total time spent</th>
      <th colspan="1">Task description</th>
  </tr>
  </thead>
  <tbody>
  `;
  data.elements.forEach((obj: ReportElement) => {
    const className = (value: string) => {
      if (value === "travel") return "travel";
      else if (value === "job") return "job";
      else if (value === "other") return "other";
    };
    if (obj.activity === "travel") {
      html += `<tr class="travel">
                  <td class="centered">${obj.activity}</td>
                  <td colspan="2"></td>
                  <td colspan="2"></td>
                  <td colspan="2"></td>
                  <td colspan="2">${obj.time}</td>
                  <td colspan="2">${obj.description}</td>
                  </tr>`;
    } else if (
      checkIfAllValuesAreNull(obj.address) &&
      checkIfAllValuesAreNull(obj.arrived) &&
      checkIfAllValuesAreNull(obj.departed)
    ) {
      html += `<tr class=${className(obj.activity)}>
                  <td class="centered">${obj.activity}</td>
                  <td colspan="2"></td>
                  <td colspan="2"></td>
                  <td colspan="2"></td>
                  <td colspan="2">${obj.time}</td>
                  <td colspan="2">${obj.description}</td>
                  </tr>`;
    } else if (
      hasNotNullValues(obj.address) &&
      checkIfAllValuesAreNull(obj.arrived) &&
      checkIfAllValuesAreNull(obj.departed)
    ) {
      if (obj.address.aroflo !== null) {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.aroflo)}</td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.actual)}</td>
  </tr>`;
      } else {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.actual)}</td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}></tr>`;
      }
    } else if (
      hasNotNullValues(obj.address) &&
      hasNotNullValues(obj.arrived) &&
      checkIfAllValuesAreNull(obj.departed)
    ) {
      if (obj.address.aroflo !== null) {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.aroflo)}</td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.aroflo)}</td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.actual)}</td>
  </tr>
          `;
      } else {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.actual)}</td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}></tr>
          `;
      }
    } else if (
      hasNotNullValues(obj.address) &&
      hasNotNullValues(obj.arrived) &&
      hasNotNullValues(obj.departed)
    ) {
      if (obj.address.aroflo !== null) {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.aroflo)}</td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.aroflo)}</td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.aroflo)}</td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.actual)}</td>
  </tr>
          `;
      } else {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.actual)}</td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}></tr>
          `;
      }
    } else if (
      hasNotNullValues(obj.address) &&
      checkIfAllValuesAreNull(obj.arrived) &&
      hasNotNullValues(obj.departed)
    ) {
      if (obj.address.aroflo !== null) {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.aroflo)}</td>
      <td colspan="2" rowspan="2"></td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.aroflo)}</td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.actual)}</td>
  </tr>
          `;
      } else {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.address.actual)}</td>
      <td colspan="2" rowspan="2"></td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.actual)}</td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}></tr>
          `;
      }
    } else if (
      checkIfAllValuesAreNull(obj.address) &&
      hasNotNullValues(obj.arrived) &&
      checkIfAllValuesAreNull(obj.departed)
    ) {
      if (obj.address.aroflo !== null) {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td colspan="2" rowspan="2"></td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.aroflo)}</td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.actual)}</td>
  </tr>
          `;
      } else {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td colspan="2" rowspan="2"></td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.actual)}</td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}></tr>
          `;
      }
    } else if (
      checkIfAllValuesAreNull(obj.address) &&
      checkIfAllValuesAreNull(obj.arrived) &&
      hasNotNullValues(obj.departed)
    ) {
      if (obj.address.aroflo !== null) {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2"></td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.aroflo)}</td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.actual)}</td>
  </tr>
          `;
      } else {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td colspan="2" rowspan="2"></td>
      <td colspan="2" rowspan="2"></td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.actual)}</td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}></tr>
          `;
      }
    } else if (
      checkIfAllValuesAreNull(obj.address) &&
      hasNotNullValues(obj.arrived) &&
      hasNotNullValues(obj.departed)
    ) {
      if (obj.address.aroflo !== null) {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td colspan="2" rowspan="2"></td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.aroflo)}</td>
      <td class="values_name" colspan="1" rowspan="1">Aroflo =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.aroflo)}</td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual = </td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.actual)}</td>
  </tr>
          `;
      } else {
        html += `
          <tr class=${className(obj.activity)}>
      <td class="centered" colspan="1" rowspan="2">${obj.activity}</td>
      <td colspan="2" rowspan="2"></td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.arrived.actual)}</td>
      <td class="values_name" colspan="1" rowspan="1">Actual =</td>
      <td colspan="1" rowspan="1">${checkForNull(obj.departed.actual)}</td>
      <td colspan="2" rowspan="2">${obj.time}</td>
      <td colspan="2" rowspan="2">${obj.description}</td>
  </tr>
  <tr class=${className(obj.activity)}></tr>
          `;
      }
    }
  });
  html += `
  </tbody>
</table>
  `;

  return html;
};

interface ParsedXLSX {
  startDate: string;
  endDate: string;
  userName: string;
  userId: string;
  records: NewEmailDataModel[];
}

export function generateReportHTML(data: Report[]) {
  let html = `
  <!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <title id="title">Report</title>
  <style>
      table {
          font-family: 'Roboto', sans-serif;
          font-size: 14px;
          font-weight: 400;
          line-height: 120%;
          border-collapse: collapse;
          table-layout: fixed;
          border-spacing: 0;
          border: 1px solid #000;
          margin: 50px auto 0;
      }
      thead {
          background-color: #98F87E;
      }
      th {
          border: 1px solid #000;
          font-size: 18px;
          padding: 6px 10px;
          min-width: 180px;
      }
      tr {
          border-bottom: 1px solid #000;
      }
      td {
          border: 1px solid #000;
          padding: 6px 10px;
          max-width: 140px;
          word-wrap: break-word;
      }
      .qspec {
          background-color: #FFE599;
      }
      .travel {
          background-color: #BDD6EE;
      }
      .job {
          background-color: #C5E0B3;
      }
      .home {
          background-color: #FFE599;
      }
      .other {
          background-color: #F7CAAC;
      }
      .centered {
          text-align: center;
      }
      .values_name {
          width: 44px;
          font-size: 12px;
      }
      h1 {
        text-align: center;
      }
  </style>
</head>
<body>`;
  data.forEach((d) => (html += generateHtmlFromJson(d)));
  html += `
</body>
</html>`;

  return html;
}
