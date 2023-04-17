import { NewArofloModel } from "@/database/ArofloDataTable";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";

const filterTasks = () => {
  const parser = new XMLParser();
  const xml = fs.readFileSync("get_schedules.xml", "utf-8");
  //   const parsed = parser.parse(xml);
  const json = parser.parse(xml);

  const filtered = json.imsapi.zoneresponse.schedules.schedule.filter(
    (task: any) => task.scheduletype.type === "task"
  );

  return filtered;
};

export const parseXML = async () => {
  const tasks = filterTasks();

  //   console.log(tasks);
  //   console.log(new Date(tasks[0].startdatetime).valueOf());

  const mapped: NewArofloModel[] = tasks.map((task: any) => {
    return {
      location: task.scheduletype.typename,
      taskId: task.scheduleid,
      startDate: new Date(task.startdatetime).valueOf(),
      endDate: new Date(task.enddatetime).valueOf(),
      description: task.note,
      userId: task.scheduledto.scheduledtoid,
    };
  });

  return mapped;
  // tasks.forEach(async () => {

  //   });
};
