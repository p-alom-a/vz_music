'use client';

import { useState, useEffect, useRef } from 'react';

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
    if (!isNaN(year) && year <= localMaxYear) {
      setLocalMinYear(year);
      onYearChange(year, localMaxYear);
    }
  };

  const handleMaxYearChange = (value: string) => {
    const year = parseInt(value);
    if (!isNaN(year) && year >= localMinYear) {
      setLocalMaxYear(year);
      onYearChange(localMinYear, year);
    }
  };

  // Calculate percentages for visual slider
  const minPercent = ((localMinYear - minYear) / (maxYear - minYear)) * 100;
  const maxPercent = ((localMaxYear - minYear) / (maxYear - minYear)) * 100;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Year Range (Optional)
      </label>

      {/* Range Slider */}
      <div className="relative pt-1 px-2">
        {/* Background track */}
        <div className="relative h-2 bg-gray-200 rounded-full">
          {/* Active range highlight */}
          <div
            className="absolute h-2 bg-blue-500 rounded-full"
            style={{
              left: `${minPercent}%`,
              right: `${100 - maxPercent}%`,
            }}
          />
        </div>

        {/* Min slider */}
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={localMinYear}
          onChange={(e) => handleMinYearChange(e.target.value)}
          disabled={disabled}
          className="absolute w-full h-2 top-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
          style={{ zIndex: localMinYear > maxYear - 100 ? 5 : 3 }}
        />

        {/* Max slider */}
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={localMaxYear}
          onChange={(e) => handleMaxYearChange(e.target.value)}
          disabled={disabled}
          className="absolute w-full h-2 top-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Year labels */}
      <div className="flex justify-between items-center mt-6 px-1">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">From</div>
          <div className="text-sm font-semibold text-gray-700">{localMinYear}</div>
        </div>
        <div className="text-gray-400">—</div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">To</div>
          <div className="text-sm font-semibold text-gray-700">{localMaxYear}</div>
        </div>
      </div>
    </div>
  );
}
