import i18n from "i18n-next";
import React from 'react';
interface ISaveProps {
  saveState: string;
  onSave?: () => void;
}
let xxxx = '';
let ccc = ``;

const Save: React.FC<ISaveProps> = props => {
  return <div testAttr={`${i18n.t('test.testAttr')}${xxxx}${xxxx}`}>
            {xxxx}
        </div>;
};

export default Save;