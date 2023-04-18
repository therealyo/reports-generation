import { Status, statusEnum } from "@/database/EmailDataTable";
import ArofloRepository from "@/repositories/ArofloRepository";
import EmailDataRepository from "@/repositories/EmailDataRepository";

interface ReportElement {
  activity: "job" | "travel" | "other";
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
  time: string;
  description: string;
}

class ReportGenerator {
  constructor(
    private arofloRepository: ArofloRepository,
    private emailDataRepository: EmailDataRepository
  ) {}

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

    const report = [] as ReportElement[];

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
        time: record.timeSpent!,
        description: "",
      } as ReportElement;

      if (record.status === Status.STOPPED) {
        for (let arofloRecord of arofloData) {
          if (arofloRecord.location === record.location) {
            el.activity = "job";
            el.address.aroflo = arofloRecord.location;
            el.arrived.aroflo = this.formatAMPM(
              new Date(arofloRecord.startDate!)
            );
            el.departed.aroflo = this.formatAMPM(
              new Date(arofloRecord.endDate!)
            );
            el.description = arofloRecord.description!;
            break;
          }
        }

        report.push(el);
      } else if (record.status === Status.MOVING) {
        report.push({
          activity: "travel",
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
          time: record.timeSpent!,
          description: "",
        });
      }
    }

    return report;
  };
}

export default ReportGenerator;
