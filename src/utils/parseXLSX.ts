import { NewEmailDataModel, Status } from "@/database/EmailDataTable";
import XLSX from "xlsx";

// var workbook = XLSX.readFile("ReportInbound.xlsx");
// var sheet_name_list = workbook.SheetNames;
// sheet_name_list.forEach(function (y) {
//   var worksheet = workbook.Sheets[y];
// var headers = {};
// var data = [];
// for(z in worksheet) {
//     if(z[0] === '!') continue;
//     //parse out the column, row, and value
//     var tt = 0;
//     for (var i = 0; i < z.length; i++) {
//         if (!isNaN(z[i])) {
//             tt = i;
//             break;
//         }
//     };
//     var col = z.substring(0,tt);
//     var row = parseInt(z.substring(tt));
//     var value = worksheet[z].v;

//     //store header names
//     if(row == 1 && value) {
//         headers[col] = value;
//         continue;
//     }

//     if(!data[row]) data[row]={};
//     data[row][headers[col]] = value;
// }
// //drop those first two rows which are empty
// data.shift();
// data.shift();
//   console.log(worksheet);
// });

const getUserId = async () => {
  // implement here
  return "Peter";
};

function ExcelDateToJSDate(serial: number) {
  var utc_days = Math.floor(serial - 25569);
  var utc_value = utc_days * 86400;
  var date_info = new Date(utc_value * 1000);

  var fractional_day = serial - Math.floor(serial) + 0.0000001;

  var total_seconds = Math.floor(86400 * fractional_day);

  var seconds = total_seconds % 60;

  total_seconds -= seconds;

  var hours = Math.floor(total_seconds / (60 * 60));
  var minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate(),
    hours,
    minutes,
    seconds
  ).valueOf();
}

export const parseXLSX = async () => {
  const workbook = XLSX.readFile("ReportInbound.xlsx");
  const sheetNameList = workbook.SheetNames;
  const sheet = workbook.Sheets[sheetNameList[0]];
  const rows: any = XLSX.utils.sheet_to_json(sheet);

  const userId: string = await getUserId();

  const records: NewEmailDataModel[] = rows
    .map((row: any) => {
      // if (row.Report === "Object:") user = row["__EMPTY"];
      if (Object.keys(row).length > 2 && row.Report !== "Status") {
        if (row.Report === Status.STOPPED) {
          return {
            startDate: ExcelDateToJSDate(row["__EMPTY"]),
            endDate: ExcelDateToJSDate(row["__EMPTY_1"]),
            timeSpent: row["__EMPTY_2"],
            location: row["__EMPTY_3"],
            userId: userId,
            status: Status.STOPPED,
          };
        } else if (row.Report === Status.MOVING) {
          return {
            startDate: ExcelDateToJSDate(row["__EMPTY"]),
            endDate: ExcelDateToJSDate(row["__EMPTY_1"]),
            timeSpent: row["__EMPTY_2"],
            userId: userId,
            location: null,
            status: Status.MOVING,
          };
        }
      }
    })
    .filter((record: NewEmailDataModel) => record);

  return records;
};
