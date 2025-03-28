// import { NOOP } from "@vue/shared";
import type { CascaderConfig, CascaderOption, CascaderProps, CascaderValue } from "./node";
import { PropType } from "vue";

export const CommonProps = {
  /**
   * @description specify which key of node object is used as the node's value
   */
  modelValue: {
    type: [Number, String, Array] as PropType<CascaderValue>,
  },
  /**
   * @description data of the options, the key of `value` and `label` can be customize by `CascaderProps`.
   */
  options: {
    type: Array as PropType<CascaderOption[]>,
    default: () => [],
  },
  /**
   * @description configuration options, see the following `CascaderProps` table.
   */
  props: {
    type: Object as PropType<CascaderProps>,
    default: () => ({}),
  },
} as const;

export const DefaultProps: CascaderConfig = {
  /**
   * @description trigger mode of expanding options
   */
  expandTrigger: "click",
  /**
   * @description whether multiple selection is enabled
   */
  multiple: false,
  maxLength: false,
  /**
   * @description whether checked state of a node not affects its parent and child nodes
   * 	节点的检查状态是否不会影响其父节点和子节点
   */
  checkStrictly: false, // whether all nodes can be selected
  // 仅当checkStrictly: false 生效，是否父节点主导
  dominant: true,
  /**
   * @description when checked nodes change, whether to emit an array of node's path, if false, only emit the value of node.
   * 在选中节点改变时，是否返回由该节点所在的各级菜单的值所组成的数组，若设置 false，则只返回该节点的值
   */
  emitPath: true, // wether to emit an array of all levels value in which node is located
  /**
   * @description whether to dynamic load child nodes, use with `lazyload` attribute
   */
  lazy: false,
  /**
   * @description method for loading child nodes data, only works when `lazy` is true
   * 是否动态加载子节点，需与 lazyLoad 方法结合使用
   */
  lazyLoad: () => void 0,
  /**
   * @description specify which key of node object is used as the node's value
   */
  value: "value",
  /**
   * @description specify which key of node object is used as the node's label
   */
  label: "label",
  /**
   * @description specify which key of node object is used as the node's children
   */
  children: "children",
  /**
   * @description specify which key of node object is used as the node's leaf
   * 指定选项的叶子节点的标志位为选项对象的某个属性值
   */
  leaf: "leaf",
  /**
   * @description specify which key of node object is used as the node's disabled
   * 注意这是key
   */
  disabled: "disabled",
  /**
   * @description hover threshold of expanding options
   */
  hoverThreshold: 500,
};

export const useCascaderConfig = (props: { props: CascaderProps }) => {
  return computed(() => ({
    ...DefaultProps,
    ...props.props,
  }));
};
