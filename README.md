# app-cascader-popup

本组件仿照element-plus的级联选择器实现，具体的props可参照（另外新增`dominant`属性，具体表现是：当`checkStrictly === false` 且 `dominant === true`时，子级全部勾选的情况下，父级的值可直接涵盖子级的值，无需同`element-plus`一样父级值与子级值一同返回）

[element-plus级联选择器]: https://element-plus.org/zh-CN/component/cascader.html

本组件基于tailwindcss实现 ，若用户使用，请在项目中集成tailwindcss。关于组件中的`tm-button`为自定义组件，用户可自行实现按钮。`app-popup`组件基于`thorui-uni`的`tui-bottom-popup`用户需自行安装。另外一些如`@shuzhi-utils/is`已上传npm官网，用户可根据提示自行安装。

> 此代码为工作之余开发的组件代码，仅作为用户的参考代码。如发现bug/建议可提issues，但本人并不一定有时间维护。

效果如下图展示：

![示例](https://raw.githubusercontent.com/Penguin-Lin/typora-img/main/img/示例.jpg)