(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@babel/polyfill'), require('css.escape')) :
    typeof define === 'function' && define.amd ? define(['exports', '@babel/polyfill', 'css.escape'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singleSpa = {}));
}(this, (function (exports) { 'use strict';

    // 描述应用的整个状态
    const NOT_LOADED = 'NOT_LOADED'; // 应用初始状态

    const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE'; // 加载资源

    const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'; // 还没有调用bootstrap方法

    const BOOTSTRAPPING = 'BOOTSTRAPPING'; // 启动中

    const NOT_MOUNTED = 'NOT_MOUNTED'; // 没有调用mount方法

    const MOUNTING = 'MOUNTING'; // 正在挂载中

    const MOUNTED = 'MOUNTED'; // 挂载完毕

    const UNMOUNTING = 'UNMOUNTING'; // 解除挂载

    function shouldBeActive(app) {
      //如果返回true 那么应用应该就开始初始化等一系列操作
      return app.activeWhen(window.location);
    }

    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }

      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }

    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
            args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);

          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }

          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }

          _next(undefined);
        });
      };
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
        keys.push.apply(keys, symbols);
      }

      return keys;
    }

    function _objectSpread2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};

        if (i % 2) {
          ownKeys(Object(source), true).forEach(function (key) {
            _defineProperty(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys(Object(source)).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
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
      fns = Array.isArray(fns) ? fns : [fns]; // 通过promise链来链式调用  多个方法组合成一个方法

      return props => fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
    }
    /**
     * @param {*} app 
     */


    function toLoadPromise(_x) {
      return _toLoadPromise.apply(this, arguments);
    }

    function _toLoadPromise() {
      _toLoadPromise = _asyncToGenerator(function* (app) {
        if (app.loadPromise) {
          return app.loadPromise; //缓存机制
        }

        return app.loadPromise = Promise.resolve().then( /*#__PURE__*/_asyncToGenerator(function* () {
          app.status = LOADING_SOURCE_CODE;
          let {
            bootstrap,
            mount,
            unmount
          } = yield app.loadApp(app.customProps);
          app.status = NOT_BOOTSTRAPPED; // 没有调用bootstrap方法
          // 我希望将多个promise组合在一起 compose

          app.bootstrap = flattenFnArray(bootstrap);
          app.mount = flattenFnArray(mount);
          app.unmount = flattenFnArray(unmount);
          delete app.loadPromise;
          return app;
        }));
      });
      return _toLoadPromise.apply(this, arguments);
    }

    /**
     * @param {*} app 
     */

    function toUnmountPromise(_x) {
      return _toUnmountPromise.apply(this, arguments);
    }

    function _toUnmountPromise() {
      _toUnmountPromise = _asyncToGenerator(function* (app) {
        // 当前应用没有被挂载直接什么都不做了
        if (app.status != MOUNTED) {
          return app;
        }

        app.status = UNMOUNTING;
        yield app.unmount(app.customProps);
        app.status = NOT_MOUNTED;
        return app;
      });
      return _toUnmountPromise.apply(this, arguments);
    }

    /**
     * @param {*} app 
     */

    function toBootstrapPromise(_x) {
      return _toBootstrapPromise.apply(this, arguments);
    }

    function _toBootstrapPromise() {
      _toBootstrapPromise = _asyncToGenerator(function* (app) {
        if (app.status !== NOT_BOOTSTRAPPED) {
          return app;
        }

        app.status = BOOTSTRAPPING;
        yield app.bootstrap(app.customProps);
        app.status = NOT_MOUNTED;
        return app;
      });
      return _toBootstrapPromise.apply(this, arguments);
    }

    /**
     * 
     * @param {} app 
     */

    function toMountPromise(_x) {
      return _toMountPromise.apply(this, arguments);
    }

    function _toMountPromise() {
      _toMountPromise = _asyncToGenerator(function* (app) {
        if (app.status !== NOT_MOUNTED) {
          return app;
        }

        app.status = MOUNTING;
        yield app.mount(app.customProps);
        app.status = MOUNTED;
        return app;
      });
      return _toMountPromise.apply(this, arguments);
    }

    // hashchange   popstate
    const routingEventsListeningTo = ['hashchange', 'popstate'];
    const capturedEventListeners = {
      // 后续挂载的事件先暂存起来
      hashchange: [],
      popstate: [] // 当应用切换完成后可以调用

    };

    function urlReroute() {
      reroute(); // 会根据路径重新加载不同的应用

      capturedEventListeners.hashchange.forEach(fn => {
        if (fn) {
          fn();
        }
      });
      capturedEventListeners.popstate.forEach(fn => {
        if (fn) {
          fn();
        }
      });
    } // 我们处理应用加载的逻辑是在最前面


    window.addEventListener('hashchange', urlReroute);
    window.addEventListener('popstate', urlReroute);
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    window.addEventListener = function (eventName, fn) {
      if (routingEventsListeningTo.indexOf(eventName) >= 0 && !capturedEventListeners[eventName].some(listener => listener == fn)) {
        capturedEventListeners[eventName].push(fn);
        return;
      }

      return originalAddEventListener.apply(this, arguments);
    };

    window.removeEventListener = function (eventName, fn) {
      if (routingEventsListeningTo.indexOf(eventName) >= 0) {
        capturedEventListeners[eventName] = capturedEventListeners[eventName].filter(l => l !== fn);
        return;
      }

      return originalRemoveEventListener.apply(this, arguments);
    }; // 如果是hash路由 hash变化时可以切换 
    // 浏览器路由，浏览器路由是h5api的 如果切换时不会触发popstate


    function patchedUpdateState(updateState, methodName) {
      return function () {
        const urlBefore = window.location.href;
        updateState.apply(this, arguments); // 调用切换方法

        const urlAfter = window.location.href;

        if (urlBefore !== urlAfter) {
          // 重新加载应用 传入事件源
          urlReroute(new PopStateEvent('popstate'));
        }
      };
    }

    window.history.pushState = patchedUpdateState(window.history.pushState);
    window.history.replaceState = patchedUpdateState(window.history.replaceState); // 用户可能还会绑定自己的路由事件 vue
    // 当我们应用切换后，还需要处理原来的方法，需要在应用切换后在执行

    function reroute() {
      //  需要获取要加载的应用
      //  需要获取要被挂载的应用
      //  哪些应用需要被卸载
      const {
        appsToLoad,
        appsToMount,
        appsToUnmount
      } = getAppChanges(); // start方法调用时是同步的，但是加载流程是异步饿

      if (started) {
        // app装载
        return performAppChanges();
      } else {
        // 注册应用时 需要预先加载
        return loadApps();
      }

      function loadApps() {
        return _loadApps.apply(this, arguments);
      }

      function _loadApps() {
        _loadApps = _asyncToGenerator(function* () {
          // 预加载应用
          let apps = yield Promise.all(appsToLoad.map(toLoadPromise)); // 就是获取到bootstrap,mount和unmount方法放到app上

          console.log(apps);
        });
        return _loadApps.apply(this, arguments);
      }

      function performAppChanges() {
        return _performAppChanges.apply(this, arguments);
      }

      function _performAppChanges() {
        _performAppChanges = _asyncToGenerator(function* () {
          // 根据路径来装载应用
          // 先卸载不需要的应用 
          let unmountPromises = appsToUnmount.map(toUnmountPromise); // 需要去卸载的app
          // 去加载需要的应用
          // 这个应用可能需要加载 但是路径不匹配  加载app1 的时候，这个时候切换到了app2

          appsToLoad.map( /*#__PURE__*/function () {
            var _ref = _asyncToGenerator(function* (app) {
              // 将需要求加载的应用拿到 => 加载 => 启动 => 挂载
              app = yield toLoadPromise(app);
              app = yield toBootstrapPromise(app);
              return toMountPromise(app);
            });

            return function (_x) {
              return _ref.apply(this, arguments);
            };
          }());
          appsToMount.map( /*#__PURE__*/function () {
            var _ref2 = _asyncToGenerator(function* (app) {
              app = yield toBootstrapPromise(app);
              return toMountPromise(app);
            });

            return function (_x2) {
              return _ref2.apply(this, arguments);
            };
          }());
        });
        return _performAppChanges.apply(this, arguments);
      }
    } // 这个流程是用于初始化操作的，我们还需要 当路径切换时重新加载应用
    // 重写路由相关的方法

    /**
     * 微前端注册
     * @param {*} appName 应用名称
     * @param {*} loadApp 加载的应用
     * @param {*} activeWhen 当激活时会调用
     * @param {*} customProps 自定义参数
     */
    // 用来存放所有的应用

    const apps = []; // 维护应用所有状态 状态机

    function registerApplication(appName, loadApp, activeWhen, customProps) {
      apps.push({
        // 注册应用
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

        switch (app.status) {
          // toLoad
          case NOT_LOADED:
          case LOADING_SOURCE_CODE:
            if (appSholdBeActive) {
              // 做判断了
              appsToLoad.push(app);
            }

            break;

          case NOT_BOOTSTRAPPED: // toMount

          case BOOTSTRAPPING:
          case NOT_MOUNTED:
            if (appSholdBeActive) {
              appsToMount.push(app);
            }

            break;

          case MOUNTED:
            // unmount
            if (!appSholdBeActive) {
              appsToUnmount.push(app);
            }

        }
      });
      return {
        appsToUnmount,
        appsToLoad,
        appsToMount
      };
    }

    const defaultOpts = {
      Vue: null,
      appOptions: null,
      template: null
    };
    function singleSpaVue(userOpts) {
      if (typeof userOpts !== "object") {
        throw new Error('single-spa-vue requires a configuration object');
      }

      const opts = _objectSpread2(_objectSpread2({}, defaultOpts), userOpts);

      if (!opts.Vue) {
        throw Error("single-spa-vue must be passed opts.Vue");
      }

      if (!opts.appOptions) {
        throw Error("single-spa-vue must be passed opts.appOptions");
      }

      if (opts.appOptions.el && typeof opts.appOptions.el !== "string" && !(opts.appOptions.el instanceof HTMLElement)) {
        throw Error(`single-spa-vue: appOptions.el must be a string CSS selector, an HTMLElement, or not provided at all. Was given ${typeof opts.appOptions.el}`);
      } // Just a shared object to store the mounted object state
      // key - name of single-spa app, since it is unique


      let mountedInstances = {};
      return {
        bootstrap: bootstrap.bind(null, opts, mountedInstances),
        mount: mount.bind(null, opts, mountedInstances),
        unmount: unmount.bind(null, opts, mountedInstances),
        update: update.bind(null, opts, mountedInstances)
      };
    }
    /**
     * 启动函数
     * @param {*} opts 
     */

    function bootstrap(opts) {
      if (opts.loadRootComponent) {
        return opts.loadRootComponent().then(root => opts.rootComponent = root);
      } else {
        return Promise.resolve();
      }
    }
    /**
     * 加载
     * @param {*} opts 
     * @param {*} mountedInstances 
     * @param {*} props 
     */


    function mount(opts, mountedInstances, props) {
      const instance = {};
      return Promise.resolve().then(() => {
        const appOptions = _objectSpread2({}, opts.appOptions);

        if (props.domElement && !appOptions.el) {
          appOptions.el = props.domElement;
        }

        let domEl;

        if (appOptions.el) {
          if (typeof appOptions.el === "string") {
            domEl = document.querySelector(appOptions.el);

            if (!domEl) {
              throw Error(`If appOptions.el is provided to single-spa-vue, the dom element must exist in the dom. Was provided as ${appOptions.el}`);
            }
          } else {
            domEl = appOptions.el;

            if (!domEl.id) {
              domEl.id = `single-spa-application:${props.name}`;
            }

            appOptions.el = `#${CSS.escape(domEl.id)}`;
          }
        } else {
          const htmlId = `single-spa-application:${props.name}`;
          appOptions.el = `#${CSS.escape(htmlId)}`;
          domEl = document.getElementById(htmlId);

          if (!domEl) {
            domEl = document.createElement("div");
            domEl.id = htmlId;
            document.body.appendChild(domEl);
          }
        }

        appOptions.el = appOptions.el + " .single-spa-container"; // single-spa-vue@>=2 always REPLACES the `el` instead of appending to it.
        // We want domEl to stick around and not be replaced. So we tell Vue to mount
        // into a container div inside of the main domEl

        if (!domEl.querySelector(".single-spa-container")) {
          const singleSpaContainer = document.createElement("div");
          singleSpaContainer.className = "single-spa-container";
          domEl.appendChild(singleSpaContainer);
        }

        instance.domEl = domEl;

        if (!appOptions.render && !appOptions.template && opts.rootComponent) {
          appOptions.render = h => h(opts.rootComponent);
        }

        if (!appOptions.data) {
          appOptions.data = {};
        }

        appOptions.data = _objectSpread2(_objectSpread2({}, appOptions.data), props);
        instance.vueInstance = new opts.Vue(appOptions);

        if (instance.vueInstance.bind) {
          instance.vueInstance = instance.vueInstance.bind(instance.vueInstance);
        }

        mountedInstances[props.name] = instance;
        return instance.vueInstance;
      });
    }
    /**
     * 更新
     * @param {*} opts 
     * @param {*} mountedInstances 
     * @param {*} props 
     */


    function update(opts, mountedInstances, props) {
      return Promise.resolve().then(() => {
        const instance = mountedInstances[props.name];

        const data = _objectSpread2(_objectSpread2({}, opts.appOptions.data || {}), props);

        for (let prop in data) {
          instance.vueInstance[prop] = data[prop];
        }
      });
    }
    /**
     * 卸载函数
     * @param {*} opts 
     * @param {*} mountedInstances 
     * @param {*} props 
     */


    function unmount(opts, mountedInstances, props) {
      return Promise.resolve().then(() => {
        const instance = mountedInstances[props.name];
        instance.vueInstance.$destroy();
        instance.vueInstance.$el.innerHTML = "";
        delete instance.vueInstance;

        if (instance.domEl) {
          instance.domEl.innerHTML = "";
          delete instance.domEl;
        }
      });
    }

    exports.registerApplication = registerApplication;
    exports.singleSpaVue = singleSpaVue;
    exports.start = start;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=single-spa.js.map
