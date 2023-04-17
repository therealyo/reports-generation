import { XMLParser } from "fast-xml-parser";
import fs from "fs";

const main = async () => {
  const parser = new XMLParser();
  const xml = fs.readFileSync("get_schedules.xml", "utf-8");
  //   const parsed = parser.parse(xml);
  const json = parser.parse(xml);

  const filtered = json.imsapi.zoneresponse.schedules.schedule.filter(
    (task: any) => task.scheduletype.type === "task"
  );

  fs.writeFileSync("filteredTasks.json", JSON.stringify(filtered, null, 2));
};

main();
