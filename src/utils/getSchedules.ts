import { NewArofloModel } from "@/database/ArofloDataTable";
import fs from "fs/promises";

const getSchedulesForTask = async (date: string) => {
  const loadJSON = JSON.parse(String(await fs.readFile("mock/schedules.json"))); // replace it with call for api (https://apidocs.aroflo.com/#c70915bc-0d58-41bb-ac41-27785f90bb0a)
  //   console.log(loadJSON);
  return loadJSON.imsapi.zoneresponse.schedules.schedule;
};

export const getSchedules = async (date: string) => {
  // const arofloData = [] as NewArofloModel[];
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
  // for (let task of tasks) {
  //   const taskSchedules = await getSchedulesForTask(task);
  //   //   const schedules = loadJSON.json.imsapi.zoneresponse.schedules.schedule;

  //   const filtered = taskSchedules.filter(
  //     (task: any) => task.scheduletype.type === "task"
  //   );

  //   const mapped: NewArofloModel[] = filtered.map((schedule: any) => {
  //     return {
  //       id: schedule.scheduleid,
  //       location: task.tasklocation.locationname,
  //       taskId: task.taskid,
  //       startDate: new Date(schedule.startdatetime).valueOf(),
  //       endDate: new Date(schedule.enddatetime).valueOf(),
  //       description: task.description,
  //       userId: schedule.scheduledto.scheduledtoid,
  //     };
  //   });

  //   arofloData.push(...mapped);

  //   // arofloData[`${task.taskid}`] = mapped;
  // }

  return arofloData;
};
