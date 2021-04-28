import React from 'react'


interface ISaveProps {
    saveState: string,
    onSave?: () => void,
}

let xxxx = ''
const Save: React.FC<ISaveProps> = (props) => {
    return (
        <div testAttr={`测试属性${xxxx}${xxxx}`}>
            {xxxx}
        </div>
    )
}

export default Save
