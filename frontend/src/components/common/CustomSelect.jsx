import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select an option", 
  className = "",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white dark:bg-[#1C1C1E] flex items-center justify-between rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-white/5' : 'cursor-pointer hover:border-slate-400'}`}
      >
        <span className={`block truncate ${selectedOption ? 'text-textPrimary dark:text-white' : 'text-textSecondary dark:text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-textSecondary dark:text-gray-400 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-mac-btn shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={String(value) === String(option.value)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5
                  ${String(value) === String(option.value) ? 'bg-primary/5 text-primary font-medium' : 'text-textSecondary dark:text-gray-400'}`}
              >
                <span className="block truncate">{option.label}</span>
                {String(value) === String(option.value) && <Check size={16} className="shrink-0 ml-2" />}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-textSecondary dark:text-gray-400 text-center">No options available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
