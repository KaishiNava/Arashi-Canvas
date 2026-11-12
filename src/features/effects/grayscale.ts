import type { EffectDefinition } from "./types";
export const grayscaleEffect: EffectDefinition = {
  id: "grayscale", label: "Grayscale", min: 0, max: 100, initial: 0,
  cssFilter: (value) => `grayscale(${value}%)`
};
