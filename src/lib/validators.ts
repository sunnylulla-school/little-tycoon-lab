// Validators and completion helpers
export const isTextComplete = (v: string) => v.trim().length >= 20;
export const isNumComplete = (v: string) => {
  const n = parseFloat(v);
  return !Number.isNaN(n) && n > 0;
};
export const isSelectComplete = (v: string) => v.trim().length > 0;
