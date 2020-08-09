import 'css.escape'

const defaultOpts = {
    Vue: null,
    appOptions: null,
    template: null
}

export function singleSpaVue(userOpts) {
    if (typeof userOpts !== "object") {
        throw new Error('single-spa-vue requires a configuration object')
    }

    const opts = {
        ...defaultOpts,
        ...userOpts
    }

    if (!opts.Vue) {
        throw Error("single-spa-vue must be passed opts.Vue");
    }

    if (!opts.appOptions) {
        throw Error("single-spa-vue must be passed opts.appOptions");
    }

    if (
        opts.appOptions.el &&
        typeof opts.appOptions.el !== "string" &&
        !(opts.appOptions.el instanceof HTMLElement)
    ) {
        throw Error(
            `single-spa-vue: appOptions.el must be a string CSS selector, an HTMLElement, or not provided at all. Was given ${typeof opts
                .appOptions.el}`
        );
    }

    // Just a shared object to store the mounted object state
    // key - name of single-spa app, since it is unique
    let mountedInstances = {}

    return {
        bootstrap: bootstrap.bind(null, opts, mountedInstances),
        mount: mount.bind(null, opts, mountedInstances),
        unmount: unmount.bind(null, opts, mountedInstances),
        update: update.bind(null, opts, mountedInstances)
    }

}

/**
 * 启动函数
 * @param {*} opts 
 */
function bootstrap(opts) {
    if (opts.loadRootComponent) {
        return opts.loadRootComponent().then(root => (opts.rootComponent = root))
    } else {
        return Promise.resolve()
    }
}
