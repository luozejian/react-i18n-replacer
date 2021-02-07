const yargs = require('yargs');
const fs = require('fs')
const path = require('path')
const mapDir = require('./helper').mapDir
const replaceOptions = require('./options')
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
        // const jsxTextRegPre = "(<([\\S]+?)[\\s\\S]*?>[\\s\\S]*?)" //example:<div>文本<...
        const jsxTextTotalReg = "(>[^<]*?)" + `(${chineseString})` + "([^<]*?<\/)"
        // const jsxTextTotalReg = jsxTextRegPre + `(${chineseString})` + "([\\s\\S]*<[\\s]*?\/\\2[\\s]*>)"
        const jsxTextTotalRegExp = new RegExp(jsxTextTotalReg, 'g')
        // console.log(jsxTextTotalRegExp)
        if (jsxTextTotalRegExp.test(sourceString)) {
            // console.log('JSXText ' + chineseString)
            shouldImportI18n = true
        }
        sourceString = //jsx标签中的文本
            sourceString.replace(
                jsxTextTotalRegExp,
                ($0, $1, $2, $3, $4) => {
                    return $1 + `{i18n.t(\'${variableName}\')}` + $3
                }
            )
        return [sourceString, shouldImportI18n]
    },
    templateString(sourceString, chineseString, variableName, shouldImportI18n) {
        const templateStringRegExp = new RegExp('(\`[^\`]*?)' + `(${chineseString})` + '([^\`]*?\`)', 'g')
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
                    return $1 + '${i18n.t(\'' + variableName + '\')}' + $3
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
    const sourceDir = useRootPath ?
        path.join(rootPath, path.parse(rawSourcePath).dir).replace(/\\/g, '\/') :
        path.join('./',
            path.parse(sourcePath).base).replace(/\\/g, '\/')

    const defaultDistDir = rawDistPath ? rawDistPath : defaultDistPath


    const finalDistPath = cover ? sourcePath :
        path.join(defaultDistDir,rawSourcePath)
    // return
    let sourceString = fs.readFileSync(pathName, 'utf8');
    mappings.forEach((mapping, index) => {
        const mappingNameSpace = path.basename(mappingPath + mappingFiles[index] + mappingFileExt).split('.')[0]
        if (extName === '.tsx' || extName === '.jsx') {
            let commentArray;
            [sourceString, commentArray] = replacerCommand.replaceComment(sourceString)

            console.log(sourceString)
            if (replaceReg.existChineseReg.test(sourceString)) {//包含中文
                // 替换注释为占位符
                // if (/class[\s\S]+extends/.test(sourceString)) { //Class 组件
                let shouldImportI18n = false
                // console.log(sourceString.match(new RegExp(singleQuoteAttributeReg+'类型','g')))
                for (let i = 0; i < mapping.length; i++) {
                    const chineseString = mapping[i][1]
                    const variableName = `${mappingNameSpace}.${mapping[i][0]}`//变量名
                    ;[sourceString, shouldImportI18n] = replacerCommand.doubleQuoteAttribute(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.singleQuoteAttribute(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.JSXText(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.singleQuoteString(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.doubleQuoteString(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.templateString(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.chinese(sourceString, chineseString, variableName, shouldImportI18n)
                }
                // return
                // [commentArray] = [[]]
                sourceString = replacerCommand.recoverComment(sourceString, commentArray)
                if (shouldImportI18n) {
                    if (!(sourceString.replace(/\s+/g, "")
                        .includes('import i18n from \'i18next\''.replace(/\s+/g, "")
                        ))
                    ) {
                        sourceString = 'import i18n from \'i18next\'\n' + sourceString;
                    }
                    if (fs.existsSync(finalDistPath)) {
                        fs.writeFileSync(finalDistPath, sourceString, 'utf8')

                        console.log('文本替换成功')
                    } else {
                        if (!fs.existsSync(path.parse(finalDistPath).dir)) {//文件夹不存在
                            try {
                                fs.mkdirSync(path.parse(finalDistPath).dir)
                            } catch (err) {
                                console.log('新建文件夹失败')
                            }

                        }
                        try {
                            // copy(sourcePath,distPath)
                            fs.appendFileSync(finalDistPath, sourceString, 'utf8');
                            // fs.writeFileSync(disPath, sourceString, 'utf8')
                            console.log('文件创建成功')
                        } catch (err) {
                            console.log(err)
                            console.log('文件创建错误xxx')
                            /* 处理错误 */
                        }
                        // fs.appendFileSync(disPath,sourceString,function(err){
                        //     if(err)  {
                        //         console.log(err);
                        //     } else {
                        //         console.log('文件创建成功')
                        //         fs.writeFileSync(disPath, sourceString, 'utf8')
                        //     }
                        // })
                    }
                } else {//匹配不到中文直接复制
                    copy(pathName, finalDistPath)
                }

                // }
                // if (sourceString.includes('React.FC') || /export[\s\S]function/.test(sourceString)) {//函数式组件
                //     for (let i = 0; i < mapping.length; i++) {
                //         const chineseString = mapping[i][1]
                //         console.log('\"' + chineseString + '\"')
                //         sourceString = sourceString.replace('\"' + chineseString + '\"', `i18n.t(\'${mappingNameSpace}.${mapping[i][0]}\')`)
                //         sourceString = sourceString.replace('\'' + chineseString + '\'', `i18n.t(\'${mappingNameSpace}.${mapping[i][0]}\')`)
                //         sourceString = sourceString.replace(chineseString, `i18n.t(\'${mappingNameSpace}.${mapping[i][0]}\')`)
                //     }
                //     fs.writeFileSync(pathName.replace(sourceDir, argv.cover ? sourceDir : defaultDistDir), sourceString, 'utf8')
                //     return
                // }
            } else {//没有中文直接复制
                console.log(finalDistPath)
                copy(pathName, finalDistPath)
            }


        } else {
            let commentArray;
            [sourceString, commentArray] = replacerCommand.replaceComment(sourceString)

            if (replaceReg.existChineseReg.test(sourceString)) {//包含中文
                // 替换注释为占位符
                // if (/class[\s\S]+extends/.test(sourceString)) { //Class 组件
                let shouldImportI18n = false

                // console.log(sourceString.match(new RegExp(singleQuoteAttributeReg+'类型','g')))
                for (let i = 0; i < mapping.length; i++) {
                    const chineseString = mapping[i][1]
                    const variableName = `${mappingNameSpace}.${mapping[i][0]}` //变量名
                    ;[sourceString, shouldImportI18n] = replacerCommand.doubleQuoteString(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.singleQuoteString(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.templateString(sourceString, chineseString, variableName, shouldImportI18n)
                    ;[sourceString, shouldImportI18n] = replacerCommand.chinese(sourceString, chineseString, variableName, shouldImportI18n)
                }

                sourceString = replacerCommand.recoverComment(sourceString, commentArray)

                if (shouldImportI18n) {
                    if (!(sourceString.replace(/\s+/g, "")
                        .includes('import i18n from \'i18next\''.replace(/\s+/g, "")
                        ))
                    ) {
                        sourceString = 'import i18n from \'i18next\'\n' + sourceString;
                    }

                    if (fs.existsSync(finalDistPath)) {
                        fs.writeFileSync(finalDistPath, sourceString, 'utf8')
                    } else {
                        if (!fs.existsSync(path.parse(finalDistPath).dir)) {//文件夹不存在
                            try {
                                fs.mkdirSync(path.parse(finalDistPath).dir)
                            } catch (err) {
                                console.log('新建文件夹失败')
                            }

                        }
                        try {
                            // copy(sourcePath,distPath)
                            fs.appendFileSync(finalDistPath, sourceString, 'utf8');
                            // fs.writeFileSync(disPath, sourceString, 'utf8')
                            console.log('文件创建成功')
                        } catch (err) {
                            console.log(err)
                            console.error('文件创建错误xxx')
                            /* 处理错误 */
                        }
                        // fs.appendFileSync(disPath,sourceString,function(err){
                        //     if(err)  {
                        //         console.log(err);
                        //     } else {
                        //         console.log('文件创建成功')
                        //         fs.writeFileSync(disPath, sourceString, 'utf8')
                        //     }
                        // })
                    }
                } else {//匹配不到中文直接复制
                    copy(pathName, finalDistPath)
                }

                // }
                // if (sourceString.includes('React.FC') || /export[\s\S]function/.test(sourceString)) {//函数式组件
                //     for (let i = 0; i < mapping.length; i++) {
                //         const chineseString = mapping[i][1]
                //         console.log('\"' + chineseString + '\"')
                //         sourceString = sourceString.replace('\"' + chineseString + '\"', `i18n.t(\'${mappingNameSpace}.${mapping[i][0]}\')`)
                //         sourceString = sourceString.replace('\'' + chineseString + '\'', `i18n.t(\'${mappingNameSpace}.${mapping[i][0]}\')`)
                //         sourceString = sourceString.replace(chineseString, `i18n.t(\'${mappingNameSpace}.${mapping[i][0]}\')`)
                //     }
                //     fs.writeFileSync(pathName.replace(sourceDir, argv.cover ? sourceDir : defaultDistDir), sourceString, 'utf8')
                //     return
                // }
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
