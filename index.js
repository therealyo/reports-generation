const { generateHtmlFromJson } = require("./htmlGeneration");
const fs =  require("fs");

const main = () => {
  const report = JSON.parse(fs.readFileSync("test-report.json"));
  const html = generateHtmlFromJson(report);

  fs.writeFileSync("report.html", html);
};

main();
