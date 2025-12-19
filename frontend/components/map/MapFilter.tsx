'use client';

import { useState } from 'react';

interface FilterOptions {
  types: string[];
  minScore: number;
  maxScore: number;
  radius: number;
}

interface MapFilterProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export default function MapFilter({ filters, onFilterChange }: MapFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const typeOptions = [
    { value: 'hospital', label: '병원', color: 'blue' },
    { value: 'prospect', label: '프로스펙트', color: 'green' },
    { value: 'pharmacy', label: '약국 슬롯', color: 'yellow' },
    { value: 'vacancy', label: '공실', color: 'red' },
  ];

  const radiusOptions = [500, 1000, 2000, 5000];

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFilterChange({ ...filters, types: newTypes });
  };

  const handleScoreChange = (field: 'minScore' | 'maxScore', value: number) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleRadiusChange = (radius: number) => {
    onFilterChange({ ...filters, radius });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* 필터 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium text-gray-900">필터</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 필터 내용 */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-6 border-t">
          {/* 유형 필터 */}
          <div className="pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">표시 유형</h4>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTypeToggle(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.types.includes(option.value)
                      ? `bg-${option.color}-100 text-${option.color}-800 border-2 border-${option.color}-500`
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 적합도 점수 필터 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              적합도 점수: {filters.minScore} - {filters.maxScore}점
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-8">최소</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.minScore}
                  onChange={(e) => handleScoreChange('minScore', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-600 w-8">{filters.minScore}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-8">최대</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.maxScore}
                  onChange={(e) => handleScoreChange('maxScore', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-600 w-8">{filters.maxScore}</span>
              </div>
            </div>
          </div>

          {/* 반경 필터 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">검색 반경</h4>
            <div className="flex gap-2">
              {radiusOptions.map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleRadiusChange(radius)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.radius === radius
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                </button>
              ))}
            </div>
          </div>

          {/* 필터 초기화 */}
          <button
            onClick={() =>
              onFilterChange({
                types: ['hospital', 'prospect', 'pharmacy', 'vacancy'],
                minScore: 0,
                maxScore: 100,
                radius: 2000,
              })
            }
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
          >
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
