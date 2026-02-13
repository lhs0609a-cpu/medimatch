'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Upload, ChevronRight, Check, Camera } from 'lucide-react'
import { categories } from '../data/seed'

const conditions = [
  { value: 'new', label: '신품', desc: '미개봉 또는 미사용' },
  { value: 'like-new', label: '준신품', desc: '1년 미만 사용, 외관 거의 새것' },
  { value: 'good', label: '상태 양호', desc: '1~3년 사용, 정상 작동' },
  { value: 'fair', label: '사용감 있음', desc: '3년 이상 사용, 기능 정상' },
]

const sellerTypes = [
  { value: 'hospital', label: '의원/병원 직거래' },
  { value: 'dealer', label: '딜러/유통사' },
  { value: 'manufacturer', label: '제조사' },
]

export default function EquipmentRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    condition: '',
    price: '',
    originalPrice: '',
    yearMade: '',
    usageMonths: '',
    location: '',
    seller: '',
    sellerType: '',
    description: '',
    features: '',
    warranty: '',
    phone: '',
  })

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    if (step === 1) return form.name && form.category && form.brand && form.condition && form.price
    if (step === 2) return form.location && form.seller && form.sellerType && form.description
    return true
  }

  const handleSubmit = () => {
    alert('장비 등록이 완료되었습니다. (MVP: 실제 저장은 백엔드 연결 후 지원됩니다)')
    router.push('/equipment')
  }

  const equipCategories = categories.filter((c) => c !== '전체')

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/equipment" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Package className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">장비 등록</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={`text-sm hidden sm:inline ${step >= s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {s === 1 ? '장비 정보' : s === 2 ? '판매자 정보' : '확인 / 등록'}
              </span>
              {s < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />}
            </div>
          ))}
        </div>

        {/* Step 1: Equipment info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">장비명 *</label>
              <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="예: GE LOGIQ E10 초음파" className="input w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">카테고리 *</label>
              <div className="flex flex-wrap gap-2">
                {equipCategories.map((cat) => (
                  <button key={cat} type="button" onClick={() => updateForm('category', cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${form.category === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">브랜드 *</label>
                <input type="text" value={form.brand} onChange={(e) => updateForm('brand', e.target.value)} placeholder="GE Healthcare" className="input w-full" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">모델명</label>
                <input type="text" value={form.model} onChange={(e) => updateForm('model', e.target.value)} placeholder="LOGIQ E10" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">상태 *</label>
              <div className="grid grid-cols-2 gap-2">
                {conditions.map((c) => (
                  <button key={c.value} type="button" onClick={() => updateForm('condition', c.value)} className={`p-3 rounded-lg text-left border-2 transition-colors ${form.condition === c.value ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'}`}>
                    <p className="text-sm font-medium text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">판매가 (만원) *</label>
                <input type="number" value={form.price} onChange={(e) => updateForm('price', e.target.value)} placeholder="5000" className="input w-full" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">정가 (만원)</label>
                <input type="number" value={form.originalPrice} onChange={(e) => updateForm('originalPrice', e.target.value)} placeholder="8000" className="input w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">제조년도</label>
                <input type="number" value={form.yearMade} onChange={(e) => updateForm('yearMade', e.target.value)} placeholder="2023" className="input w-full" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">사용 개월수</label>
                <input type="number" value={form.usageMonths} onChange={(e) => updateForm('usageMonths', e.target.value)} placeholder="12" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">사진 업로드</label>
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">클릭하여 사진 추가 (최대 10장)</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, 10MB 이하</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Seller info */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">판매자명 *</label>
              <input type="text" value={form.seller} onChange={(e) => updateForm('seller', e.target.value)} placeholder="의원명 또는 업체명" className="input w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">판매자 유형 *</label>
              <div className="flex flex-wrap gap-2">
                {sellerTypes.map((st) => (
                  <button key={st.value} type="button" onClick={() => updateForm('sellerType', st.value)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${form.sellerType === st.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">소재지 *</label>
              <input type="text" value={form.location} onChange={(e) => updateForm('location', e.target.value)} placeholder="서울 강남구" className="input w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">연락처</label>
              <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="010-0000-0000" className="input w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">상세 설명 *</label>
              <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="장비 상태, 사용 이력, 매각 사유 등을 상세히 작성해주세요." rows={5} className="textarea w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">주요 특징 / 옵션</label>
              <input type="text" value={form.features} onChange={(e) => updateForm('features', e.target.value)} placeholder="쉼표로 구분 (예: HD 화질, NBI 기능, 세척기 포함)" className="input w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">보증 정보</label>
              <input type="text" value={form.warranty} onChange={(e) => updateForm('warranty', e.target.value)} placeholder="남은 보증기간 (예: 2년)" className="input w-full" />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-bold text-foreground mb-4">등록 정보 확인</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['장비명', form.name],
                  ['카테고리', form.category],
                  ['브랜드 / 모델', `${form.brand} ${form.model}`],
                  ['상태', conditions.find(c => c.value === form.condition)?.label || ''],
                  ['판매가', `${Number(form.price).toLocaleString()}만원`],
                  ['소재지', form.location],
                  ['판매자', form.seller],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-4 bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                등록 후 관리자 승인을 거쳐 공개됩니다. 허위 매물은 삭제될 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary flex-1 py-3 rounded-lg">
              이전
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                canProceed() ? 'btn-primary' : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              다음
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary flex-1 py-3 rounded-lg flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> 등록하기
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
