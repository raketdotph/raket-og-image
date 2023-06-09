/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const relativeUrl = (req.query["path"] as string) || "";
    const url = `${process.env.RAKET_ORIGIN}${relativeUrl}`;

    const options = {
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      headless: true,
      ignoreHTTPSErrors: true,
    };

    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setViewport({ width: 640, height: 360 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });
    const image = await page.screenshot({ type: "png" });
    await browser.close();

    res.statusCode = 200;
    res.setHeader("Cache-Control", "s-maxage=31536000, stale-while-revalidate");
    res.setHeader("Content-Type", `image/png`);
    res.end(image);
  } catch (error) {
    res.json({
      status: "error",
      data: error || "Something went wrong",
    });
  }
}
