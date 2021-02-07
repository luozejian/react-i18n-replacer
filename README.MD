### react-i18n-replacer



##### Overview

用 Node 编写的小工具,自动在React项目文件引入i18n(react-i18next),用正则匹配替换存在的文本,React组件只支持.tsx和.jsx,不支持.js后缀的组件

##### Start 

安装依赖

```
$ npm install 
or
$ yarn
```



##### Usage

在EXCEL编辑好翻译文本,生成数组格式的文本,具体格式见目录 ./mapping 下的文件

```
[
    ["test","测试文本","test text"],
    ["testAttr","测试属性","test attrs"]
]

```

数组第一项为最终替换的变量,第二项为原始的中文文本,第三项为英文文本

可以使用在线工具生成 : 

[EXCEL 转 JSON 工具](http://www.bejson.com/json/col2json/ )

复制EXCEL文本选择转换成数组

用命令行运行根目录下的 formatJson.py 可生成 i18n 使用的有命名空间的 JSON 文件(需安装Python环境),具体的格式可以自行运行生成查看 

```
py formatJson.py
```

配置在 Options.js 中 

```
export default {
    mappingPath:'./mapping',//映射的文本目录
    rootPath:'',//指定项目根目录 在命令行带 -u 参数时有效
    distPath:'',//设置输出路径
    defaultDistPath:'./output/',//默认输出路径,在distPath为空时使用
    includesFiles:['.jsx','tsx','js','ts'],//要替换的文件格式,参数之外的文件直接复制不作替换修改
}


```

##### 命令行参数

- -i

  --input 的缩写

  输入的源文件路径,可以为文件也可以为文件夹 文件夹则递归遍历所有子文件

- -c 

  --cover 的缩写

  默认:false,是否覆盖源文件,false则输出到指定的目录

- -u

  --useRootPath 的缩写

  默认:false,是否指定项目,带上-u选项输入目录=rootPath+sourcePath

- -m (必需)

  --mapping 的缩写

  mappingPath 目录下的映射的文本文件名,不用带.txt后缀 ,同时使用多个的时候用逗号隔开

  如:-m mapping1,mapping2

  使用多个文件时有先后优先级 

  ###### example:

  mapping1.txt

  ```
  [
  ["test","测试文本","mapping1 test text"],
  ]
  ```

  mapping2.txt 

  ```
  [
  ["test","测试文本","mapping2 test text"],
  ]
  ```

  mapping1在前面会优先把 **"测试文本"** 替换成 **"mapping1 test text"**

##### Example(使用默认配置)

 src/Save.tsx

```
import React from 'react'


interface ISaveProps {
    saveState: string,
    onSave?: () => void,
}

const Save: React.FC<ISaveProps> = (props) => {
    return (
        <div testAttr='测试属性'>
            测试文本
        </div>
    )
}

export default Save
```

执行

```
Node main.js -i Save.tsx -m test
```

输出 

 output/src/Save.tsx

```
import i18n from 'i18next'
import React from 'react'


interface ISaveProps {
    saveState: string,
    onSave?: () => void,
}

const Save: React.FC<ISaveProps> = (props) => {
    return (
        <div testAttr={i18n.t('test.testAttr')}>
            {i18n.t('test.test')}
        </div>
    )
}

export default Save
```

