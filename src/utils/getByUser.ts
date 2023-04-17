import fs from "fs";

const main = () => {
  const tasks = JSON.parse(fs.readFileSync("filteredTasks.json").toString());
  const byUser = tasks.filter(
    (task: any) => task.scheduledto.scheduledtoid === "JSdKUyFRPEggCg=="
  );
  console.log(byUser);
};

main();
