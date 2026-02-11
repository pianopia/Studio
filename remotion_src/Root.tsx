import { AbsoluteFill, Composition, Img, OffthreadVideo, interpolate, useCurrentFrame } from "remotion";

type EditProps = {
  sourceUrl: string;
  kind: "image" | "video";
  startSec: number;
  endSec: number;
};

const fps = 30;

const EditComposition = ({ sourceUrl, kind, startSec, endSec }: EditProps) => {
  const frame = useCurrentFrame();
  const durationFrames = Math.max(1, Math.floor((Math.max(endSec - startSec, 1)) * fps));
  const startFrame = Math.max(0, Math.floor(startSec * fps));
  const endFrame = Math.max(startFrame + 1, Math.floor(endSec * fps));

  if (kind === "video") {
    return (
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        <OffthreadVideo src={sourceUrl} startFrom={startFrame} endAt={endFrame} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    );
  }

  const scale = interpolate(frame, [0, durationFrames - 1], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <Img src={sourceUrl} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="MediaEdit"
      component={EditComposition}
      width={1280}
      height={720}
      fps={fps}
      durationInFrames={240}
      defaultProps={{
        sourceUrl: "",
        kind: "image",
        startSec: 0,
        endSec: 8
      }}
      calculateMetadata={({ props }) => {
        const input = props as EditProps;
        const seconds = Math.max(input.endSec - input.startSec, 1);
        return {
          durationInFrames: Math.floor(seconds * fps)
        };
      }}
    />
  );
};
