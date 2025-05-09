import { isEqual } from "lodash-es";
import Node from "./node";

import type {
  CascaderConfig,
  CascaderNodePathValue,
  CascaderNodeValue,
  CascaderOption,
} from "./node";

/**
 * 返回一个包含所有叶子节点（或者所有节点，取决于leafOnly参数）的新数组
 * @param nodes
 * @param leafOnly 是否只包含叶子节点
 * @returns
 */
const flatNodes = (nodes: Node[], leafOnly: boolean) => {
  return nodes.reduce((res, node) => {
    if (node.isLeaf) {
      // 叶子节点
      res.push(node);
    } else {
      !leafOnly && res.push(node);
      res = res.concat(flatNodes(node.children, leafOnly));
    }
    return res;
  }, [] as Node[]);
};

export default class Store {
  readonly nodes: Node[];
  readonly allNodes: Node[];
  readonly leafNodes: Node[];

  constructor(data: CascaderOption[], readonly config: CascaderConfig) {
    const nodes = (data || []).map((nodeData) => new Node(nodeData, this.config));

    this.nodes = nodes;
    this.allNodes = flatNodes(nodes, false);
    this.leafNodes = flatNodes(nodes, true);
  }

  getNodes() {
    return this.nodes;
  }

  getFlattedNodes(leafOnly: boolean) {
    return leafOnly ? this.leafNodes : this.allNodes;
  }

  // 插入节点
  appendNode(nodeData: CascaderOption, parentNode?: Node) {
    const node = parentNode ? parentNode.appendChild(nodeData) : new Node(nodeData, this.config);

    if (!parentNode) this.nodes.push(node);

    this.allNodes.push(node);
    node.isLeaf && this.leafNodes.push(node);
  }

  // 插入多个节点
  appendNodes(nodeDataList: CascaderOption[], parentNode: Node) {
    nodeDataList.forEach((nodeData) => this.appendNode(nodeData, parentNode));
  }

  // value找到node
  // when checkStrictly, leaf node first
  getNodeByValue(
    value: CascaderNodeValue | CascaderNodePathValue,
    leafOnly = false
  ): Nullable<Node> {
    if (!value && value !== 0) return null;

    const node = this.getFlattedNodes(leafOnly).find(
      (node) => isEqual(node.value, value) || isEqual(node.pathValues, value)
    );

    return node || null;
  }

  // 获取相同的节点 作用？可能具有不同的引用，可对找到的节点执行操作，如更新其属性或从存储中删除该节点
  getSameNode(node: Node): Nullable<Node> {
    if (!node) return null;

    const node_ = this.getFlattedNodes(false).find(
      ({ value, level }) => isEqual(node.value, value) && node.level === level
    );

    return node_ || null;
  }
}
