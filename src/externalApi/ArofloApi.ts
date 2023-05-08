import crypto from "crypto";
import axios, { AxiosInstance } from "axios";
import { NewArofloModel } from "@/database/ArofloDataTable";
import { mockedSchedules } from "@/utils/schedulesMock";

class ArofloApi {
  public readonly instance: AxiosInstance;
  private readonly secret: string = process.env.SECRET_KEY!;
  private readonly hostIp = process.env.HOST_IP;
  private readonly accept = "text/json";
  constructor() {
    this.instance = axios.create({
      maxBodyLength: Infinity,
      baseURL: "https://api.aroflo.com",
    });
  }

  private getArofloAuth = (
    requestType: "GET" | "POST",
    queryString: string
  ) => {
    const date = new Date().toISOString();
    const urlPath = "";

    const authorization =
      "uencoded=" +
      encodeURIComponent(process.env.uEncoded!) +
      "&pencoded=" +
      encodeURIComponent(process.env.pEncoded!) +
      "&orgEncoded=" +
      encodeURIComponent(process.env.orgEncoded!);
    const payload: string[] = [requestType];

    payload.push(urlPath);
    payload.push(this.accept);
    payload.push(authorization);
    payload.push(date);
    payload.push(queryString);

    const hmac = crypto.createHmac("sha512", this.secret);
    const hash = hmac.update(payload.join("+"));

    const hmacSignature = hash.digest("hex");

    return {
      urlPath,
      accept: this.accept,
      Authorization: authorization,
      af_hmac_signature: hmacSignature,
      timestamp: date,
    };
  };

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
    const auth = this.getArofloAuth("GET", queryString);
    const arofloUsers = await this.instance.get(`?${queryString}`, {
      headers: {
        Accept: auth.accept,
        Authorization: auth.Authorization,
        HostIP: this.hostIp,
        afdatetimeutc: auth.timestamp,
        Authentication: `HMAC ${auth.af_hmac_signature}`,
      },
    });

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
    const auth = this.getArofloAuth("GET", queryString);
    const arofloSchedules = await this.instance.get(`?${queryString}`, {
      headers: {
        Accept: auth.accept,
        Authorization: auth.Authorization,
        HostIP: this.hostIp,
        afdatetimeutc: auth.timestamp,
        Authentication: `HMAC ${auth.af_hmac_signature}`,
      },
    });

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
