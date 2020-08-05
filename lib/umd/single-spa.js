(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singleSpa = {}));
}(this, (function (exports) { 'use strict';

    // 描述应用的整个状态
    const NOT_LOADED = 'NOT_LOADED';// 应用初始状态
    const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE'; // 加载资源
    const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'; // 还没有调用bootstrap方法
    const BOOTSTRAPPING = 'BOOTSTRAPPING'; // 启动中
    const NOT_MOUNTED = 'NOT_MOUNTED';// 没有调用mount方法
    const MOUNTED = 'MOUNTED'; // 挂载完毕
    // 当前这个应用是否要被激活
    function shouldBeActive(app) { //如果返回true 那么应用应该就开始初始化等一系列操作
        return app.activeWhen(window.location)
    }

    let started = false;
    function start() {
        // 挂载应用
        started = true;
        reroute(); // 除了去加载应用，还需要去挂载应用
    }

    /**
     * 数组函数
     * @param {*} fns 
     */
    function flattenFnArray(fns) {
        fns = Array.isArray(fns) ? fns : [fns];
        // 通过promise链来链式调用  多个方法组合成一个方法
        return (props) => fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
    }


    async function toLoadPromise(app) {
        if (app.loadPromise) {
            return app.loadPromise; //缓存机制
        }
        return (app.loadPromise = Promise.resolve().then(async () => {
            app.status = LOADING_SOURCE_CODE;
            let { bootstrap, mount, unmount } = await app.loadApp(app.customProps);
            app.status = NOT_BOOTSTRAPPED; // 没有调用bootstrap方法
            // 我希望将多个promise组合在一起 compose
            app.bootstrap = flattenFnArray(bootstrap);
            app.mount = flattenFnArray(mount);
            app.unmount = flattenFnArray(unmount);
            delete app.loadPromise;
            return app;
        }))
    }

    // 核心应用处理方法
    function reroute() {
        //  需要获取要加载的应用
        //  需要获取要被挂载的应用
        //  哪些应用需要被卸载
        const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges();
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
            console.log(apps);
        }
        async function performAppChanges() { // 根据路径来装载应用
            
        }
    }


    // 这个流程是用于初始化操作的，我们还需要 当路径切换时重新加载应用
    // 重写路由相关的方法

    /**
     * 微前端注册
     * @param {*} appName 应用名称
     * @param {*} loadApp 加载的应用
     * @param {*} activeWhen 当激活时会调用
     * @param {*} customProps 自定义参数
     */

    // 用来存放所有的应用
    const apps = [];

    // 维护应用所有状态 状态机
    function registerApplication(appName, loadApp, activeWhen, customProps) {
        apps.push({ // 注册应用
            name: appName,
            loadApp,
            activeWhen,
            customProps,
            status: NOT_LOADED
        });
        reroute(); // 加载应用
        // vue 一系列的生命周期
    }

    function getAppChanges() {
        const appsToUnmount = []; // 要卸载的app
        const appsToLoad = []; // 要加载的app
        const appsToMount = []; // 需要挂载的
        apps.forEach(app => {
            // 需不需要被加载
            const appSholdBeActive = shouldBeActive(app);
            switch (app.status) { // toLoad
                case NOT_LOADED:
                case LOADING_SOURCE_CODE:
                    if (appSholdBeActive) {// 做判断了
                        appsToLoad.push(app);
                    }
                    break
                case NOT_BOOTSTRAPPED: // toMount
                case BOOTSTRAPPING:
                case NOT_MOUNTED:
                    if (appSholdBeActive) {
                        appsToMount.push(app);
                    }
                    break;
                case MOUNTED:  // unmount
                    if (!appSholdBeActive) {
                        appsToUnmount.push(app);
                    }
            }
        });
        return { appsToUnmount, appsToLoad, appsToMount }
    }

    exports.registerApplication = registerApplication;
    exports.start = start;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=single-spa.js.map
