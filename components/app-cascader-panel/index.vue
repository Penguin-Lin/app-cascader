<template>
  <div :class="[ns.b(), ns.is('bordered', border)]" @keydown="handleKeyDown">
    <app-cascader-menu
      v-for="(menu, index) in menus"
      :key="index"
      :ref="(item) => (menuList[index] = item)"
      :index="index"
      :nodes="[...menu]"
    />

    <div :class="ns.e('empty')" v-if="menus.length === 1">没有更多了</div>
  </div>
</template>

<script lang="ts">
export default {
  options: {
    name: "app-cascader-panel",
    styleIsolation: "shared", // 解除样式隔离
    // #ifdef MP-WEIXIN
    // 将自定义节点设置成虚拟的（去掉自定义组件包裹层），更加接近Vue组件的表现，能更好的使用flex属性
    virtualHost: true,
    // #endif
  },
};
</script>

<script lang="ts" setup>
import "./style/cascader-panel.scss";

import { PropType } from "vue";
import { CommonProps, useCascaderConfig } from "./config";
import { cascaderPanelExpose } from "./cascader-panel";
import { checkNode, getMenuIndex, sortByOriginalOrder, sortByLevel } from "./utils";
import { CASCADER_PANEL_INJECTION_KEY } from "./types";
import { useNamespace } from "@/hooks";
import Store from "./store";
import Node from "./node";
import { UPDATE_MODEL_EVENT, CHANGE_EVENT, EVENT_CODE } from "@/constants";
import { isArray, isEmpty, isNumber } from "@shuzhi-utils/is";
import { cloneDeep, flattenDeep, isEqual } from "lodash-es";
import { isClient } from "@vueuse/core";
import { castArray, unique } from "@/utils/arrays";
import { focusNode, getSibling } from "@/utils/dom/index";

import AppCascaderMenu from "./menu.vue";

import type {
  default as CascaderNode,
  CascaderNodeValue,
  CascaderNodePathValue,
  CascaderOption,
  CascaderValue,
  RenderLabel,
} from "./node";

import type { ElCascaderPanelContext } from "./types";

const props = defineProps({
  ...CommonProps,
  border: {
    type: Boolean,
    default: true,
  },
  renderLabel: Function as PropType<RenderLabel>,
});

const emit = defineEmits([UPDATE_MODEL_EVENT, CHANGE_EVENT, "close", "expand-change"]);
const slots = useSlots();

const ns = useNamespace("cascader-panel");

const config = useCascaderConfig(props);

// for interrupt sync check status in lazy mode
let manualChecked = false;

// let store: Nullable<Store> = null;
const store = shallowRef<Nullable<Store>>(null);
const initialLoaded = ref(true);
const menuList = ref<any[]>([]);
const checkedValue = ref<Nullable<CascaderValue>>(null);
const menus = ref<CascaderNode[][]>([]);
const expandingNode = ref<Nullable<CascaderNode>>(null);
// 当前选中的节点列表
const checkedNodes = ref<CascaderNode[]>([]);

const isHoverMenu = computed(() => config.value.expandTrigger === "hover");
const renderLabelFn = computed(() => props.renderLabel || slots.default);

// 懒加载节点？
const lazyLoad: ElCascaderPanelContext["lazyLoad"] = (node, cb) => {
  const cfg = config.value;
  node = node || new Node({}, cfg, undefined, true);
  node.loading = true;

  const resolve = (dataList: CascaderOption[]) => {
    const _node = node as Node;
    // 若当前节点为根节点，则没有parent
    const parent = _node.root ? null : _node;

    // dataList && store?.appendNodes(dataList, parent as any);
    dataList && store.value?.appendNodes(dataList, parent as any);
    _node.loading = false;
    _node.loaded = true;
    _node.childrenData = _node.childrenData || [];
    cb && cb(dataList);
  };

  cfg.lazyLoad(node!, resolve as any);
};

// 根据传入的节点展开菜单
const expandNode: ElCascaderPanelContext["expandNode"] = (node, silent) => {
  const { level } = node;
  // 展开节点所在层级之前的所有菜单
  const newMenus = menus.value.slice(0, level);
  let newExpandingNode: Nullable<CascaderNode>;

  if (node.isLeaf) {
    // 获取祖父节点
    newExpandingNode = node.pathNodes[level - 2];
  } else {
    newExpandingNode = node;
    newMenus.push(node.children);
  }

  if (expandingNode.value?.uid !== newExpandingNode?.uid) {
    expandingNode.value = node;
    menus.value = newMenus;

    console.log("expand:", node?.pathValues);

    !silent && emit("expand-change", node?.pathValues || []);
  }
};

// 根据展开的节点滚动到相应的位置
const scrollToExpandingNode = () => {
  if (!isClient) return;

  menuList.value.forEach((menu) => {
    const menuElement = menu?.$el;
    if (menuElement) {
      const container = menuElement.querySelector(`.${ns.namespace.value}-scrollbar__wrap`);
      const activeNode =
        menuElement.querySelector(`.${ns.b("node")}.${ns.is("active")}`) ||
        menuElement.querySelector(`.${ns.b("node")}.in-active-path`);
      // todo
      // scrollIntoView(container, activeNode);
    }
  });
};

// 根据新选中的节点列表，同步展开选中的节点
const syncMenuState = (
  newCheckedNodes: CascaderNode[],
  reserveExpandingState = true /* 是否保留之前的展开状态 */
) => {
  const { checkStrictly, dominant } = config.value;
  const oldNodes = checkedNodes.value;
  // const newNodes = newCheckedNodes.filter((node) => !!node && (checkStrictly || node.isLeaf));
  const newNodes = newCheckedNodes.filter(
    (node) => !!node && (checkStrictly || dominant || node.isLeaf)
  );
  // 之前展开的节点
  // const oldExpandingNode = store?.getSameNode(expandingNode.value!);
  const oldExpandingNode = store.value?.getSameNode(expandingNode.value!);
  const newExpandingNode = (reserveExpandingState && oldExpandingNode) || newNodes[0];

  if (newExpandingNode) {
    newExpandingNode.pathNodes.forEach((node) => expandNode(node, true));
  } else {
    expandingNode.value = null;
  }

  oldNodes.forEach((node) => node.doCheck(false));
  newNodes.forEach((node) => node.doCheck(true));

  checkedNodes.value = newNodes;
  nextTick(scrollToExpandingNode);
};

// 同步选中的值
const syncCheckedValue = (loaded = false, forced = false) => {
  const { modelValue } = props;
  const { lazy, multiple, checkStrictly, dominant } = config.value;
  const leafOnly = !(checkStrictly ? checkStrictly : dominant);

  if (!initialLoaded.value || manualChecked || (!forced && isEqual(modelValue, checkedValue.value)))
    return;

  if (lazy && !loaded) {
    const values: CascaderNodeValue[] = unique(flattenDeep(castArray(modelValue!)));

    const nodes = values
      // .map((val) => store?.getNodeByValue(val))
      .map((val) => store.value?.getNodeByValue(val))
      .filter((node) => !!node && !node.loaded && !node.loading) as Node[];

    if (nodes.length) {
      nodes.forEach((node) => {
        lazyLoad(node, () => syncCheckedValue(false, forced));
      });
    } else {
      syncCheckedValue(true, forced);
    }
  } else {
    // 根据选中的值获取对应的节点，并更新选中状态
    const values = multiple ? castArray(modelValue!) : [modelValue!];
    // const nodes = unique(values.map((val) => store?.getNodeByValue(val, leafOnly))) as Node[];
    const nodes = unique(values.map((val) => store.value?.getNodeByValue(val, leafOnly))) as Node[];

    console.log("syncCheckedValue nodes:", nodes);

    syncMenuState(nodes, forced);
    checkedValue.value = cloneDeep(modelValue!);
  }
};

// 初始化数据仓库
const initStore = () => {
  const { options } = props;
  const cfg = config.value;

  manualChecked = false;
  // store = new Store(options, cfg);
  // menus.value = [store.getNodes()];
  store.value = new Store(options, cfg);
  menus.value = [store.value.getNodes()];

  // 懒加载根节点
  if (cfg.lazy && isEmpty(props.options)) {
    initialLoaded.value = false;
    lazyLoad(undefined, (list) => {
      if (list) {
        // store = new Store(list, cfg);
        // menus.value = [store.getNodes()];
        store.value = new Store(list, cfg);
        menus.value = [store.value.getNodes()];
      }
      initialLoaded.value = true;
    });
  } else {
    syncCheckedValue(false, true);
  }
};

// 计算选中的值
const calculateCheckedValue = () => {
  const { checkStrictly, dominant, multiple } = config.value;
  const oldNodes = checkedNodes.value;
  // const newNodes = getCheckedNodes(!checkStrictly)!;
  const newNodes = getCheckedNodes(!(checkStrictly ? checkStrictly : dominant))!;
  // ensure the original order 保证顺序没有太大变化
  const nodes =
    !checkStrictly && dominant
      ? sortByLevel(sortByOriginalOrder(oldNodes, newNodes))
      : sortByOriginalOrder(oldNodes, newNodes);
  // console.log("nodes:", nodes);
  // const values = nodes.map((node) => node.valueByOption);
  const values = nodes.reduce((prev, node) => {
    const value = node.valueByOption;

    if (!checkStrictly && dominant) {
      const result = prev.some((pItem) => {
        if (isArray(pItem)) {
          return isArray(value) && pItem.every((ppItem, idx) => ppItem === value[idx]);
        } else {
          const pathValues = node.pathValues;
          return pathValues.some((vIitem) => vIitem === pItem);
        }
      });

      if (!result) prev = [...prev, node.valueByOption];
    } else {
      prev = [...prev, node.valueByOption];
    }

    return prev;
  }, [] as (CascaderNodeValue | CascaderNodePathValue)[]);
  console.log("values:", values);
  checkedNodes.value = nodes;
  checkedValue.value = multiple ? values : values[0] ?? null;
};

// 展开父节点
const expandParentNode = (node) => {
  if (!node) return;
  node = node.parent;
  expandParentNode(node);
  node && expandNode(node);

  // console.log("expandParentNode:", node);
};

// 处理选中状态改变
const handleCheckChange: ElCascaderPanelContext["handleCheckChange"] = (
  node,
  checked,
  emitClose = true
) => {
  const { checkStrictly, multiple, maxLength } = config.value;
  const oldNode = checkedNodes.value[0];
  manualChecked = true;

  // 非多选 上一次选的重置
  !multiple && oldNode?.doCheck(false);

  node.doCheck(checked);
  calculateCheckedValue();
  emitClose && !multiple && !checkStrictly && emit("close");
  !emitClose && !multiple && !checkStrictly && expandParentNode(node);
};

// 获取扁平化的节点列表
const getFlattedNodes = (leafOnly: boolean) => {
  // return store?.getFlattedNodes(leafOnly);
  return store.value?.getFlattedNodes(leafOnly);
};

// 获取选中的节点列表
const getCheckedNodes = (leafOnly: boolean) => {
  return getFlattedNodes(leafOnly)?.filter((node) => node.checked !== false);
};

// 清除选中的节点
const clearCheckedNodes = () => {
  checkedNodes.value.forEach((node) => node.doCheck(false));
  calculateCheckedValue();
  menus.value = menus.value.slice(0, 1);
  expandingNode.value = null;
  emit("expand-change", []);
};

// 处理键盘按键事件
const handleKeyDown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement;
  const { code } = e;

  switch (code) {
    case EVENT_CODE.up:
    case EVENT_CODE.down: {
      e.preventDefault();
      const distance = code === EVENT_CODE.up ? -1 : 1;
      focusNode(getSibling(target, distance, `.${ns.b("node")}[tabindex="-1"]`));
      break;
    }
    case EVENT_CODE.left: {
      e.preventDefault();
      const preMenu = menuList.value[getMenuIndex(target) - 1];
      const expandedNode = preMenu?.$el.querySelector(`.${ns.b("node")}[aria-expanded="true"]`);
      focusNode(expandedNode);
      break;
    }
    case EVENT_CODE.right: {
      e.preventDefault();
      const nextMenu = menuList.value[getMenuIndex(target) + 1];
      const firstNode = nextMenu?.$el.querySelector(`.${ns.b("node")}[tabindex="-1"]`);
      focusNode(firstNode);
      break;
    }
    case EVENT_CODE.enter:
      checkNode(target);
      break;
  }
};

provide(
  CASCADER_PANEL_INJECTION_KEY,
  reactive({
    config,
    expandingNode,
    checkedNodes,
    isHoverMenu,
    initialLoaded,
    renderLabelFn,
    lazyLoad,
    expandNode,
    handleCheckChange,
  })
);

// const instance = getCurrentInstance();

defineExpose({
  checkedNodes,
  store,
  getCheckedNodes,
  calculateCheckedValue,
  clearCheckedNodes,
});

// defineExpose(
//   Object.keys(cascaderPanelExpose).reduce((prev, key) => {
//     prev[key] = instance?.proxy?.[key];
//     return prev;
//   }, {} as any)
// );

// console.log("instance:", instance?.proxy?.calculateCheckedValue);

watch([config, () => props.options], initStore, {
  deep: true,
  immediate: true,
});

watch(
  () => props.modelValue,
  () => {
    manualChecked = false;
    syncCheckedValue();
  },
  {
    deep: true,
  }
);

watch(
  () => checkedValue.value,
  (val) => {
    if (!isEqual(val, props.modelValue)) {
      // console.log("val:", val);
      emit(UPDATE_MODEL_EVENT, val);
      emit(CHANGE_EVENT, val);
    }
  }
);

onBeforeUpdate(() => (menuList.value = []));

onMounted(() => !isEmpty(props.modelValue) && syncCheckedValue());
</script>

<!-- <style lang="scss">
@use "./style/cascader-panel.scss";
</style> -->
