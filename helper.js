const fs = require('fs')

const path = require('path')
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
function mapDir(dir, include, targetCallback, excludeCallback, finish) {
    fs.readdir(dir, function (err, files) {
        if (err) {
            console.error(err)
            return
        }
        files.forEach((filename, index) => {
            let pathname = path.join(dir, filename)
            fs.stat(pathname, (err, stats) => { // 读取文件信息
                if (err) {
                    console.log('获取文件stats失败')
                    return
                }
                if (stats.isDirectory()) {
                    mapDir(pathname, include, targetCallback, excludeCallback)
                } else if (stats.isFile()) {
                    if (include.includes(path.extname(pathname))) {
                        // console.log(path.join(dir, pathname))
                        targetCallback && targetCallback(pathname)
                        return;
                    }
                    excludeCallback && excludeCallback(pathname)
                }
            })
            if (index === files.length - 1) {
                finish && finish()
            }
        })
    })
}
function writeFileSync(writePath,data) {
    if (fs.existsSync(writePath)) {
        fs.writeFileSync(writePath, data, 'utf8')

        console.log('文件替换成功')
    } else {
        if (!fs.existsSync(path.parse(writePath).dir)) {//文件夹不存在
            try {
                // fs.mkdirSync(path.parse(finalDistPath).dir)
                mkdirsSync(path.parse(writePath).dir)
            } catch (err) {
                console.log('新建文件夹失败')
            }

        }
        try {
            // copy(sourcePath,distPath)
            fs.appendFileSync(writePath, data, 'utf8');
            console.log('文件创建成功')
        } catch (err) {
            // console.log(err)
            console.log('文件创建错误')
            /* 处理错误 */
        }
    }
}
module.exports = {
    mapDir,
    writeFileSync
}
