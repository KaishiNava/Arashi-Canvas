export type EffectDefinition = {
  id: string;
  label: string;
  cssFilter: (value: number) => string;
  min: number;
  max: number;
  initial: number;
};
