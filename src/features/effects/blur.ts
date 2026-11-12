import type { EffectDefinition } from "./types";
export const blurEffect: EffectDefinition = {
  id: "blur", label: "Blur", min: 0, max: 20, initial: 0,
  cssFilter: (value) => `blur(${value}px)`
};
