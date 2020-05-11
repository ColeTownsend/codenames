import React from 'react';
import OriginalWords from '../words.json';

const WordSetToggle = ({ key, words, label, selected, onToggle }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      kay={key}
      className={selected ? 'btn-wordsettoggle selected' : 'btn-wordsettoggle'}
      onClick={onToggle}
    >
      {label}
    </div>
  );
};

export default WordSetToggle;
