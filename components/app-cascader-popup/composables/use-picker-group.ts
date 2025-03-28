import { useCascader } from "./use-cascader";
import { useCascaderPopup } from "./use-cascader-popup";
import { UPDATE_MODEL_EVENT } from "@/constants";
import type { CascaderPopupProps, CascaderPopupEmits } from "../cascader";

export const usePickerGroup = (
  props: CascaderPopupProps,
  emit: SetupContext<CascaderPopupEmits>["emit"]
) => {
  const appCascaderPopupShow = ref(false);

  const { inputValue, checkedNodes, cascaderPanelRef, ...casacderHookData } = useCascader(
    props,
    emit
  );

  const { checkedValue } = useCascaderPopup(props, emit);

  const store = computed(() => cascaderPanelRef.value?.store);

  const pickerLabel = computed(() => {
    const { showAllLevels, separator } = props;

    return (
      store.value?.getNodeByValue(props.modelValue as string)?.calcText(showAllLevels, separator) ||
      props.title
    );
  });

  const isActive = computed(() => {
    return !!checkedNodes.value.length;
  });

  function openPicker() {
    appCascaderPopupShow.value = true;
  }

  function handleReset() {
    // console.log("cascaderPanelRef.value:", cascaderPanelRef.value)
    cascaderPanelRef.value?.handleReset();
    cascaderPanelRef.value?.handleSure();
  }

  function handleSure() {
    // console.log(" _modelValue.value:", checkedValue);

    emit(UPDATE_MODEL_EVENT, checkedValue.value);
    emit("sure", checkedValue.value, checkedNodes.value);

    appCascaderPopupShow.value = false;
  }

  return {
    appCascaderPopupShow,
    openPicker,
    pickerLabel,
    isActive,
    checkedValue,
    handleSure,
    handleReset,

    cascaderPanelRef,
    inputValue,
    checkedNodes,
    ...casacderHookData,
  };
};
