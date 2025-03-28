<template>
  <div :class="[pickerKls]" @click="openPicker">
    {{ pickerLabel }}
    <!-- <tm-icon
      v-if="showResetIcon && isActive"
      name="tmicon-times-circle"
      fontSize="26"
      color="red"
      :class="[ns.e('icon'), ns.e('close-icon')]"
      @click.stop="handleReset"
    ></tm-icon> -->
    <tm-icon
      name="tmicon-angle-down"
      fontSize="18"
      color="#989897"
      :class="[ns.e('icon')]"
    ></tm-icon>
  </div>

  <app-cascader-popup
    ref="cascaderPanelRef"
    v-model:show="appCascaderPopupShow"
    v-model="checkedValue"
    :options="options"
    :props="appCascaserProps"
    :height="990"
    :showResetButton="showResetButton"
    :title="title"
    :bottom="bottom"
    :zIndex="zIndex"
    @sure="handleSure"
  ></app-cascader-popup>
</template>

<script lang="ts">
export default {
  options: {
    name: "AppCascaderPicker",
    styleIsolation: "shared", // 解除样式隔离
    // #ifdef MP-WEIXIN
    // 将自定义节点设置成虚拟的（去掉自定义组件包裹层），更加接近Vue组件的表现，能更好的使用flex属性
    virtualHost: true,
    // #endif
  },
};
</script>

<script lang="ts" setup>
import "@/components/AppPicker/style/picker.scss";
import AppCascaderPopup from "./popup.vue";
import { useNamespace } from "@/hooks/use-namespace";

import { cascaderPopupProps, cascaderPopupEmits } from "./cascader";
import { usePicker } from "./composables/use-picker";

const ns = useNamespace("picker");

const pickerKls = computed(() => [ns.b(), ns.is("actived", isActive.value)]);

const props = defineProps(cascaderPopupProps);
const emit = defineEmits(cascaderPopupEmits);

const appCascaserProps = computed(() => {
  return {
    ...props.props,
    // todo 暂时只做单选
    multiple: false,
    emitPath: false,
  };
});

const {
  appCascaderPopupShow,
  openPicker,
  cascaderPanelRef,
  pickerLabel,
  checkedValue,
  handleSure,
  handleReset,

  isActive,
} = usePicker(props, emit);
</script>
