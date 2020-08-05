
/**
 * 微前端注册
 * @param {*} appName 应用名称
 * @param {*} loadApp 加载的应用
 * @param {*} activeWhen 当激活时会调用
 * @param {*} customProps 自定义参数
 */

// 用来存放所有的应用
const apps = []

// 维护应用所有状态 状态机
export function registerApplication(appName, loadApp, activeWhen, customProps) {
    apps.push({ // 注册应用
        name: appName,
        loadApp,
        activeWhen,
        customProps
    })
    // vue 一系列的生命周期
}