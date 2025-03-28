import { useCascader } from "./use-cascader";
import { UPDATE_MODEL_EVENT } from "@/constants";
import type { CascaderPopupProps, CascaderPopupEmits } from "../cascader";

export const usePicker = (
  props: CascaderPopupProps,
  emit: SetupContext<CascaderPopupEmits>["emit"]
) => {
  const appCascaderPopupShow = ref(false);

  const { inputValue, checkedValue, checkedNodes, cascaderPanelRef, ...casacderHookData } =
    useCascader(props, emit);

  const store = computed(() => cascaderPanelRef.value?.store);

  const pickerLabel = computed(() => {
    const { showAllLevels, separator } = props;

    // console.log("props.modelValue:", props.modelValue);
    // console.log("store:", store.value);
    // console.log(
    //   "store.value?.getNodeByValue(props.modelValue as string):",
    //   store.value?.getNodeByValue(props.modelValue as string)
    // );

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
    handleSure,
    handleReset,
    cascaderPanelRef,
    inputValue,
    checkedValue,
    checkedNodes,
    ...casacderHookData,
  };
};
