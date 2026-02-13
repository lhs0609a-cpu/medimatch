'use client'

import { useState } from 'react'
import { Eye, Plus, Trash2, X, Bell } from 'lucide-react'
import { WatchRegion } from '../data/seed'

interface WatchConfigProps {
  regions: WatchRegion[]
  onUpdate: (regions: WatchRegion[]) => void
  onClose: () => void
}

const specialtyOptions = ['전체', '내과', '정형외과', '피부과', '이비인후과', '안과', '치과', '소아청소년과', '산부인과', '정신건강의학과']

export default function WatchConfig({ regions, onUpdate, onClose }: WatchConfigProps) {
  const [items, setItems] = useState<WatchRegion[]>(regions)
  const [newRegion, setNewRegion] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('전체')

  const handleAdd = () => {
    if (!newRegion.trim()) return
    const newItem: WatchRegion = {
      id: `w-${Date.now()}`,
      name: newRegion.trim(),
      specialty: newSpecialty,
      enabled: true,
    }
    setItems([...items, newItem])
    setNewRegion('')
    setNewSpecialty('전체')
  }

  const toggleItem = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)))
  }

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id))
  }

  const handleSave = () => {
    onUpdate(items)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            관심 지역 설정
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Add new */}
          <div className="space-y-2">
            <input
              type="text"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              placeholder="지역명 (예: 서울 강남구)"
              className="input w-full"
            />
            <div className="flex gap-2">
              <select
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                className="select flex-1"
              >
                {specialtyOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button onClick={handleAdd} className="btn-primary px-4 rounded-lg flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> 추가
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  item.enabled ? 'bg-primary/5' : 'bg-muted/50'
                }`}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    item.enabled ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  }`}
                >
                  {item.enabled && <Bell className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.specialty}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="btn-ghost p-1.5 rounded-lg text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-lg">
            취소
          </button>
          <button onClick={handleSave} className="btn-primary flex-1 py-2.5 rounded-lg">
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
