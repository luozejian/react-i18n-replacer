import React from 'react';


interface ISaveProps {
  saveState: string;
  onSave?: () => void;}


let xxxx = '';
const Save: React.FC<ISaveProps> = props => {
  return (
    <div testAttr={`${i18n.t('test.testAttr')}${xxxx}${xxxx}`}>
            {xxxx}{i18n.t('test.test')}
        </div>);

};

export default Save;