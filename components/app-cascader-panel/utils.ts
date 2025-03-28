import type { default as CascaderNode } from "./node";

export const isLeaf = (el: HTMLElement) => !el.getAttribute("aria-owns");

export const getMenuIndex = (el: HTMLElement) => {
  if (!el) return 0;
  const pieces = el.id.split("-");
  return Number(pieces[pieces.length - 2]);
};

export const checkNode = (el: HTMLElement) => {
  if (!el) return;

  const input = el.querySelector("input");
  if (input) {
    input.click();
  } else if (isLeaf(el)) {
    el.click();
  }
};

// 根据原始顺序对节点进行排序 [...oldNodes, ...newNodes] 并且去重 oldNodes 中的 newNodes
export const sortByOriginalOrder = (oldNodes: CascaderNode[], newNodes: CascaderNode[]) => {
  const newNodesCopy = newNodes.slice(0);
  const newIds = newNodesCopy.map((node) => node.uid);
  const res = oldNodes.reduce((acc, item) => {
    const index = newIds.indexOf(item.uid);
    if (index > -1) {
      acc.push(item);
      newNodesCopy.splice(index, 1);
      newIds.splice(index, 1);
    }
    return acc;
  }, [] as CascaderNode[]);

  res.push(...newNodesCopy);
  return res;
};

// 根据level排序
export const sortByLevel = (nodes: CascaderNode[]) => {
  return nodes.sort((prev, next) => prev.level - next.level);
};

/**
 * Generate random number in range [0, 1000]
 * Maybe replace with [uuid](https://www.npmjs.com/package/uuid)
 */
export const generateId = (): number => Math.floor(Math.random() * 10000);
