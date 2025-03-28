import { getOpenId } from "@/service/api/user/login";
import { useUserStoreWithOut } from "@/store/modules/user";
import { extractFileNameAndExtension } from "./utils";
import type { ComponentInternalInstance } from "vue";

export const USER_DATA_PATH = "";

export function getWxOpenId(): ReturnPromiseType<typeof getOpenId> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: "weixin", //使用微信登录 必要的参数详情看官方文档
      success: async (res) => {
        if (res.code) {
          // 将微信的code传给后端，换取openid等
          const data = await getOpenId({ code: res.code });
          const userStore = useUserStoreWithOut();
          userStore.setSession(data);
          resolve(data);
        } else {
          uni.showToast({
            title: "初始化失败",
            icon: "error",
            duration: 2000,
          });

          console.log("初始化失败" + res.errMsg);

          reject(res.errMsg);
        }
      },
    });
  });
}

export function openDocument({ url }: { url: string }) {
  const suffix = url.match(/\.[a-zA-z0-9]+$/)?.[0] || "";

  // 微信公众平台-->开发管理-->开发设置-->downloadFile合法域名
  uni.downloadFile({
    url,
    header: {
      "content-type": "application/pdf",
      Authorization: "",
    },
    success: function (res) {
      const filePath = res.tempFilePath;
      uni.openDocument({
        filePath,
        showMenu: true,
        fileType: suffix,
        success: function (res) {},
      });
    },
    fail: function (res) {
      uni.showToast({
        icon: "none",
        title: "打开文件失败",
      });
    },
  });
}

export function delContract() {
  try {
    const file = uni.getFileSystemManager();
    file.readdir({
      dirPath: `${USER_DATA_PATH}`,
      success: (res) => {
        if (res.files.length > 2) {
          file.unlink({
            filePath: `${USER_DATA_PATH}/${res.files[0]}`,
            complete: (res) => {},
          });
        }
      },
    });
  } catch (error) {
    /* empty */
  }
}

export function compareVersion(v1: string, v2: string) {
  const _v1 = v1.split(".");
  const _v2 = v2.split(".");
  const len = Math.max(_v1.length, _v2.length);

  while (_v1.length < len) {
    _v1.push("0");
  }
  while (_v2.length < len) {
    _v2.push("0");
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(_v1[i]);
    const num2 = parseInt(_v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
}

export function getVersion() {
  const version = uni.getSystemInfoSync().SDKVersion || "";
  console.log("当前版本号version", version);
  if (compareVersion(version, "2.21.2") >= 0) {
    return true;
  }
  uni.showModal({
    title: "提示",
    content: "当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。",
  });
  return false;
}

export async function getPhoneNumber(e: any): Promise<string> {
  return new Promise((resolve, reject) => {
    // 判断版本号
    if (getVersion()) {
      // 新版本不需要
      // 判断是否已经获取过openid才调用
      // const openid = store.getState().user.openid;

      // if (!openid) await wxLogin();

      const { errMsg, code } = e.detail;

      if (errMsg === "getPhoneNumber:ok") {
        console.log("获取手机号使用的code =====>>>>>>", code);
        if (code) {
          resolve(code);
        } else {
          reject();
        }
      } else {
        console.log("取消授权！");
        uni.showToast({
          title: "取消授权",
          icon: "error",
        });
      }
    }
  });
}

export function getFileSize(filePath: string) {
  return new Promise((resolve) => {
    uni.getFileSystemManager().getFileInfo({
      filePath: filePath,
      success: function (res) {
        // console.log("res:", res);
        const size = res.size;
        resolve(size);
        // console.log("size:", size);
      },
    });
  });
}

export function getMapLocation() {
  return new Promise((resolve) => {
    uni.authorize({
      scope: "scope.userLocation",
      complete: function (res) {
        uni.chooseLocation({
          success(str) {
            console.log("str:", str);
            const key = "TZKBZ-LGA6K-SSAJ3-AF3XK-RBS67-FEBVX";
            // 发送请求通过经纬度反查地址信息
            const getAddressUrl = `https://apis.map.qq.com/ws/geocoder/v1/?location=${str.latitude},${str.longitude}&key=${key}&get_poi=1`;
            uni.request({
              url: getAddressUrl,
              // todo ts
              success: function (result: any) {
                console.log("result:", result);

                const province = result.data.result.address_component.province;
                const city = result.data.result.address_component.city;
                const district = result.data.result.address_component.district;
                const address = result.data.result.formatted_addresses.recommend;
                console.log("省市县:" + province + city + district);
                console.log("地址：" + address);
                console.log("input[2].val:", [province, city, district]);

                console.log("input[3].val:", address);
              },
            });
          },
        });
      },
    });
  });
}

export function copyText(text: string) {
  uni.setClipboardData({
    data: text,
    success: function () {
      uni.showToast({
        title: "复制成功",
      });
    },
  });
}

export function getDomRef(ident: string, that?: ComponentInternalInstance | null) {
  const instance = that || getCurrentInstance();
  // console.log("instance:", instance);
  const query = uni.createSelectorQuery().in(instance);

  return query.select(ident);
}

export function getBoundingClientRect(node: UniApp.NodesRef): Promise<UniApp.NodeInfo> {
  return new Promise((resolve) => {
    node
      .boundingClientRect(async (data) => {
        // console.log("data:", data);

        resolve(data as UniApp.NodeInfo);
      })
      .exec();
  });
}

export function getCompatibleBoundingClientRect() {}

export function judgeWriteAlbumAuthorize() {
  return new Promise((resolve, reject) => {
    uni.getSetting({
      success: (res) => {
        if (res.authSetting["scope.writePhotosAlbum"]) {
          //验证用户是否授权可以访问相册
          resolve(true);
        } else {
          uni.authorize({
            //重新发起获取授权
            scope: "scope.writePhotosAlbum",
            success: () => {
              resolve(true);
            },
            fail: (err) => {
              console.log("err:", err);
              uni.showModal({
                title: "是否授权保存到相册",
                content: "请确认授权，否则无法保存到相册",
                success: (res) => {
                  if (res.confirm) {
                    uni.openSetting();
                  }
                },
              });
            },
          });
        }
      },
    });
  });
}

export function clearStorage({
  type = "directory",
  path = "",
}: {
  type?: "directory" | "file";
  path: string;
}) {
  return new Promise((resolve, reject) => {
    if (type === "file") {
      // 根据文件路径清除文件
      try {
        const fs = uni.getFileSystemManager();
        const res = fs.unlinkSync(path);
        console.log("success:", res);
      } catch (err) {
        console.log("err:", err);
      }
      resolve(true);
    } else {
      // 根据文件目录清除文件
      try {
        const fs = uni.getFileSystemManager();
        fs.readdir({
          dirPath: `${path}`,
          success: async (res) => {
            console.log("readdir:", res);
            await Promise.allSettled(
              res.files.map((item) => {
                try {
                  const fs = uni.getFileSystemManager();
                  const res = fs.unlinkSync(`${path}/${item}`);
                  console.log("success:", `${path}/${item}`, res);
                  return Promise.resolve();
                } catch (err) {
                  console.log("err:", err);
                  return Promise.reject();
                }
              })
            );

            resolve(true);
          },
          fail: (err) => {
            console.log("readdir:", err);
            resolve(true);
          },
        });
      } catch (err) {
        console.log("err:", err);
        resolve(true);
      }
    }
  });
}

export function getDownloadPath({
  url = "",
  type = "url",
  filename,
  onProgress = () => {},
}: {
  url: string;
  filename?: string | number;
  type?: "url" | "base64" | "video" | "music";
  onProgress?: (progress: number) => void;
}): Promise<string> {
  const fileNameAndExtension = extractFileNameAndExtension(url);

  filename = filename || fileNameAndExtension.fileName || Math.random();

  return new Promise((resolve) => {
    clearStorage({
      path: wx.env.USER_DATA_PATH,
    }).then(() => {
      if (type === "video" || type === "music" || type === "url") {
        let filePath = "";

        if (type === "video") {
          // @ts-ignore
          filePath =
            wx.env.USER_DATA_PATH +
            "/video" +
            filename +
            `${fileNameAndExtension.allFileExtension || ".mp4"}`;
        } else if (type === "music") {
          // @ts-ignore
          filePath =
            wx.env.USER_DATA_PATH +
            "/music" +
            filename +
            `${fileNameAndExtension.allFileExtension || ".mp3"}`;
        } else if (type === "url") {
          // @ts-ignore
          filePath =
            wx.env.USER_DATA_PATH +
            "/pic" +
            filename +
            `${fileNameAndExtension.allFileExtension || ".png"}`;

          // 或者 uni.getImageInfo({ url, success: () => {} })
        }

        const downloadTask = uni.downloadFile({
          url,
          filePath,
          timeout: 6000000,
          success: (res) => {
            resolve(filePath);
          },
          fail: (err) => {
            console.log("err:", err);
            uni.showToast({
              title: "保存失败",
              icon: "error",
            });
          },
        });

        // 进度条
        downloadTask.onProgressUpdate((res) => {
          onProgress(res.progress);
        });
      } else if (type === "base64") {
        const data = url.slice(22); // 注意这里,截掉data:image/png;base64
        // @ts-ignore
        const filePath = wx.env.USER_DATA_PATH + "/pic" + filename + ".png";
        // 文件写入临时目录
        uni.getFileSystemManager().writeFile({
          filePath,
          data,
          encoding: "base64",
          success: (res) => {
            onProgress(100);
            resolve(filePath);
          },
          fail: (err) => {
            console.log("err:", err);
            uni.showToast({
              title: "保存失败",
              icon: "error",
            });
          },
        });
      }
    });
  });
}

export function saveImage({
  url = "",
  type = "url",
  isShowMessage = true,
  onProgress = () => {},
}: {
  url: string;
  type?: "url" | "base64";
  isShowMessage?: boolean;
  onProgress?: (progress: number) => void;
}) {
  return new Promise((resolve, reject) => {
    judgeWriteAlbumAuthorize().then(async () => {
      // 下载文件不支持网络路径，需要先将网络路径转换为
      const filePath = await getDownloadPath({ url, type, onProgress });

      uni.saveImageToPhotosAlbum({
        filePath,
        success: (res) => {
          isShowMessage &&
            uni.showToast({
              title: "保存成功",
            });
          resolve(true);
        },
        fail: (err) => {
          console.log("err:", err);
          isShowMessage &&
            uni.showToast({
              title: "保存失败",
              icon: "error",
            });
          resolve(false);
        },
      });
    });
  });
}

export async function saveMusic({
  url,
  filename,
  onProgress = () => {},
}: {
  url: string;
  filename?: string;
  onProgress?: (progress: number) => void;
}) {
  // 下载文件不支持网络路径，需要先将网络路径转换为
  const filePath = await getDownloadPath({ url, type: "music", filename, onProgress });

  uni.showToast({
    icon: "none",
    title: `已保存在${filePath}路径下`,
    duration: 2000,
  });
}

export function saveVideo({
  url,
  filename,
  isShowMessage = true,
  onProgress = () => {},
}: {
  url: string;
  filename?: string;
  isShowMessage?: boolean;
  onProgress?: (progress: number) => void;
}) {
  return new Promise((resolve, reject) => {
    judgeWriteAlbumAuthorize().then(async () => {
      // 下载文件不支持网络路径，需要先将网络路径转换为
      const filePath = await getDownloadPath({ url, type: "video", filename, onProgress });

      uni.saveVideoToPhotosAlbum({
        filePath,
        success: (res) => {
          isShowMessage &&
            uni.showToast({
              title: "保存成功",
            });
          resolve(true);
        },
        fail: (err) => {
          console.log("err:", err);
          isShowMessage &&
            uni.showToast({
              title: "保存失败",
              icon: "error",
            });

          reject(false);
        },
      });
    });
  });
}

export function wxPay({
  provider = "wxpay",
  timeStamp,
  nonceStr,
  package: _package,
  signType,
  paySign,
  orderInfo,
}: CustomPartial<UniNamespace.RequestPaymentOptions, "provider">) {
  // 调起微信支付
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider, // 服务提提供商
      timeStamp, // 时间戳
      nonceStr, // 随机字符串
      package: _package,
      signType, // 签名算法
      paySign, // 签名
      orderInfo,
      success: function (res) {
        resolve(res);
      },
      fail: function (err) {
        uni.showToast({
          title: "支付失败",
          icon: "none",
        });
        reject(err);
      },
    });
  });
}

export function chooseImage({
  count = 1,
  sizeType = ["original"],
  sourceType = ["album", "camera"],
}: Omit<UniNamespace.ChooseImageOptions, "success" | "fail" | "complete">): Promise<string[]> {
  return new Promise((resovle, reject) => {
    uni.chooseImage({
      count,
      sizeType,
      sourceType,
      success: (res) => {
        if (res.tempFilePaths?.length > 0) {
          resovle(res.tempFilePaths as string[]);
        }
      },
      fail: (err) => {
        uni.showToast({
          title: "上传失败",
          icon: "none",
        });
        reject(err);
      },
    });
  });
}
