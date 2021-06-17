var express = require("express");
var router = express.Router();
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require("puppeteer-extra");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

require("dotenv").config();
const fs = require('fs');
var path = require('path');

const MobileNumber = process.env.MobileNumber;
const Password = process.env.Password;

setInterval(async () => {
  const date = new Date();
  const key = parseInt(date.getTime() / (1 * 60 * 1000))

  const fileName = path.join(__dirname, '../', 'public', 'data.json');
  const file = require(fileName);

  const usage = await getUsage();
  file[key] = usage.usedAmount;

  fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(file));
  });
}, 1 * 60 * 1000)

const getUsage = async () => {
  if (!MobileNumber || !Password) {
    res.json({ error: "missing MobileNumber and Password" });
    return;
  }
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  let page = (await browser.pages())[0];
  await page.goto("https://my.te.eg/");

  await page.waitForSelector("#MobileNumberID");
  await page.type("#MobileNumberID", MobileNumber, { delay: 100 });

  await page.waitForSelector("#PasswordID");

  await page.type("#PasswordID", "p", { delay: 1000 });
  await page.focus("#PasswordID");
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");

  for (let i = 0; i < Password.length; i++) {
    const element = Password[i];
    await page.type("#PasswordID", element, { delay: 100 });
  }

  const singInBtn = await page.waitForSelector("#singInBtn");
  await singInBtn.click();

  const finalResponse = await page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/line/freeunitusage") &&
      response.request().method() === "POST",
    11
  );
  const responseJson = await finalResponse.json();

  await browser.close();

  return responseJson?.body?.detailedLineUsageList[0];
}

/* GET users listing. */
router.get("/", async (req, res) => {
  const usage = await getUsage();

  res.json(usage);
});

module.exports = router;
