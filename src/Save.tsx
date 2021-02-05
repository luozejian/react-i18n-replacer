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
