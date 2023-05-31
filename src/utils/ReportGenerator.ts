import { Status, statusEnum } from "@/database/EmailDataTable";
import ArofloRepository from "@/repositories/ArofloRepository";
import EmailDataRepository from "@/repositories/EmailDataRepository";
import AWS, { Lambda } from "aws-sdk";
import axios from "axios";
import haversine from "haversine";

export interface ReportElement {
  name: string;
  activity: "job" | "travel" | "other";
  jobNumber?: number;
  jobSummary?: {
    timeUsed: string;
    inTime: string;
  };
  address: {
    aroflo: string | null;
    actual: string | null;
  };
  arrived: {
    aroflo: string | null;
    actual: string | null;
  };
  departed: {
    aroflo: string | null;
    actual: string | null;
  };
  time: {
    aroflo: string | null;
    actual: string | null;
  };
  description: string;
}

export interface Report {
  name: string;
  date: string;
  elements: ReportElement[];
}

export type Loc = {
  lng: number;
  lat: number;
};

class ReportGenerator {
  private lambda: AWS.Lambda;
  constructor(
    private arofloRepository: ArofloRepository,
    private emailDataRepository: EmailDataRepository
  ) {
    this.lambda = new AWS.Lambda({ region: process.env.AWS_REGION });
  }

  public formatAMPM = (date: Date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    let min = minutes < 10 ? "0" + minutes : minutes;
    let strTime = hours + ":" + min + " " + ampm;
    return strTime;
  };

  private getHoursMinutesSeconds = (timestamp: number) => {
    const diffInMilliseconds = Math.abs(timestamp);

    const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const minutes = Math.floor(
      (diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((diffInMilliseconds % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  public compareLocations = async (loc1: Loc, loc2: Loc) => {
    return haversine(loc1, loc2, {
      threshold: 0.2,
      unit: "km",
      format: "{lat,lng}",
    });
  };

  public generateJSONTable = async (
    userId: string,
    startDate: number,
    endDate: number
  ) => {
    const arofloData =
      await this.arofloRepository.getUserActualDataForTimePeriod(
        userId,
        startDate,
        endDate
      );
    const actualData =
      await this.emailDataRepository.getUserActualDataForTimePeriod(
        userId,
        startDate,
        endDate
      );

    if (actualData.length !== 0) {
      const report = {
        name: actualData[0].userName!,
        date: new Date(actualData[0].startDate!)
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "/"),
        elements: [] as ReportElement[],
      } as Report;

      const matched: string[] = [];
      let jobNumber = 0;
      for (let record of actualData) {
        let el = {
          activity: "other",
          address: {
            aroflo: null,
            actual: record.location,
          },
          arrived: {
            aroflo: null,
            actual: this.formatAMPM(new Date(record.startDate!)),
          },
          departed: {
            aroflo: null,
            actual: this.formatAMPM(new Date(record.endDate!)),
          },
          time: {
            aroflo: null,
            actual: record.timeSpent!,
          },
          description: "",
        } as ReportElement;

        if (record.status === Status.STOPPED) {
          for (let arofloRecord of arofloData) {
            const realLoc = {
              lng: record.lng!,
              lat: record.lat!,
            };
            const arofloLoc = {
              lng: arofloRecord.lng!,
              lat: arofloRecord.lat!,
            };
            if (
              (await this.compareLocations(realLoc, arofloLoc)) &&
              !matched.includes(arofloRecord.id)
            ) {
              matched.push(arofloRecord.id);
              jobNumber++;
              el.activity = "job";
              el.jobNumber = jobNumber;
              const inTime = this.getHoursMinutesSeconds(
                record.startDate! - arofloRecord.startDate!
              );
              const timeUsed = this.getHoursMinutesSeconds(
                record.endDate! -
                  record.startDate! -
                  (arofloRecord.endDate! - arofloRecord.startDate!)
              );

              el.jobSummary = {
                inTime:
                  record.startDate! - arofloRecord.startDate! > 0
                    ? `Late to job: ${inTime.hours} h ${inTime.minutes} min ${inTime.seconds} s`
                    : `Earlier to job: ${inTime.hours} h ${inTime.minutes} min ${inTime.seconds} s`,
                timeUsed:
                  record.endDate! -
                    record.startDate! -
                    (arofloRecord.endDate! - arofloRecord.startDate!) >
                  0
                    ? `Under time: ${timeUsed.hours} h ${timeUsed.minutes} min ${timeUsed.seconds} s`
                    : `Overtime: ${timeUsed.hours} h ${timeUsed.minutes} min ${timeUsed.seconds} s`,
              };
              el.address.aroflo = arofloRecord.location;
              el.arrived.aroflo = this.formatAMPM(
                new Date(arofloRecord.startDate!)
              );
              el.departed.aroflo = this.formatAMPM(
                new Date(arofloRecord.endDate!)
              );
              const arofloTime = this.getHoursMinutesSeconds(
                arofloRecord.endDate! - arofloRecord.startDate!
              );
              el.time.aroflo =
                arofloTime.hours == 0
                  ? `${arofloTime.minutes} min ${arofloTime.seconds} s`
                  : `${arofloTime.hours} h ${arofloTime.minutes} min ${arofloTime.seconds} s`;
              el.description = arofloRecord.description!;
              break;
            }
          }
        } else if (record.status === Status.MOVING) {
          el.activity = "travel";
        }
        report.elements.push(el);
      }

      return report;
    }
  };

  public generatePDFfromHTML = async (html: string) => {
    const params: Lambda.Types.InvocationRequest = {
      FunctionName: process.env.PDF_LAMBDA_NAME!,
      Payload: JSON.stringify({ html }),
    };

    const pdf = await this.lambda.invoke(params).promise();
    // @ts-ignore
    return Buffer.from(JSON.parse(pdf.Payload).data);
  };
}

export default ReportGenerator;
