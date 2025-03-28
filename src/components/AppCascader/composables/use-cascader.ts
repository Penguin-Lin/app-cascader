import { castArray, unique } from "@/utils/arrays";
import { CHANGE_EVENT } from "@/constants";
import type { CascaderProps, CascaderEmits } from "../cascader";
import type {
  CascaderNode,
  CascaderPanelInstance,
  CascaderValue,
  CascaderStore,
  Tag,
} from "@/components/AppCascaderPanel/index";
import { cloneDeep } from "lodash-es";

export const useCascader = (props: CascaderProps, emit: SetupContext<CascaderEmits>["emit"]) => {
  const cascaderPanelRef: Ref<CascaderPanelInstance | null> = ref(null);
  const innerModelValue = ref<CascaderValue>();
  const inputValue = ref("");
  const searchInputValue = ref("");

  const isDisabled = computed(() => props.disabled);
  const checkedNodes: ComputedRef<CascaderNode[]> = computed(
    () => cascaderPanelRef.value?.checkedNodes || []
  );

  const store: ComputedRef<Nullable<CascaderStore> | undefined> = computed(
    () => cascaderPanelRef.value?.store
  );

  const multiple = computed(() => !!props.props.multiple);
  const checkStrictly = computed(() => props.props.checkStrictly);
  const dominant = computed(() => props.props.dominant);
  const modelValue = computed(() => props.modelValue);

  const presentText = computed(() => {
    const { showAllLevels, separator } = props;
    const nodes = checkedNodes.value;
    return nodes.length ? (multiple.value ? "" : nodes[0].calcText(showAllLevels, separator)) : "";
  });

  const checkedValue = computed<CascaderValue>({
    get() {
      // return cloneDeep(props.modelValue) as CascaderValue;
      return innerModelValue.value as CascaderValue;
    },
    set(val) {
      innerModelValue.value = val;
      // emit(UPDATE_MODEL_EVENT, val);
      emit(CHANGE_EVENT, innerModelValue.value);
      // if (props.validateEvent) {
      //   formItem?.validate("change").catch((err) => debugWarn(err));
      // }
    },
  });

  const syncPresentTextValue = () => {
    const { value } = presentText;
    inputValue.value = value;
    searchInputValue.value = value;
  };

  // watch([modelValueNodes, isDisabled], calculatePresentTags);

  watch(
    modelValue,
    (val) => {
      innerModelValue.value = cloneDeep(val);
    },
    {
      immediate: true,
    }
  );

  watch(presentText, syncPresentTextValue, { immediate: true });

  return {
    cascaderPanelRef,
    inputValue,
    innerModelValue,
    checkedValue,
    checkedNodes,
    store,
  };
};
