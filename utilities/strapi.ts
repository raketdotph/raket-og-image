export interface BuildStrapiUploadFormDataParams {
  refId: string;
  file: Buffer;
  ref: string;
  field: string;
}

export const buildStrapiUploadFormData = ({
  file,
  refId,
  ref,
  field,
}: BuildStrapiUploadFormDataParams) => {
  const blob = new Blob([file]);
  const form = new FormData();
  form.append("file", blob);
  form.append("refId", refId);
  form.append("ref", ref);
  form.append("field", field);

  return form;
};
