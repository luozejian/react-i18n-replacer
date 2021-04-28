import i18n from "i18n-next";
import React from 'react';
import lodash from 'lodash';
interface ISaveProps {
  saveState: string;
  onSave?: () => void;
}
let xxxx = i18n.t('test.testAttr');

const Save: React.FC<ISaveProps> = props => {
  return <div testAttr={xxxx + i18n.t('test.testAttr') + ''} NIUBI={haha} SHABI={i18n.t('test.testAttr')}>
            {xxxx}{i18n.t('test.test')}
        </div>;
};

export default Save;