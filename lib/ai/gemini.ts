import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { createGeneratedFilePaths, writeBase64GeneratedFile } from "@/lib/storage/generated";
import type { Attachment } from "@/types/chat";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toPartFromAttachment = (attachment: Attachment) => {
  const base64 = attachment.dataUrl.split(",")[1] ?? "";
  return {
    inlineData: {
      mimeType: attachment.mimeType,
      data: base64
    }
  };
};

const getAi = () => {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY が未設定です。");
  }
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
};

const inferImageExtension = (mimeType?: string) => {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
};

const toImageInput = (attachment?: Attachment) => {
  if (!attachment) {
    return undefined;
  }
  return {
    imageBytes: attachment.dataUrl.split(",")[1] ?? "",
    mimeType: attachment.mimeType
  };
};

export const generateAssistantText = async (message: string, attachments: Attachment[]) => {
  const ai = getAi();

  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: message }, ...attachments.map(toPartFromAttachment)]
      }
    ]
  });

  return response.text ?? "応答を生成できませんでした。";
};

export const generateImage = async (prompt: string) => {
  const ai = getAi();

  const response = await ai.models.generateImages({
    model: env.GEMINI_IMAGE_MODEL,
    prompt,
    config: {
      numberOfImages: 1,
      includeRaiReason: true
    }
  });

  const image = response.generatedImages?.[0]?.image;
  if (!image?.imageBytes) {
    throw new Error("画像生成に失敗しました。画像データが返されませんでした。");
  }

  const extension = inferImageExtension(image.mimeType);
  const url = await writeBase64GeneratedFile(image.imageBytes, extension);
  return { url, mimeType: image.mimeType ?? "image/png" };
};

export const generateVideo = async (prompt: string, firstImageAttachment?: Attachment) => {
  const ai = getAi();

  let operation = await ai.models.generateVideos({
    model: env.GEMINI_VIDEO_MODEL,
    prompt,
    image: toImageInput(firstImageAttachment),
    config: {
      numberOfVideos: 1
    }
  });

  for (let i = 0; i < env.VIDEO_POLL_MAX_ATTEMPTS; i += 1) {
    if (operation.done) {
      break;
    }
    await sleep(env.VIDEO_POLL_INTERVAL_MS);
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (!operation.done) {
    throw new Error("動画生成がタイムアウトしました。再度実行してください。");
  }

  if (operation.error) {
    throw new Error(`動画生成が失敗しました: ${JSON.stringify(operation.error)}`);
  }

  const generatedVideo = operation.response?.generatedVideos?.[0];
  const video = generatedVideo?.video;
  if (!video) {
    throw new Error("動画生成に失敗しました。動画データが返されませんでした。");
  }

  if (video.videoBytes) {
    const url = await writeBase64GeneratedFile(video.videoBytes, "mp4");
    return { url, mimeType: video.mimeType ?? "video/mp4" };
  }

  const { absolutePath, publicUrl } = await createGeneratedFilePaths("mp4");
  await ai.files.download({
    file: generatedVideo,
    downloadPath: absolutePath
  });

  return { url: publicUrl, mimeType: video.mimeType ?? "video/mp4" };
};
