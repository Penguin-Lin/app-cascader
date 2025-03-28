<template>
  <div :class="[ns.b()]">
    <div :class="ns.e('wrap')">
      <scroll-view scroll-y style="height: 100%">
        <div :class="[ns.e('list'), ns.is('empty', isEmpty)]">
          <app-cascader-node
            v-for="node in nodes"
            :key="node.uid"
            :node="node"
            :menu-id="menuId"
            @expand="handleExpand"
          />
          <div v-if="isLoading" :class="ns.e('empty-text')">
            <tm-icon name="tmicon-loading" color="primary" :class="[ns.is('loading')]"></tm-icon>
            加载中
          </div>
          <div v-else-if="isEmpty" :class="ns.e('empty-text')">暂无数据</div>
          <svg v-else-if="panel?.isHoverMenu" ref="hoverZone" :class="ns.e('hover-zone')"></svg>
        </div>
      </scroll-view>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  options: {
    name: "AppCascaderMenu",
    styleIsolation: "shared", // 解除样式隔离
    // #ifdef MP-WEIXIN
    // 将自定义节点设置成虚拟的（去掉自定义组件包裹层），更加接近Vue组件的表现，能更好的使用flex属性
    virtualHost: true,
    // #endif
  },
};
</script>

<script lang="ts" setup>
import AppCascaderNode from "./node.vue";
import { useNamespace } from "@/hooks";
import { CASCADER_PANEL_INJECTION_KEY } from "./types";

import { generateId } from "./utils";

import type { default as CascaderNode } from "./node";

const props = defineProps({
  nodes: {
    type: Array as PropType<CascaderNode[]>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  scrollHeight: {
    type: [Number, String],
    default: "180px",
  },
});

const instance = getCurrentInstance()!;
const ns = useNamespace("cascader-menu");

const id = generateId();

let activeNode: Nullable<HTMLElement> = null;
let hoverTimer: Nullable<number> = null;

const panel = inject(CASCADER_PANEL_INJECTION_KEY)!;

const hoverZone = ref<null | SVGSVGElement>(null);

const isEmpty = computed(() => !props.nodes.length);
const isLoading = computed(() => !panel.initialLoaded);
const menuId = computed(() => `cascader-menu-${id}-${props.index}`);

const handleExpand = (e: MouseEvent) => {
  activeNode = e.target as HTMLElement;
};

const clearHoverTimer = () => {
  if (!hoverTimer) return;
  clearTimeout(hoverTimer);
  hoverTimer = null;
};

const clearHoverZone = () => {
  if (!hoverZone.value) return;
  hoverZone.value.innerHTML = "";
  clearHoverTimer();
};

const handleMouseMove = (e: MouseEvent) => {
  if (!panel.isHoverMenu || !activeNode || !hoverZone.value) return;

  if (activeNode.contains(e.target as HTMLElement)) {
    clearHoverTimer();

    const el = instance.vnode.el as HTMLElement;
    const { left } = el.getBoundingClientRect();
    const { offsetWidth, offsetHeight } = el;
    const startX = e.clientX - left;
    const top = activeNode.offsetTop;
    const bottom = top + activeNode.offsetHeight;

    hoverZone.value.innerHTML = `
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${top} L${offsetWidth} 0 V${top} Z" />
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${bottom} L${offsetWidth} ${offsetHeight} V${bottom} Z" />
        `;
  } else if (!hoverTimer) {
    hoverTimer = window.setTimeout(clearHoverZone, panel.config.hoverThreshold);
  }
};
</script>
