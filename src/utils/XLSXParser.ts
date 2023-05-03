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
    const sheetNameList = workbook.SheetNames;
    const sheet = workbook.Sheets[sheetNameList[0]];
    const rows: any = utils.sheet_to_json(sheet);

    const users = await this.arofloApi.getUsers();

    let userData = {} as ParsedXLSX;
    rows.map((row: any) => {
      if (row.Report === "Object:") {
        if (parsed.length !== 0) {
          userData = {} as ParsedXLSX;
        }
        userData.records = [] as NewEmailDataModel[];
        userData.userName = row["__EMPTY"];

        const user = users.filter(
          (u: any) => u.customfields.value === userData.userName
        );
        userData.userId = user.customfields.fieldid;
        parsed.push(userData);
      }
      if (row.Report === "Period:") {
        userData.startDate = row["__EMPTY"].split(" ")[0].replace(/-/g, "/");
        userData.endDate = row["__EMPTY"].split(" ")[3].replace(/-/g, "/");
      }
      if (Object.keys(row).length > 2 && row.Report !== "Status") {
        if (row.Report === Status.STOPPED) {
          userData.records.push({
            startDate: this.excelDateToJSDate(row["__EMPTY"]),
            endDate: this.excelDateToJSDate(row["__EMPTY_1"]),
            timeSpent: row["__EMPTY_2"],
            location: row["__EMPTY_3"],
            userId: userData.userId,
            userName: userData.userName,
            status: Status.STOPPED,
          });
        } else if (row.Report === Status.MOVING) {
          userData.records.push({
            startDate: this.excelDateToJSDate(row["__EMPTY"]),
            endDate: this.excelDateToJSDate(row["__EMPTY_1"]),
            timeSpent: row["__EMPTY_2"],
            userId: userData.userId,
            location: null,
            userName: userData.userName,
            status: Status.MOVING,
          });
        }
      }
    });

    return parsed;
  };
}
