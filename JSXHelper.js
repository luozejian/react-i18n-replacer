const {parse} = require("@babel/core")
const parseJsx=function (jsx){
    return  parse(jsx, {
        filename: 'file.tsx',
        presets: [
            [
                '@babel/preset-env',
                {
                    modules: false
                }
            ],
            '@babel/preset-react',
            '@babel/preset-typescript'
        ],
        plugins: [
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-syntax-dynamic-import',
        ],
    })
}
module.exports={
    parseJsx
}

