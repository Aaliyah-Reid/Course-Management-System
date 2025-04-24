import React from 'react';

interface PasswordStrengthIndicatorProps {
  strength: number; // 0-4 (0: empty, 1: very weak, 2: weak, 3: medium, 4: strong)
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ strength }) => {
  const getStrengthText = (): string => {
    switch (strength) {
      case 0:
        return '';
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Medium';
      case 4:
        return 'Strong';
      default:
        return '';
    }
  };

  const getTextColor = (): string => {
    switch (strength) {
      case 0:
        return 'text-gray-400';
      case 1:
        return 'text-red-500';
      case 2:
        return 'text-orange-500';
      case 3:
        return 'text-yellow-500';
      case 4:
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const strengthText = getStrengthText();
  
  if (strength === 0) return null;
  
  return (
    <div className="mt-1 mb-2">
      <div className="flex justify-between mb-1">
        <span className={`text-xs ${getTextColor()}`}>{strengthText}</span>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              level <= strength
                ? level === 1
                  ? 'bg-red-500'
                  : level === 2
                  ? 'bg-orange-500'
                  : level === 3
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;