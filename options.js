module.exports ={
    mappingPath:'./mapping/',//映射文本目录
    rootPath:'',//指定项目根目录 在命令行有 -u 时有效
    // sourcePath:'./src/',//源文件目录 可以为文件也可以为文件夹 文件夹则递归遍历所有子文件
    distPath:'',//设置输出路径
    defaultDistPath:'./output/',//默认输出路径,在没有distPath为空时使用
    includesFiles:['.jsx','.tsx','.js','.ts'],//要替换的文件格式
}
