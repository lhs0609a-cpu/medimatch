'use client';

import { useState } from 'react';

interface MapSearchBoxProps {
  onSearch: (address: string, lat: number, lng: number) => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapSearchBox({ onSearch }: MapSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!query.trim() || !window.kakao) return;

    setIsSearching(true);

    const geocoder = new window.kakao.maps.services.Geocoder();
    const places = new window.kakao.maps.services.Places();

    // 주소 검색
    geocoder.addressSearch(query, (result: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const firstResult = result[0];
        onSearch(
          firstResult.address_name,
          parseFloat(firstResult.y),
          parseFloat(firstResult.x)
        );
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      // 주소 검색 실패 시 장소 검색
      places.keywordSearch(query, (result: any[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          const firstResult = result[0];
          onSearch(
            firstResult.address_name || firstResult.place_name,
            parseFloat(firstResult.y),
            parseFloat(firstResult.x)
          );
          setSuggestions([]);
        }
        setIsSearching(false);
      });
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // 자동완성 (디바운스 적용 필요)
    if (value.length > 1 && window.kakao) {
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(value, (result: any[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSuggestions(result.slice(0, 5));
        } else {
          setSuggestions([]);
        }
      });
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (place: any) => {
    onSearch(
      place.address_name || place.place_name,
      parseFloat(place.y),
      parseFloat(place.x)
    );
    setQuery(place.place_name);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="주소 또는 장소를 검색하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 자동완성 목록 */}
      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, index) => (
            <li
              key={index}
              onClick={() => selectSuggestion(place)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
            >
              <p className="font-medium text-gray-900">{place.place_name}</p>
              <p className="text-sm text-gray-500">{place.address_name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
