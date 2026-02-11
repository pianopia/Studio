import path from "node:path";
import { env } from "@/lib/env";
import { createGeneratedFilePaths } from "@/lib/storage/generated";

type RenderEditInput = {
  sourceUrl: string;
  kind: "image" | "video";
  startSec: number;
  endSec: number;
};

let bundledServeUrlPromise: Promise<string> | null = null;

const getServeUrl = async () => {
  if (!bundledServeUrlPromise) {
    const { bundle } = await import("@remotion/bundler");
    bundledServeUrlPromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion_src", "index.ts")
    });
  }
  return bundledServeUrlPromise;
};

const toAbsoluteSourceUrl = (sourceUrl: string) => {
  if (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://")) {
    return sourceUrl;
  }
  return new URL(sourceUrl, env.APP_ORIGIN).toString();
};

export const renderEditedVideo = async (input: RenderEditInput) => {
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const serveUrl = await getServeUrl();
  const output = await createGeneratedFilePaths("mp4");

  const inputProps = {
    sourceUrl: toAbsoluteSourceUrl(input.sourceUrl),
    kind: input.kind,
    startSec: input.startSec,
    endSec: input.endSec
  };

  const composition = await selectComposition({
    serveUrl,
    id: "MediaEdit",
    inputProps
  });

  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    outputLocation: output.absolutePath,
    inputProps
  });

  return output.publicUrl;
};
