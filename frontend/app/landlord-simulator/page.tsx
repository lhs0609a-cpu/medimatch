'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2, MapPin, Train, Users, Car,
  Zap, Clock, ShieldCheck,
  Wind, Flame, Landmark, Pill, Cross, Banknote,
  CreditCard, Receipt, HeartHandshake, ArrowRight, ArrowLeft,
  TrendingUp, AlertTriangle, CheckCircle2,
  ChevronDown, Info, BarChart3, Target, Stethoscope,
  CircleDollarSign, HelpCircle, Sparkles
} from 'lucide-react';

/* ─────────────────────────── types ─────────────────────────── */

interface FormState {
  // 1. 입지
  areaType: string;
  subwayAccess: string;
  busAccess: boolean;
  footTraffic: string;
  roadAccess: string;
  parkingConvenience: string;
  // 2. 건물 조건
  floor: string;
  area: number;
  parkingSpaces: string;
  elevator: boolean;
  buildingAge: string;
  infrastructure: string;
  // 3. 상권/수요
  population: string;
  ageGroup: string;
  nearbyClinics: string;
  nearbyPharmacy: string;
  nearbyHospital: boolean;
  // 4. 재무 매력도
  depositLevel: string;
  rentLevel: string;
  maintenanceFee: string;
  premium: string;
  leaseFlexibility: string;
  // 5. 법적/시설
  buildingUse: string;
  accessibility: boolean;
  fireSafety: string;
  ventilation: string;
}

interface ScoreBreakdown {
  location: number;
  building: number;
  market: number;
  financial: number;
  legal: number;
}

interface CategoryDetail {
  label: string;
  max: number;
  score: number;
  items: { name: string; score: number; max: number }[];
}

interface Recommendation {
  specialty: string;
  score: number;
  reason: string;
}

/* ─────────────────────────── constants ─────────────────────────── */

const INITIAL_STATE: FormState = {
  areaType: '', subwayAccess: '', busAccess: false, footTraffic: '',
  roadAccess: '', parkingConvenience: '',
  floor: '', area: 35, parkingSpaces: '', elevator: false,
  buildingAge: '', infrastructure: '',
  population: '', ageGroup: '', nearbyClinics: '', nearbyPharmacy: '',
  nearbyHospital: false,
  depositLevel: '', rentLevel: '', maintenanceFee: '', premium: '',
  leaseFlexibility: '',
  buildingUse: '', accessibility: false, fireSafety: '', ventilation: '',
};

const AREA_TYPES = [
  { value: 'medical', label: '의료밀집지역', desc: '병원/의원이 밀집된 지역' },
  { value: 'station', label: '역세권', desc: '지하철역 인근 상업지대' },
  { value: 'commercial', label: '상업지역', desc: '일반 상업/업무지구' },
  { value: 'residential', label: '주거밀집지역', desc: '아파트/주택 밀집 지역' },
  { value: 'newtown', label: '신도시', desc: '신규 택지/개발지구' },
  { value: 'other', label: '기타', desc: '위에 해당하지 않는 지역' },
];

const FLOORS = [
  { value: '1F', label: '1층' },
  { value: '2F', label: '2층' },
  { value: '3F', label: '3층' },
  { value: '4F+', label: '4~5층' },
  { value: 'high', label: '6층 이상' },
  { value: 'B1', label: '지하 1층' },
];

/* ─────────────────────────── scoring engine ─────────────────────────── */

function calcLocationScore(s: FormState) {
  const items: { name: string; score: number; max: number }[] = [];

  // 지역 유형 (8점)
  const areaMap: Record<string, number> = { medical: 8, station: 7, commercial: 6, residential: 5, newtown: 4, other: 2 };
  items.push({ name: '지역 유형', score: areaMap[s.areaType] ?? 0, max: 8 });

  // 대중교통 (6점)
  const subwayMap: Record<string, number> = { '5min': 6, '10min': 4, '15min+': 2 };
  let transit = subwayMap[s.subwayAccess] ?? 0;
  if (s.busAccess && transit > 0) transit = Math.min(transit + 1, 6);
  items.push({ name: '대중교통', score: transit, max: 6 });

  // 유동인구 (5점)
  const footMap: Record<string, number> = { veryHigh: 5, high: 4, medium: 3, low: 1 };
  items.push({ name: '유동인구', score: footMap[s.footTraffic] ?? 0, max: 5 });

  // 도로 접근성 (3점)
  const roadMap: Record<string, number> = { main: 3, side: 2, alley: 1 };
  items.push({ name: '주요도로 접근성', score: roadMap[s.roadAccess] ?? 0, max: 3 });

  // 주차 편의성 (3점)
  const pConvMap: Record<string, number> = { public: 3, paid: 2, poor: 1 };
  items.push({ name: '주차 편의성(주변)', score: pConvMap[s.parkingConvenience] ?? 0, max: 3 });

  const total = items.reduce((a, b) => a + b.score, 0);
  return { label: '입지', max: 25, score: total, items };
}

function calcBuildingScore(s: FormState) {
  const items: { name: string; score: number; max: number }[] = [];

  // 층수 (6점)
  const floorMap: Record<string, number> = { '1F': 6, '2F': 5, '3F': 4, '4F+': 3, B1: 2, high: 1 };
  items.push({ name: '해당 층수', score: floorMap[s.floor] ?? 0, max: 6 });

  // 전용면적 (6점)
  let areaScore = 2;
  if (s.area >= 30 && s.area <= 50) areaScore = 6;
  else if (s.area > 50 && s.area <= 80) areaScore = 5;
  else if (s.area >= 20 && s.area < 30) areaScore = 4;
  else if (s.area > 80) areaScore = 3;
  items.push({ name: '전용면적', score: areaScore, max: 6 });

  // 주차 (4점)
  const parkMap: Record<string, number> = { '10+': 4, '5-9': 3, '1-4': 2, none: 0 };
  items.push({ name: '주차', score: parkMap[s.parkingSpaces] ?? 0, max: 4 });

  // 엘리베이터 (3점) — 2층 이상 필수
  const needElevator = ['2F', '3F', '4F+', 'high'].includes(s.floor);
  const elevScore = s.elevator ? 3 : (needElevator ? 0 : 3);
  items.push({ name: '엘리베이터', score: elevScore, max: 3 });

  // 건물 연식 (3점)
  const ageMap: Record<string, number> = { new5: 3, yr10: 2, yr20: 1, old: 0 };
  items.push({ name: '건물 연식', score: ageMap[s.buildingAge] ?? 0, max: 3 });

  // 전기/급배수 (3점)
  const infraMap: Record<string, number> = { suitable: 3, reinforce: 1, unsuitable: 0 };
  items.push({ name: '전기/급배수 용량', score: infraMap[s.infrastructure] ?? 0, max: 3 });

  const total = items.reduce((a, b) => a + b.score, 0);
  return { label: '건물 조건', max: 25, score: total, items };
}

function calcMarketScore(s: FormState) {
  const items: { name: string; score: number; max: number }[] = [];

  const popMap: Record<string, number> = { '50k+': 5, '30-50k': 4, '10-30k': 3, '<10k': 1 };
  items.push({ name: '반경 500m 인구', score: popMap[s.population] ?? 0, max: 5 });

  const ageMap: Record<string, number> = { senior: 5, balanced: 3, young: 2 };
  items.push({ name: '연령대 구성', score: ageMap[s.ageGroup] ?? 0, max: 5 });

  const clinicMap: Record<string, number> = { optimal: 5, few: 3, none: 2, overcrowded: 1 };
  items.push({ name: '인근 의원 수', score: clinicMap[s.nearbyClinics] ?? 0, max: 5 });

  const pharmMap: Record<string, number> = { '3min': 3, '5min': 2, none: 0 };
  items.push({ name: '인근 약국', score: pharmMap[s.nearbyPharmacy] ?? 0, max: 3 });

  items.push({ name: '인근 종합병원', score: s.nearbyHospital ? 2 : 0, max: 2 });

  const total = items.reduce((a, b) => a + b.score, 0);
  return { label: '상권/수요', max: 20, score: total, items };
}

function calcFinancialScore(s: FormState) {
  const items: { name: string; score: number; max: number }[] = [];

  const lvlMap: Record<string, number> = { below: 5, average: 3, above: 1 };
  items.push({ name: '보증금 수준', score: lvlMap[s.depositLevel] ?? 0, max: 5 });
  items.push({ name: '월 임대료', score: lvlMap[s.rentLevel] ?? 0, max: 5 });

  const maintMap: Record<string, number> = { low: 3, mid: 2, high: 1 };
  items.push({ name: '관리비', score: maintMap[s.maintenanceFee] ?? 0, max: 3 });

  const premMap: Record<string, number> = { none: 4, '50m': 3, '100m': 2, '100m+': 1 };
  items.push({ name: '권리금', score: premMap[s.premium] ?? 0, max: 4 });

  const flexMap: Record<string, number> = { full: 3, partial: 2, none: 1 };
  items.push({ name: '임대 조건 유연성', score: flexMap[s.leaseFlexibility] ?? 0, max: 3 });

  const total = items.reduce((a, b) => a + b.score, 0);
  return { label: '재무 매력도', max: 20, score: total, items };
}

function calcLegalScore(s: FormState) {
  const items: { name: string; score: number; max: number }[] = [];

  const useMap: Record<string, number> = { medical: 4, check: 2, impossible: 0 };
  items.push({ name: '의료기관 개설 가능 용도', score: useMap[s.buildingUse] ?? 0, max: 4 });

  items.push({ name: '장애인 접근성', score: s.accessibility ? 2 : 0, max: 2 });

  const fireMap: Record<string, number> = { ok: 2, reinforce: 1, fail: 0 };
  items.push({ name: '소방/안전 기준', score: fireMap[s.fireSafety] ?? 0, max: 2 });

  const ventMap: Record<string, number> = { good: 2, normal: 1, poor: 0 };
  items.push({ name: '환기/채광', score: ventMap[s.ventilation] ?? 0, max: 2 });

  const total = items.reduce((a, b) => a + b.score, 0);
  return { label: '법적/시설', max: 10, score: total, items };
}

/** S-curve: f(x) = 5 + 94 / (1 + e^(-0.12*(x-50))) — maps 0-100 score → ~5-99% */
function scoreToProbability(score: number): number {
  const raw = 5 + 94 / (1 + Math.exp(-0.12 * (score - 50)));
  return Math.round(Math.min(99, Math.max(5, raw)));
}

function getGrade(score: number): { label: string; color: string; bgClass: string; textClass: string; ringClass: string } {
  if (score >= 85) return { label: '최상', color: '#22c55e', bgClass: 'bg-green-500', textClass: 'text-green-600', ringClass: 'ring-green-400' };
  if (score >= 70) return { label: '우수', color: '#16a34a', bgClass: 'bg-green-600', textClass: 'text-green-600', ringClass: 'ring-green-400' };
  if (score >= 55) return { label: '양호', color: '#3b82f6', bgClass: 'bg-blue-500', textClass: 'text-blue-600', ringClass: 'ring-blue-400' };
  if (score >= 40) return { label: '보통', color: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-600', ringClass: 'ring-amber-400' };
  if (score >= 25) return { label: '미흡', color: '#ef4444', bgClass: 'bg-red-500', textClass: 'text-red-600', ringClass: 'ring-red-400' };
  return { label: '부적합', color: '#dc2626', bgClass: 'bg-red-700', textClass: 'text-red-700', ringClass: 'ring-red-600' };
}

/* ─────────────── 진료과 추천 로직 ─────────────── */

interface SpecialtyCandidate {
  name: string;
  baseScore: number;
  reason: string;
}

function getSpecialtyRecommendations(s: FormState, _breakdown: ScoreBreakdown): Recommendation[] {
  const candidates: SpecialtyCandidate[] = [];
  const f = s.floor;
  const a = s.area;
  const isLowFloor = ['1F'].includes(f);
  const isMidFloor = ['2F', '3F'].includes(f);
  const isHighFloor = ['4F+', 'high'].includes(f);
  const hasManyParking = s.parkingSpaces === '10+' || s.parkingSpaces === '5-9';
  const isSenior = s.ageGroup === 'senior';
  const isYoung = s.ageGroup === 'young';

  // 1층 + 20~30평
  if (isLowFloor && a >= 20 && a < 30) {
    candidates.push({ name: '한의원', baseScore: 90, reason: '1층 소규모 공간에 최적화' });
    candidates.push({ name: '약국', baseScore: 88, reason: '1층 접근성 좋은 소형 공간' });
  }
  // 1층 + 30~50평
  if (isLowFloor && a >= 30 && a <= 50) {
    candidates.push({ name: '피부과', baseScore: 92, reason: '1층 가시성 + 적정 면적' });
    candidates.push({ name: '이비인후과', baseScore: 85, reason: '1층 접근성 우수' });
    candidates.push({ name: '소아청소년과', baseScore: 87, reason: '유모차 접근 용이한 1층' });
  }
  // 2~3층 + 30~50평
  if (isMidFloor && a >= 30 && a <= 50) {
    candidates.push({ name: '내과', baseScore: 91, reason: '가장 보편적인 의원 입지 조건' });
    candidates.push({ name: '정형외과', baseScore: 85, reason: '적정 층수 및 면적' });
    candidates.push({ name: '비뇨기과', baseScore: 82, reason: '프라이버시 확보 가능한 층수' });
  }
  // 2~3층 + 50~80평
  if (isMidFloor && a > 50 && a <= 80) {
    candidates.push({ name: '안과', baseScore: 90, reason: '장비 배치 가능한 넓은 공간' });
    candidates.push({ name: '치과', baseScore: 93, reason: '유닛 체어 배치에 이상적' });
    candidates.push({ name: '산부인과', baseScore: 80, reason: '충분한 진료 공간 확보' });
  }
  // 고층 / 80평+
  if (isHighFloor || a > 80) {
    candidates.push({ name: '성형외과', baseScore: 88, reason: '넓은 공간 + 프라이버시' });
    candidates.push({ name: '재활의학과', baseScore: 84, reason: '운동치료실 확보 가능' });
    candidates.push({ name: '정신건강의학과', baseScore: 86, reason: '조용한 고층 + 넓은 공간' });
  }

  // 범용 후보 (조건 폭이 넓은 경우)
  if (candidates.length < 3) {
    if (a >= 30 && a <= 50) candidates.push({ name: '내과', baseScore: 78, reason: '가장 범용적인 진료과' });
    if (a >= 25 && a <= 60) candidates.push({ name: '피부과', baseScore: 76, reason: '다양한 조건에서 개원 가능' });
    if (a >= 30) candidates.push({ name: '치과', baseScore: 75, reason: '면적 충분 시 개원 가능' });
    if (a >= 20) candidates.push({ name: '한의원', baseScore: 72, reason: '소규모에서도 운영 가능' });
  }

  // 가산점
  candidates.forEach((c) => {
    if (hasManyParking && (c.name === '정형외과' || c.name === '안과')) c.baseScore += 5;
    if (isSenior && ['내과', '정형외과', '비뇨기과'].includes(c.name)) c.baseScore += 5;
    if (isYoung && ['피부과', '성형외과', '정신건강의학과'].includes(c.name)) c.baseScore += 5;
  });

  // 중복 제거 후 정렬
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  return unique
    .sort((a, b) => b.baseScore - a.baseScore)
    .slice(0, 5)
    .map((c) => ({ specialty: c.name, score: c.baseScore, reason: c.reason }));
}

/* ─────────────── 개선 권고사항 ─────────────── */

function getImprovements(categories: CategoryDetail[]) {
  const allItems: { name: string; score: number; max: number; category: string; potential: number }[] = [];
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      if (item.score < item.max) {
        allItems.push({ ...item, category: cat.label, potential: item.max - item.score });
      }
    });
  });
  allItems.sort((a, b) => b.potential - a.potential);
  return allItems.slice(0, 3);
}

/* ─────────────── UI helper components ─────────────── */

function SelectField({
  label, value, onChange, options, icon: Icon, hint
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string; desc?: string }[];
  icon?: React.ElementType; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {hint && (
          <span className="ml-1.5 inline-flex items-center">
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          </span>
        )}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none`}
        >
          <option value="">선택해주세요</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}{o.desc ? ` — ${o.desc}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function ToggleField({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
          ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </label>
  );
}

function SliderField({ label, value, onChange, min, max, step, unit, marks }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string;
  marks?: { value: number; label: string }[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-blue-600">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
      {marks && (
        <div className="flex justify-between mt-1">
          {marks.map((m) => (
            <span key={m.value} className="text-xs text-gray-400">{m.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── circular gauge ─── */

function CircularGauge({ probability, grade }: { probability: number; grade: ReturnType<typeof getGrade> }) {
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (probability / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="200" height="200" className="transform -rotate-90">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx="100" cy="100" r={radius} fill="none"
          stroke={grade.color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: grade.color }}>{probability}%</span>
        <span className={`text-sm font-semibold mt-1 ${grade.textClass}`}>{grade.label}</span>
      </div>
      {probability >= 85 && (
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
      )}
    </div>
  );
}

/* ─── score bar ─── */

function ScoreBar({ category }: { category: CategoryDetail }) {
  const pct = category.max > 0 ? (category.score / category.max) * 100 : 0;
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{category.label}</span>
        <span className="text-sm font-bold text-gray-900">{category.score}/{category.max}점</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function LandlordSimulatorPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [activeSection, setActiveSection] = useState<number>(0);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* ── compute all scores ── */
  const analysis = useMemo(() => {
    const location = calcLocationScore(form);
    const building = calcBuildingScore(form);
    const market = calcMarketScore(form);
    const financial = calcFinancialScore(form);
    const legal = calcLegalScore(form);

    const categories: CategoryDetail[] = [location, building, market, financial, legal];
    const totalScore = categories.reduce((a, c) => a + c.score, 0);
    const breakdown: ScoreBreakdown = {
      location: location.score,
      building: building.score,
      market: market.score,
      financial: financial.score,
      legal: legal.score,
    };
    const probability = scoreToProbability(totalScore);
    const grade = getGrade(totalScore);
    const recommendations = getSpecialtyRecommendations(form, breakdown);
    const improvements = getImprovements(categories);

    return { categories, totalScore, breakdown, probability, grade, recommendations, improvements };
  }, [form]);

  const hasAnyInput = Object.entries(form).some(([, v]) => v !== '' && v !== false && v !== 35);

  /* ── sections for accordion ── */
  const sections = [
    { id: 0, title: '입지 조건', icon: MapPin, desc: '지역 유형, 교통, 유동인구' },
    { id: 1, title: '건물 조건', icon: Building2, desc: '층수, 면적, 주차, 시설' },
    { id: 2, title: '상권/수요', icon: Users, desc: '인구, 연령, 인근 의원' },
    { id: 3, title: '재무 매력도', icon: Banknote, desc: '임대료, 권리금, 조건' },
    { id: 4, title: '법적/시설 적합성', icon: ShieldCheck, desc: '용도, 안전, 접근성' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Link href="/" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm mb-4">
                <Target className="w-4 h-4" />
                <span>건물주 전용 분석 도구</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                병원 입점 확률<br className="hidden sm:block" /> 시뮬레이터
              </h1>
              <p className="mt-3 text-blue-100 text-base md:text-lg max-w-xl">
                건물 조건을 입력하면 의료기관 입점 가능성을 AI가 실시간으로 분석합니다.
                5개 카테고리, 22개 항목을 종합 평가하여 맞춤형 전략을 제안합니다.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-center bg-white/10 backdrop-blur rounded-2xl p-6 min-w-[180px]">
              <Stethoscope className="w-12 h-12 text-blue-200 mb-2" />
              <span className="text-2xl font-bold">{analysis.probability}%</span>
              <span className="text-sm text-blue-200">현재 입점 확률</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Section tabs (mobile) */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${activeSection === sec.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                >
                  {sec.title}
                </button>
              ))}
            </div>

            {/* ── Section 0: 입지 ── */}
            <FormSection
              section={sections[0]}
              open={activeSection === 0}
              onToggle={() => setActiveSection(activeSection === 0 ? -1 : 0)}
              score={analysis.categories[0]}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">지역 유형</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AREA_TYPES.map((at) => (
                      <button
                        key={at.value}
                        onClick={() => set('areaType', at.value)}
                        className={`p-3 rounded-lg border text-left transition-all text-sm
                          ${form.areaType === at.value
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                        <span className="font-medium block">{at.label}</span>
                        <span className="text-xs text-gray-500">{at.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <SelectField
                  label="지하철 접근성"
                  value={form.subwayAccess}
                  onChange={(v) => set('subwayAccess', v)}
                  icon={Train}
                  options={[
                    { value: '5min', label: '도보 5분 이내' },
                    { value: '10min', label: '도보 10분 이내' },
                    { value: '15min+', label: '도보 15분 이상' },
                  ]}
                />
                <div className="flex flex-col justify-end">
                  <ToggleField
                    label="버스 정류장 도보 3분 이내"
                    checked={form.busAccess}
                    onChange={(v) => set('busAccess', v)}
                  />
                </div>
                <SelectField
                  label="유동인구"
                  value={form.footTraffic}
                  onChange={(v) => set('footTraffic', v)}
                  icon={Users}
                  options={[
                    { value: 'veryHigh', label: '매우 높음' },
                    { value: 'high', label: '높음' },
                    { value: 'medium', label: '보통' },
                    { value: 'low', label: '낮음' },
                  ]}
                />
                <SelectField
                  label="주요도로 접근성"
                  value={form.roadAccess}
                  onChange={(v) => set('roadAccess', v)}
                  icon={MapPin}
                  options={[
                    { value: 'main', label: '대로변' },
                    { value: 'side', label: '이면도로' },
                    { value: 'alley', label: '골목' },
                  ]}
                />
                <SelectField
                  label="주변 주차 편의성"
                  value={form.parkingConvenience}
                  onChange={(v) => set('parkingConvenience', v)}
                  icon={Car}
                  options={[
                    { value: 'public', label: '공영주차장 인근' },
                    { value: 'paid', label: '유료주차 가능' },
                    { value: 'poor', label: '주차 불편' },
                  ]}
                />
              </div>
            </FormSection>

            {/* ── Section 1: 건물 조건 ── */}
            <FormSection
              section={sections[1]}
              open={activeSection === 1}
              onToggle={() => setActiveSection(activeSection === 1 ? -1 : 1)}
              score={analysis.categories[1]}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">해당 층수</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {FLOORS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => set('floor', f.value)}
                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all text-center
                          ${form.floor === f.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <SliderField
                    label="전용면적"
                    value={form.area}
                    onChange={(v) => set('area', v)}
                    min={10} max={120} step={5}
                    unit="평"
                    marks={[
                      { value: 10, label: '10평' },
                      { value: 30, label: '30평' },
                      { value: 50, label: '50평' },
                      { value: 80, label: '80평' },
                      { value: 120, label: '120평' },
                    ]}
                  />
                </div>
                <SelectField
                  label="건물 내 주차"
                  value={form.parkingSpaces}
                  onChange={(v) => set('parkingSpaces', v)}
                  icon={Car}
                  options={[
                    { value: '10+', label: '10대 이상' },
                    { value: '5-9', label: '5~9대' },
                    { value: '1-4', label: '1~4대' },
                    { value: 'none', label: '주차 불가' },
                  ]}
                />
                <div className="flex flex-col justify-end">
                  <ToggleField
                    label="엘리베이터"
                    checked={form.elevator}
                    onChange={(v) => set('elevator', v)}
                    description={['2F', '3F', '4F+', 'high'].includes(form.floor) ? '2층 이상 필수 항목' : undefined}
                  />
                </div>
                <SelectField
                  label="건물 연식"
                  value={form.buildingAge}
                  onChange={(v) => set('buildingAge', v)}
                  icon={Clock}
                  options={[
                    { value: 'new5', label: '5년 이내 / 리모델링' },
                    { value: 'yr10', label: '10년 이내' },
                    { value: 'yr20', label: '20년 이내' },
                    { value: 'old', label: '20년 초과' },
                  ]}
                />
                <SelectField
                  label="전기/급배수 용량"
                  value={form.infrastructure}
                  onChange={(v) => set('infrastructure', v)}
                  icon={Zap}
                  hint="의료기기 운영 가능 여부"
                  options={[
                    { value: 'suitable', label: '의료기관 적합' },
                    { value: 'reinforce', label: '보강 필요' },
                    { value: 'unsuitable', label: '부적합' },
                  ]}
                />
              </div>
            </FormSection>

            {/* ── Section 2: 상권/수요 ── */}
            <FormSection
              section={sections[2]}
              open={activeSection === 2}
              onToggle={() => setActiveSection(activeSection === 2 ? -1 : 2)}
              score={analysis.categories[2]}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="반경 500m 인구수"
                  value={form.population}
                  onChange={(v) => set('population', v)}
                  icon={Users}
                  options={[
                    { value: '50k+', label: '5만 이상' },
                    { value: '30-50k', label: '3~5만' },
                    { value: '10-30k', label: '1~3만' },
                    { value: '<10k', label: '1만 미만' },
                  ]}
                />
                <SelectField
                  label="주요 연령대 구성"
                  value={form.ageGroup}
                  onChange={(v) => set('ageGroup', v)}
                  icon={Users}
                  options={[
                    { value: 'senior', label: '고령화 (40대+ 비율 높음)' },
                    { value: 'balanced', label: '균형 잡힘' },
                    { value: 'young', label: '20~30대 위주' },
                  ]}
                />
                <SelectField
                  label="반경 500m 인근 의원 수"
                  value={form.nearbyClinics}
                  onChange={(v) => set('nearbyClinics', v)}
                  icon={Cross}
                  options={[
                    { value: 'optimal', label: '적정 (3~8개)' },
                    { value: 'few', label: '소수 (1~2개)' },
                    { value: 'none', label: '없음' },
                    { value: 'overcrowded', label: '과밀 (15개 이상)' },
                  ]}
                />
                <SelectField
                  label="인근 약국 접근성"
                  value={form.nearbyPharmacy}
                  onChange={(v) => set('nearbyPharmacy', v)}
                  icon={Pill}
                  options={[
                    { value: '3min', label: '도보 3분 이내' },
                    { value: '5min', label: '도보 5분 이내' },
                    { value: 'none', label: '없음' },
                  ]}
                />
                <ToggleField
                  label="반경 1km 내 종합병원"
                  checked={form.nearbyHospital}
                  onChange={(v) => set('nearbyHospital', v)}
                  description="종합병원이 있으면 의원 수요 견인"
                />
              </div>
            </FormSection>

            {/* ── Section 3: 재무 매력도 ── */}
            <FormSection
              section={sections[3]}
              open={activeSection === 3}
              onToggle={() => setActiveSection(activeSection === 3 ? -1 : 3)}
              score={analysis.categories[3]}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="보증금 수준"
                  value={form.depositLevel}
                  onChange={(v) => set('depositLevel', v)}
                  icon={Banknote}
                  options={[
                    { value: 'below', label: '지역 평균 이하' },
                    { value: 'average', label: '지역 평균' },
                    { value: 'above', label: '지역 평균 초과' },
                  ]}
                />
                <SelectField
                  label="월 임대료 수준"
                  value={form.rentLevel}
                  onChange={(v) => set('rentLevel', v)}
                  icon={CircleDollarSign}
                  options={[
                    { value: 'below', label: '지역 평균 이하' },
                    { value: 'average', label: '지역 평균' },
                    { value: 'above', label: '지역 평균 초과' },
                  ]}
                />
                <SelectField
                  label="관리비"
                  value={form.maintenanceFee}
                  onChange={(v) => set('maintenanceFee', v)}
                  icon={Receipt}
                  options={[
                    { value: 'low', label: '15만원 이하' },
                    { value: 'mid', label: '15~30만원' },
                    { value: 'high', label: '30만원 이상' },
                  ]}
                />
                <SelectField
                  label="권리금"
                  value={form.premium}
                  onChange={(v) => set('premium', v)}
                  icon={CreditCard}
                  options={[
                    { value: 'none', label: '없음' },
                    { value: '50m', label: '5천만원 이하' },
                    { value: '100m', label: '1억원 이하' },
                    { value: '100m+', label: '1억원 초과' },
                  ]}
                />
                <SelectField
                  label="임대 조건 유연성"
                  value={form.leaseFlexibility}
                  onChange={(v) => set('leaseFlexibility', v)}
                  icon={HeartHandshake}
                  hint="인테리어 기간 무료, 장기계약 등"
                  options={[
                    { value: 'full', label: '매우 유연 (무료 기간 + 장기 가능)' },
                    { value: 'partial', label: '일부 유연' },
                    { value: 'none', label: '유연하지 않음' },
                  ]}
                />
              </div>
            </FormSection>

            {/* ── Section 4: 법적/시설 ── */}
            <FormSection
              section={sections[4]}
              open={activeSection === 4}
              onToggle={() => setActiveSection(activeSection === 4 ? -1 : 4)}
              score={analysis.categories[4]}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="의료기관 개설 가능 용도"
                  value={form.buildingUse}
                  onChange={(v) => set('buildingUse', v)}
                  icon={Landmark}
                  options={[
                    { value: 'medical', label: '의료시설/근린생활시설' },
                    { value: 'check', label: '확인 필요' },
                    { value: 'impossible', label: '개설 불가' },
                  ]}
                />
                <SelectField
                  label="소방/안전 기준"
                  value={form.fireSafety}
                  onChange={(v) => set('fireSafety', v)}
                  icon={Flame}
                  options={[
                    { value: 'ok', label: '충족' },
                    { value: 'reinforce', label: '보강 필요' },
                    { value: 'fail', label: '미충족' },
                  ]}
                />
                <ToggleField
                  label="장애인 접근성 충족"
                  checked={form.accessibility}
                  onChange={(v) => set('accessibility', v)}
                  description="경사로, 장애인 화장실 등"
                />
                <SelectField
                  label="환기/채광"
                  value={form.ventilation}
                  onChange={(v) => set('ventilation', v)}
                  icon={Wind}
                  options={[
                    { value: 'good', label: '양호' },
                    { value: 'normal', label: '보통' },
                    { value: 'poor', label: '불량' },
                  ]}
                />
              </div>
            </FormSection>
          </div>

          {/* ── Right: Results Panel ── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-5">
              {/* Probability Gauge */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  종합 분석 결과
                </h2>
                <div className="flex justify-center mb-5">
                  <CircularGauge probability={analysis.probability} grade={analysis.grade} />
                </div>
                <div className="text-center mb-5">
                  <p className="text-sm text-gray-500">
                    총점 <span className="font-bold text-gray-900">{analysis.totalScore}</span>/100점
                  </p>
                  {hasAnyInput ? (
                    <p className="text-xs text-gray-400 mt-1">입력 항목을 변경하면 실시간 반영됩니다</p>
                  ) : (
                    <p className="text-xs text-blue-500 mt-1 flex items-center justify-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      왼쪽 폼을 채워주세요
                    </p>
                  )}
                </div>

                {/* 5 category bars */}
                <div className="space-y-3">
                  {analysis.categories.map((cat) => (
                    <ScoreBar key={cat.label} category={cat} />
                  ))}
                </div>
              </div>

              {/* 추천 진료과 */}
              {hasAnyInput && analysis.recommendations.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    추천 입점 진료과 Top {analysis.recommendations.length}
                  </h2>
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, idx) => (
                      <div key={rec.specialty} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                          ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-700'}`}
                          style={idx > 2 ? { backgroundColor: '#94a3b8' } : undefined}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">{rec.specialty}</span>
                            <span className="text-xs font-medium text-blue-600">{rec.score}점</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{rec.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 개선 권고사항 */}
              {hasAnyInput && analysis.improvements.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    개선 권고사항
                  </h2>
                  <div className="space-y-3">
                    {analysis.improvements.map((imp) => {
                      const potentialProbIncrease = Math.round(
                        (imp.potential / 100) * 94 * 0.12 * Math.exp(-0.12 * Math.abs(analysis.totalScore - 50)) * 10
                      ) || 1;
                      return (
                        <div key={imp.name} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{imp.name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              현재 {imp.score}/{imp.max}점 ({imp.category}) —
                              <span className="text-green-600 font-medium"> 개선 시 +{potentialProbIncrease}% 상승 가능</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 임대수익 비교 */}
              {hasAnyInput && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    임대수익 비교
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">일반 상가 임대</p>
                      <p className="text-xl font-bold text-gray-700">100%</p>
                      <p className="text-xs text-gray-400 mt-1">기준 수익</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-600 mb-1">의료기관 임대</p>
                      <p className="text-xl font-bold text-blue-700">
                        {analysis.totalScore >= 70 ? '150' : analysis.totalScore >= 50 ? '140' : '130'}%
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        평균 {analysis.totalScore >= 70 ? '1.5' : analysis.totalScore >= 50 ? '1.4' : '1.3'}배 수익
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-green-700 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      의료기관은 일반 상가 대비 장기 임차(평균 5~10년), 안정적 임대수익, 건물 가치 상승 효과가 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">무료 매물 등록하기</h3>
                <p className="text-sm text-blue-100 mb-4">
                  매물을 등록하면 개원을 준비하는 의료인에게 직접 노출됩니다.
                </p>
                <Link
                  href="/landlord/register"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white text-blue-700 font-semibold
                    rounded-xl hover:bg-blue-50 transition-colors text-sm"
                >
                  매물 등록하러 가기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── collapsible form section ─── */

function FormSection({
  section,
  open,
  onToggle,
  score,
  children,
}: {
  section: { id: number; title: string; icon: React.ElementType; desc: string };
  open: boolean;
  onToggle: () => void;
  score: CategoryDetail;
  children: React.ReactNode;
}) {
  const Icon = section.icon;
  const pct = score.max > 0 ? Math.round((score.score / score.max) * 100) : 0;
  const colorClass = pct >= 80 ? 'text-green-600 bg-green-50' : pct >= 60 ? 'text-blue-600 bg-blue-50' : pct >= 40 ? 'text-amber-600 bg-amber-50' : 'text-gray-500 bg-gray-100';

  return (
    <div className={`bg-white rounded-2xl border transition-all ${open ? 'border-blue-200 shadow-md' : 'border-gray-200 shadow-sm'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${open ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Icon className={`w-5 h-5 ${open ? 'text-blue-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
            <p className="text-xs text-gray-500">{section.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorClass}`}>
            {score.score}/{score.max}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <div className="border-t border-gray-100 pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
