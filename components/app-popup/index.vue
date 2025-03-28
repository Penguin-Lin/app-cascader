<template>
  <tui-bottom-popup
    :isSafeArea="false"
    :zIndex="zIndex"
    :backgroundColor="backgroundColor"
    :height="height"
    :bottom="bottom"
    :show="show"
    @close="handleClose"
  >
    <div w-full bg-white h-full>
      <div flex justify-center px-20rpx py-20rpx relative h-30rpx>
        <div>
          <slot name="title">
            <h3 v-if="props.title" text-center text-30rpx>{{ props.title }}</h3>
          </slot>
        </div>
        <tui-icon
          name="close"
          size="20"
          color="#8E8E8E"
          @click="handleClose"
          absolute
          right-20rpx
        ></tui-icon>
      </div>

      <div>
        <scroll-view scroll-y :style="scrollStyle">
          <slot></slot>
        </scroll-view>
      </div>

      <div>
        <slot name="bottom"> </slot>
      </div>
    </div>
  </tui-bottom-popup>
</template>

<script setup lang="ts">
import { popupProps, popupEmits } from "./popup";

const emit = defineEmits(popupEmits);

const props = defineProps(popupProps);

const scrollStyle = computed(() => `height: ${props.scrollHeight}rpx`);

function handleClose() {
  emit("update:show", false);
  emit("close");
}
</script>
