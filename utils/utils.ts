import { cloneDeep } from "lodash-es";
import { isArray } from "@shuzhi-utils/is";
import { getDomRef, getBoundingClientRect } from "./wx";
import qs from "qs";
import type { ComponentInternalInstance } from "vue";

export function setPropByPath(obj: Recordable, path: string, value: any, strict = false) {
  let tempObj = obj;

  // ios不支持零宽断言
  // function parsePath(path: string) {
  // // ios 不支持
  //   // const pattern = /(?<=^|\.)\w+|\[\d+\]/g;
  // const pattern = new RegExp('(?<=^|\\.)\\w+|\\[\\d+\\]', 'g');
  //   return path.replace(/^\./, "").match(pattern) || [];
  // }

  function parsePath(path: string) {
    const pattern = /(?:^|\.)\w+|\[\d+\]/g;
    const matches = path.match(pattern);
    return matches ? matches.map((match) => match.replace(/^\./, "")) : [];
  }

  const keyArr = parsePath(path);
  const keyArrLen = keyArr.length;
  let i = 0;

  for (let len = keyArrLen; i < len; ++i) {
    // 若是数组[xxx]，需转
    const key = keyArr[i].replace(/\[(\w+)\]/g, "$1");
    // console.log("key:", key);
    // console.log("i:", i);
    // console.log("tempObj:", JSON.parse(JSON.stringify(tempObj)));
    // console.log("-------------------");
    if (key in tempObj) {
      // 最后一项
      if (i === keyArrLen - 1) tempObj[key] = value;
    } else {
      if (strict) {
        throw new Error("please transfer a valid prop path to form item!");
      } else {
        const next_key = keyArr[i + 1];
        // 数组
        if (/^\[\d+\]$/.test(next_key)) {
          tempObj[key] = [];
        } else {
          // 对象
          tempObj[key] = {};
        }
      }
    }
    tempObj = tempObj[key];
  }

  return {
    k: keyArr[i],
    o: obj,
  };
}

export function styleToString(styleObj: Recordable) {
  return Object.keys(styleObj)
    .map((key) => `${camelToKebab(key)}: ${styleObj[key]};`)
    .join(" ");
}

export function camelToKebab(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * 整数数字转中文
 * @param str {number} 整数
 * @returns {string}
 */
export function numToZh(str: string | number) {
  const cstr = ("" + str).trim().replace(/^0*/, ""); //去掉前面修饰的0
  const match = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "零"];
  return (
    ("0000" + cstr)
      .substr(cstr.length % 4 || 4)
      .replace(/(\d){4}/g, function (_str, endIndex, startIndex) {
        const dot = (((cstr.length - 1) / 4) >> 0) - ((startIndex / 4) >> 0);
        let prefix = (function getPrfix(dot: number): string {
          return dot > 2
            ? +_str
              ? dot === 3
                ? "万"
                : getPrfix(dot - 1) + "万"
              : ""
            : dot === 1
            ? +_str
              ? "万"
              : ""
            : dot === 2
            ? "亿"
            : "";
        })(dot);
        /0+$/g.test(_str) && (prefix += match[10]); //处理单元内后半部分有零的地方
        return +_str
          ? _str.replace(/(\d)(\d)(\d)(\d)/g, function ($0, $1, $2, $3, $4) {
              !match[$1] &&
                (match[$2] ? ($1 = 10) : match[$3] ? ($2 = 10) : match[$4] ? ($3 = 10) : ""); //处理相邻单元前半部分
              match[$1] && match[$3] && !match[$2] && ($2 = 10),
                match[$2] && match[$4] && !match[$3] && ($3 = 10),
                match[$1] && match[$4] && !match[$3] && !match[$2] && ($3 = 10); //中间两个连续为0，只是获取最后一个
              return (
                (match[$1] && ($1 < 10 ? match[$1] + "千" : match[$1])) +
                (match[$2] && ($2 < 10 ? match[$2] + "百" : match[$2])) +
                (match[$3] && ($3 < 10 ? ($3 === 1 ? "十" : match[$3] + "十") : match[$3])) +
                (match[$4] && match[$4])
              );
            }) + prefix
          : prefix;
      })
      .replace(/^零*/g, "")
      .replace(/零*$/g, "")
      .replace(/(零)*/g, "$1")
      .replace(/零亿/g, "亿") || match[10]
  ); //处理连续零的问题
}

export async function getElementClientRect(
  instance: ComponentInternalInstance | null,
  {
    selector,
    selectorElement,
  }: {
    selector: string;
    selectorElement: Nullable<HTMLElement>;
  }
) {
  // #ifndef H5
  if (selector) {
    const domRef = getDomRef(selector, instance);

    const element = await getBoundingClientRect(domRef as UniApp.NodesRef);
    console.log("有结果:", element);
    return element;
  }
  // #endif

  // #ifdef H5
  if (selectorElement) {
    const element = selectorElement;

    return {
      width: element.clientWidth,
      height: element.clientHeight,
      // left: element.clientLeft,
      // right: element.clientRight,
    };
  }
  // #endif
}

/**
 * 裁切字符串
 * @param param
 * @returns
 */
export function clipString({
  str = "",
  length = 30,
  suffix = "...",
  showSuffix = true,
}: {
  str: string;
  length?: number;
  suffix?: string;
  showSuffix?: boolean;
}) {
  return str.substring(0, length) + (showSuffix ? suffix : "");
}

export function unshiftPrefix(prefix = "", str = "") {
  return (str ? prefix : "") + str;
}

export function getCurrentPage() {
  const currentRoutes = getCurrentPages(); // 获取当前打开过的页面路由数组
  const currentRoute = currentRoutes[currentRoutes.length - 1]?.route || ""; //获取当前页面路由
  // @ts-ignore
  const currentParams = currentRoutes[currentRoutes.length - 1]?.options || {}; //获取路由参数
  // 拼接参数
  const params = qs.stringify(currentParams);
  const localRoute = currentRoute + unshiftPrefix("?", params);

  return {
    route: unshiftPrefix("/", currentRoute),
    params,
    currentParams,
    fullRoute: unshiftPrefix("/", localRoute),
  };
}

/**
 * 扁平化数组
 */
type flatArrPropType = {
  key: string;
  children: string;
  parent: string;
  sort?: string;
};

type flatArrArgType<T> = {
  props: flatArrPropType;
  arr: any[];
  parentVal: string | number;
  flatKeyObject: T;
  beforePush?: Fn;
  flatOptions?: any[];
};

export const flatArr = <T = Recordable<any>>({
  props,
  arr,
  parentVal,
  flatKeyObject,
  beforePush = () => {},
  flatOptions = [],
}: flatArrArgType<T>) => {
  const { key, children, parent } = props;

  const isMap = flatKeyObject instanceof Map;

  arr.forEach((item, index) => {
    if (
      !(isMap
        ? flatKeyObject.get(item[key])
        : flatKeyObject[item[key] as keyof typeof flatKeyObject])
    ) {
      const item_obj = item;
      item_obj[parent] = parentVal;

      if (beforePush) beforePush({ item: item_obj, index });

      flatOptions.push(item_obj);

      isMap
        ? flatKeyObject.set(item_obj[key], item_obj)
        : (flatKeyObject[item_obj[key] as keyof typeof flatKeyObject] = item_obj);

      if (item_obj[children]) {
        flatArr({
          props,
          arr: item_obj[children],
          parentVal: item_obj[key],
          flatKeyObject,
          beforePush,
          flatOptions,
        });
      }
    }
  });

  return {
    flatOptions,
    flatKeyObject,
  };
};

/**
 * 找到所有祖父父节点，补充完成为数组
 */
type fullArrArgType<T> = {
  value: string;
  flatKeyObject: T;
  parentKey: string;
  arr?: string[];
};

export const fullArr = <T = Recordable<any>>({
  value,
  flatKeyObject,
  parentKey,
  arr = [],
}: fullArrArgType<T>) => {
  if (value) {
    arr.unshift(value);

    const isMap = flatKeyObject instanceof Map;

    const parentVal = isMap ? flatKeyObject.get(value) : flatKeyObject[value];
    const _val = parentVal && parentVal[parentKey];

    if (_val) {
      fullArr({
        value: _val,
        flatKeyObject,
        parentKey,
        arr,
      });
    }
  }
  return arr;
};

/**
 * 找到所有祖父节点，补充完成为一个选项
 * @param props
 * @param vals
 * @param flatKeyObject
 * @param disabledParent
 * @param keepChildren  是否保留flatKeyObject中原本存在的children节点
 * @param isSort 生成选项时是否排序
 * @param assign
 * @returns {*[]}
 */
type fullValOptionsParams<T> = {
  props: flatArrPropType;
  vals: string[];
  flatKeyObject: T;
  afterPush?: Fn;
  keepChildren?: boolean;
  assign?: boolean;
};

export const fullValOptions = <T = Recordable<any>>({
  props,
  vals,
  flatKeyObject,
  afterPush = () => {},
  keepChildren = false,
  assign = false,
}: fullValOptionsParams<T>) => {
  const isMap = flatKeyObject instanceof Map;

  const { children, parent } = props;
  const _flatKeyObject = assign ? flatKeyObject : cloneDeep(flatKeyObject);

  const map: Recordable<any> = {};
  const valsSet = new Set<string>();
  let fullValsSet = new Set<string>();
  const options: any[] = [];

  vals.forEach((val) => {
    valsSet.add(val);
    fullValsSet = new Set([
      ...fullValsSet,
      ...fullArr({
        value: val,
        flatKeyObject: _flatKeyObject,
        parentKey: parent,
      }),
    ]);
  });

  fullValsSet.forEach((val) => {
    const mapObj = isMap ? (_flatKeyObject as Map<any, any>).get(val) : _flatKeyObject[val];

    // 有可能是父节点，有可能是子节点
    if (valsSet.has(val)) {
      if (keepChildren) {
        map[val] = mapObj;
      } else {
        delete mapObj[children];
        map[val] = mapObj;
      }
    } /*valsSet.has(val)若无，则表示该节点必定是父节点 */ else {
      map[val] = {
        ...mapObj,
        [children]: [],
      };
    }
  });

  fullValsSet.forEach((val, index) => {
    const pid = map[val][parent];
    if (map[pid]) {
      !isArray(map[pid][children]) && (map[pid][children] = []);

      map[pid][children].push(map[val]);

      if (afterPush) afterPush({ arr: map[pid][children], index });
    } else {
      options.push(map[val]);
    }
  });

  return options;
};

/**
 * 生成二维数组选项
 */
type flatDimensionalArgType<T> = {
  props: Pick<flatArrPropType, "children">;
  options: any[];
  flatOptions?: any[];
};

export const flatDimensionalOptions = <T = Recordable<any>>({
  props,
  options,
  flatOptions = [],
}: flatDimensionalArgType<T>) => {
  const { children } = props;

  flatOptions.push(options);
  const nextOptions = options?.[0]?.[children];

  if (nextOptions) {
    flatDimensionalOptions({ props, options: nextOptions, flatOptions });
  }

  return flatOptions;
};

export function extractFileNameAndExtension(url: string) {
  let allFileName = "";
  let fileName = "";
  let allFileExtension = "";
  let fileExtension = "";

  const regexString = "/(([^/?#]+)(\\.([a-zA-Z0-9]+)))(?:[?#]|$)";
  const regex = new RegExp(regexString);
  const match = url.match(regex);
  if (match) {
    const fileNameWithExtension = match;
    console.log(fileNameWithExtension);
    allFileName = fileNameWithExtension[1];
    fileName = fileNameWithExtension[2];
    allFileExtension = fileNameWithExtension[3];
    fileExtension = fileNameWithExtension[4];
  }
  return { allFileName, fileName, allFileExtension, fileExtension };
}

// rpx转px
export function rpxToPx(rpx: number) {
  const screenWidth = uni.getSystemInfoSync().screenWidth;
  return (screenWidth * Number.parseInt(rpx)) / 750;
}

// px转rpx
export function pxToRpx(px: number) {
  const screenWidth = uni.getSystemInfoSync().screenWidth;
  return (750 * Number.parseInt(px)) / screenWidth;
}
