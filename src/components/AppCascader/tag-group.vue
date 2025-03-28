<template>
  <div :class="ns.b()">
    <div :class="ns.e('scroll-wrap')">
      <scroll-view
        scroll-x
        :class="ns.e('scroll')"
        scroll-with-animation
        :scroll-left="scrollLeft"
        @scroll="handleScroll"
      >
        <div :class="ns.e('scroll-content')" :id="`${id}`" ref="scrollContent">
          <template v-if="presentTags.length">
            <div :class="ns.e('tag')" v-for="tag in presentTags" :key="tag.key">
              {{ tag.text }}
              <tm-icon
                name="tmicon-times"
                fontSize="22"
                color="#989897"
                :class="[ns.e('close-icon')]"
                @click.stop="deleteTag(tag)"
              ></tm-icon>
            </div>
          </template>
          <span v-else :class="ns.e('placeholder')">{{ inputPlaceholder }}</span>
        </div>
      </scroll-view>

      <tm-icon
        v-if="presentTags.length"
        name="tmicon-times-circle-fill"
        fontSize="26"
        color="#989897"
        :class="[ns.e('clear-icon')]"
        @click.stop="handleClear()"
      ></tm-icon>
    </div>

    <div :class="ns.e('icon-wrap')" @click="handleAppCascaderPopupShow">
      <tm-icon
        name="aicon-zhedie"
        fontSize="38"
        :class="[ns.e('open-icon'), ns.is('open', appCascaderPopupShow)]"
      ></tm-icon>
    </div>

    <app-cascader-popup
      ref="cascaderPopupRef"
      v-bind="{
        ...props,
      }"
      v-model:show="appCascaderPopupShow"
      :height="990"
      @sure="(...args) => emit('sure', ...args)"
      @change="(...args) => emit(CHANGE_EVENT, ...args)"
      @update:model-value="(...args) => emit(UPDATE_MODEL_EVENT, ...args)"
    ></app-cascader-popup>
  </div>
</template>

<script lang="ts">
export default {
  options: {
    name: "AppCascaderTagGroup",
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
import { DefaultProps } from "../AppCascaderPanel";
import { generateId } from "../AppCascaderPanel/utils";
import { CHANGE_EVENT, UPDATE_MODEL_EVENT } from "@/constants";
import { PropType } from "vue";
import { getElementClientRect } from "@/utils/utils";
import type { CascaderProps } from "../AppCascaderPanel";
import type { CascaderPopupInstance } from "./instance";

const ns = useNamespace("tag-group");

const props = defineProps({
  ...cascaderPopupProps,
  props: {
    type: Object as PropType<CascaderProps>,
    default: () => DefaultProps,
  },
  placeholder: {
    type: String,
    default: () => "",
  },
});

const emit = defineEmits(cascaderPopupEmits);

const id = `tag-group-content-${generateId()}`;
const scrollContent = ref<HTMLElement>();

const appCascaderPopupShow = ref(false);
const cascaderPopupRef: Ref<CascaderPopupInstance | null> = ref(null);

const scrollLeft = ref(0);
const oldScrollLeft = ref(0);

// const checkedValue = computed({
//   get() {
//     return props.modelValue
//   },
//   set() {

//   }
// })

const presentTags = computed(() => {
  return cascaderPopupRef.value?.presentTags || [];
});

const inputPlaceholder = computed(() => props.placeholder || "请选择");

const handleSure = () => {
  cascaderPopupRef.value?.handleSure();
};

const handleReset = () => {
  cascaderPopupRef.value?.handleReset();
};

const deleteTag = (...args: any[]) => {
  cascaderPopupRef.value?.deleteTag(...args);
};

const handleClear = () => {
  cascaderPopupRef.value?.handleClear();
};

function handleScroll(e: any) {
  oldScrollLeft.value = e.detail.scrollLeft;
}

function handleAppCascaderPopupShow() {
  appCascaderPopupShow.value = true;
}

const instance = getCurrentInstance();

watch(
  () => presentTags.value.length,
  async (length) => {
    scrollLeft.value = oldScrollLeft.value;
    await nextTick();
    // console.log("length:", length);
    if (!length) {
      scrollLeft.value = 0;
    } else {
      // console.log("id:", `#${id}`);
      const { width } = await getElementClientRect(instance, {
        selector: `#${id}`,
        selectorElement: scrollContent.value,
      });
      // console.log("width:", width);
      scrollLeft.value = width;
    }
  }
);

defineExpose({
  handleSure,
  handleReset,
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins/mixins.scss" as *;

@include b(tag-group) {
  display: flex;
  width: 100%;
  flex: 1;
  // height: 50rpx;
  align-items: center;
  padding: 0 15rpx;
  box-sizing: border-box;

  $clear-icon: 50rpx;

  @include e(scroll-wrap) {
    flex: 1;
    width: 1rpx;
    border: 2rpx solid #{getCssVar("color-primary")};
    border-radius: 20rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
  }

  @include e(scroll) {
    width: calc(100% - #{$clear-icon});
    height: 100%;
    padding-left: 15rpx;
    box-sizing: border-box;
  }

  @include e(clear-icon) {
    width: $clear-icon;
  }

  @include e(scroll-content) {
    height: 100%;
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  @include e(placeholder) {
    font-size: 28rpx;
    color: #989897;
  }

  @include e(tag) {
    align-items: center;
    font-weight: 500;
    font-size: 24rpx;
    padding: 8rpx 15rpx;
    display: inline-flex;
    align-items: center;
    background-color: #f2f2f2;
    border: 2rpx solid #f2f2f2;
    border-radius: 20rpx;
    box-sizing: border-box;
    margin-right: 15rpx;
  }

  @include e(close-icon) {
    margin-left: 5rpx;
    width: 35rpx;
    height: 35rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @include e(icon-wrap) {
    display: flex;
    align-items: center;
    margin-left: 15rpx;
  }

  @include e(open-icon) {
    transition: all 0.2s;
  }
  .is-open {
    transform: rotateZ(180deg);
  }
}
</style>
