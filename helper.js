const fs = require('fs')

const path = require('path')

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
module.exports = {
    mapDir
}
