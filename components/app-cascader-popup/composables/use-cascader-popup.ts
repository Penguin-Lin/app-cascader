import { cloneDeep } from "lodash-es";
import { UPDATE_MODEL_EVENT } from "@/constants";
import { castArray, unique } from "@/utils/arrays";
import { isArray, isNumber } from "@shuzhi-utils/is";
import type { CascaderPopupProps, CascaderPopupEmits } from "../cascader";
import type { CascaderValue, CascaderNode, Tag } from "@/components/app-cascader-panel/index";

import { useCascader } from "./use-cascader";

export const useCascaderPopup = (
  props: CascaderPopupProps,
  emit: SetupContext<CascaderPopupEmits>["emit"]
) => {
  const {
    cascaderPanelRef,
    innerModelValue,
    checkedValue,
    checkedNodes,
    store,
    ...casacderHookData
  } = useCascader(props, emit);

  const innerAppCascaderPopupShow = ref(false);
  const presentTags: Ref<Tag[]> = ref([]);
  const allPresentTags: Ref<Tag[]> = ref([]);

  const appCascaderPopupShow = computed({
    get() {
      return props.show || innerAppCascaderPopupShow.value;
    },
    set(val) {
      innerAppCascaderPopupShow.value = val;
      emit("update:show", val);
    },
  });

  const multiple = computed(() => !!props.props.multiple);
  const checkStrictly = computed(() => props.props.checkStrictly);
  const dominant = computed(() => props.props.dominant);
  const maxLength = computed(() => props.props.maxLength);

  const isDisabled = computed(() => props.disabled);

  const modelValueNodes = computed(() => {
    const leafOnly = !(checkStrictly.value ? checkStrictly.value : dominant.value);

    // const flattedNodes = store.value?.getFlattedNodes(leafOnly);

    const values = multiple.value ? castArray(props.modelValue!) : [props.modelValue!];

    const nodes = unique(values.map((val) => store.value?.getNodeByValue(val, leafOnly))).filter(
      (node) => !!node
    ) as unknown as Node[];
		
		console.log("调用nodes：", nodes);

    return nodes;
  });

  const sureSuffixText = computed(() => {
    if (multiple.value && isNumber(maxLength.value)) {
      return `已选择（${isArray(checkedValue.value) ? checkedValue.value.length : 0}/${
        maxLength.value
      }）`;
    }
    return "";
  });

  const handleExpandChange = (value: CascaderValue) => {
    // updatePopperPosition();
    emit("expandChange", value);
  };

  const openPicker = () => {
    appCascaderPopupShow.value = true;
  };

  const handleSure = () => {
    if (
      multiple.value &&
      isNumber(maxLength.value) &&
      isArray(checkedValue.value) &&
      maxLength.value < checkedValue.value.length
    ) {
      uni.showToast({
        icon: "none",
        title: "超出选择数量最大限制",
      });
      return;
    }

    console.log("checkedValue:", checkedValue.value);

    emit(UPDATE_MODEL_EVENT, checkedValue.value!);
    emit("sure", checkedValue.value!, checkedNodes.value);

    appCascaderPopupShow.value = false;
  };

  const handleReset = () => {
    innerModelValue.value = undefined;
  };

  const genTag = (node: CascaderNode): Tag => {
    const { showAllLevels, separator } = props;
    return {
      node,
      key: node.uid,
      text: node.calcText(showAllLevels, separator),
      hitState: false,
      closable: !isDisabled.value && !node.isDisabled,
      isCollapseTag: false,
    };
  };

  const deleteTag = (tag: Tag) => {
    const node = tag.node as CascaderNode;
    node.doCheck(false);
    cascaderPanelRef.value?.calculateCheckedValue();
    emit("removeTag", node.valueByOption);
    nextTick(() => {
      handleSure();
    });
  };

  const handleClear = () => {
    cascaderPanelRef.value?.clearCheckedNodes();
    nextTick(() => {
      handleSure();
    });
  };

  const calculatePresentTags = () => {
    if (!multiple.value) return;

    // 根据选中的值获取对应的节点，并更新选中状态

    const nodes = modelValueNodes.value;

    console.log("调用nodes：", nodes);

    const tags: Tag[] = [];

    const allTags: Tag[] = [];
    nodes.forEach((node) => allTags.push(genTag(node)));
    allPresentTags.value = allTags;

    if (nodes.length) {
      const [first, ...rest] = nodes;
      const restCount = rest.length;

      tags.push(genTag(first));

      if (restCount) {
        if (props.collapseTags) {
          tags.push({
            key: -1,
            text: `+ ${restCount}`,
            closable: false,
            isCollapseTag: true,
          });
        } else {
          rest.forEach((node) => tags.push(genTag(node)));
        }
      }
    }

    presentTags.value = tags;

    console.log("presentTags:", presentTags);
  };

  watch(
    () => props.show,
    (value) => {
      if (value) {
        innerModelValue.value = cloneDeep(props.modelValue);
      }
    }
  );

  watch([modelValueNodes, isDisabled], calculatePresentTags);

  return {
    cascaderPanelRef,
    appCascaderPopupShow,
    presentTags,
    checkedValue,
    checkedNodes,
    store,
    sureSuffixText,
    openPicker,
    handleSure,
    handleReset,
    handleExpandChange,
    deleteTag,
    handleClear,
    ...casacderHookData,
  };
};
