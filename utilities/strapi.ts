import { DataType } from "@/pages/api/generate-graph-image";
import axios from "axios";
import { File as BufferFile } from "buffer";

const uploadApi = "https://api-dev.raket.ph";

export interface BuildStrapiUploadFormDataParams {
  refId: string;
  files: File;
  ref: string;
  field: string;
}

export const buildStrapiUploadFormData = ({
  files,
  refId,
  ref,
  field,
}: BuildStrapiUploadFormDataParams) => {
  const form = new FormData();
  form.append("files", files);
  form.append("refId", refId);
  form.append("ref", ref);
  form.append("field", field);

  return form;
};

/**
 * returns link of new image saved to database
 */
export async function saveImageToDatabase(
  field: string,
  imageType: DataType,
  refId: string,
  image: string
): Promise<any> {
  const file = await dataUrlToFile(`data:image/PNG;base64,${image}`);

  const form = buildStrapiUploadFormData({
    files: file as any,
    field: field,
    ref: `api::${imageType}.${imageType}`,
    refId: refId,
  });

  const data = await axios({
    method: "POST",
    url: `${uploadApi}/api/upload`,
    data: form,
    headers: {
      Authorization: `Bearer 44f950fe989a5cc7ba61091d293db1c0b9ec904b31e52da0655f74eaecdc768f7d7c52e1910dbf5ca2a51f770eb037d80dff3b1fd9fa8c21b60f88223a3169753f5d95ac76ef5b85841635fc36beeddc63769d68b030f74c023e2a54ab79b6134c36792434fa4509cd4dc9b9f6693bbff9c2e65440178d401c3b96bd2ec6564b`,
    },
  }).catch((reason) => {
    console.error(reason, "ERROR REASON", reason.request);
  });
  return data;
}

export const makeid = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

async function dataUrlToFile(dataUrl: string): Promise<BufferFile> {
  const res: Response = await fetch(dataUrl);
  const blob: Blob = await res.blob();
  return new BufferFile([blob as any], `photo-${makeid(10)}`, {
    type: "image/PNG",
  });
}
