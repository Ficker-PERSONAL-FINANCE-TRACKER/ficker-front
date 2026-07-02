import React from "react";
import { Composition } from "remotion";
import { FickerVideo, FICKER_DURATION } from "./FickerVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FickerPromo"
      component={FickerVideo}
      durationInFrames={FICKER_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
