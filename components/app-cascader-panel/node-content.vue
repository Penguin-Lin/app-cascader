<template>
  <span :class="ns.e('label')">{{ renderLabelFn ? renderLabelFn({ node, data }) : label }}</span>
</template>

<script lang="ts">
export default {
  name: "AppNodeContent",
};
</script>

<script lang="ts" setup>
import { useNamespace } from "@/hooks";
// import { getCurrentInstance } from "vue";

const props = defineProps({
  node: Object,
  panel: Object,
});

const ns = useNamespace("cascader-node");

// todo
// const instance = getCurrentInstance()!;

// const { node, panel } = instance.parent.proxy;

// console.log("instance.parent:", instance.parent.proxy.node);
// console.log("panel:", panel);

const { data, label } = props.node;

const { renderLabelFn } = props.panel || {};
</script>
