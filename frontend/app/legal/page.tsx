'use client'

import { useState } from 'react'
import { ArrowLeft, Scale, ChevronDown, ChevronUp, BookOpen, Phone, Clock, BadgeCheck, AlertCircle, User, Briefcase, FileText } from 'lucide-react'
import Link from 'next/link'

type Category = '임대차' | '의료법' | '약사법' | '근로법' | '세법' | '동업계약'

interface QA {
  question: string
  answer: string
  law: string
}

const faqData: Record<Category, QA[]> = {
  '임대차': [
    {
      question: '권리금을 보호받으려면 어떤 조건이 필요한가요?',
      answer: '상가건물 임대차보호법 제10조의3에 따라, 임차인은 임대차 종료 전 6개월부터 임대차 종료 시까지 신규 임차인을 주선할 수 있는 권리가 보장됩니다. 임대인은 정당한 사유 없이 신규 임차인과의 계약 체결을 거절할 수 없습니다.\n\n다만, 임차인이 3기(3개월치) 이상 차임을 연체했거나, 임대인의 동의 없이 무단 전대한 경우 등에는 권리금 회수 기회 보호를 받을 수 없습니다. 약국의 경우 환자 데이터와 처방전 확보 경로 자체가 권리금의 핵심이므로, 권리금 산정 시 영업이익 기반 평가를 받는 것이 유리합니다.',
      law: '상가건물 임대차보호법 제10조의3~제10조의7',
    },
    {
      question: '임대차 계약 갱신을 거절당했습니다. 대응 방법은?',
      answer: '상가건물 임대차보호법 제10조에 의해, 임차인은 최초 임대차 기간을 포함하여 전체 10년까지 갱신을 요구할 수 있습니다. 임대인은 임차인의 3기 이상 차임 연체, 무단 전대, 건물 파손 등 법정 사유가 아닌 한 갱신을 거절할 수 없습니다.\n\n거절 통지를 받으면 즉시 내용증명을 발송하고, 대한법률구조공단이나 상가임대차분쟁조정위원회에 조정을 신청하세요. 갱신 거절이 부당한 경우 손해배상 청구도 가능합니다. 특히 약국은 입지 변경 시 처방전 유실이 크므로 적극적으로 권리를 행사해야 합니다.',
      law: '상가건물 임대차보호법 제10조, 제10조의2',
    },
    {
      question: '보증금을 돌려받지 못하고 있습니다. 어떻게 해야 하나요?',
      answer: '임대차 종료 후 임대인이 보증금을 반환하지 않으면, 먼저 내용증명으로 반환을 요구합니다. 2주 이내 미반환 시 임차권등기명령을 신청하여 대항력과 우선변제권을 유지한 상태에서 이사할 수 있습니다.\n\n이후 지급명령 또는 민사소송을 통해 강제집행이 가능합니다. 보증금이 일정액 이하(서울 6,500만원)인 경우 소액임차인으로서 최우선변제를 받을 수 있으나, 약국 보증금은 대부분 이를 초과하므로 확정일자 취득이 필수입니다.',
      law: '상가건물 임대차보호법 제5조, 제6조, 민사집행법 제280조',
    },
    {
      question: '원상복구 범위가 어디까지인가요?',
      answer: '원칙적으로 임차인은 임대차 종료 시 원상복구 의무가 있으나, 그 범위는 계약서에 명시된 내용을 기준으로 합니다. 통상 임차인이 설치한 시설물(인테리어, 간판 등)의 철거 및 원래 상태 복원을 의미합니다.\n\n약국의 경우 조제실, 약품 선반 등 고정 시설이 많으므로 계약 체결 시 원상복구 범위를 구체적으로 명시해 두는 것이 중요합니다. 자연마모나 시간 경과에 따른 노후화는 원상복구 대상이 아니며, 분쟁 시 계약서 문언이 가장 중요한 판단 기준이 됩니다.',
      law: '민법 제615조, 제654조, 상가건물 임대차보호법',
    },
  ],
  '의료법': [
    {
      question: '의료기관 광고 시 주의사항은 무엇인가요?',
      answer: '의료법 제56조에 따라 의료광고는 엄격하게 규제됩니다. 치료 효과를 보장하는 광고, 환자 치료 사례(비포/애프터), 신문기사나 방송 내용을 이용한 광고, 다른 의료기관과의 비교 광고 등은 금지됩니다.\n\n온라인 광고(블로그, SNS 포함)도 동일한 규제가 적용됩니다. 광고 가능 내용은 진료과목, 진료시간, 의료인 학력/경력, 시설 안내 등으로 제한됩니다. 위반 시 1년 이하 징역 또는 1천만원 이하 벌금에 처해질 수 있으므로 광고 게재 전 반드시 의료광고심의위원회의 사전심의를 받는 것을 권장합니다.',
      law: '의료법 제56조, 제57조, 제89조',
    },
    {
      question: '비급여 진료비를 반드시 고지해야 하나요?',
      answer: '의료법 제45조의2에 따라, 모든 의료기관은 비급여 진료비용을 원내에 게시하고, 건강보험심사평가원에 현황을 보고해야 합니다. 환자가 요청하면 비급여 항목과 비용을 상세하게 설명할 의무가 있습니다.\n\n미게시 또는 허위 게시 시 300만원 이하 과태료가 부과됩니다. 비급여 진료비는 합리적인 기준에 따라 산정해야 하며, 부당하게 높은 금액을 청구할 경우 환자가 소비자원에 신고할 수 있습니다.',
      law: '의료법 제45조, 제45조의2, 시행규칙 제42조의2',
    },
    {
      question: '진료기록 보관 기간과 관리 기준은?',
      answer: '의료법 제22조 및 시행규칙에 따라, 진료기록부는 10년, 수술기록은 10년, 처방전은 2년, 환자 명부는 5년간 보관해야 합니다. 전자의무기록(EMR)의 경우에도 동일한 보관 기간이 적용됩니다.\n\n진료기록은 환자 본인이나 법정 대리인의 동의 없이 제3자에게 열람/복사가 불가능합니다. 다만 보험회사, 수사기관 등 법률에 의한 요청은 예외입니다. EMR 시스템은 위변조 방지 기능이 필수이며, 정기 백업 체계를 갖추어야 합니다.',
      law: '의료법 제22조, 제21조, 시행규칙 제15조',
    },
    {
      question: '의료사고 발생 시 대응 절차는?',
      answer: '의료사고 발생 시 즉시 환자 상태 안정화에 집중하고, 진료기록을 정확하게 작성합니다. 이후 의료배상책임보험에 사고를 통보하고, 한국의료분쟁조정중재원에 조정을 신청할 수 있습니다.\n\n의료사고 감정이 필요한 경우 조정중재원 감정부에서 전문 감정을 실시합니다. 형사 고소가 접수된 경우에는 즉시 의료 전문 변호사를 선임하여 대응해야 합니다. 평소 의료배상책임보험(의배보) 가입은 필수이며, 사고 예방을 위해 정기적인 안전 교육과 프로토콜 점검이 중요합니다.',
      law: '의료사고 피해구제 및 의료분쟁 조정 등에 관한 법률',
    },
  ],
  '약사법': [
    {
      question: '약국 개설 시 필요한 요건은 무엇인가요?',
      answer: '약사법 제20조에 따라 약국은 약사 또는 한약사만 개설할 수 있으며, 1인 1약국 원칙이 적용됩니다. 약국 개설 시 관할 시/군/구청에 약국개설등록을 해야 하며, 시설 기준(조제실 면적 최소 6.6㎡ 이상, 의약품 보관시설 등)을 충족해야 합니다.\n\n또한, 약국은 의료기관 내에 개설할 수 없으며(의약분업 원칙), 다른 약국과 일정 거리를 유지해야 하는 규정은 폐지되었으나 실질적으로 인근 의료기관 밀집도가 중요합니다. 등록 시 약사 면허증, 건물 임대차계약서, 시설 도면 등이 필요합니다.',
      law: '약사법 제20조, 제21조, 시행규칙 제12조',
    },
    {
      question: '약사가 다른 사업을 겸업할 수 있나요?',
      answer: '약사법상 약사의 겸업을 직접 금지하는 조항은 없으나, 약국 관리에 지장을 초래하는 경우 문제가 됩니다. 약국 개설자는 약국에 상시 근무하여 직접 관리해야 하며(약사법 제20조), 이를 위반하면 과태료 또는 약국 업무정지 처분을 받을 수 있습니다.\n\n건강기능식품 판매업, 의료기기 판매업 등은 약국 내에서 겸업이 가능하지만, 의약품 도매업과의 겸업은 금지됩니다. 온라인 쇼핑몰 운영도 가능하나, 의약품 온라인 판매는 엄격히 금지되므로 건강기능식품/의료기기만 취급해야 합니다.',
      law: '약사법 제20조, 제44조, 건강기능식품법 제4조',
    },
    {
      question: '의약품 판매 시 지켜야 할 규정은?',
      answer: '전문의약품은 반드시 의사의 처방전에 따라 조제/판매해야 하며, 처방전 없이 판매하면 약사법 위반으로 형사처벌 대상입니다. 일반의약품도 약국에서만 판매 가능하며(편의점 판매 품목 제외), 약사의 복약지도 의무가 있습니다.\n\n의약품 기록 관리도 중요합니다. 마약류 의약품은 별도 장부를 비치하여 입출고를 기록하고, 2중 잠금장치가 있는 장소에 보관해야 합니다. 의약품 판매 시 유통기한을 확인하고, 반품/회수 약품의 재판매는 절대 금지됩니다.',
      law: '약사법 제23조, 제50조, 마약류관리법 제15조',
    },
    {
      question: '약국 내 건강기능식품 판매 규정은?',
      answer: '약국에서는 건강기능식품을 판매할 수 있으나, 의약품과 혼동되지 않도록 별도 진열해야 합니다. 건강기능식품은 질병 치료 효과를 표방할 수 없으며, "건강기능식품" 표시가 있는 제품만 판매 가능합니다.\n\n약국 내 건강기능식품 판매 시 식약처에 영업신고를 별도로 해야 합니다. 고객에게 상담 시에도 의약품과 건강기능식품의 차이를 명확히 설명해야 하며, 건강기능식품으로 질병 치료가 가능하다는 식의 안내는 허위/과대광고에 해당합니다.',
      law: '건강기능식품에 관한 법률 제18조, 약사법 제44조',
    },
  ],
  '근로법': [
    {
      question: '직원 채용 시 근로계약서에 반드시 포함해야 할 내용은?',
      answer: '근로기준법 제17조에 따라, 근로계약 체결 시 임금, 소정근로시간, 휴일, 연차유급휴가에 관한 사항을 반드시 서면으로 명시하고 교부해야 합니다. 이를 위반하면 500만원 이하 벌금에 처합니다.\n\n약국의 경우 약사, 약무보조원, 사무직 등 직종별로 업무 내용이 다르므로, 담당 업무를 구체적으로 기재하는 것이 좋습니다. 수습기간(최대 3개월)을 두는 경우 그 기간과 조건도 명시해야 하며, 수습기간 중 최저임금의 90%까지 지급 가능합니다(1년 미만 계약 제외).',
      law: '근로기준법 제17조, 최저임금법 제5조의2',
    },
    {
      question: '퇴직금 지급 기준은 어떻게 되나요?',
      answer: '근로자퇴직급여보장법에 따라, 1년 이상 근무하고 주 15시간 이상 일한 근로자에게는 퇴직금을 지급해야 합니다. 퇴직금은 30일분 이상의 평균임금에 근속연수를 곱한 금액입니다.\n\n퇴직 후 14일 이내에 지급해야 하며, 지연 시 지연이자(연 20%)가 발생합니다. 5인 미만 약국도 퇴직금 지급 의무가 있습니다. 퇴직연금제도(DB형/DC형)를 도입하면 세제 혜택이 있으며, 직원 만족도도 높일 수 있습니다.',
      law: '근로자퇴직급여보장법 제8조, 제9조',
    },
    {
      question: '4대보험 가입 의무와 비용 분담은?',
      answer: '직원 1인 이상 고용 시 국민연금, 건강보험, 고용보험, 산재보험에 모두 가입해야 합니다. 국민연금과 건강보험은 사업주와 근로자가 각각 50%씩 부담하며, 고용보험은 사업주가 더 많이 부담합니다. 산재보험료는 전액 사업주 부담입니다.\n\n2025년 기준 4대보험 사업주 부담 비율은 급여의 약 10~12% 수준입니다. 일용직이나 주 15시간 미만 초단시간 근로자는 일부 보험에서 적용 제외될 수 있으나, 1개월 이상 고용 시 건강보험과 국민연금 가입 대상입니다.',
      law: '국민연금법, 국민건강보험법, 고용보험법, 산업재해보상보험법',
    },
    {
      question: '약국 근무시간과 휴게시간 규정은?',
      answer: '근로기준법상 1주 소정근로시간은 40시간(1일 8시간)이 원칙이며, 연장근로는 당사자 합의 하에 주 12시간까지 가능합니다. 4시간 근무 시 30분, 8시간 근무 시 1시간 이상의 휴게시간을 부여해야 합니다.\n\n약국의 영업시간이 길어 교대근무가 필요한 경우, 탄력적 근로시간제(2주/3개월 단위)를 활용할 수 있습니다. 야간근무(22시~06시) 시 50% 가산수당을 지급해야 하며, 주휴일(유급)도 반드시 보장해야 합니다.',
      law: '근로기준법 제50조~제56조',
    },
  ],
  '세법': [
    {
      question: '약국은 어떤 사업자 유형으로 등록해야 하나요?',
      answer: '약국은 대부분 개인사업자로 시작하며, 부가가치세 면세사업자와 과세사업자 겸업으로 등록합니다. 조제 매출(전문의약품)은 부가세 면세이고, OTC/건강기능식품 매출은 과세 대상입니다.\n\n연 매출이 일정 규모 이상이 되면 간이과세 대상에서 제외되어 일반과세자로 전환됩니다. 사업자등록은 개업일로부터 20일 이내에 관할 세무서에 해야 하며, 사업 개시 전 등록도 가능합니다. 약국은 현금영수증 의무발행 업종이므로 관련 장비를 반드시 구비해야 합니다.',
      law: '부가가치세법 제26조, 소득세법 제168조',
    },
    {
      question: '약국 매출 중 부가세 면세 범위는?',
      answer: '부가가치세법 제26조에 따라 의료보건 용역은 부가세 면세입니다. 약국에서는 처방조제(전문의약품), 한약 조제가 면세에 해당합니다. 반면 일반의약품(OTC) 판매, 건강기능식품, 의료기기, 화장품 등은 과세 대상입니다.\n\n면세와 과세를 겸업하므로, 매입세액 중 공통매입세액의 안분 계산이 필요합니다. 약품 구매 시 면세용인지 과세용인지 구분하여 장부에 기록해야 합니다. 부가세 신고는 1월/7월(확정), 4월/10월(예정)에 합니다.',
      law: '부가가치세법 제26조, 시행령 제35조',
    },
    {
      question: '소득세 절세 방법에는 어떤 것이 있나요?',
      answer: '약국 개인사업자의 주요 절세 방법으로는 성실신고확인제도 활용(연 매출 5억 이상 시 의무), 노란우산공제 가입(연 최대 500만원 소득공제), 퇴직연금 DC형 가입(사업주 본인 포함), 감가상각비 적정 반영 등이 있습니다.\n\n경비 처리 가능한 항목을 빠짐없이 반영하는 것이 중요합니다. 임대료, 인건비, 약품비, 감가상각비, 차량유지비(업무용), 통신비, 소모품비, 세무사 수수료 등이 모두 경비로 인정됩니다. 종합소득세 신고 시 기장세액공제(20%)를 받으려면 복식부기 장부를 비치해야 합니다.',
      law: '소득세법 제70조의2, 조세특례제한법 제86조의3',
    },
    {
      question: '법인 전환은 언제 하는 것이 유리한가요?',
      answer: '일반적으로 연 과세소득이 5,000만원을 초과하면 법인 전환을 검토하고, 1억원 이상이면 법인이 유리한 경우가 많습니다. 개인사업자 소득세율은 최고 45%(+지방소득세 4.5%)인 반면, 법인세율은 2억원 이하 9%, 200억원 이하 19%로 상대적으로 낮습니다.\n\n다만, 법인 전환 시 대표자 급여 설정, 배당소득세, 법인 운영 비용(세무/감사), 4대보험료 증가 등을 종합적으로 고려해야 합니다. 또한 약국의 경우 약사법상 약사 1인 약국 원칙이 있으므로, 법인 형태는 주식회사보다는 의료법인이 아닌 개인 명의 법인으로 설립하는 것이 일반적입니다.',
      law: '법인세법 제55조, 소득세법 제55조, 조세특례제한법',
    },
    {
      question: '약국 양수도 시 세금 문제는?',
      answer: '약국을 양도할 때는 양도소득세 또는 사업소득세가 발생합니다. 사업 전체를 포괄양도하면 부가세가 면제되며(부가세법 제10조 제9항), 개별 자산 양도 시에는 부가세가 과세됩니다.\n\n권리금도 과세 대상으로, 양도자는 기타소득(필요경비 80% 공제)으로 신고해야 합니다. 양수인은 권리금에 대해 22%의 원천징수를 해야 합니다. 약국 양수도 계약 시에는 세무사와 사전 상담을 통해 절세 구조를 설계하는 것이 중요합니다.',
      law: '소득세법 제21조, 부가가치세법 제10조, 소득세법 제145조',
    },
  ],
  '동업계약': [
    {
      question: '동업 계약서에 반드시 포함해야 할 조항은?',
      answer: '약국 동업 계약서에는 반드시 다음 사항을 포함해야 합니다: (1) 출자 비율 및 방법(현금, 현물, 노무), (2) 손익 배분 비율, (3) 업무 분담(조제, 경영, OTC 관리 등), (4) 의사결정 방법(중요사항은 전원 합의), (5) 탈퇴/가입 조건, (6) 분쟁 해결 방법.\n\n특히 약국은 약사법상 개설자가 1인이어야 하므로, 법률적으로는 1인 명의로 개설하되 내부적으로 동업계약을 체결하는 형태가 됩니다. 이때 비개설 약사의 권리 보호를 위해 계약서 공증을 받고, 투자금 반환 보증을 확보하는 것이 매우 중요합니다.',
      law: '민법 제703조~제724조 (조합), 약사법 제20조',
    },
    {
      question: '동업 지분은 어떻게 배분하는 것이 좋을까요?',
      answer: '지분 배분은 출자 비율을 기본으로 하되, 실제 노무 기여도를 반영하여 조정하는 것이 일반적입니다. 예를 들어 자금 출자자 A(7,000만원)와 노무 출자자 B(약사 풀타임)가 동업하면, A 60% / B 40%로 시작하되, B의 노무 가치를 연간 재평가하는 방식입니다.\n\n중요한 것은 지분율과 별개로 경영 참여 범위를 명확히 하는 것입니다. 조제는 반드시 약사만 가능하므로, 비약사 투자자의 약국 운영 개입에는 한계가 있습니다. 이익 배분 주기(월/분기/연)도 미리 정하고, 재투자 비율도 합의해 두어야 분쟁을 예방할 수 있습니다.',
      law: '민법 제711조, 제703조',
    },
    {
      question: '동업 탈퇴 시 정산은 어떻게 이루어지나요?',
      answer: '민법상 조합원의 탈퇴 시 지분 가액을 금전으로 반환하는 것이 원칙입니다(민법 제719조). 지분 가액 산정은 탈퇴 시점의 조합재산(약국 자산-부채)을 기준으로 하며, 영업권(권리금 상당)도 포함될 수 있습니다.\n\n분쟁을 방지하려면 계약서에 탈퇴 시 가치 평가 방법(장부가치, 감정평가, 수익환원법 등)을 미리 정해두는 것이 필수입니다. 통상 탈퇴 통보 후 3~6개월의 유예기간을 두고, 분할 지급(3~12개월)하는 것이 현실적입니다. 경업금지 조항도 함께 포함하여 탈퇴 후 인근 약국 개설을 제한하는 것이 일반적입니다.',
      law: '민법 제716조~제720조',
    },
    {
      question: '동업 중 분쟁이 발생하면 어떻게 해결하나요?',
      answer: '동업 분쟁 발생 시 우선 계약서에 명시된 분쟁 해결 절차를 따릅니다. 일반적으로 (1) 당사자 간 협의 → (2) 제3자 중재(회계사/변호사) → (3) 대한상사중재원 중재 → (4) 법원 소송의 단계로 진행합니다.\n\n소송까지 가면 시간과 비용이 크게 소요되므로, 중재 조항을 계약서에 포함하는 것을 강력히 권장합니다. 또한, 분쟁 방지를 위해 월 1회 이상 정기 회의를 열어 재무 현황을 공유하고, 모든 중요 의사결정을 서면으로 기록해 두는 것이 좋습니다.',
      law: '중재법, 민법 제706조',
    },
  ],
}

const lawyers = [
  { name: '김정훈 변호사', specialty: '부동산/임대차 전문', experience: '15년 (서울지방법원 조정위원)', fee: '초회 상담 5만원 / 30분', desc: '상가 임대차 분쟁 500건 이상 수임. 약국/의원 임대차 특화' },
  { name: '이수민 변호사', specialty: '의료법/약사법 전문', experience: '12년 (전 보건복지부 법무담당)', fee: '초회 상담 7만원 / 30분', desc: '의료인 행정처분 대응, 약사법 위반 사건 전문. 의료광고 심의 자문' },
  { name: '박현우 변호사', specialty: '세법/기업법 전문', experience: '10년 (전 국세청 조사관)', fee: '초회 상담 10만원 / 40분', desc: '의료기관 법인 전환, 양수도 세무, 동업 계약 자문 전문' },
]

const categoryIcons: Record<Category, typeof Scale> = {
  '임대차': BookOpen,
  '의료법': FileText,
  '약사법': Briefcase,
  '근로법': User,
  '세법': Scale,
  '동업계약': FileText,
}

export default function LegalPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('임대차')
  const [expandedQA, setExpandedQA] = useState<number | null>(0)

  const categories: Category[] = ['임대차', '의료법', '약사법', '근로법', '세법', '동업계약']

  const toggleQA = (idx: number) => {
    setExpandedQA(expandedQA === idx ? null : idx)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Scale className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">법률 Q&A / 자문</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-8">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">본 정보는 일반적인 법률 안내이며, 개별 사안에 대한 법률 자문이 아닙니다. 구체적인 법률 문제는 반드시 전문 변호사와 상담하시기 바랍니다.</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => {
            const Icon = categoryIcons[cat]
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setExpandedQA(0) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4" />{cat}
              </button>
            )
          })}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqData[activeCategory].map((qa, idx) => (
            <div key={idx} className="card overflow-hidden">
              <button onClick={() => toggleQA(idx)} className="w-full flex items-start justify-between p-5 text-left hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">Q</span>
                  <span className="font-semibold text-foreground leading-relaxed">{qa.question}</span>
                </div>
                {expandedQA === idx ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />}
              </button>
              {expandedQA === idx && (
                <div className="px-5 pb-5 border-t border-border/50">
                  <div className="pl-10 pt-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold flex-shrink-0">A</span>
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{qa.answer}</div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg ml-10">
                      <BookOpen className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-primary">관련 법규</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{qa.law}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lawyer Consultation CTA */}
        <div className="card p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">전문 변호사 상담 신청</h2>
            <p className="text-sm text-muted-foreground">메디플라톤 제휴 변호사에게 1:1 상담을 받아보세요</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {lawyers.map((l, i) => (
              <div key={i} className="card p-5 bg-background">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{l.name}</h3>
                    <p className="text-xs text-primary font-medium">{l.specialty}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{l.experience}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{l.fee}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{l.desc}</p>
                </div>
                <button className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />상담 신청
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            본 페이지의 법률 정보는 2025년 기준이며, 법령 개정에 따라 내용이 변경될 수 있습니다.
            <br />실제 법률 문제는 반드시 전문가와 상담 후 결정하시기 바랍니다.
          </p>
        </div>
      </main>
    </div>
  )
}
