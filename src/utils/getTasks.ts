import fs from "fs/promises";

export const getTasks = async (date: string) => {
  const loadJSON = JSON.parse(String(await fs.readFile("mock/tasks.json"))); // replace it with actual api call https://apidocs.aroflo.com/#8a035593-4198-4c58-b653-6c9241dc31cf
  const tasks = loadJSON.zoneresponse.tasks;
  // console.log(tasks.length);
  return tasks.filter((task: any) => task.completeddate === date);
};
