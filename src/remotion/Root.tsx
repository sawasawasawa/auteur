import { Composition } from "remotion";
import { Short, ShortProps } from "./Short";

const defaultProps: ShortProps = {
  audioSrc: "",
  durationSec: 30,
  hook: "AUTEUR DEMO",
  beats: [
    { start: 0, end: 2, text: "THIS IS AUTEUR" },
    { start: 2, end: 5, text: "BUILT IN A DAY" },
  ],
  brand: "AUTEUR",
};

export const Root = () => {
  return (
    <>
      <Composition
        id="Short"
        component={Short as unknown as React.FC}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
      />
    </>
  );
};
