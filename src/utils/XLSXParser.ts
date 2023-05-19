import { read, utils } from "xlsx";

import { NewEmailDataModel, Status } from "../database/EmailDataTable";
import ArofloApi from "@/externalApi/ArofloApi";

interface ParsedXLSX {
  startDate: string;
  endDate: string;
  userName: string;
  userId: string;
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
    const parsed = [] as ParsedXLSX[];
    const workbook = read(xlsx);

    const users = await this.arofloApi.getUsers();
    const drivers = users.filter((user: any) => {
      return user.customfields.length > 0;
    });

    let userData = {} as ParsedXLSX;
    const sheets = Object.values(workbook.Sheets);
    sheets.forEach((sheet: any) => {
      if (sheet.A1.v === "Object:") {
        if (parsed.length !== 0) {
          userData = {} as ParsedXLSX;
        }
        userData.records = [] as NewEmailDataModel[];
        userData.userName = sheet.B1.v;

        const [user] = drivers.filter((u: any) => {
          return u.customfields[0].value === userData.userName;
        });

        if (user) userData.userId = user.customfields[0].fieldid;
        userData.startDate = sheet.B2.v.split(" ")[0].replace(/-/g, "/");
        userData.endDate = sheet.B2.v.split(" ")[3].replace(/-/g, "/");
        parsed.push(userData);
      }

      if (sheet.A1.v === "Status") {
        for (let rowId of Object.keys(sheet)) {
          const rowNumber = rowId.slice(1, rowId.length);
          if (rowId.includes("A") && sheet[rowId].v === Status.STOPPED) {
            const rowNumber = rowId.slice(1, rowId.length);
            userData.records.push({
              startDate: this.excelDateToJSDate(sheet[`B${rowNumber}`].v),
              endDate: this.excelDateToJSDate(sheet[`C${rowNumber}`].v),
              timeSpent: sheet[`D${rowNumber}`].v,
              location: sheet[`E${rowNumber}`].v,
              userId: userData.userId,
              userName: userData.userName,
              status: Status.STOPPED,
            });
          } else if (rowId.includes("A") && sheet[rowId].v === Status.MOVING) {
            userData.records.push({
              startDate: this.excelDateToJSDate(sheet[`B${rowNumber}`].v),
              endDate: this.excelDateToJSDate(sheet[`C${rowNumber}`].v),
              timeSpent: sheet[`D${rowNumber}`].v,
              userId: userData.userId,
              location: null,
              userName: userData.userName,
              status: Status.MOVING,
            });
          }
        }
      }
    });
    return parsed;
  };
}
