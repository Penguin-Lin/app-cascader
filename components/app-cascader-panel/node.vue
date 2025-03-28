<template>
  <li
    :id="`${menuId}-${node.uid}`"
    :tabindex="expandable ? -1 : undefined"
    :class="[
      ns.b(),
      ns.is('selectable', checkStrictly),
      ns.is('active', node.checked),
      ns.is('disabled', !expandable),
      ns.is('parent', !node.parent),
      inExpandingPath && 'in-active-path',
      inCheckedPath && 'in-checked-path',
    ]"
    @mouseenter="handleHoverExpand"
    @focus="handleHoverExpand"
    @click="handleClick"
  >
    <!-- prefix -->
    <!-- 白痴组件，居然不是受控模式，辣鸡UI库(ps:改成受控的了) -->
    <tm-checkbox
      v-if="multiple"
      :model-value="node.checked"
      :defaultChecked="node.checked"
      :indeterminate="node.indeterminate"
      :disabled="isDisabled"
      @update:model-value="handleSelectCheck"
      :size="28"
      :margin="[0, 0]"
    >
      <template #right>
        <node-content :node="node" :panel="panel" />
      </template>
    </tm-checkbox>

    <!-- <tm-radio
      v-else-if="checkStrictly"
      :model-value="checkedNodeId"
      :value="node.uid"
      :disabled="isDisabled"
      @update:model-value="handleSelectCheck"
      :size="18"
      :margin="[0, 0]"
    ></tm-radio> -->

    <tm-checkbox
      v-else-if="checkStrictly"
      :model-value="checkedNodeId"
      :value="node.uid"
      :disabled="isDisabled"
      @update:model-value="handleSelectCheck"
      :size="28"
      :margin="[0, 0]"
      :round="25"
    >
      <template #right>
        <node-content :node="node" :panel="panel" />
      </template>
    </tm-checkbox>

    <!-- 非任意项选中 -->
    <template v-else-if="isLeaf && node.checked">
      <tm-icon name="tmicon-check" color="primary" :class="ns.e('prefix')" fontSize="24"></tm-icon>
      <node-content :node="node" :panel="panel" />
    </template>

    <!-- content -->
    <!-- <node-content /> -->

    <!-- postfix -->
    <template v-if="!isLeaf">
      <tm-icon
        name="tmicon-loading"
        color="primary"
        v-if="node.loading"
        fontSize="24"
        :class="[ns.is('loading'), ns.e('postfix')]"
      ></tm-icon>

      <!-- <tm-icons
        name="tmicon-angle-right"
        color="#888A8D"
        v-else
        fontSize="22"
        :class="['arrow-right', ns.e('postfix')]"
      ></tm-icon> -->
    </template>
  </li>
</template>

<script lang="ts">
export default {
  name: "AppCascaderNode",
};
</script>

<script lang="ts" setup>
import type { PropType } from "vue";
import type { default as CascaderNode } from "./node";
import { CASCADER_PANEL_INJECTION_KEY } from "./types";
import NodeContent from "./node-content.vue";

import { inject, computed } from "vue";
import { useNamespace } from "@/hooks";

const props = defineProps({
  node: {
    type: Object as PropType<CascaderNode>,
    required: true,
  },
  menuId: String,
});

const emit = defineEmits(["expand"]);

const panel = inject(CASCADER_PANEL_INJECTION_KEY)!;

const ns = useNamespace("cascader-node");
const isHoverMenu = computed(() => panel.isHoverMenu);
// 是否多选
const multiple = computed(() => panel.config.multiple);
// 是否严格的遵守父子节点不互相关联
const checkStrictly = computed(() => panel.config.checkStrictly);
const checkedNodeId = computed(() => panel.checkedNodes[0]?.uid);
const isDisabled = computed(() => props.node.isDisabled);
// 是否还有子节点
const isLeaf = computed(() => props.node.isLeaf);
// 是否还有子节点？
const expandable = computed(() => (checkStrictly.value && !isLeaf.value) || !isDisabled.value);
// 是否处于可扩展的路径上？
const inExpandingPath = computed(() => isInPath(panel.expandingNode!));
// only useful in check-strictly mode
const inCheckedPath = computed(() => checkStrictly.value && panel.checkedNodes.some(isInPath));

const isInPath = (node: CascaderNode) => {
  const { level, uid } = props.node;
  return node?.pathNodes[level - 1]?.uid === uid;
};

const doExpand = () => {
  if (inExpandingPath.value) return;
  // console.log("props.node:", props.node);
  panel.expandNode(props.node);
  // console.log("expand:vvv");
};

const doCheck = (checked: boolean) => {
  const { node } = props;
  if (checked === node.checked) return;
  panel.handleCheckChange(node, checked);
};

const doLoad = () => {
  panel.lazyLoad(props.node, () => {
    if (!isLeaf.value) doExpand();
  });
};

const handleHoverExpand = (e: Event) => {
  if (!isHoverMenu.value) return;
  handleExpand();
  !isLeaf.value && emit("expand", e);
};

const handleExpand = () => {
  const { node } = props;
  // do not exclude leaf node because the menus expanded might have to reset
  if (!expandable.value || node.loading) return;
  node.loaded ? doExpand() : doLoad();
};

const handleClick = () => {
  if (isHoverMenu.value && !isLeaf.value) return;

  if (isLeaf.value && !isDisabled.value && !checkStrictly.value && !multiple.value) {
    handleCheck(true);
  } else {
    handleExpand();
  }
};

const handleSelectCheck = (checked: boolean) => {
  // console.log("checked:", checked);
  if (checkStrictly.value) {
    doCheck(checked);
    if (props.node.loaded) {
      doExpand();
    }
  } else {
    handleCheck(checked);
  }
};

const handleCheck = (checked: boolean) => {
  // console.log("handleCheck:", handleCheck);

  if (!props.node.loaded) {
    doLoad();
  } else {
    doCheck(checked);
    !checkStrictly.value && doExpand();
  }
};

defineExpose({
  node: props.node,
  panel,
});
</script>
