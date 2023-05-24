import fs from "fs";
import crypto from "crypto";
import axios, { AxiosInstance } from "axios";
import { NewArofloModel } from "@/database/ArofloDataTable";
import { mockedSchedules } from "@/utils/schedulesMock";
import { HmacSHA512 } from "crypto-js";
// import { tasks } from "@/utils/tasksMock";

class ArofloApi {
  public readonly instance: AxiosInstance;
  private readonly secret: string = process.env.SECRET_KEY!;
  private readonly hostIp = process.env.HOST_IP;
  private readonly accept = "application/json";
  constructor() {
    this.instance = axios.create({
      maxBodyLength: Infinity,
      baseURL: "https://api.aroflo.com",
    });
  }

  public getArofloAuth = (requestType: "GET" | "POST", queryString: string) => {
    try {
      const date = new Date().toISOString();
      const urlPath = "";

      const authorization =
        "uencoded=" +
        encodeURIComponent(process.env.U_ENCODED!) +
        "&pencoded=" +
        encodeURIComponent(process.env.P_ENCODED!) +
        "&orgEncoded=" +
        encodeURIComponent(process.env.ORG_ENCODED!);
      const payload: string[] = [requestType];

      payload.push(urlPath);
      payload.push(this.accept);
      payload.push(authorization);
      payload.push(date);
      payload.push(queryString);

      let hash = HmacSHA512(payload.join("+"), this.secret!).toString();

      return {
        urlPath,
        accept: this.accept,
        Authorization: authorization,
        af_hmac_signature: hash,
        timestamp: date,
      };
    } catch (err: unknown) {
      console.log("getArofloAuth error: ", err);
    }
  };

  public getUsers = async () => {
    // // mocked id for testing
    // return "JSc6UyZRTEwgCg==";
    let page = 1;
    const users = [] as any;
    try {
      while (true) {
        const params = [
          "zone=" + encodeURIComponent("users"),
          "join=" + encodeURIComponent("customfields"),
          "where=" + encodeURIComponent("and|archived|=|false"),
          "page=" + encodeURIComponent(`${page}`),
        ];
        const queryString = params.join("&");
        const auth = this.getArofloAuth("GET", queryString);
        if (auth) {
          const arofloUsers = await this.instance.get(`?${queryString}`, {
            headers: {
              Accept: auth.accept,
              Authorization: auth.Authorization,
              afdatetimeutc: auth.timestamp,
              Authentication: `HMAC ${auth.af_hmac_signature}`,
            },
          });

          // return arofloUsers.data;
          if (!arofloUsers.data.zoneresponse.users.length) break;
          users.push(...arofloUsers.data.zoneresponse.users);
          page++;
        }
      }
    } catch (err: unknown) {
      console.log("getUsersError: ", err);
    }
    return users;
  };

  public getTasks = async () => {
    let page = 65;
    const tasks = [] as any;
    while (true) {
      // console.log("PAGE: ", page);
      const params = [
        "zone=" + encodeURIComponent("tasks"),
        "where=" + encodeURIComponent("and|linkprocessed|=|false"),
        "page=" + encodeURIComponent(`${page}`),
      ];

      const queryString = params.join("&");
      const auth = this.getArofloAuth("GET", queryString);
      if (auth) {
        const { data } = await this.instance.get(`?${queryString}`, {
          headers: {
            Accept: auth.accept,
            Authorization: auth.Authorization,
            afdatetimeutc: auth.timestamp,
            Authentication: `HMAC ${auth.af_hmac_signature}`,
          },
        });
        // console.log(data.zoneresponse.tasks.length);
        if (!data.zoneresponse.tasks.length) break;

        tasks.push(...data.zoneresponse.tasks);
        page++;
      }
    }

    return tasks;
    // return tasks;
  };

  public getSchedules = async (date: string) => {
    let page = 1;
    const arofloData = [] as NewArofloModel[];
    const tasks = await this.getTasks();
    // const tasks = JSON.parse(
    //   fs.readFileSync("tasksReponseArray.json").toString("utf-8")
    // );
    while (true) {
      const params = [
        "zone=" + encodeURIComponent("schedules"),
        "where=" + encodeURIComponent(`and|startdate|=|${date}`),
        "order=" + encodeURIComponent("startdatetime|asc"),
        "page=" + encodeURIComponent(`${page}`),
      ];
      const queryString = params.join("&");
      const auth = this.getArofloAuth("GET", queryString);
      if (auth) {
        const arofloSchedules = await this.instance.get(`?${queryString}`, {
          headers: {
            Accept: auth.accept,
            Authorization: auth.Authorization,
            afdatetimeutc: auth.timestamp,
            Authentication: `HMAC ${auth.af_hmac_signature}`,
          },
        });

        const taskSchedules = arofloSchedules.data.zoneresponse.schedules;

        if (!taskSchedules.length) break;

        const filtered = taskSchedules.filter(
          (task: any) => task.scheduletype.type === "task"
        );
        arofloData.push(
          ...filtered
            .map((schedule: any) => {
              const [scheduleTask] = tasks.filter((task: any) => {
                return task.taskid === schedule.scheduletype.typeid;
              });
              if (scheduleTask) {
                return {
                  id: schedule.scheduleid,
                  location: scheduleTask.tasklocation.locationname,
                  taskId: schedule.scheduletype.typeid,
                  startDate: new Date(schedule.startdatetime).valueOf(),
                  endDate: new Date(schedule.enddatetime).valueOf(),
                  description: scheduleTask.description,
                  userId: schedule.scheduledto.scheduledtoid,
                };
              }
            })
            .filter((mapped: any) => mapped)
        );
        page++;
      }
    }
    return arofloData;
  };
}

export default ArofloApi;
