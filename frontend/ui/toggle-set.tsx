import React from 'react';
import Toggle from './toggle';

interface ToggleSetProps {
  toggle: {
    name: string;
    setting: string;
    desc: string;
  };
  values: any;
  handleToggle: any;
}

const ToggleSet = ({ toggle, values, handleToggle }: ToggleSetProps) => {
  return (
    <div className="toggle-set" key={toggle.setting}>
      <div className="settings-label">
        {toggle.name}{' '}
        <span className={'toggle-state'}>
          {values[toggle.setting] ? 'ON' : 'OFF'}
        </span>
        <div className="settings-desc">{toggle.desc}</div>
      </div>
      <Toggle
        state={values[toggle.setting]}
        handleToggle={(e) => handleToggle(e, toggle.setting)}
      />
    </div>
  );
};

export default ToggleSet;
