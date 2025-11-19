'use client';

import { useState, useEffect } from 'react';

interface YearRangeFilterProps {
  minYear: number;
  maxYear: number;
  selectedMinYear: number;
  selectedMaxYear: number;
  onYearChange: (minYear: number, maxYear: number) => void;
  disabled?: boolean;
}

export default function YearRangeFilter({
  minYear,
  maxYear,
  selectedMinYear,
  selectedMaxYear,
  onYearChange,
  disabled = false,
}: YearRangeFilterProps) {
  const [localMinYear, setLocalMinYear] = useState(selectedMinYear);
  const [localMaxYear, setLocalMaxYear] = useState(selectedMaxYear);

  useEffect(() => {
    setLocalMinYear(selectedMinYear);
    setLocalMaxYear(selectedMaxYear);
  }, [selectedMinYear, selectedMaxYear]);

  const handleMinYearChange = (value: string) => {
    const year = parseInt(value);
    if (!isNaN(year)) {
      setLocalMinYear(year);
      onYearChange(year, localMaxYear);
    }
  };

  const handleMaxYearChange = (value: string) => {
    const year = parseInt(value);
    if (!isNaN(year)) {
      setLocalMaxYear(year);
      onYearChange(localMinYear, year);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Year Range (Optional)
      </label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label htmlFor="year-min" className="block text-xs text-gray-600 mb-1">
            From
          </label>
          <input
            id="year-min"
            type="number"
            min={minYear}
            max={maxYear}
            value={localMinYear}
            onChange={(e) => handleMinYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>
        <span className="text-gray-500 mt-6">—</span>
        <div className="flex-1">
          <label htmlFor="year-max" className="block text-xs text-gray-600 mb-1">
            To
          </label>
          <input
            id="year-max"
            type="number"
            min={minYear}
            max={maxYear}
            value={localMaxYear}
            onChange={(e) => handleMaxYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Selected range: {localMinYear} - {localMaxYear}
      </p>
    </div>
  );
}
