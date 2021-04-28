const yargs = require('yargs');
const fs = require('fs')
const path = require('path')
const {mapDir} = require('./helper')
const {hasStringLiteralJSXAttribute} = require('./visitorCheck')
// const {parseJsx} = require('./JSXHelper')
// const mapDir = require('./helper').mapDir
const writeFileSync = require('./helper').writeFileSync
const replaceOptions = require('./options')
const {parse, transformSync, transform, transformFromAst} = require("@babel/core")
const generate = require("@babel/generator").default
const traverse = require("@babel/traverse").default
const t = require('@babel/types')
const {
    mappingPath,
    rootPath,
    distPath: rawDistPath,
    defaultDistPath,
    includesFiles,
} = replaceOptions
// const sourcePath = './src/'
// console.log(mapDir)
// const mappingPath = 'C:/Users/LuoZeJian1/Desktop/project/Davinci-master/webapp/app/assets/text/'
const mappingFileExt = '.txt'
// const defaultDistPath = './output/'
let argv = yargs
    .alias('c', 'cover')
    .alias('u', 'useRootPath')
    .alias('i', 'input')
    .alias('o', 'dist')
    .alias('m', 'mapping')
    .alias('r', 'rootPath')
    .boolean('c')
    .boolean('u')
    // .demandOption('m', '请提供映射文件')
    // .demandOption(['i', 'o'], '源文件(-i)和目标文件(-o)选项必填')
    // .demandOption('i', '源文件(-i)选项必填')
    // .default('r', rootPath)
    .describe('i', '源文件')
    .describe('o', '目标文件')
    .describe('c', '是否覆盖源文件')
    .describe('r', '项目根目录')
    .argv;
const normalizedRootPath = rootPath.replace(/\\/g, '\/')
const rawSourcePath = argv.input
const sourcePath = argv.useRootPath ?
    path.join(rootPath, argv.input) :
    rawSourcePath
// console.log(path.parse(sourcePath))
// argv.useRootPath=rootPath
// const sourcePath = argv.useRootPath ? rootPath + rawSourcePath : rawSourcePath

const mappingFiles = argv.mapping.split(',')
let mappings = mappingFiles.map(filePth => {
    return JSON.parse(fs.readFileSync(mappingPath + filePth + mappingFileExt, 'utf8')).sort((a, b) => b[1].length - a[1].length)
})

function mkdirsSync(dirname) {//递归调用创建文件夹方法
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

// console.log(1111)

function copy(sourcePath, distPath) {
    if (fs.existsSync(path.parse(distPath).dir)) {
        fs.copyFileSync(sourcePath, distPath)
    } else {
        try {
            mkdirsSync(path.parse(distPath).dir)
            fs.copyFileSync(sourcePath, distPath)
            // console.log('文件复制成功')
        } catch (err) {
            console.log('文件复制错误', distPath)
            /* 处理错误 */
        }

    }
}

// function replacerCommand(commandOptions = []) {
//     let shouldImportI18n = false;
const replaceReg = {
    doubleQuoteAttributeReg: "([\\w]+\=",
    singleQuoteAttributeReg: "([\\w]+\=",
    existChineseReg: /[\u4e00-\u9fa5]+/,
    // commentReg: "(/\\\*([^*]|[\\\r\\\n]|(\\\*+([^*/]|[\\\r\\\n])))*\\\*+/)|(//.*)"
    singleRowCommentReg: "/(?:^|\\n|\\r)\\s*\\/\\*[\\s\\S]*?\\*\\/\\s*(?:\\r|\\n|$)/g",
    multipleRowCommentReg: "/(?:^|\\n|\\r)\\s*\\/\\/.*(?:\\r|\\n|$)/g"
}
const replacerCommand = {
    test(sourceString, chineseString) {
        let regExp = new RegExp(chineseString, 'g')
        return regExp.test(sourceString)
        // sourceString = //jsx 属性 双引号
        //     sourceString.replace(
        //         regExp,)
        // return sourceString
    },
    replaceComment(sourceString) {//替换注释
        const {singleRowCommentReg, multipleRowCommentReg} = replaceReg;
        // const commentExp = new RegExp(singleRowCommentReg, 'g');
        const matchResult = sourceString.match(singleRowCommentReg) || []
        const matchResult2 = sourceString.match(multipleRowCommentReg) || []
        const commentArray = [...matchResult, ...matchResult2].map((item, index) => {
            sourceString = sourceString.replace(item, `/*placeholder${index}*/`)
            return item
        })
        return [sourceString, commentArray]
    },
    doubleQuoteAttribute(sourceString, chineseString, variableName, shouldImportI18n) {
        const jsxTagRegPre = "(\\S+?=)\"([^\"]*?)" //example:<div>文本<...
        const jsxTagRegEnd = "(([^\"]*?))\""
        const jsxDoubleAttrTotalReg = jsxTagRegPre + chineseString + jsxTagRegEnd
        const doubleQuoteAttributeRegExp = new RegExp(jsxDoubleAttrTotalReg, 'g')
        if (doubleQuoteAttributeRegExp.test(sourceString)) {
            console.log('doubleQuoteAttributeRegExp ' + chineseString)
            shouldImportI18n = true
        }
        sourceString = //jsx 属性 双引号
            sourceString.replace(
                doubleQuoteAttributeRegExp,
                ($0, $1, $2, $3, $4) => {

                    $2 = $2 ? "\"" + $2 + "\"+" : ''
                    $4 = $4 ? "+\"" + $4 + "\"" : ''
                    return $1 + '{' + $2 + `i18n.t(\'${variableName}\')` + $4 + '}'
                }
            )
        return [sourceString, shouldImportI18n]
    },
    singleQuoteAttribute(sourceString, chineseString, variableName, shouldImportI18n) {
        const jsxTagRegPre = "(\\S+?=)\'([^\']*?)" //example:<div>文本<...
        const jsxTagRegEnd = "(([^\']*?))\'"
        const jsxSingleAttrTotalReg = jsxTagRegPre + chineseString + jsxTagRegEnd
        const singleQuoteAttributeRegExp = new RegExp(jsxSingleAttrTotalReg, 'g')
        if (singleQuoteAttributeRegExp.test(sourceString)) {
            console.log('singleQuoteAttribute ' + chineseString)
            shouldImportI18n = true
        }
        sourceString = //jsx 属性 单引号
            sourceString.replace(
                singleQuoteAttributeRegExp,
                ($0, $1, $2, $3, $4) => {
                    $2 = $2 ? "\"" + $2 + "\"+" : ''
                    $4 = $4 ? "+\"" + $4 + "\"" : ''
                    return $1 + '{' + $2 + `i18n.t(\'${variableName}\')` + $4 + '}'
                }
            )
        return [sourceString, shouldImportI18n]
    },
    bracketsAttributeVal(sourceString, chineseString, variableName, shouldImportI18n) {
        const jsxTagRegPre = "(\\S+?=)\{([\\s\\S]*?)" //example:<div>文本<...
        const jsxTagRegEnd = "(([^\']*?))\}"
        const jsxSingleAttrTotalReg = jsxTagRegPre + chineseString + jsxTagRegEnd
        const singleQuoteAttributeRegExp = new RegExp(jsxSingleAttrTotalReg, 'g')
        if (singleQuoteAttributeRegExp.test(sourceString)) {

            shouldImportI18n = true
        }
        sourceString = //jsx 属性 单引号
            sourceString.replace(
                singleQuoteAttributeRegExp,
                ($0, $1, $2, $3, $4) => {
                    $2 = $2 ? $2 + "\"+" : ''
                    $4 = $4 ? "+\"" + $4 : ''
                    return $1 + '{' + $2 + `i18n.t(\'${variableName}\')` + $4 + '}'
                }
            )
        return [sourceString, shouldImportI18n]
    },
    doubleQuoteString(sourceString, chineseString, variableName, shouldImportI18n) {
        const doubleQuoteStringRegExp = new RegExp('\"([^\"]*?)' + chineseString + '([^\"]*?)\"', 'g')
        if (doubleQuoteStringRegExp.test(sourceString)) {
            console.log('doubleQuoteStringRegExp ' + chineseString)
            shouldImportI18n = true
        }
        sourceString = //双引号字符串
            sourceString.replace(
                doubleQuoteStringRegExp,
                ($0, $1, $2) => {
                    $1 = $1 ? "\"" + $1 + '\"+' : ''
                    $2 = $2 ? "+\"" + $2 + '\"' : ''
                    if ($0.includes('\'') || $0.includes('\`')) {
                        return $0
                    }
                    return $1 + `i18n.t(\'${variableName}\')` + $2
                }
            )

        return [sourceString, shouldImportI18n]
    },
    singleQuoteString(sourceString, chineseString, variableName, shouldImportI18n) {
        // const singleQuoteStringRegExp=new RegExp('\'' + chineseString + '\'', 'g')
        // if (singleQuoteStringRegExp.test(sourceString)) {
        //     shouldImportI18n = true
        // }
        //
        // sourceString=sourceString.replace(
        //     singleQuoteStringRegExp,
        //     ($0, $1, $2) => {
        //         return `i18n.t(\'${variableName}\')`
        //     })

        const singleQuoteStringRegExp2 = new RegExp('\'([^\']*?)' + chineseString + '([^\']*?)\'', 'g')
        if (singleQuoteStringRegExp2.test(sourceString)) {
            console.log('singleQuoteStringRegExp2' + chineseString)
            shouldImportI18n = true
        }

        sourceString = sourceString.replace(
            singleQuoteStringRegExp2,
            ($0, $1, $2) => {
                if ($0.includes('\"') || $0.includes('\`')) {
                    return $0
                }
                // console.log($1)
                // console.log($1 + `i18n.t(\'${variableName}\')` + $2)
                $1 = $1 ? "\"" + $1 + '\"+' : ''
                $2 = $2 ? "+\"" + $2 + '\"' : ''
                return $1 + `i18n.t(\'${variableName}\')` + $2
            })

        return [sourceString, shouldImportI18n]
    },
    JSXText(sourceString, chineseString, variableName, shouldImportI18n) {
        //匹配开始和结束标签
        const jsxWithSingleQuoteReg = "(>[^<]*?)" + `(\'${chineseString}\')` + "([^<]*?<\/)"
        const jsxWithDoubleQuoteReg = "(>[^<]*?)" + `(\"${chineseString}\")` + "([^<]*?<\/)"
        // const jsxTextRegPre = "(<([\\S]+?)[\\s\\S]*?>[\\s\\S]*?)" //example:<div>文本<...
        // const jsxTextReg = "(>[^<]*?)" + `(${chineseString})` + "([^<]*?<\/)"
        // const jsxTextReg = "(>[^<]*?)" + `(${chineseString})` + "([^<]*?<\/)"
        // const jsxTextTotalReg = jsxTextRegPre + `(${chineseString})` + "([\\s\\S]*<[\\s]*?\/\\2[\\s]*>)"
        const jsxTextTotalRegExp = new RegExp(chineseString, 'g')
        // const jsxWithSingleQuoteRegExp = new RegExp(jsxWithSingleQuoteReg, 'g')
        // const jsxWithDoubleQuoteRegExp = new RegExp(jsxWithDoubleQuoteReg, 'g')
        // if (jsxTextTotalRegExp.test(sourceString) ||
        //     jsxWithSingleQuoteRegExp.test(sourceString) ||
        //     jsxWithDoubleQuoteRegExp.test(sourceString)
        //
        // ) {
        //     shouldImportI18n = true
        // }
        // sourceString = //jsx标签中的文本
        //     sourceString.replace(
        //         jsxWithSingleQuoteReg,
        //         ($0, $1, $2, $3, $4) => {
        //             return $1 + `i18n.t(\'${variableName}\')` + $3
        //         }
        //     )
        // sourceString = //jsx标签中的文本
        //     sourceString.replace(
        //         jsxWithSingleQuoteRegExp,
        //         ($0, $1, $2, $3, $4) => {
        //             return $1 + `i18n.t(\'${variableName}\')` + $3
        //         }
        //     )
        // sourceString = //jsx标签中的文本
        //     sourceString.replace(
        //         jsxTextTotalRegExp,
        //         ($0, $1, $2, $3, $4) => {
        //             return $1 + `{i18n.t(\'${variableName}\')}` + $3
        //         }
        //     )
        sourceString = //jsx标签中的文本
            sourceString.replace(
                jsxTextTotalRegExp,
                ($0, $1, $2, $3, $4) => {
                    return `{i18n.t(\'${variableName}\')}`
                }
            )
        return [sourceString, shouldImportI18n]
    },
    templateString(sourceString, chineseString, variableName, shouldImportI18n) {
        // const templateStringRegExp = new RegExp('(\`[^\`]*?)' + `(${chineseString})` + '([^\`]*?\`)', 'g')
        const templateStringRegExp = new RegExp(chineseString, 'g')
        if (templateStringRegExp.test(sourceString)) {
            // console.log('templateString' + chineseString)
            shouldImportI18n = true
        }
        // console.log(new RegExp('(\`\[\\s\\S\]\*)' + `(${chineseString})` + '(\[\\s\\S\]\*\`)', 'g'))
        sourceString = //模板字符串
            sourceString.replace(
                templateStringRegExp,
                ($0, $1, $2, $3) => {
                    // console.log($1 + '${i18n.t(\'' + variableName + '\')}' + $3)
                    return '${i18n.t(\'' + variableName + '\')}'
                }
            )
        // console.log(sourceString)
        // `i18n.t(\'${variableName}\')`)

        return [sourceString, shouldImportI18n]
    },
    chinese(sourceString, chineseString, variableName, shouldImportI18n) {
        if (new RegExp(chineseString, 'g').test(sourceString)) {
            console.log('sourceString' + chineseString)
            shouldImportI18n = true
        }
        sourceString = sourceString.replace(new RegExp(chineseString, 'g'), `i18n.t(\'${variableName}\')`)
        return [sourceString, shouldImportI18n]
    },
    recoverComment(sourceString, commentArray) {//恢复注释
        commentArray.forEach((item, index) => {//恢复占位符为原来的字符串
            // console.log(commentArray[index])
            sourceString = sourceString.replace(`/*placeholder${index}*/`, commentArray[index])
        })
        return sourceString
    }

}

// }

function i18nReplacer(pathName) {
    const {cover, useRootPath} = argv
    const extName = path.extname(pathName)
    const fileName = path.basename(pathName)
    const sourceDir = useRootPath ?
        path.join(rootPath, path.parse(rawSourcePath).dir).replace(/\\/g, '\/') :
        path.join('./',
            path.parse(sourcePath).base).replace(/\\/g, '\/')

    const defaultDistDir = rawDistPath ? rawDistPath : defaultDistPath


    const finalDistPath = cover ? sourcePath :
        path.join(defaultDistDir, rawSourcePath)
    // return
    // console.log(path.parse(finalDistPath).dir)

    let sourceString = fs.readFileSync(pathName, 'utf8');
    mappings.forEach((mapping, index) => {
        const mappingNameSpace = path.basename(mappingPath + mappingFiles[index] + mappingFileExt).split('.')[0]
        if (extName === '.tsx' || extName === '.jsx') {
            // const testSourceString = sourceString

            let commentArray;
            [sourceString, commentArray] = replacerCommand.replaceComment(sourceString)

            // console.log(sourceString)
            if (replaceReg.existChineseReg.test(sourceString)) {//包含中文
                let shouldImportI18n = false
                let alreadyImportI18n = false
                const ast = parse(sourceString, {
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
                traverse(ast, {
                    ImportDefaultSpecifier(path) {
                        if (path.node.local.name === 'i18n') { //判断是否已经引入 i18n 方法
                            alreadyImportI18n = true
                        }
                    },
                    JSXAttribute(path) {
                        console.log('JSXAttribute')
                        const {node} = path
                        if (hasStringLiteralJSXAttribute(path)) {
                            for (let i = 0; i < mapping.length; i++) {
                                const chineseString = mapping[i][1]
                                const attributeName = node.name.name
                                // const attributeVal = node.value.value
                                const variableName = `'${mappingNameSpace}.${mapping[i][0]}'`
                                if (replacerCommand.test(node.value.value, chineseString)) {
                                    shouldImportI18n = true
                                    path.node.name = (t.jsxIdentifier(attributeName))
                                    // console.log((t.jsxExpressionContainer(path.node.value))).node
                                    path.node.value = (t.jsxExpressionContainer(path.node.value))
                                }
                            }
                        }
                    },
                    StringLiteral(path) {
                        console.log('StringLiteral')
                        for (let i = 0; i < mapping.length; i++) {
                            const chineseString = mapping[i][1]
                            const variableName = `${mappingNameSpace}.${mapping[i][0]}`
                            // console.log(path)
                            if (replacerCommand.test(path.node.value, chineseString)) {
                                //     shouldImportI18n=true
                                path.replaceWith(t.identifier(`i18n.t('${variableName}')`))
                            }
                        }
                    },
                    // JSXExpressionContainer(path) {
                    //     const {node} = path
                    //     if (hasStringLiteralJSXAttribute(path)) {
                    //     }
                    // },
                    JSXText(path) {
                        for (let i = 0; i < mapping.length; i++) {
                            const chineseString = mapping[i][1]
                            const variableName = `${mappingNameSpace}.${mapping[i][0]}`
                            if (replacerCommand.test(path.node.value, chineseString)) {
                                shouldImportI18n = true
                                path.node.value = replacerCommand.JSXText(path.node.value, chineseString, variableName)[0]
                            }
                        }
                    },
                    TemplateElement(path) {
                        const {node} = path;
                        // console.log(node.value)
                        for (let i = 0; i < mapping.length; i++) {
                            const chineseString = mapping[i][1]
                            const variableName = `${mappingNameSpace}.${mapping[i][0]}`
                            if (replacerCommand.test(path.node.raw, chineseString)) {
                                shouldImportI18n = true
                                node.value.raw = replacerCommand.templateString(node.value.raw, chineseString, variableName)[0]
                            }
                        }

                    },

                })

                const code = generate(ast, {retainLines: true})

                transformFromAst(ast, code.code, {
                    // sourceMap: true,
                    // filename: '.tsx',
                    // ast: true,
                    // code: true,
                    // presets: [
                    //     // [
                    //     //     '@babel/preset-env',
                    //     //     {
                    //     //         modules: false
                    //     //     }
                    //     // ],
                    //     '@babel/preset-react',
                    //     '@babel/preset-typescript'
                    // ],
                    plugins: [
                        // '@babel/plugin-transform-modules-commonjs',
                        // 'dynamic-import-node',
                        '@babel/plugin-proposal-nullish-coalescing-operator',
                        '@babel/plugin-proposal-optional-chaining',
                        '@babel/plugin-proposal-class-properties',
                        // '@babel/plugin-syntax-dynamic-import',
                        {

                            visitor: {
                                Program: {},
                                ImportDeclaration: {
                                    enter(path) {
                                        console.log('进入')
                                    },
                                    exit(path) {
                                        if (shouldImportI18n && !alreadyImportI18n) {
                                            alreadyImportI18n = true
                                            path.insertBefore(t.importDeclaration(
                                                [t.importDefaultSpecifier(t.identifier('i18n'))],
                                                t.stringLiteral('i18n-next')))
                                        }
                                    }
                                },


                            }
                        }
                    ]
                }, (err, result) => {
                    writeFileSync(finalDistPath, result.code)
                    writeFileSync(path.join(path.parse(finalDistPath).dir, 'ast' + fileName + '.json'), JSON.stringify(ast))
                })

            } else {//没有中文直接复制
                console.log(finalDistPath)
                copy(pathName, finalDistPath)
            }


        } else {
            let commentArray;
            [sourceString, commentArray] = replacerCommand.replaceComment(sourceString)

            if (replaceReg.existChineseReg.test(sourceString)) {//包含中文
                } else {//没有中文直接复制
                copy(pathName, finalDistPath)
            }


        }
    })
    // console.log(rawDistPath)
    // console.log(distPath)
    // return;

}

fs.stat(sourcePath, (err, stats) => { // 读取文件信息
    if (err) {
        console.error('读取文件失败')
        console.log(err)
        return
    }

    if (stats.isFile()) {
        console.log('不是文件夹')
        i18nReplacer(sourcePath)
        return;
    }
    mapDir(sourcePath, includesFiles, i18nReplacer, (pathName) => {
        const sourceDir = path.join('./', path.parse(sourcePath).base)
        const defaultDistDir = path.join('./', path.parse(rawDistPath).base)
        const distPath = argv.cover ? sourceDir : defaultDistDir
        const finalDistPath = pathName.replace(sourceDir, distPath)
        copy(pathName, finalDistPath)
    })
})


// // // testHtml.replace(/<title>([\s\S]){1,}<\/title>/gm, '<title>二标题</title>')
// fs.writeFileSync(distPath + (argv.dist || sourceFileName), sourceString, 'utf8')
