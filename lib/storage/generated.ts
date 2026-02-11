import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

const publicGeneratedDir = path.join(process.cwd(), "public", "generated");

export const ensureGeneratedDir = async () => {
  await mkdir(publicGeneratedDir, { recursive: true });
};

export const createGeneratedFilePaths = async (extension: string) => {
  await ensureGeneratedDir();
  const fileName = `${uuidv4()}.${extension.replace(/^\./, "")}`;
  const absolutePath = path.join(publicGeneratedDir, fileName);
  const publicUrl = `/generated/${fileName}`;
  return { fileName, absolutePath, publicUrl };
};

export const writeBase64GeneratedFile = async (base64Data: string, extension: string) => {
  const { absolutePath, publicUrl } = await createGeneratedFilePaths(extension);
  await writeFile(absolutePath, Buffer.from(base64Data, "base64"));
  return publicUrl;
};

export const writeBinaryGeneratedFile = async (data: Buffer, extension: string) => {
  const { absolutePath, publicUrl } = await createGeneratedFilePaths(extension);
  await writeFile(absolutePath, data);
  return publicUrl;
};
