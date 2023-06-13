/* eslint-disable import/no-anonymous-default-export */
import { buildStrapiUploadFormData } from "@/utilities/strapi";
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import axios from "axios";
import qs from "qs";
import { SEOData } from "@/interfaces/interface";

const api = "http://localhost:3000/api";
const origin = "http://localhost:3000/";

type DataType = "raket" | "raketeer" | "product";

// GET /generate-graph-image?username=joyce&type=rakateer
// GET /generate-graph-image?username=joyce&type=raket&slug=test-raket
// GET /generate-graph-image?username=joyce&type=product&slug=test-product
export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const username = (req.query["username"] as string) || "";
    const slug = (req.query["slug"] as string) || "";
    const type = (req.query["type"] as DataType) || "raketeer";

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
    const fetchedData = await fetchData(username, slug, type);
    if (!!fetchedData.seoImage) {
      res.statusCode = 405;
      res.json({ status: "seo image already generated" });
      return;
    }

    // 2. generate the image
    const image = await generateImage(fetchUrl);

    // 3. save {image} to database
    // const imageUrl = await saveImageToDatabase("seoImage", type, "", image);

    // (OPTIONAL) 4. save the link to the user/raket/product as `seoImage`
    // await saveImageToData(fetchedData.id, imageUrl, type);

    res.statusCode = 200;
    res.send({ status: fetchedData });
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
  const image = await page.screenshot({ type: "png" });
  await browser.close();
  return image;
}

// fetch data from database
async function fetchData(
  username: string,
  slug: string,
  type: DataType
): Promise<SEOData> {
  let url = "";

  if (type === "raketeer") {
    url = `${api}/raketeer?username=${username}`;
  } else if (type === "raket") {
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

  const seoData: SEOData = {
    seoImage: null,
    data: data,
    id: "",
  };

  if (data["id"]) {
    // if raketeer
    seoData.id = data.id;
    seoData.seoImage = data.attributes.seoImage;
  } else if (data["data"]) {
    // if raket
    seoData.id = data.data.id;
    seoData.seoImage = data.data.seoImage;
  } else if (data["products"]) {
    // if product
    seoData.id = data.products.data[0].id;
    seoData.seoImage = data.products.data[0].attributes.seoImage;
  }

  return seoData;
}

async function saveImageLinkToMyData(
  id: string,
  imageUrl: string,
  type: DataType
) {
  let url = `${api}/raketeer/update`;
  if (type === "product") {
    url = `${api}/products/${id}`;
    return;
  }

  if (type === "raket") {
    url = `${api}/raket/update`;
    return;
  }

  await axios({
    method: "POST",
    url: url,
    data: {
      id: id,
      data: {
        seoImage: imageUrl,
      },
    },
  });
}

/**
 * returns link of new image saved to database
 */
async function saveImageToDatabase(
  field: string,
  imageType: DataType,
  refId: string,
  image: Buffer
): Promise<string> {
  const form = buildStrapiUploadFormData({
    file: image,
    field: field,
    ref: imageType,
    refId: refId,
  });

  const { data } = await axios({
    method: "POST",
    url: `${api}/file/create`,
    data: form,
  });

  return data.file[0].attributes.url;
}
