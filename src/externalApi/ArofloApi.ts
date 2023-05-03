import axios, { AxiosInstance } from "axios";
import { NewArofloModel } from "@/database/ArofloDataTable";
import { mockedSchedules } from "@/utils/schedulesMock";

class ArofloApi {
  public readonly instance: AxiosInstance;
  constructor() {
    this.instance = axios.create({
      maxBodyLength: Infinity,
      baseURL: "https://api.aroflo.com",
      headers: {
        Authorization: process.env.AUTHORIZATION,
        Accept: "text/json",
        HostIP: "XXX.XXX.XXX.XXX",
        Authentication: process.env.AUTHENTICATION,
        afdatetimeutc: new Date().valueOf(),
      },
    });
  }

  public getUsers = async () => {
    // // mocked id for testing
    // return "JSc6UyZRTEwgCg==";
    const params = [
      "zone=" + encodeURIComponent("users"),
      "join=" + encodeURIComponent("customfields"),
      "where=" + encodeURIComponent("and|archived|=|false"),
      "page=" + encodeURIComponent("1"),
    ];
    const queryString = params.join("&");
    const arofloUsers = await this.instance.get(`?${queryString}`);

    return arofloUsers.data.zoneresponse.users;
  };

  public getSchedules = async (date: string) => {
    const dateParams = date.split("/");
    const params = [
      "zone=" + encodeURIComponent("schedules"),
      "where=" +
        encodeURIComponent(
          `and|startdate|=|${dateParams[0]}/${dateParams[1]}/${dateParams[2]}`
        ),
      "order=" + encodeURIComponent("startdatetime|asc"),
      "page=" + encodeURIComponent("1"),
    ];
    const queryString = params.join("&");

    const arofloSchedules = await this.instance.get(`?${queryString}`);

    const taskSchedules =
      arofloSchedules.data.imsapi.zoneresponse.schedules.schedule;

    const filtered = taskSchedules.filter(
      (task: any) => task.scheduletype.type === "task"
    );

    const arofloData: NewArofloModel[] = filtered.map((schedule: any) => {
      return {
        id: schedule.scheduleid,
        location: schedule.scheduletype.typename,
        taskId: schedule.scheduletype.typeid,
        startDate: new Date(schedule.startdatetime).valueOf(),
        endDate: new Date(schedule.enddatetime).valueOf(),
        description: schedule.note,
        userId: schedule.scheduledto.scheduledtoid,
      };
    });

    return arofloData;
  };
}

export default ArofloApi;
