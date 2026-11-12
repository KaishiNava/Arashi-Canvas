import type { EffectDefinition } from "./types";
export const contrastEffect: EffectDefinition = {
  id: "contrast", label: "Contrast", min: 0, max: 200, initial: 100,
  cssFilter: (value) => `contrast(${value}%)`
};
