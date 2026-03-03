/**
 * 마일스톤 축하 트리거 설정
 * 페이즈 완료 및 전체 완료 시 축하 메시지를 표시
 */

export interface Milestone {
  id: string
  type: 'phase_complete' | 'all_complete'
  phaseId?: number
  title: string
  description: string
  emoji: string
}

export const milestones: Milestone[] = [
  { id: 'phase-1', type: 'phase_complete', phaseId: 1, title: '사업계획 수립 완료!', description: '훌륭한 시작입니다. 다음은 입지를 선정할 차례예요.', emoji: '📋' },
  { id: 'phase-2', type: 'phase_complete', phaseId: 2, title: '입지 선정 완료!', description: '좋은 자리를 찾으셨군요. 이제 인허가를 진행하세요.', emoji: '📍' },
  { id: 'phase-3', type: 'phase_complete', phaseId: 3, title: '인허가 완료!', description: '행정 절차를 마쳤습니다. 인테리어를 시작하세요.', emoji: '✅' },
  { id: 'phase-4', type: 'phase_complete', phaseId: 4, title: '인테리어 완료!', description: '멋진 의원이 완성되어 가고 있습니다.', emoji: '🏗️' },
  { id: 'phase-5', type: 'phase_complete', phaseId: 5, title: '장비 도입 완료!', description: '진료 준비가 착착 진행 중이에요.', emoji: '🩺' },
  { id: 'phase-6', type: 'phase_complete', phaseId: 6, title: '인력 채용 완료!', description: '함께할 팀이 완성되었습니다.', emoji: '👥' },
  { id: 'phase-7', type: 'phase_complete', phaseId: 7, title: '마케팅 준비 완료!', description: '개원 소식을 알릴 준비가 되었습니다.', emoji: '📢' },
  { id: 'phase-8', type: 'phase_complete', phaseId: 8, title: '개원 준비 완료!', description: '모든 준비가 끝났습니다. 성공적인 개원을 축하합니다!', emoji: '🎉' },
  { id: 'all-complete', type: 'all_complete', title: '축하합니다! 개원 여정을 완주하셨습니다!', description: '44개 체크리스트를 모두 완료했습니다. 이제 EMR로 본격적인 진료를 시작하세요.', emoji: '🏆' },
]

export const getMilestoneByPhase = (phaseId: number): Milestone | undefined =>
  milestones.find(m => m.type === 'phase_complete' && m.phaseId === phaseId)

export const getAllCompleteMilestone = (): Milestone =>
  milestones.find(m => m.type === 'all_complete')!
