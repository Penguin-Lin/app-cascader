import { isBoolean } from "@shuzhi-utils/is";

export const popupProps = {
  title: String,
  show: {
    type: Boolean,
    default: false,
  },
  height: {
    type: Number,
    default: 900,
  },
  scrollHeight: {
    type: Number,
    default: 800,
  },
  backgroundColor: {
    type: String,
    default: "transparent",
  },
  bottom: {
    type: String,
    default: 0,
  },
  zIndex: {
    type: [Number, String],
    default: 99999,
  },
};

export const popupEmits = {
  ["update:show"]: (val: boolean) => isBoolean(val),
  close: () => void 0,
};

export type PopupProps = ExtractPropTypes<typeof popupProps>;

export type PopupEmits = typeof popupEmits;
