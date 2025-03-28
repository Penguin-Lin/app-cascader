<template>
  <div flex w-full h-50rpx items-center :class="ns.b()">
    <div flex-1 w-1rpx>
      <scroll-view scroll-x style="width: 100%">
        <div inline-flex flex-nowrap whitespace-nowrap px-10rpx>
          <slot name="left"></slot>

          <template v-for="item in groupOptions" :key="item.key">
            <div mr-20rpx>
              <app-picker
                :options="item[props.props.children]"
                :label="item[props.props.label]"
                :props="props.props"
                @change="handleSure"
                v-model="checkedValue"
              ></app-picker>
            </div>
          </template>

          <slot name="right"></slot>
        </div>
      </scroll-view>
    </div>

    <div flex items-center px-15rpx @click="handleAppCascaderPopupShow">
      <tm-icon
        name="aicon-zhedie"
        fontSize="32"
        :class="[ns.e('open-icon'), ns.is('open', appCascaderPopupShow)]"
      ></tm-icon>
    </div>

    <app-cascader-popup
      ref="cascaderPanelRef"
      v-model:show="appCascaderPopupShow"
      v-model="checkedValue"
      :options="options"
      :props="props.props"
      :height="990"
      :showResetButton="showResetButton"
      :title="title"
      :bottom="bottom"
      :zIndex="zIndex"
      @sure="handleSure"
    ></app-cascader-popup>
  </div>
</template>

<script lang="ts">
export default {
  options: {
    name: "AppCascaderPickerGroup",
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
import AppPicker from "@/components/AppPicker/index.vue";
import AppCascaderPopup from "./popup.vue";
import { useNamespace } from "@/hooks/use-namespace";

import { cascaderPopupProps, cascaderPopupEmits } from "./cascader";
import { DefaultProps } from "../AppCascaderPanel";
import { usePickerGroup } from "./composables";
import { PropType } from "vue";
import type { PropsType as PickerPropsType } from "../AppPicker/pickerData";
import type { CascaderOption, CascaderProps } from "../AppCascaderPanel";

const ns = useNamespace("picker-group");

const props = defineProps({
  ...cascaderPopupProps,
  props: {
    type: Object as PropType<CascaderProps & PickerPropsType>,
    default: () => DefaultProps,
  },
  groupOptions: {
    type: Array as PropType<CascaderOption[]>,
    default: () => [],
  },
});

const emit = defineEmits(cascaderPopupEmits);

const {
  appCascaderPopupShow,
  openPicker,
  cascaderPanelRef,
  pickerLabel,
  checkedValue,
  handleSure,
  handleReset,
} = usePickerGroup(props, emit);

function handleAppCascaderPopupShow() {
  appCascaderPopupShow.value = true;
}

function handleConfirm() {
  handleSure();
}

defineExpose({
  handleSure,
  handleReset,
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins/mixins.scss" as *;

@include b(picker-group) {
  @include e(open-icon) {
    transition: all 0.2s;
  }
  .is-open {
    transform: rotateZ(180deg);
  }
}
</style>
