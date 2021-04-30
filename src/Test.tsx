import React from 'react'


interface ISaveProps {
    saveState: string,
    onSave?: () => void,
}

let xxxx = '测试文本'+hhhh
let ccc = `测试文本`
const Save: React.FC<ISaveProps> = (props) => {
    return (
        <div testAttr={`测试属性${xxxx}${xxxx}`}>
            {xxxx}
        </div>
    )
}

export default Save

