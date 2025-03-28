// @ts-nocheck
import { isEmpty, isFunction, isDef } from "@shuzhi-utils/is";
import type { VNode } from "vue";

const isUndefined = (val: unknown) => !isDef(val);

const capitalize = <T extends string>(str: T) => {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
};

export type CascaderNodeValue = string | number;
export type CascaderNodePathValue = CascaderNodeValue[];
export type CascaderValue =
  | CascaderNodeValue
  | CascaderNodePathValue
  | (CascaderNodeValue | CascaderNodePathValue)[];
export type CascaderConfig = Required<CascaderProps>;
export type ExpandTrigger = "click" | "hover";
export type isDisabled = (data: CascaderOption, node: Node) => boolean;
export type isLeaf = (data: CascaderOption, node: Node) => boolean;
export type Resolve = (dataList?: CascaderOption[]) => void;
export type LazyLoad = (node: Node, resolve: Resolve) => void;
export type RenderLabel = ({ node: Node, data: CascaderOption }) => VNode | VNode[];
export interface CascaderOption extends Record<string, unknown> {
  label?: string;
  value?: CascaderNodeValue;
  children?: CascaderOption[];
  disabled?: boolean;
  leaf?: boolean;
}

export interface CascaderProps {
  expandTrigger?: ExpandTrigger;
  multiple?: boolean;
  maxLength?: boolean | number;
  checkStrictly?: boolean;
  dominant?: boolean;
  emitPath?: boolean;
  lazy?: boolean;
  lazyLoad?: LazyLoad;
  value?: string;
  label?: string;
  children?: string;
  disabled?: string | isDisabled;
  leaf?: string | isLeaf;
  hoverThreshold?: number;
}

export type Nullable<T> = null | T;

type ChildrenData = CascaderOption[] | undefined;

let uid = 0;

const calculatePathNodes = (node: Node) => {
  const nodes = [node];
  let { parent } = node;

  // 循环 将所有父节点扔到头部  作用？
  while (parent) {
    nodes.unshift(parent);
    parent = parent.parent;
  }

  return nodes;
};

class Node {
  readonly uid: number = uid++;
  readonly level: number;
  readonly value: CascaderNodeValue;
  readonly label: string;
  readonly pathNodes: Node[];
  readonly pathValues: CascaderNodePathValue;
  readonly pathLabels: string[];

  childrenData: ChildrenData;
  children: Node[];
  text: string;
  loaded: boolean;
  /**
   * Is it checked
   *
   * @default false
   * 选中状态
   */
  checked = false;
  /**
   * Used to indicate the intermediate state of unchecked and fully checked child nodes
   *
   * @default false
   * 中间状态
   */
  indeterminate = false;
  /**
   * Loading Status
   *
   * @default false
   */
  loading = false;

  constructor(
    readonly data: Nullable<CascaderOption>,
    readonly config: CascaderConfig,
    readonly parent?: Node,
    readonly root = false
  ) {
    const { value: valueKey, label: labelKey, children: childrenKey } = config;

    // 得到子节点
    const childrenData = data[childrenKey] as ChildrenData;
    const pathNodes = calculatePathNodes(this);

    // 设置节点的层级
    this.level = root ? 0 : parent ? parent.level + 1 : 1;
    // 取值
    this.value = data[valueKey] as CascaderNodeValue;
    this.label = data[labelKey] as string;
    // 得到该节点极其路径上的所有父节点
    this.pathNodes = pathNodes;
    this.pathValues = pathNodes.map((node) => node.value);
    this.pathLabels = pathNodes.map((node) => node.label);
    this.childrenData = childrenData;
    // 构造子节点
    this.children = (childrenData || []).map((child) => new Node(child, config, this));
    // 子节点是否已加载
    // lazy === true => false, 继续后续; lazy === false => true, true
    this.loaded = !config.lazy || this.isLeaf || !isEmpty(childrenData);
  }

  get isDisabled(): boolean {
    const { data, parent, config } = this;
    const { disabled, checkStrictly } = config;
    const isDisabled = isFunction(disabled) ? disabled(data, this) : !!data[disabled];
    return isDisabled || (!checkStrictly && parent?.isDisabled);
  }

  // 当前节点是否为叶子节点
  get isLeaf(): boolean {
    const { data, config, childrenData, loaded } = this;
    const { lazy, leaf } = config;
    // 叶子节点的标志值
    const isLeaf = isFunction(leaf) ? leaf(data, this) : data[leaf];

    return isUndefined(isLeaf)
      ? lazy && !loaded // 如果 leaf 属性未定义或为空，且 lazy 为 true 且子节点数据尚未加载（即 loaded 为 false），则返回 false，表示当前节点不是叶子节点，但可能有子节点（词法分析，先定义了loaded 则为undefined，之后才赋值，即初始值为undefined）
        ? false
        : !(Array.isArray(childrenData) && childrenData.length) // 子节点数据不是数组或为空数组，就认为当前节点是叶子节点
      : !!isLeaf;
  }

  // 取值
  get valueByOption() {
    return this.config.emitPath ? this.pathValues : this.value;
  }

  // 插入子节点
  appendChild(childData: CascaderOption) {
    const { childrenData, children } = this;
    const node = new Node(childData, this.config, this);

    if (Array.isArray(childrenData)) {
      childrenData.push(childData);
    } else {
      this.childrenData = [childData];
    }

    children.push(node);

    return node;
  }

  // 值 -> 文本
  calcText(allLevels: boolean, separator: string) {
    const text = allLevels ? this.pathLabels.join(separator) : this.label;
    this.text = text;
    return text;
  }

  // 向该节点的所有子节点广播（传递）一个特定的事件和参数 调用所有后代节点的 onParentCheck
  broadcast(event: string, ...args: unknown[]) {
    console.log("capitalize:", capitalize("check"));
    const handlerName = `onParent${capitalize(event)}`;
    this.children.forEach((child) => {
      if (child) {
        // bottom up
        child.broadcast(event, ...args); // 后代也调用
        child[handlerName] && child[handlerName](...args);
      }
    });
  }

  // 调用所有祖父节点的 onChildCheck
  emit(event: string, ...args: unknown[]) {
    const { parent } = this;
    const handlerName = `onChild${capitalize(event)}`;
    if (parent) {
      parent[handlerName] && parent[handlerName](...args);
      parent.emit(event, ...args);
    }
  }

  onParentCheck(checked: boolean) {
    if (!this.isDisabled) {
      this.setCheckState(checked);
    }
  }

  onChildCheck() {
    const { children } = this;
    const validChildren = children.filter((child) => !child.isDisabled);
    // 是否所有子节点选中状态
    const checked = validChildren.length ? validChildren.every((child) => child.checked) : false;

    this.setCheckState(checked);
  }

  setCheckState(checked: boolean) {
    const totalNum = this.children.length;
    // 统计子节点选中的数量，0.5 只是为了最后总数 < totalNum
    const checkedNum = this.children.reduce((c, p) => {
      const num = p.checked ? 1 : p.indeterminate ? 0.5 : 0;
      return c + num;
    }, 0);

    // 所有子节点都被选中，才能设置当前节点选中？
    this.checked =
      this.loaded &&
      this.children // 是否所有子节点选中状态
        .filter((child) => !child.isDisabled)
        .every((child) => child.loaded && child.checked) &&
      checked;
    this.indeterminate = this.loaded && checkedNum !== totalNum && checkedNum > 0;
  }

  doCheck(checked: boolean) {
    if (this.checked === checked) return;

    const { checkStrictly, multiple } = this.config;

    // 仅改变自身（其实就是只能选叶子节点）
    if (checkStrictly || !multiple) {
      this.checked = checked;
    } else {
      // bottom up to unify the calculation of the indeterminate state
      this.broadcast("check", checked);
      this.setCheckState(checked);
      this.emit("check");
    }
  }
}

export default Node;
