import React from 'react'


interface ISaveProps {
    saveState: string,
    onSave?: () => void,
}

let xxxx = ''
const Save: React.FC<ISaveProps> = (props) => {
    return (
        <div testAttr={`测试属性${xxxx}${xxxx}`}>
            {xxxx}测试文本
        </div>
    )
}

export default Save
