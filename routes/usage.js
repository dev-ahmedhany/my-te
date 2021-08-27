var express = require("express");
var router = express.Router();

// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require("puppeteer-extra");
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

let browser;
(async () => {
  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
})();

require("dotenv").config();

const MobileNumber = process.env.MobileNumber;
const Password = process.env.Password;

const getUsage = async () => {
  if (!MobileNumber || !Password) {
    return { error: "missing MobileNumber and Password" };
  }
  let response = { error: "not completed" };
  const page = await browser.newPage();
  try {
    await page.goto("https://my.te.eg/");

    const mobileNumberSelector = '#serviceNo > input'
    const passwordSelector = '#password'
    const singInBtnSelector = 'body > app-root > div > div.p-mt-5.top-relative > app-login > div > div > div > p-card:nth-child(2) > div > div > div > form > div > button:nth-child(4)'

    await page.waitForSelector(mobileNumberSelector);
    await page.type(mobileNumberSelector, MobileNumber, { delay: 100 });

    await page.waitForSelector(passwordSelector);

    await page.type(passwordSelector, "p", { delay: 1000 });
    await page.focus(passwordSelector);
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");

    for (let i = 0; i < Password.length; i++) {
      const element = Password[i];
      await page.type(passwordSelector, element, { delay: 100 });
    }

    await page.type(passwordSelector, String.fromCharCode(13), { delay: 100 });

    const finalResponse = await page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/line/freeunitusage") &&
        response.request().method() === "POST",
      11
    );
    const responseJson = await finalResponse.json();
    response = responseJson?.body?.detailedLineUsageList[0];
  } catch (e) {
    console.log(e);
  } finally {
    await page.close();
  }
  return response;
}

/* GET users listing. */
router.get("/", async (req, res) => {
  const usage = await getUsage();
  res.json(usage);
});

module.exports = router;
