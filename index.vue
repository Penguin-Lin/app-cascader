<template>
  <app-cascader-popup
    v-model:show="appCascaderPopupShow"
    :model-value="category"
    :options="goodTypeOptions"
    :props="appCascaserProps"
    :height="990"
    :showResetButton="false"
    title="选择分类"
    @sure="handleCategorySure"
  ></app-cascader-popup>
</template>

<script lang="ts" setup>
import type { CascaderNode } from "@/components/AppCascaderPanel/index";

const appCascaderPopupShow = ref(false);

const category = reactive([])

const goodTypeOptions = computed(() => {
  return [
    {
      id: "1",
      name: "测试",
      parent_id: "",
      disabled: false,
      children: [
        {
          id: "2",
          name: "测试2",
          parent_id: "",
          disabled: false,
        },
      ],
    },
    {
      id: "3",
      name: "测试3",
      parent_id: "",
      disabled: false,
    },
    {
      id: "4",
      name: "测试4",
      parent_id: "",
      disabled: true,
    },
  ];
});

const appCascaserProps = ref({
  value: "id",
  label: "name",
  children: "children",
  maxLength: categorys,
  checkStrictly: false,
  multiple: true,
  dominant: true,
  emitPath: false,
});

function handleCategorySure(value: string[], nodes: CascaderNode[]) {}
</script>
