import axios from "axios";

import { NewArofloModel } from "@/database/ArofloDataTable";

const getSchedulesForTask = async (date: string) => {
  const params = [
    "zone=" + encodeURIComponent("schedules"),
    "where=" +
      encodeURIComponent(
        `and|startdate|=|${new Date().getFullYear()}/${new Date().getMonth()}/${new Date().getDate()}`
      ),
    "order=" + encodeURIComponent("startdatetime|asc"),
    "page=" + encodeURIComponent("1"),
  ];
  const queryString = params.join("&");

  const arofloSchedules = await axios.get(
    `https://api.aroflo.com/${queryString}`,
    {
      headers: {
        Authorization: process.env.AUTHORIZATION,
        Accept: "text/json",
        Authentication: process.env.AUTHENTICATION,
        afdatetimeutc: new Date().toString(),
      },
    }
  );

  return arofloSchedules.data.imsapi.zoneresponse.schedules.schedule;
  // return mockedSchedules.imsapi.zoneresponse.schedules.schedule;
};

export const getSchedules = async (date: string) => {
  const taskSchedules = await getSchedulesForTask(date);

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
