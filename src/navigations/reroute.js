import { started } from '../start.js'
import { getAppChanges } from "../application/app.js";
import { toLoadPromise } from '../lifecycles/load.js';


// 核心应用处理方法
export function reroute() {
    //  需要获取要加载的应用
    //  需要获取要被挂载的应用
    //  哪些应用需要被卸载
    const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges()
    // start方法调用时是同步的，但是加载流程是异步饿
    if (started) {
        // app装载
        return performAppChanges();
    } else {
        // 注册应用时 需要预先加载
        return loadApps()
    }
    async function loadApps() { // 预加载应用
        let apps = await Promise.all(appsToLoad.map(toLoadPromise)); // 就是获取到bootstrap,mount和unmount方法放到app上
        console.log(apps)
    }
    async function performAppChanges() { // 根据路径来装载应用
        
    }
}


// 这个流程是用于初始化操作的，我们还需要 当路径切换时重新加载应用
// 重写路由相关的方法