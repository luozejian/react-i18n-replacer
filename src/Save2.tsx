import React from 'react'


interface ISaveProps {
    saveState: string,
    onSave?: () => void,
}

let xxxx = '测试属性'
const Save: React.FC<ISaveProps> = (props) => {
    return (
        <div testAttr={xxxx+"测试属性"+''} NIUBI={haha} SHABI="测试属性">
            {xxxx}测试文本
        </div>
    )
}

export default Save
