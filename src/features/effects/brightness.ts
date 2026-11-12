import type { EffectDefinition } from "./types";
export const brightnessEffect: EffectDefinition = {
  id: "brightness", label: "Brightness", min: 0, max: 200, initial: 100,
  cssFilter: (value) => `brightness(${value}%)`
};
