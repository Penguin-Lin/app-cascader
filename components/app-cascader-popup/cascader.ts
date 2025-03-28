import {
  popupProps as commonPopupProps,
  popupEmits as commonPopupEmits,
} from "@/components/AppPopup/popup";
import { CommonProps as commonCascaderProps } from "@/components/app-cascader-panel/index";
import { UPDATE_MODEL_EVENT, CHANGE_EVENT } from "@/constants";
import { isBoolean } from "@shuzhi-utils/is";

import type { CascaderNode, CascaderValue } from "@/components/app-cascader-panel/index";
// import type {} from "@/components/AppPopup/popup";

export const cascaderProps = {
  ...commonCascaderProps,
  /**
   * @description option label separator
   */
  separator: {
    type: String,
    default: " / ",
  },
  /**
   * @description whether to display all levels of the selected value in the input
   */
  showAllLevels: {
    type: Boolean,
    default: true,
  },
};

export const cascaderPopupProps = {
  ...cascaderProps,
  ...commonPopupProps,
  showResetButton: {
    type: Boolean,
    default: true,
  },
};

export const cascaderEmits = {
  [UPDATE_MODEL_EVENT]: (val: CascaderValue) => !!val || val === null,
  [CHANGE_EVENT]: (val: CascaderValue) => !!val || val === null,
  expandChange: (val: CascaderValue) => !!val,
  focus: (evt: FocusEvent) => evt instanceof FocusEvent,
  blur: (evt: FocusEvent) => evt instanceof FocusEvent,
  visibleChange: (val: boolean) => isBoolean(val),
  removeTag: (val: CascaderNode["valueByOption"]) => !!val,
};

export const cascaderPopupEmits = {
  ...cascaderEmits,
  ...commonPopupEmits,
  sure: (val: CascaderValue, nodes: CascaderNode[]) => !!val || !!nodes,
  ["update:show"]: (val: boolean) => isBoolean(val),
};

export type CascaderProps = ExtractPropTypes<typeof cascaderProps>;

export type CascaderEmits = typeof cascaderEmits;

export type CascaderPopupProps = ExtractPropTypes<typeof cascaderPopupProps>;

export type CascaderPopupEmits = typeof cascaderPopupEmits;
