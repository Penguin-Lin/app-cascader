import { isArray } from "@shuzhi-utils/is";

export const unique = <T>(arr: T[]) => [...new Set(arr)];

export const castArray = <T>(arr: T | ReadonlyArray<T>): T[] => {
  if (!arr && (arr as any) !== 0) return [];
  return isArray(arr) ? arr : [arr as T];
};
