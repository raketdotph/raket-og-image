/* eslint-disable import/no-anonymous-default-export */
import { saveImageToDatabase } from "@/utilities/strapi";
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import axios from "axios";
import qs from "qs";
import { Product, Raket, Raketeer, SEOData } from "@/interfaces/interface";

const api = process.env.RAKET_API;
const origin = process.env.RAKET_ORIGIN;

export type DataType = "raket" | "raketeer" | "product";

// GET /generate-graph-image?username=joyce&type=rakateer
// GET /generate-graph-image?username=joyce&type=raket&slug=test-raket
// GET /generate-graph-image?username=joyce&type=product&slug=test-product
export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const username = (req.query["username"] as string) || "";
    const slug = (req.query["slug"] as string) || "";
    const type = (req.query["type"] as DataType) || "raketeer";
    const force = (req.query["force"] as unknown as boolean) || false;

    let fetchUrl = ``;
    if (type === "raketeer") {
      fetchUrl = `${origin}/${username}`;
    } else if (type === "raket") {
      fetchUrl = `${origin}/${username}/${slug}`;
    } else if (type === "product") {
      fetchUrl = `${origin}/${username}/products/${slug}`;
    } else {
      res.statusCode = 404;
      res.json({ status: "not found" });
    }

    // 1. get the raketeer / raket / product, check if seo image is already generated, return if already generated
    const seoData = await fetchSEOData(username, slug, type);
    if (!force && !!seoData.ogImage) {
      res.statusCode = 405;
      res.json({ status: 405, message: "Seo image already generated" });
      return;
    }

    // 2. generate the image
    const image = await generateImage(fetchUrl);

    // 3. save {image} to database
    const imageUrl = await saveImageToDatabase(
      "ogImage",
      type,
      seoData.userId,
      image
    );

    res.statusCode = 200;
    res.send({ status: 200, url: imageUrl.data[0].url });
  } catch (error) {
    res.json({
      status: "error",
      data: error || "Something went wrong",
    });
  }
}

async function generateImage(url: string) {
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
  const image = await page.screenshot({ type: "png", encoding: "base64" });
  await browser.close();
  return image;
}

// fetch data from database
async function fetchSEOData(
  username: string,
  slug: string,
  type: DataType
): Promise<SEOData> {
  const { data: userData } = await axios({
    method: "GET",
    url: `${api}/raketeer?username=${username}`,
  });

  const seoData: SEOData = {
    ogImage:
      (userData as Raketeer).attributes.ogImage.data?.attributes.url ?? null,
    data: userData,
    id: userData.id,
    userId: userData.id,
  };

  if (type === "raketeer") {
    return seoData;
  }

  let url = "";
  if (type === "raket") {
    url = `${api}/raket?username=${username}&slug=${slug}`;
  } else if (type === "product") {
    const productParams = {
      filters: {
        slug: {
          eq: slug as string,
        },
        raketeer: {
          username: {
            eq: username as string,
          },
        },
      },
    };
    url = `${api}/products?${qs.stringify(productParams, { encode: false })}`;
  }
  const { data } = await axios({
    method: "GET",
    url: url,
  });

  if (data["data"]) {
    // if raket
    seoData.id = data.data.id;
    seoData.ogImage = (data as Raket).data.ogImage.data?.attributes.url ?? null;
    seoData.data = data;
  } else if (data["products"]) {
    // if product
    seoData.id = data.products.data[0].id;
    seoData.ogImage =
      (data as Product).products.data[0].attributes.ogImage.data?.attributes
        .url ?? null;
    seoData.data = data;
  }

  return seoData;
}
