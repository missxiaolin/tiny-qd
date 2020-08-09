import { NOT_LOADED, SKIP_BECAUSE_BROKEN, shouldBeActive, LOADING_SOURCE_CODE, NOT_BOOTSTRAPPED, NOT_MOUNTED, BOOTSTRAPPING, MOUNTED } from "./app.helpers"

import { reroute } from '../navigations/reroute'

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
        customProps,
        status: NOT_LOADED
    })
    reroute() // 加载应用
    // vue 一系列的生命周期
}

export function getAppChanges() {
    const appsToUnmount = [] // 要卸载的app
    const appsToLoad = [] // 要加载的app
    const appsToMount = [] // 需要挂载的
    apps.forEach(app => {
        // 需不需要被加载
        const appSholdBeActive = shouldBeActive(app)
        switch (app.status) { // toLoad
            case NOT_LOADED:
            case LOADING_SOURCE_CODE:
                if (appSholdBeActive) {// 做判断了
                    appsToLoad.push(app)
                }
                break
            case NOT_BOOTSTRAPPED: // toMount
            case BOOTSTRAPPING:
            case NOT_MOUNTED:
                if (appSholdBeActive) {
                    appsToMount.push(app)
                }
                break;
            case MOUNTED:  // unmount
                if (!appSholdBeActive) {
                    appsToUnmount.push(app)
                }
        }
    });
    return { appsToUnmount, appsToLoad, appsToMount }
}