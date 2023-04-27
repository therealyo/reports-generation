// import { parseXLSX } from './parseXLSX';
import axios from "axios";
import { read, utils } from "xlsx";
import { NewEmailDataModel, Status } from "@/database/EmailDataTable";
import ArofloApi from "@/externalApi/ArofloApi";

interface ParsedXLSX {
  startDate: string;
  endDate: string;
  user: string;
  records: NewEmailDataModel[];
}

export default class XLSXParser {
  constructor(private arofloApi: ArofloApi) {}

  private excelDateToJSDate = (serial: number) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    const fractional_day = serial - Math.floor(serial) + 0.0000001;

    let total_seconds = Math.floor(86400 * fractional_day);

    const seconds = total_seconds % 60;

    total_seconds -= seconds;

    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(
      date_info.getFullYear(),
      date_info.getMonth(),
      date_info.getDate(),
      hours,
      minutes,
      seconds
    ).valueOf();
  };

  public parseXLSX = async (xlsx: any) => {
    const parsed = {} as ParsedXLSX;
    const workbook = read(xlsx);
    const sheetNameList = workbook.SheetNames;
    const sheet = workbook.Sheets[sheetNameList[0]];
    const rows: any = utils.sheet_to_json(sheet);

    await Promise.all(
      rows.map(async (row: any) => {
        if (row.Report === "Object:")
          parsed.user = await this.arofloApi.getUserId(row["__EMPTY"]);
        if (row.Report === "Period:") {
          parsed.startDate = row["__EMPTY"].split(" ")[0].replace(/-/g, "/");
          parsed.endDate = row["__EMPTY"].split(" ")[3].replace(/-/g, "/");
        }
      })
    );

    parsed.records = rows
      .map((row: any) => {
        if (Object.keys(row).length > 2 && row.Report !== "Status") {
          if (row.Report === Status.STOPPED) {
            return {
              startDate: this.excelDateToJSDate(row["__EMPTY"]),
              endDate: this.excelDateToJSDate(row["__EMPTY_1"]),
              timeSpent: row["__EMPTY_2"],
              location: row["__EMPTY_3"],
              userId: parsed.user,
              status: Status.STOPPED,
            };
          } else if (row.Report === Status.MOVING) {
            return {
              startDate: this.excelDateToJSDate(row["__EMPTY"]),
              endDate: this.excelDateToJSDate(row["__EMPTY_1"]),
              timeSpent: row["__EMPTY_2"],
              userId: parsed.user,
              location: null,
              status: Status.MOVING,
            };
          }
        }
      })
      .filter((record: NewEmailDataModel) => record);

    return parsed;
  };
}

// const getUserId = async (userName: string) => {
//   // implement here
//   // return "JSc6UyZRTEwgCg==";
//   const params = [
//     "zone=" + encodeURIComponent("users"),
//     "where=" + encodeURIComponent("and|archived|=|false"),
//     "join=" + encodeURIComponent("customfields"),
//     "page=" + encodeURIComponent("1"),
//   ];
//   const queryString = params.join("&");

//   const arofloUsers = await axios.get(`https://api.aroflo.com/${queryString}`, {
//     headers: {
//       Authorization: process.env.AUTHORIZATION,
//       Accept: "text/json",
//       Authentication: process.env.AUTHENTICATION,
//       afdatetimeutc: new Date().toString(),
//     },
//   });

//   const user = arofloUsers.data.zoneresponse.users.filter(
//     (u: any) => u.customfields.value === userName
//   );

//   return user.customfields.fieldid;
// };

// function excelDateToJSDate(serial: number) {
//   const utc_days = Math.floor(serial - 25569);
//   const utc_value = utc_days * 86400;
//   const date_info = new Date(utc_value * 1000);

//   const fractional_day = serial - Math.floor(serial) + 0.0000001;

//   let total_seconds = Math.floor(86400 * fractional_day);

//   const seconds = total_seconds % 60;

//   total_seconds -= seconds;

//   const hours = Math.floor(total_seconds / (60 * 60));
//   const minutes = Math.floor(total_seconds / 60) % 60;

//   return new Date(
//     date_info.getFullYear(),
//     date_info.getMonth(),
//     date_info.getDate(),
//     hours,
//     minutes,
//     seconds
//   ).valueOf();
// }

// export const parseXLSX = async (xlsx: any) => {
//   const parsed = {} as ParsedXLSX;
//   const workbook = read(xlsx);
//   const sheetNameList = workbook.SheetNames;
//   const sheet = workbook.Sheets[sheetNameList[0]];
//   const rows: any = utils.sheet_to_json(sheet);

//   await Promise.all(
//     rows.map(async (row: any) => {
//       if (row.Report === "Object:")
//         parsed.user = await getUserId(row["__EMPTY"]);
//       if (row.Report === "Period:") {
//         parsed.startDate = row["__EMPTY"].split(" ")[0].replace(/-/g, "/");
//         parsed.endDate = row["__EMPTY"].split(" ")[3].replace(/-/g, "/");
//       }
//     })
//   );

//   parsed.records = rows
//     .map((row: any) => {
//       if (Object.keys(row).length > 2 && row.Report !== "Status") {
//         if (row.Report === Status.STOPPED) {
//           return {
//             startDate: excelDateToJSDate(row["__EMPTY"]),
//             endDate: excelDateToJSDate(row["__EMPTY_1"]),
//             timeSpent: row["__EMPTY_2"],
//             location: row["__EMPTY_3"],
//             userId: parsed.user,
//             status: Status.STOPPED,
//           };
//         } else if (row.Report === Status.MOVING) {
//           return {
//             startDate: excelDateToJSDate(row["__EMPTY"]),
//             endDate: excelDateToJSDate(row["__EMPTY_1"]),
//             timeSpent: row["__EMPTY_2"],
//             userId: parsed.user,
//             location: null,
//             status: Status.MOVING,
//           };
//         }
//       }
//     })
//     .filter((record: NewEmailDataModel) => record);

//   return parsed;
// };
