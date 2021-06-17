var express = require("express");
var router = express.Router();
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require("puppeteer-extra");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

require("dotenv").config();
const MobileNumber = process.env.MobileNumber;
const Password = process.env.Password;

/* GET users listing. */
router.get("/", async (req, res) => {
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

  const usage = responseJson?.body?.detailedLineUsageList[0];

  res.json(usage);
});

module.exports = router;
