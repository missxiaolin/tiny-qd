### 初始化开发环境

初始化配置安装rollup

这里我们一切从简，只借助rollup模块化和打包的能力~，不进行过多的rollup配置， 把精力放到编写微前端的核心逻辑上~~~

~~~
npm init -y
npm install rollup rollup-plugin-serve
~~~

~~~
import serve from 'rollup-plugin-serve'
export default {
    input:'./src/single-spa.js',
    output:{
        file:'./lib/umd/single-spa.js',
        format:"umd",
        name:'singleSpa',
        sourcemap:true
    },
    plugins:[
        serve({
            openPage:'/index.html',
            contentBase:'',
            port:3000
        })
    ]
}
~~~

### SignleSpa的使用方式

~~~
singleSpa.registerApplication('app1',
    async () => {
        return {
            bootstrap:async()=>{
                console.log('应用启动');
            },
            mount:async()=>{
                console.log('应用挂载');
            },
            unmount:async()=>{
                console.log('应用卸载')
            }
        }
    },
    location => location.hash.startsWith('#/app1'), 
    { store: { name: 'zf' } }
);
singleSpa.start();
~~~

- 参数分别是:
- appName: 当前注册应用的名字
- loadApp: 加载函数(必须返回的是promise)，返回的结果必须包含bootstrap、mount和 unmount做为接入协议
- activityWhen: 满足条件时调用loadApp方法
- customProps:自定义属性可用于父子应用通信

#### 根据使用方式编写源码

~~~
const apps = [];
export function registerApplication(appName,loadApp,activeWhen,customProps){
    apps.push({
        name:appName,
        loadApp,
        activeWhen,
        customProps,
    });
}
export function start(){
    // todo...
}
export {registerApplication} from './applications/app.js';
export {start} from './start.js';
~~~

### 应用加载状态 - 生命周期

<img scr="http://missxiaolin.com/lifecycle.fb2af586.png" />

~~~
export const NOT_LOADED = "NOT_LOADED"; // 没有加载过
export const LOADING_SOURCE_CODE = "LOADING_SOURCE_CODE"; // 加载原代码
export const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED"; // 没有启动
export const BOOTSTRAPPING = "BOOTSTRAPPING"; // 启动中
export const NOT_MOUNTED = "NOT_MOUNTED"; // 没有挂载
export const MOUNTING = "MOUNTING"; // 挂载中
export const MOUNTED = "MOUNTED"; // 挂载完毕
export const UPDATING = "UPDATING"; // 更新中
export const UNMOUNTING = "UNMOUNTING"; // 卸载中
export const UNLOADING = "UNLOADING"; // 没有加载中
export const LOAD_ERROR = "LOAD_ERROR"; // 加载失败
export const SKIP_BECAUSE_BROKEN = "SKIP_BECAUSE_BROKEN"; // 运行出错

export function isActive(app) { // 当前app是否已经挂载
    return app.status === MOUNTED;
}
export function shouldBeActive(app) { // 当前app是否应该激活
    return app.activeWhen(window.location);
}
~~~

#### 标注应用状态

~~~
import { NOT_LOADED } from './app.helpers';
apps.push({
    name: appName,
    loadApp,
    activeWhen,
    customProps,
    status: NOT_LOADED // 默认应用为未加载
});
~~~

### 加载应用并启动

reroute方法就是比较核心的一个方法啦~，当注册应用时reroute的功能是加载子应用，当调用start方法时是挂载应用。

~~~
import {reroute} from '../navigation/reroute.js';
export function registerApplication(appName, loadApp, activeWhen, customProps) {
	// ...
    reroute(); // 这个是加载应用
}
~~~

~~~
import {reroute} from './navigation/reroute'
export let started = false;
export function start(){
    started = true;
    reroute(); // 这个是启动应用
}
~~~

### reroute方法

这个方法是整个Single-SPA中最核心的方法,当路由切换时也会执行该逻辑

#### 1).获取对应状态的app

~~~
import {getAppChanges} from '../applications/apps';
export function reroute() {
    const {
        appsToLoad, // 获取要去加载的app
        appsToMount, // 获取要被挂载的
        appsToUnmount // 获取要被卸载的
    } = getAppChanges();
}
~~~

~~~
export function getAppChanges(){
    const appsToUnmount = [];
    const appsToLoad = [];
    const appsToMount = [];
    apps.forEach(app => {
        const appShouldBeActive = app.status !== SKIP_BECAUSE_BROKEN && shouldBeActive(app);
        switch (app.status) { // toLoad
            case STATUS.NOT_LOADED:
            case STATUS.LOADING_SOURCE_CODE:
                if(appShouldBeActive){
                    appsToLoad.push(app);
                }
                break;
            case STATUS.NOT_BOOTSTRAPPED: // toMount
            case STATUS.NOT_MOUNTED:
                if(appShouldBeActive){
                    appsToMount.push(app);
                }
                break
            case STATUS.MOUNTED: // toUnmount
                if(!appShouldBeActive){
                    appsToUnmount.push(app);
                }
        }
    });
    return {appsToUnmount,appsToLoad,appsToMount}
}
~~~

根据状态筛选对应的应用

#### 2). 预加载应用

当用户没有调用start方法时，我们默认会先进行应用的加载

~~~
if(started){
     return performAppChanges();
}else{
     return loadApps();
}
async function performAppChanges(){
    // 启动逻辑
}
async function loadApps(){
    // 预加载应用
}
~~~

~~~
import {toLoadPromise} from '../lifecycles/load';
async function loadApps(){
	// 预加载应用
	await Promise.all(appsToLoad.map(toLoadPromise));
}
~~~

~~~
import { LOADING_SOURCE_CODE, NOT_BOOTSTRAPPED } from "../applications/app.helpers";
function flattenFnArray(fns) { // 将函数通过then链连接起来
    fns = Array.isArray(fns) ? fns : [fns];
    return function(props) {
        return fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
    }
}
export async function toLoadPromise(app) { 
    app.status = LOADING_SOURCE_CODE;
    let { bootstrap, mount, unmount } = await app.loadApp(app.customProps); // 调用load函数拿到接入协议
    app.status = NOT_BOOTSTRAPPED;
    app.bootstrap = flattenFnArray(bootstrap);
    app.mount = flattenFnArray(mount);
    app.unmount = flattenFnArray(unmount);
    return app;
}
~~~

用户load函数返回的bootstrap、mount、unmount可能是数组形式，我们将这些函数进行组合

#### 3). app运转逻辑

路由切换时卸载不需要的应用

~~~
import {toUnmountPromise} from '../lifecycles/unmount';
import {toUnloadPromise} from '../lifecycles/unload';
async function performAppChanges(){
        // 卸载不需要的应用，挂载需要的应用
    let unmountPromises = appsToUnmount.map(toUnmountPromise).map(unmountPromise=>unmountPromise.then(toUnloadPromise));
}
~~~

这里为了更加直观，我就采用最简单的方法来实现，调用钩子，并修改应用状态

~~~
import { UNMOUNTING, NOT_MOUNTED ,MOUNTED} from "../applications/app.helpers";
export async function toUnmountPromise(app){
    if(app.status != MOUNTED){
        return app;
    }
    app.status = UNMOUNTING;
    await app.unmount(app);
    app.status = NOT_MOUNTED;
    return app;
}
~~~

~~~
import { NOT_LOADED, UNLOADING } from "../applications/app.helpers";
const appsToUnload = {};
export async function toUnloadPromise(app){
    if(!appsToUnload[app.name]){
        return app;
    }
    app.status = UNLOADING;
    delete app.bootstrap;
    delete app.mount;
    delete app.unmount;
    app.status = NOT_LOADED;
}
~~~

匹配到没有加载过的应用 (加载=> 启动 => 挂载)

~~~
const loadThenMountPromises = appsToLoad.map(async (app) => {
    app = await toLoadPromise(app);
    app = await toBootstrapPromise(app);
    return toMountPromise(app);
});
~~~

这里需要注意一下，可能还有没加载完的应用这里不要进行重复加载

~~~
export async function toLoadPromise(app) {
    if(app.loadPromise){
        return app.loadPromise;
    }
    if (app.status !== NOT_LOADED) {
        return app;
    }
    app.status = LOADING_SOURCE_CODE;
    return (app.loadPromise = Promise.resolve().then(async ()=>{
        let { bootstrap, mount, unmount } = await app.loadApp(app.customProps);

        app.status = NOT_BOOTSTRAPPED;
        app.bootstrap = flattenFnArray(bootstrap);
        app.mount = flattenFnArray(mount);
        app.unmount = flattenFnArray(unmount);
        delete app.loadPromise;
        return app;
    }));
}
~~~

~~~
import { BOOTSTRAPPING, NOT_MOUNTED,NOT_BOOTSTRAPPED } from "../applications/app.helpers.js";
export async function toBootstrapPromise(app) {
    if(app.status !== NOT_BOOTSTRAPPED){
        return app;
    }
    app.status = BOOTSTRAPPING;
    await app.bootstrap(app.customProps);
    app.status = NOT_MOUNTED;
    return app;
}
~~~

~~~
import { MOUNTED, MOUNTING,NOT_MOUNTED } from "../applications/app.helpers.js";
export async function toMountPromise(app) {
    if (app.status !== NOT_MOUNTED) {
        return app;
    }
    app.status = MOUNTING;
    await app.mount();
    app.status = MOUNTED;
    return app;
}
~~~

已经加载过了的应用 (启动 => 挂载)

~~~
const mountPromises = appsToMount.map(async (app) => {
    app = await toBootstrapPromise(app);
    return toMountPromise(app);
});
await Promise.all(unmountPromises); // 等待先卸载完成
await Promise.all([...loadThenMountPromises,...mountPromises]); 
~~~

### 路由劫持

~~~
import { reroute } from "./reroute.js";
export const routingEventsListeningTo = ["hashchange", "popstate"];
const capturedEventListeners = { // 存储hashchang和popstate注册的方法
    hashchange: [],
    popstate: []
}
function urlReroute() {
    reroute([], arguments)
}
// 劫持路由变化
window.addEventListener('hashchange', urlReroute); 
window.addEventListener('popstate', urlReroute);
// 重写addEventListener方法
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

window.addEventListener = function(eventName, fn) {
    if (routingEventsListeningTo.indexOf(eventName) >= 0 && !capturedEventListeners[eventName].some(listener => listener == fn)) {
        capturedEventListeners[eventName].push(fn);
        return;
    }
    return originalAddEventListener.apply(this, arguments);
}
window.removeEventListener = function(eventName, listenerFn) {
    if (routingEventsListeningTo.indexOf(eventName) >= 0) {
        capturedEventListeners[eventName] = capturedEventListeners[
            eventName
        ].filter((fn) => fn !== listenerFn);
        return;
    }
    return originalRemoveEventListener.apply(this, arguments);
};
function patchedUpdateState(updateState, methodName) {
    return function() {
        const urlBefore = window.location.href;
        const result = updateState.apply(this, arguments);
        const urlAfter = window.location.href;
        if (urlBefore !== urlAfter) {
            urlReroute(new PopStateEvent('popstate', { state }));
        }
        return result;
    }
}
// 重写pushState 和 repalceState方法
window.history.pushState = patchedUpdateState(window.history.pushState, 'pushState');
window.history.replaceState = patchedUpdateState(window.history.replaceState, 'replaceState');

// 在子应用加载完毕后调用此方法，执行拦截的逻辑（保证子应用加载完后执行）
export function callCapturedEventListeners(eventArguments) {
    if (eventArguments) {
        const eventType = eventArguments[0].type;
        if (routingEventsListeningTo.indexOf(eventType) >= 0) {
            capturedEventListeners[eventType].forEach((listener) => {
                listener.apply(this, eventArguments);
            });
        }
    }
}
~~~

为了保证应用加载逻辑最先被处理，我们对路由的一系列的方法进行重写，确保加载应用的逻辑最先被调用，其次手动派发事件

### 加载应用

~~~
await Promise.all(appsToLoad.map(toLoadPromise)); // 加载后触发路由方法
callCapturedEventListeners(eventArguments);


await Promise.all(unmountPromises); // 等待先卸载完成后触发路由方法
callCapturedEventListeners(eventArguments);
~~~

校验当前是否需要被激活,在进行启动和挂载

~~~
async function tryToBootstrapAndMount(app) {
    if (shouldBeActive(app)) {
        app = await toBootstrapPromise(app);
        return toMountPromise(app);
    }
    return app;
}
~~~

### 批处理加载等待

<img src="http://missxiaolin.com/flow.7557f3a1.png" />

~~~
export function reroute(pendings = [], eventArguments) {
    if (appChangeUnderway) {
        return new Promise((resolve, reject) => {
            peopleWaitingOnAppChange.push({
                resolve,
                reject,
                eventArguments
            })
        });
    }
    // ...
    if (started) {
        appChangeUnderway = true;
        return performAppChanges();
    }
    async function performAppChanges() {
        // ...
        finishUpAndReturn(); // 完成后批量处理在队列中的任务
    }
    function finishUpAndReturn(){
        appChangeUnderway = false;
        if(peopleWaitingOnAppChange.length > 0){
            const nextPendingPromises = peopleWaitingOnAppChange;
            peopleWaitingOnAppChange = [];
            reroute(nextPendingPromises)
        }
    }
}
~~~

这里的思路和Vue.nextTick一样，如果当前应用正在加载时，并且用户频繁切换路由。我们会将此时的reroute方法暂存起来，等待当前应用加载完毕后再次触发reroute渲染应用，从而节约性能!

最终别忘了，完成一轮应用加载时，需要手动触发用户注册的路由事件！

~~~
callAllEventListeners();
 function callAllEventListeners() {
     pendingPromises.forEach((pendingPromise) => {
     	callCapturedEventListeners(pendingPromise.eventArguments);
     });
     callCapturedEventListeners(eventArguments);
 }
~~~

既然做了微前端，再来说下既然用了微前端css 隔离 和 js 沙箱如何处理

### CSS 隔离方案

子应用之间样式隔离:

- Dynamic Stylesheet 动态样式表，当应用切换时移除老应用样式，添加新应用样式

主应用和子应用之间的样式隔离:

- BEM (Block Element Modifier)约定项目前缀
- CSS-Module 打包时生成不冲突的选择器名
- Shadow DOM 真正意义上的隔离（官网称影子dom）
- css-in-js

### js 沙箱

当运行子应用时应该跑在内部沙箱环境中 

<img src="http://missxiaolin.com/js-sx.png" />

当运行子应用时泡在内部沙箱环境中

- 快照沙箱，在应用沙箱挂载或卸载时记录快照，在切换时依据快照恢复环境 (无法支持多实 例)
- Proxy 代理沙箱,不影响全局环境

1).快照沙箱

- 1.激活时将当前window属性进行快照处理
- 2.失活时用快照中的内容和当前window属性比对
- 3.如果属性发生变化保存到 modifyPropsMap 中，并用快照还原window属性
- 4.在次激活时，再次进行快照，并用上次修改的结果还原window

~~~
class SnapshotSandbox {
    constructor() {
        this.proxy = window;
        this.modifyPropsMap = {}; // 修改了那些属性 this.active();
        active() {
            this.windowSnapshot = {}; // window对象的快照 for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                // 将window上的属性进行拍照 this.windowSnapshot[prop] = window[prop];
            }
        }
        Object.keys(this.modifyPropsMap).forEach(p => {
            window[p] = this.modifyPropsMap[p];
        });
    }
    inactive() {
        for (const prop in window) { // diff 差异
            if (window.hasOwnProperty(prop)) {
                // 将上次拍照的结果和本次window属性做对比
                if (window[prop] !== this.windowSnapshot[prop]) {
                    // 保存修改后的结果 this.modifyPropsMap[prop] = window[prop]; // 还原window
                    window[prop] = this.windowSnapshot[prop];
                }
            }
        }
    }
}
 
 
let sandbox = new SnapshotSandbox();
((window) => {
    window.a = 1;
    window.b = 2;
    window.c = 3
    console.log(a, b, c)
    sandbox.inactive();
    console.log(a, b, c)
})(sandbox.proxy);
~~~

快照沙箱只能针对单实例应用场景,如果是多个实例同时挂载的情况则无法解决，只能通过 proxy代理沙箱来实现

2).Proxy 代理沙箱

~~~
class ProxySandbox {
    constructor() {
        const rawWindow = window;
        const fakeWindow = {}
        const proxy = new Proxy(fakeWindow, {
            set(target, p, value) {
                target[p] = value;
                return true
            },
            get(target, p) {
                return target[p] || rawWindow[p];
            }
        });
        this.proxy = proxy
    }
}
 
 
let sandbox1 = new ProxySandbox();
let sandbox2 = new ProxySandbox();
window.a = 1;
((window) => {
    window.a = 'hello';
    console.log(window.a)
})(sandbox1.proxy);
((window) => {
    window.a = 'world';
    console.log(window.a)
})(sandbox2.proxy);
~~~

每个应用都创建一个proxy来代理window，好处是每个应用都是相对独立，不需要直接更 改全局window属性!


