/* eslint-disable import/no-anonymous-default-export */
import chrome from "chrome-aws-lambda";
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer-core";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const relativeUrl = (req.query["path"] as string) || "";
    const url = "https://raket.ph/" + relativeUrl;

    const executablePath = await chrome.executablePath;
    const options = executablePath
      ? {
          args: chrome.args,
          executablePath: await chrome.executablePath,
          headless: chrome.headless,
          defaultViewport: chrome.defaultViewport,
          ignoreHTTPSErrors: true,
        }
      : {
          args: [],
          executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        };

    const browser = await puppeteer.launch(options);
    console.log("browser");
    const page = await browser.newPage();
    console.log("page");
    await page.setViewport({ width: 640, height: 360 });
    console.log("page1");
    await page.goto(url, { waitUntil: "networkidle0" });
    console.log("page2");
    const image = await page.screenshot({ type: "png" });
    console.log("image");
    await browser.close();
    console.log("image close");

    res.statusCode = 200;
    res.setHeader("Cache-Control", "s-maxage=31536000, stale-while-revalidate");
    res.setHeader("Content-Type", `image/png`);
    res.end(image);
  } catch (error) {
    console.log("error", error);
    res.json({
      status: "error",
      data: error || "Something went wrong",
    });
  }
}
