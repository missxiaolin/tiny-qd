import serve from 'rollup-plugin-serve'
import babel from 'rollup-plugin-babel'

// rollup可以帮我们打包 es6的模块化语法
export default {
    input: './src/single-spa.js',
    output: {
        file: './lib/single-spa.js',
        format: 'umd',
        name: 'singleSpa',
        sourcemap: true
    },
    plugins: [
        serve({
            openPage: './index.html',
            contentBase: '',
            port: 9002
        }),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}