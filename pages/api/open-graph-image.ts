/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const relativeUrl = (req.query["path"] as string) || "";
    const url = "https://raket.ph/" + relativeUrl;

    const options = {
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      headless: true,
      ignoreHTTPSErrors: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
    };

    console.log("OPTIONS", options);
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
