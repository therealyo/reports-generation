import { NewArofloModel } from "@/database/ArofloDataTable";
import { mockedSchedules } from "./schedulesMock";
import fs from "fs/promises";

const getSchedulesForTask = async (date: string) => {
  // const loadJSON = JSON.parse(
  //   // String(await fs.readFile("./mock/schedules.json"))
  // ); // replace it with call for api (https://apidocs.aroflo.com/#2101ceb1-6c15-4c99-8029-62f3688f800d)
  // return loadJSON.imsapi.zoneresponse.schedules.schedule;
  return mockedSchedules.imsapi.zoneresponse.schedules.schedule;
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
