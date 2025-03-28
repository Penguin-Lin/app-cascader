import { useCascader } from "./use-cascader";
import { useCascaderPopup } from "./use-cascader-popup";
import { UPDATE_MODEL_EVENT } from "@/constants";
import type { CascaderPopupProps, CascaderPopupEmits } from "../cascader";
import type {
  CascaderNode,
  CascaderPanelInstance,
  CascaderValue,
  CascaderStore,
  Tag,
} from "@/components/app-cascader-panel/index";

export const useTagGroup = (
  props: CascaderPopupProps,
  emit: SetupContext<CascaderPopupEmits>["emit"]
) => {
  const appCascaderPopupShow = ref(false);
  const cascaderPanelRef: Ref<CascaderPanelInstance | null> = ref(null);

  const presentTags = computed(() => {
    return cascaderPanelRef.value?.presentTags;
  });

  const handleSure = () => {
    cascaderPanelRef.value?.handleSure();
  };

  const handleReset = () => {
    cascaderPanelRef.value?.handleReset();
  };

  return {
    appCascaderPopupShow,
    cascaderPanelRef,
    handleSure,
    handleReset,
  };
};
