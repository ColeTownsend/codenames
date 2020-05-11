import React from 'react';

interface ToggleProps {
  state: boolean;
  handleToggle: any;
}

const Toggle = ({ state, handleToggle }: ToggleProps) => {
  return (
    <div
      onClick={handleToggle}
      className={state ? 'toggle active' : 'toggle inactive'}
    >
      <div className="switch"></div>
    </div>
  );
};

export default Toggle;
