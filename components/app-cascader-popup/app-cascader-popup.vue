<template>
  <app-popup
    :class="ns.b()"
    :isSafeArea="false"
    :backgroundColor="backgroundColor"
    :height="height"
    :bottom="bottom"
    :show="appCascaderPopupShow"
    :title="title"
    :zIndex="zIndex"
    @close="handleClose"
  >
    <div :class="ns.e('wrap')">
      <app-cascader-panel
        ref="cascaderPanelRef"
        v-model="checkedValue"
        :options="options"
        :props="props.props"
        :border="false"
        :render-label="$slots.default"
        @expand-change="handleExpandChange"
        @close="$nextTick(() => togglePopperVisible(false))"
        v-bind="$attrs"
      ></app-cascader-panel>
    </div>

    <template #bottom>
      <div flex-center>
        <tm-button
          v-if="showResetButton"
          :margin="[10, 0]"
          transprent
          text
          :shadow="0"
          size="normal"
          label="重置"
          fontSize="30"
          @tap="handleReset"
        ></tm-button>

        <div :class="ns.e('choosen-text')" v-if="sureSuffixText">{{ sureSuffixText }}</div>

        <tm-button
          round="8"
          font-color="white"
          size="small"
          :label="`确定`"
          fontSize="30"
          :width="300"
          :height="75"
          color="primary"
          @tap="handleSure"
        ></tm-button>
      </div>
    </template>
  </app-popup>
</template>

<script lang="ts">
export default {
  options: {
    name: "AppCascaderPopup",
    styleIsolation: "shared", // 解除样式隔离
    // #ifdef MP-WEIXIN
    // 将自定义节点设置成虚拟的（去掉自定义组件包裹层），更加接近Vue组件的表现，能更好的使用flex属性
    virtualHost: true,
    // #endif
  },
};
</script>

<script lang="ts" setup>
import "./style/cascader.scss";

import AppPopup from "@/components/AppPopup/index.vue";
import app-cascader-panel from "@/components/app-cascader-panel/index.vue";
import { cascaderPopupProps, cascaderPopupEmits } from "./cascader";
import { useCascaderPopup } from "./composables/index";
import { useNamespace } from "@/hooks";

const props = defineProps(cascaderPopupProps);
const emit = defineEmits(cascaderPopupEmits);

const ns = useNamespace("cascader-popup");

const {
  cascaderPanelRef,
  appCascaderPopupShow,
  checkedValue,
  checkedNodes,
  store,
  sureSuffixText,
  handleExpandChange,
  handleReset,
  handleSure,
  presentTags,
  deleteTag,
  handleClear,
} = useCascaderPopup(props, emit);

function handleClose() {
  emit("update:show", false);
  emit("close");
}

function togglePopperVisible(bool: boolean) {}

const exposeObj = Object.keys({
  getCheckedNodes: "getCheckedNodes",
  calculateCheckedValue: "calculateCheckedValue",
}).reduce((prev, key) => {
  prev[key] = function () {
    return cascaderPanelRef.value?.[key]();
  };

  return prev;
}, {} as any);

console.log("exposeObj:", exposeObj);

defineExpose({
  checkedNodes,
  store,
  presentTags,
  handleReset,
  handleSure,
  deleteTag,
  handleClear,
  ...exposeObj,
});
</script>
