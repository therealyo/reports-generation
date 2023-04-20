import { NewEmailDataModel, Status } from "@/database/EmailDataTable";
import { S3Client } from "@aws-sdk/client-s3";
import { read, utils } from "xlsx";

const getUserId = async (userName: string) => {
  // implement here
  return "JSc6UyZRTEwgCg==";
};

function excelDateToJSDate(serial: number) {
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
}

interface ParsedXLSX {
  startDate: string;
  endDate: string;
  user: string;
  records: NewEmailDataModel[];
}

// const client = new

export const parseXLSX = async (xlsx: any) => {
  const parsed = {} as ParsedXLSX;
  const workbook = read(xlsx);
  const sheetNameList = workbook.SheetNames;
  const sheet = workbook.Sheets[sheetNameList[0]];
  const rows: any = utils.sheet_to_json(sheet);

  // get date and userId from excel report
  await Promise.all(
    rows.map(async (row: any) => {
      if (row.Report === "Object:")
        parsed.user = await getUserId(row["__EMPTY"]);
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
            startDate: excelDateToJSDate(row["__EMPTY"]),
            endDate: excelDateToJSDate(row["__EMPTY_1"]),
            timeSpent: row["__EMPTY_2"],
            location: row["__EMPTY_3"],
            userId: parsed.user,
            status: Status.STOPPED,
          };
        } else if (row.Report === Status.MOVING) {
          return {
            startDate: excelDateToJSDate(row["__EMPTY"]),
            endDate: excelDateToJSDate(row["__EMPTY_1"]),
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
