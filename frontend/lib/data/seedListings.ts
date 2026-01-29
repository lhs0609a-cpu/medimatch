/**
 * 시드 데이터 - 매물 목록
 * 플랫폼이 활성화되어 보이도록 대량의 가짜 매물 데이터
 */

// 지역 데이터 (좌표 포함)
interface SubAreaCoord {
  name: string
  lat: number
  lng: number
}

interface RegionData {
  code: string
  name: string
  lat: number
  lng: number
  subAreas: SubAreaCoord[]
}

const regions: RegionData[] = [
  // ===== 서울특별시 =====
  {
    code: 'seoul-gangnam', name: '서울 강남구', lat: 37.5172, lng: 127.0473,
    subAreas: [
      { name: '역삼동', lat: 37.5007, lng: 127.0365 },
      { name: '삼성동', lat: 37.5145, lng: 127.0592 },
      { name: '청담동', lat: 37.5247, lng: 127.0476 },
      { name: '논현동', lat: 37.5112, lng: 127.0287 },
      { name: '신사동', lat: 37.5238, lng: 127.0239 },
      { name: '압구정동', lat: 37.5273, lng: 127.0283 },
      { name: '대치동', lat: 37.4947, lng: 127.0635 },
      { name: '도곡동', lat: 37.4883, lng: 127.0463 },
    ]
  },
  {
    code: 'seoul-seocho', name: '서울 서초구', lat: 37.4837, lng: 127.0324,
    subAreas: [
      { name: '서초동', lat: 37.4919, lng: 127.0076 },
      { name: '방배동', lat: 37.4826, lng: 126.9882 },
      { name: '반포동', lat: 37.5058, lng: 127.0011 },
      { name: '잠원동', lat: 37.5168, lng: 127.0109 },
      { name: '양재동', lat: 37.4685, lng: 127.0387 },
    ]
  },
  {
    code: 'seoul-songpa', name: '서울 송파구', lat: 37.5145, lng: 127.1050,
    subAreas: [
      { name: '잠실동', lat: 37.5133, lng: 127.0846 },
      { name: '신천동', lat: 37.5144, lng: 127.0934 },
      { name: '삼전동', lat: 37.5028, lng: 127.0893 },
      { name: '석촌동', lat: 37.5048, lng: 127.1002 },
      { name: '송파동', lat: 37.5031, lng: 127.1125 },
      { name: '방이동', lat: 37.5133, lng: 127.1213 },
      { name: '오금동', lat: 37.5023, lng: 127.1285 },
    ]
  },
  {
    code: 'seoul-mapo', name: '서울 마포구', lat: 37.5663, lng: 126.9014,
    subAreas: [
      { name: '합정동', lat: 37.5496, lng: 126.9138 },
      { name: '상수동', lat: 37.5478, lng: 126.9225 },
      { name: '서교동', lat: 37.5526, lng: 126.9182 },
      { name: '연남동', lat: 37.5656, lng: 126.9247 },
      { name: '망원동', lat: 37.5556, lng: 126.9047 },
      { name: '공덕동', lat: 37.5436, lng: 126.9518 },
    ]
  },
  {
    code: 'seoul-yeongdeungpo', name: '서울 영등포구', lat: 37.5263, lng: 126.8963,
    subAreas: [
      { name: '여의도동', lat: 37.5219, lng: 126.9245 },
      { name: '당산동', lat: 37.5349, lng: 126.9028 },
      { name: '영등포동', lat: 37.5159, lng: 126.9074 },
      { name: '문래동', lat: 37.5178, lng: 126.8966 },
    ]
  },
  {
    code: 'seoul-gangdong', name: '서울 강동구', lat: 37.5301, lng: 127.1238,
    subAreas: [
      { name: '천호동', lat: 37.5387, lng: 127.1234 },
      { name: '길동', lat: 37.5336, lng: 127.1401 },
      { name: '명일동', lat: 37.5517, lng: 127.1452 },
      { name: '고덕동', lat: 37.5593, lng: 127.1543 },
      { name: '암사동', lat: 37.5518, lng: 127.1303 },
    ]
  },
  {
    code: 'seoul-jongno', name: '서울 종로구', lat: 37.5735, lng: 126.9790,
    subAreas: [
      { name: '종로동', lat: 37.5705, lng: 126.9830 },
      { name: '혜화동', lat: 37.5823, lng: 127.0015 },
      { name: '명륜동', lat: 37.5883, lng: 126.9972 },
      { name: '삼청동', lat: 37.5866, lng: 126.9816 },
    ]
  },
  {
    code: 'seoul-jung', name: '서울 중구', lat: 37.5636, lng: 126.9975,
    subAreas: [
      { name: '명동', lat: 37.5636, lng: 126.9850 },
      { name: '을지로', lat: 37.5660, lng: 126.9910 },
      { name: '충무로', lat: 37.5616, lng: 126.9943 },
      { name: '회현동', lat: 37.5580, lng: 126.9815 },
    ]
  },

  // ===== 경기도 =====
  {
    code: 'gyeonggi-seongnam', name: '경기 성남시', lat: 37.4200, lng: 127.1265,
    subAreas: [
      { name: '분당구', lat: 37.3825, lng: 127.1190 },
      { name: '수정구', lat: 37.4503, lng: 127.1457 },
      { name: '중원구', lat: 37.4313, lng: 127.1362 },
    ]
  },
  {
    code: 'gyeonggi-suwon', name: '경기 수원시', lat: 37.2636, lng: 127.0286,
    subAreas: [
      { name: '영통구', lat: 37.2591, lng: 127.0465 },
      { name: '권선구', lat: 37.2575, lng: 126.9720 },
      { name: '장안구', lat: 37.3036, lng: 127.0105 },
      { name: '팔달구', lat: 37.2820, lng: 127.0185 },
    ]
  },
  {
    code: 'gyeonggi-yongin', name: '경기 용인시', lat: 37.2411, lng: 127.1776,
    subAreas: [
      { name: '수지구', lat: 37.3219, lng: 127.0987 },
      { name: '기흥구', lat: 37.2747, lng: 127.1150 },
      { name: '처인구', lat: 37.2340, lng: 127.2026 },
    ]
  },
  {
    code: 'gyeonggi-goyang', name: '경기 고양시', lat: 37.6584, lng: 126.8320,
    subAreas: [
      { name: '일산동구', lat: 37.6586, lng: 126.7742 },
      { name: '일산서구', lat: 37.6753, lng: 126.7505 },
      { name: '덕양구', lat: 37.6376, lng: 126.8320 },
    ]
  },
  {
    code: 'gyeonggi-bucheon', name: '경기 부천시', lat: 37.5034, lng: 126.7660,
    subAreas: [
      { name: '원미구', lat: 37.5052, lng: 126.7830 },
      { name: '소사구', lat: 37.4783, lng: 126.7952 },
      { name: '오정구', lat: 37.5234, lng: 126.7932 },
    ]
  },
  {
    code: 'gyeonggi-anyang', name: '경기 안양시', lat: 37.3943, lng: 126.9568,
    subAreas: [
      { name: '동안구', lat: 37.3943, lng: 126.9518 },
      { name: '만안구', lat: 37.3866, lng: 126.9268 },
    ]
  },
  {
    code: 'gyeonggi-hwaseong', name: '경기 화성시', lat: 37.1996, lng: 126.8312,
    subAreas: [
      { name: '동탄', lat: 37.2006, lng: 127.0742 },
      { name: '병점동', lat: 37.1896, lng: 127.0112 },
      { name: '봉담읍', lat: 37.2196, lng: 126.9312 },
    ]
  },
  {
    code: 'gyeonggi-pyeongtaek', name: '경기 평택시', lat: 36.9921, lng: 127.1126,
    subAreas: [
      { name: '평택역', lat: 36.9921, lng: 127.0856 },
      { name: '송탄', lat: 37.0821, lng: 127.0556 },
      { name: '안중읍', lat: 36.9521, lng: 126.9156 },
    ]
  },

  // ===== 인천광역시 =====
  {
    code: 'incheon-yeonsu', name: '인천 연수구', lat: 37.4103, lng: 126.6783,
    subAreas: [
      { name: '송도동', lat: 37.3833, lng: 126.6573 },
      { name: '연수동', lat: 37.4103, lng: 126.6783 },
      { name: '청학동', lat: 37.4256, lng: 126.6892 },
    ]
  },
  {
    code: 'incheon-namdong', name: '인천 남동구', lat: 37.4486, lng: 126.7309,
    subAreas: [
      { name: '구월동', lat: 37.4486, lng: 126.7239 },
      { name: '간석동', lat: 37.4636, lng: 126.7109 },
      { name: '논현동', lat: 37.4086, lng: 126.7409 },
    ]
  },
  {
    code: 'incheon-bupyeong', name: '인천 부평구', lat: 37.5074, lng: 126.7219,
    subAreas: [
      { name: '부평역', lat: 37.4897, lng: 126.7235 },
      { name: '산곡동', lat: 37.5074, lng: 126.7019 },
      { name: '십정동', lat: 37.4974, lng: 126.7319 },
    ]
  },

  // ===== 부산광역시 =====
  {
    code: 'busan-haeundae', name: '부산 해운대구', lat: 35.1631, lng: 129.1635,
    subAreas: [
      { name: '해운대동', lat: 35.1587, lng: 129.1603 },
      { name: '우동', lat: 35.1653, lng: 129.1315 },
      { name: '중동', lat: 35.1575, lng: 129.1312 },
      { name: '좌동', lat: 35.1695, lng: 129.1726 },
    ]
  },
  {
    code: 'busan-suyeong', name: '부산 수영구', lat: 35.1457, lng: 129.1130,
    subAreas: [
      { name: '광안동', lat: 35.1530, lng: 129.1185 },
      { name: '수영동', lat: 35.1434, lng: 129.1130 },
      { name: '민락동', lat: 35.1573, lng: 129.1275 },
    ]
  },
  {
    code: 'busan-busanjin', name: '부산 부산진구', lat: 35.1629, lng: 129.0532,
    subAreas: [
      { name: '서면', lat: 35.1579, lng: 129.0592 },
      { name: '전포동', lat: 35.1529, lng: 129.0632 },
      { name: '부전동', lat: 35.1629, lng: 129.0582 },
    ]
  },
  {
    code: 'busan-nam', name: '부산 남구', lat: 35.1368, lng: 129.0849,
    subAreas: [
      { name: '대연동', lat: 35.1368, lng: 129.0849 },
      { name: '용호동', lat: 35.1168, lng: 129.1049 },
      { name: '문현동', lat: 35.1268, lng: 129.0749 },
    ]
  },
  {
    code: 'busan-dong', name: '부산 동구', lat: 35.1294, lng: 129.0455,
    subAreas: [
      { name: '범일동', lat: 35.1394, lng: 129.0555 },
      { name: '초량동', lat: 35.1194, lng: 129.0355 },
    ]
  },

  // ===== 대구광역시 =====
  {
    code: 'daegu-suseong', name: '대구 수성구', lat: 35.8583, lng: 128.6306,
    subAreas: [
      { name: '범어동', lat: 35.8591, lng: 128.6210 },
      { name: '수성동', lat: 35.8530, lng: 128.6185 },
      { name: '황금동', lat: 35.8472, lng: 128.6336 },
      { name: '지산동', lat: 35.8362, lng: 128.6355 },
    ]
  },
  {
    code: 'daegu-jung', name: '대구 중구', lat: 35.8694, lng: 128.6062,
    subAreas: [
      { name: '동성로', lat: 35.8694, lng: 128.5962 },
      { name: '삼덕동', lat: 35.8694, lng: 128.6162 },
      { name: '대봉동', lat: 35.8594, lng: 128.6062 },
    ]
  },
  {
    code: 'daegu-dalseong', name: '대구 달서구', lat: 35.8299, lng: 128.5332,
    subAreas: [
      { name: '월성동', lat: 35.8299, lng: 128.5332 },
      { name: '상인동', lat: 35.8099, lng: 128.5432 },
      { name: '죽전동', lat: 35.8399, lng: 128.5232 },
    ]
  },

  // ===== 광주광역시 =====
  {
    code: 'gwangju-seo', name: '광주 서구', lat: 35.1522, lng: 126.8895,
    subAreas: [
      { name: '상무지구', lat: 35.1522, lng: 126.8595 },
      { name: '치평동', lat: 35.1422, lng: 126.8495 },
      { name: '농성동', lat: 35.1622, lng: 126.8795 },
    ]
  },
  {
    code: 'gwangju-nam', name: '광주 남구', lat: 35.1326, lng: 126.9026,
    subAreas: [
      { name: '봉선동', lat: 35.1326, lng: 126.9126 },
      { name: '주월동', lat: 35.1226, lng: 126.8926 },
      { name: '진월동', lat: 35.1126, lng: 126.8826 },
    ]
  },
  {
    code: 'gwangju-buk', name: '광주 북구', lat: 35.1747, lng: 126.9120,
    subAreas: [
      { name: '운암동', lat: 35.1747, lng: 126.8920 },
      { name: '문흥동', lat: 35.1847, lng: 126.9220 },
      { name: '용봉동', lat: 35.1847, lng: 126.9020 },
    ]
  },

  // ===== 대전광역시 =====
  {
    code: 'daejeon-seo', name: '대전 서구', lat: 36.3551, lng: 127.3837,
    subAreas: [
      { name: '둔산동', lat: 36.3551, lng: 127.3737 },
      { name: '월평동', lat: 36.3651, lng: 127.3637 },
      { name: '탄방동', lat: 36.3451, lng: 127.3837 },
    ]
  },
  {
    code: 'daejeon-yuseong', name: '대전 유성구', lat: 36.3623, lng: 127.3562,
    subAreas: [
      { name: '봉명동', lat: 36.3623, lng: 127.3462 },
      { name: '노은동', lat: 36.3723, lng: 127.3262 },
      { name: '궁동', lat: 36.3523, lng: 127.3362 },
    ]
  },
  {
    code: 'daejeon-jung', name: '대전 중구', lat: 36.3256, lng: 127.4217,
    subAreas: [
      { name: '대흥동', lat: 36.3256, lng: 127.4217 },
      { name: '은행동', lat: 36.3306, lng: 127.4267 },
      { name: '선화동', lat: 36.3206, lng: 127.4167 },
    ]
  },

  // ===== 울산광역시 =====
  {
    code: 'ulsan-nam', name: '울산 남구', lat: 35.5444, lng: 129.3301,
    subAreas: [
      { name: '삼산동', lat: 35.5444, lng: 129.3301 },
      { name: '달동', lat: 35.5344, lng: 129.3201 },
      { name: '무거동', lat: 35.5544, lng: 129.3101 },
    ]
  },
  {
    code: 'ulsan-jung', name: '울산 중구', lat: 35.5697, lng: 129.3324,
    subAreas: [
      { name: '성남동', lat: 35.5697, lng: 129.3324 },
      { name: '학성동', lat: 35.5597, lng: 129.3424 },
      { name: '복산동', lat: 35.5797, lng: 129.3224 },
    ]
  },

  // ===== 세종특별자치시 =====
  {
    code: 'sejong', name: '세종시', lat: 36.4801, lng: 127.2892,
    subAreas: [
      { name: '어진동', lat: 36.4801, lng: 127.2892 },
      { name: '도담동', lat: 36.4901, lng: 127.2792 },
      { name: '나성동', lat: 36.4701, lng: 127.2992 },
      { name: '보람동', lat: 36.4851, lng: 127.2842 },
    ]
  },

  // ===== 강원도 =====
  {
    code: 'gangwon-chuncheon', name: '강원 춘천시', lat: 37.8813, lng: 127.7298,
    subAreas: [
      { name: '효자동', lat: 37.8713, lng: 127.7198 },
      { name: '석사동', lat: 37.8913, lng: 127.7398 },
      { name: '퇴계동', lat: 37.8763, lng: 127.7248 },
    ]
  },
  {
    code: 'gangwon-wonju', name: '강원 원주시', lat: 37.3422, lng: 127.9202,
    subAreas: [
      { name: '단계동', lat: 37.3522, lng: 127.9302 },
      { name: '무실동', lat: 37.3422, lng: 127.9102 },
      { name: '중앙동', lat: 37.3372, lng: 127.9202 },
    ]
  },
  {
    code: 'gangwon-gangneung', name: '강원 강릉시', lat: 37.7519, lng: 128.8761,
    subAreas: [
      { name: '교동', lat: 37.7519, lng: 128.8761 },
      { name: '포남동', lat: 37.7619, lng: 128.8861 },
      { name: '입암동', lat: 37.7419, lng: 128.8661 },
    ]
  },

  // ===== 충청북도 =====
  {
    code: 'chungbuk-cheongju', name: '충북 청주시', lat: 36.6424, lng: 127.4890,
    subAreas: [
      { name: '복대동', lat: 36.6324, lng: 127.4790 },
      { name: '용암동', lat: 36.6524, lng: 127.4590 },
      { name: '성화동', lat: 36.6424, lng: 127.4990 },
      { name: '가경동', lat: 36.6224, lng: 127.4690 },
    ]
  },
  {
    code: 'chungbuk-chungju', name: '충북 충주시', lat: 36.9910, lng: 127.9259,
    subAreas: [
      { name: '성내동', lat: 36.9910, lng: 127.9259 },
      { name: '연수동', lat: 36.9810, lng: 127.9159 },
      { name: '호암동', lat: 37.0010, lng: 127.9359 },
    ]
  },

  // ===== 충청남도 =====
  {
    code: 'chungnam-cheonan', name: '충남 천안시', lat: 36.8151, lng: 127.1139,
    subAreas: [
      { name: '두정동', lat: 36.8251, lng: 127.1239 },
      { name: '신부동', lat: 36.8051, lng: 127.1339 },
      { name: '불당동', lat: 36.8151, lng: 127.1039 },
      { name: '쌍용동', lat: 36.7951, lng: 127.1139 },
    ]
  },
  {
    code: 'chungnam-asan', name: '충남 아산시', lat: 36.7898, lng: 127.0018,
    subAreas: [
      { name: '온양동', lat: 36.7898, lng: 127.0018 },
      { name: '배방읍', lat: 36.7698, lng: 127.0218 },
      { name: '탕정면', lat: 36.7798, lng: 126.9918 },
    ]
  },

  // ===== 전라북도 =====
  {
    code: 'jeonbuk-jeonju', name: '전북 전주시', lat: 35.8242, lng: 127.1480,
    subAreas: [
      { name: '효자동', lat: 35.8242, lng: 127.1280 },
      { name: '서신동', lat: 35.8142, lng: 127.1180 },
      { name: '송천동', lat: 35.8342, lng: 127.1380 },
      { name: '삼천동', lat: 35.8042, lng: 127.1580 },
    ]
  },
  {
    code: 'jeonbuk-iksan', name: '전북 익산시', lat: 35.9483, lng: 126.9576,
    subAreas: [
      { name: '영등동', lat: 35.9483, lng: 126.9476 },
      { name: '어양동', lat: 35.9583, lng: 126.9576 },
      { name: '부송동', lat: 35.9383, lng: 126.9676 },
    ]
  },

  // ===== 전라남도 =====
  {
    code: 'jeonnam-yeosu', name: '전남 여수시', lat: 34.7604, lng: 127.6622,
    subAreas: [
      { name: '학동', lat: 34.7604, lng: 127.6522 },
      { name: '문수동', lat: 34.7704, lng: 127.6622 },
      { name: '여서동', lat: 34.7504, lng: 127.6722 },
    ]
  },
  {
    code: 'jeonnam-suncheon', name: '전남 순천시', lat: 34.9506, lng: 127.4872,
    subAreas: [
      { name: '연향동', lat: 34.9506, lng: 127.4772 },
      { name: '조례동', lat: 34.9606, lng: 127.4972 },
      { name: '왕조동', lat: 34.9406, lng: 127.4872 },
    ]
  },
  {
    code: 'jeonnam-mokpo', name: '전남 목포시', lat: 34.8118, lng: 126.3922,
    subAreas: [
      { name: '하당동', lat: 34.8018, lng: 126.4022 },
      { name: '상동', lat: 34.8118, lng: 126.3822 },
      { name: '옥암동', lat: 34.7918, lng: 126.4122 },
    ]
  },

  // ===== 경상북도 =====
  {
    code: 'gyeongbuk-pohang', name: '경북 포항시', lat: 36.0190, lng: 129.3435,
    subAreas: [
      { name: '죽도동', lat: 36.0290, lng: 129.3535 },
      { name: '양학동', lat: 36.0090, lng: 129.3635 },
      { name: '장량동', lat: 36.0390, lng: 129.3335 },
    ]
  },
  {
    code: 'gyeongbuk-gumi', name: '경북 구미시', lat: 36.1195, lng: 128.3446,
    subAreas: [
      { name: '송정동', lat: 36.1195, lng: 128.3346 },
      { name: '원평동', lat: 36.1095, lng: 128.3546 },
      { name: '형곡동', lat: 36.1295, lng: 128.3246 },
    ]
  },
  {
    code: 'gyeongbuk-gyeongju', name: '경북 경주시', lat: 35.8562, lng: 129.2247,
    subAreas: [
      { name: '성건동', lat: 35.8562, lng: 129.2147 },
      { name: '황성동', lat: 35.8462, lng: 129.2347 },
      { name: '동천동', lat: 35.8662, lng: 129.2247 },
    ]
  },

  // ===== 경상남도 =====
  {
    code: 'gyeongnam-changwon', name: '경남 창원시', lat: 35.2279, lng: 128.6811,
    subAreas: [
      { name: '상남동', lat: 35.2279, lng: 128.6811 },
      { name: '용호동', lat: 35.2179, lng: 128.6911 },
      { name: '중앙동', lat: 35.2379, lng: 128.6711 },
      { name: '명서동', lat: 35.2079, lng: 128.6611 },
    ]
  },
  {
    code: 'gyeongnam-gimhae', name: '경남 김해시', lat: 35.2341, lng: 128.8896,
    subAreas: [
      { name: '내외동', lat: 35.2341, lng: 128.8796 },
      { name: '삼계동', lat: 35.2241, lng: 128.8996 },
      { name: '장유동', lat: 35.1941, lng: 128.8096 },
    ]
  },
  {
    code: 'gyeongnam-jinju', name: '경남 진주시', lat: 35.1798, lng: 128.1076,
    subAreas: [
      { name: '상대동', lat: 35.1798, lng: 128.0976 },
      { name: '충무공동', lat: 35.1698, lng: 128.1176 },
      { name: '상봉동', lat: 35.1898, lng: 128.1076 },
    ]
  },

  // ===== 제주특별자치도 =====
  {
    code: 'jeju-jeju', name: '제주시', lat: 33.4996, lng: 126.5312,
    subAreas: [
      { name: '연동', lat: 33.4896, lng: 126.4912 },
      { name: '노형동', lat: 33.4796, lng: 126.4712 },
      { name: '이도동', lat: 33.4996, lng: 126.5312 },
      { name: '삼도동', lat: 33.5096, lng: 126.5212 },
    ]
  },
  {
    code: 'jeju-seogwipo', name: '서귀포시', lat: 33.2541, lng: 126.5600,
    subAreas: [
      { name: '중문동', lat: 33.2541, lng: 126.4100 },
      { name: '서귀동', lat: 33.2441, lng: 126.5600 },
      { name: '대정읍', lat: 33.2241, lng: 126.2500 },
    ]
  },
]

const hospitalTypes = ['내과', '정형외과', '피부과', '치과', '한의원', '이비인후과', '안과', '산부인과', '소아청소년과', '비뇨기과', '신경외과', '재활의학과']
const pharmacyTypes = ['일반약국', '조제전문', '한약', '병원내약국']

// 랜덤 유틸리티
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

// 익명 코드 생성 (예: PM-A7X2K)
function generateAnonymousCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 혼동하기 쉬운 문자 제외 (0, O, 1, I)
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${code}`
}

// 현실적인 라운드 숫자 생성
function roundToRealistic(value: number, unit: number = 500): number {
  return Math.round(value / unit) * unit
}

// 건물 매물 생성
export interface BuildingListing {
  id: string
  title: string
  region: string
  regionCode: string
  address: string
  subArea: string // 동 이름
  lat: number // 위도
  lng: number // 경도
  floor: string
  areaPyeong: number
  deposit: number // 만원
  monthlyRent: number // 만원
  maintenanceFee: number // 만원
  premium: number // 만원
  preferredTenants: string[]
  nearbyHospitals: string[]
  hasParking: boolean
  hasElevator: boolean
  buildingAge: number
  status: 'ACTIVE' | 'RESERVED' | 'CONTRACTED'
  viewCount: number
  inquiryCount: number
  createdAt: string
  isVerified: boolean
  thumbnailIndex: number
  // 새로운 필드들
  isHot: boolean
  isNew: boolean
  currentViewers: number
  lastInquiryTime: string
  urgencyTag?: string
}

export function generateBuildingListings(count: number = 350): BuildingListing[] {
  const listings: BuildingListing[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const region = randomChoice(regions)
    const subArea = randomChoice(region.subAreas)
    const areaPyeong = roundToRealistic(randomInt(18, 70), 5) // 5평 단위
    const isGoodLocation = Math.random() > 0.7
    const createdHoursAgo = randomInt(0, 75 * 24) // 0~75일 전
    const isNew = createdHoursAgo < 48 && Math.random() > 0.75 // 48시간 이내 + 25%만 NEW

    // 인기 매물은 12%만
    const isHot = Math.random() > 0.88

    // 문의 수: 현실적인 분포
    const inquiryRandom = Math.random()
    let inquiryCount: number
    if (inquiryRandom > 0.92) {
      inquiryCount = randomInt(15, 35) // 상위 8%
    } else if (inquiryRandom > 0.6) {
      inquiryCount = randomInt(5, 15) // 32%
    } else {
      inquiryCount = randomInt(1, 5) // 60%
    }

    // 긴급 태그: 8%만
    const urgencyTags = ['이번 주 계약 예정', '급매', '협의 가능']
    const hasUrgency = Math.random() > 0.92

    // 현재 보는 사람: 대부분 0명
    let currentViewers = 0
    if (isHot && Math.random() > 0.6) {
      currentViewers = randomInt(1, 3)
    } else if (Math.random() > 0.9) {
      currentViewers = 1
    }

    // 마지막 문의 시간: 40%만 표시
    let lastInquiryTime = ''
    if (Math.random() > 0.6) {
      const minutesAgo = Math.random() > 0.6
        ? randomInt(5, 120)    // 40%: 최근 2시간 내
        : randomInt(120, 4320) // 60%: 2시간~3일 전
      lastInquiryTime = getRelativeTime(minutesAgo)
    }

    // 좌표에 약간의 랜덤 오프셋 추가 (같은 동에서도 다른 위치)
    const latOffset = (Math.random() - 0.5) * 0.008
    const lngOffset = (Math.random() - 0.5) * 0.008

    listings.push({
      id: `bld-${generateId()}`,
      title: `${subArea.name} ${isGoodLocation ? '역세권 ' : ''}${randomChoice(['메디컬빌딩', '상가', '빌딩'])} ${randomInt(1, 8)}층`,
      region: region.name,
      regionCode: region.code,
      address: `${region.name} ${subArea.name}`,
      subArea: subArea.name,
      lat: subArea.lat + latOffset,
      lng: subArea.lng + lngOffset,
      floor: `${randomInt(1, 12)}층`,
      areaPyeong,
      deposit: roundToRealistic(randomInt(5000, 25000), 1000),
      monthlyRent: roundToRealistic(randomInt(200, 600), 50),
      maintenanceFee: roundToRealistic(randomInt(15, 40), 5),
      premium: Math.random() > 0.4 ? roundToRealistic(randomInt(2000, 12000), 1000) : 0,
      preferredTenants: randomChoices(hospitalTypes, randomInt(2, 3)),
      nearbyHospitals: randomChoices(hospitalTypes, randomInt(1, 2)),
      hasParking: Math.random() > 0.35,
      hasElevator: Math.random() > 0.25,
      buildingAge: randomInt(2, 20),
      status: Math.random() > 0.88 ? 'RESERVED' : 'ACTIVE',
      viewCount: randomInt(60, 350),
      inquiryCount,
      createdAt: new Date(now - createdHoursAgo * 60 * 60 * 1000).toISOString(),
      isVerified: Math.random() > 0.45,
      thumbnailIndex: i % 54, // 54개 이미지를 순차적으로 분산
      isHot,
      isNew,
      currentViewers,
      lastInquiryTime,
      urgencyTag: hasUrgency ? randomChoice(urgencyTags) : undefined,
    })
  }

  // 최신순 정렬
  return listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// 익명 약국 매물 생성
export interface PharmacyListing {
  id: string
  anonymousId: string
  region: string
  regionCode: string
  subArea: string // 동 이름
  lat: number // 위도
  lng: number // 경도
  pharmacyType: string
  nearbyHospitals: string[]
  monthlyRevenueMin: number // 만원
  monthlyRevenueMax: number // 만원
  monthlyRxCount: number
  premiumMin: number // 만원
  premiumMax: number // 만원
  monthlyRent: number // 만원
  deposit: number // 만원
  operationYears: number
  transferReason: string
  hasAutoDispenser: boolean
  hasParking: boolean
  floorInfo: string
  status: 'ACTIVE' | 'PAUSED' | 'MATCHED'
  viewCount: number
  interestCount: number
  matchScore?: number
  createdAt: string
  // 새로운 필드들
  isHot: boolean
  isNew: boolean
  currentViewers: number
  lastInterestTime: string
  urgencyTag?: string
  competitionLevel: 'low' | 'medium' | 'high'
}

const transferReasons = ['은퇴', '이주', '건강', '진로변경', '가족사정', '기타']

export function generatePharmacyListings(count: number = 120): PharmacyListing[] {
  const listings: PharmacyListing[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const region = randomChoice(regions)
    const subArea = randomChoice(region.subAreas)
    // 현실적인 매출 (500만 단위로 라운드)
    const baseRevenue = roundToRealistic(randomInt(4000, 12000), 500)
    const createdHoursAgo = randomInt(0, 60 * 24) // 0~60일 전
    const isNew = createdHoursAgo < 48 && Math.random() > 0.7 // 48시간 이내 + 30%만 NEW 표시

    // 인기 매물은 10%만
    const isHot = Math.random() > 0.9

    // 관심 수: 대부분 낮고, 일부만 높음
    const interestRandom = Math.random()
    let interestCount: number
    if (interestRandom > 0.9) {
      interestCount = randomInt(20, 45) // 상위 10%: 높은 관심
    } else if (interestRandom > 0.6) {
      interestCount = randomInt(8, 20) // 30%: 중간 관심
    } else {
      interestCount = randomInt(1, 8) // 60%: 낮은 관심
    }

    // 경쟁도는 관심 수에 기반 (논리적으로)
    let competitionLevel: 'low' | 'medium' | 'high'
    if (interestCount >= 20) {
      competitionLevel = 'high'
    } else if (interestCount >= 8) {
      competitionLevel = 'medium'
    } else {
      competitionLevel = 'low'
    }

    // 긴급 태그는 10%만, 경쟁 높을 때만
    const urgencyTags = ['협의 진행중', '급양도', '우대조건']
    const hasUrgency = competitionLevel === 'high' && Math.random() > 0.7

    // 현재 보는 사람: 대부분 없음, 인기 매물만 1-3명
    let currentViewers = 0
    if (isHot && Math.random() > 0.5) {
      currentViewers = randomInt(1, 3)
    } else if (Math.random() > 0.85) {
      currentViewers = randomInt(1, 2)
    }

    // 마지막 관심 시간: 50%만 표시, 시간도 다양하게
    let lastInterestTime: string | undefined
    if (Math.random() > 0.5) {
      const minutesAgo = Math.random() > 0.7
        ? randomInt(1, 60)  // 30%: 최근 1시간 내
        : randomInt(60, 2880) // 70%: 1시간~2일 전
      lastInterestTime = getRelativeTime(minutesAgo)
    }

    // 권리금도 1000만 단위로 라운드
    const premiumBase = roundToRealistic(randomInt(8000, 35000), 1000)

    // 좌표에 약간의 랜덤 오프셋 추가
    const latOffset = (Math.random() - 0.5) * 0.008
    const lngOffset = (Math.random() - 0.5) * 0.008

    listings.push({
      id: `phm-${generateId()}`,
      anonymousId: generateAnonymousCode('PM'), // PM-A7X2K 형식
      region: region.name,
      regionCode: region.code,
      subArea: subArea.name,
      lat: subArea.lat + latOffset,
      lng: subArea.lng + lngOffset,
      pharmacyType: randomChoice(pharmacyTypes),
      nearbyHospitals: randomChoices(hospitalTypes, randomInt(2, 4)),
      monthlyRevenueMin: baseRevenue,
      monthlyRevenueMax: baseRevenue + roundToRealistic(randomInt(1000, 3000), 500),
      monthlyRxCount: roundToRealistic(randomInt(1000, 3500), 100),
      premiumMin: premiumBase,
      premiumMax: premiumBase + roundToRealistic(randomInt(3000, 8000), 1000),
      monthlyRent: roundToRealistic(randomInt(200, 500), 50),
      deposit: roundToRealistic(randomInt(5000, 15000), 1000),
      operationYears: randomInt(3, 18),
      transferReason: randomChoice(transferReasons),
      hasAutoDispenser: Math.random() > 0.5,
      hasParking: Math.random() > 0.4,
      floorInfo: Math.random() > 0.6 ? '1층' : `${randomInt(2, 4)}층`,
      status: Math.random() > 0.92 ? 'MATCHED' : 'ACTIVE',
      viewCount: randomInt(40, 250),
      interestCount,
      matchScore: randomInt(72, 95),
      createdAt: new Date(now - createdHoursAgo * 60 * 60 * 1000).toISOString(),
      isHot,
      isNew,
      currentViewers,
      lastInterestTime: lastInterestTime || '',
      urgencyTag: hasUrgency ? randomChoice(urgencyTags) : undefined,
      competitionLevel,
    })
  }

  return listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// 커뮤니티 게시글 생성
export interface CommunityPost {
  id: string
  category: string
  title: string
  content: string
  authorType: 'doctor' | 'pharmacist' | 'landlord' | 'expert'
  authorName: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  isPinned: boolean
  tags: string[]
  // 새로운 필드들
  isHot: boolean
  isNew: boolean
  lastCommentTime?: string
  authorBadge?: string
}

const postCategories = ['개원정보', '약국운영', '매물후기', '질문답변', '업계소식', '세무/법률', '장비/인테리어']

const sampleTitles = [
  { category: '개원정보', titles: [
    '강남역 근처 개원 3개월차 후기 공유합니다',
    '정형외과 개원 비용 정리 (실제 견적 포함)',
    '피부과 개원 시 꼭 알아야 할 5가지',
    '첫 개원, 입지 선정 어떻게 하셨나요?',
    '개원 자금 대출 후기 (시중은행 vs 의사전용)',
    '40평대 내과 개원 인테리어 비용 공개',
    '신도시 vs 구도심, 개원 입지 고민입니다',
    '개원 1년차, 월 매출 3억 달성 후기',
    '소아과 개원, 예상보다 어려웠던 점들',
    '내과 개원 준비 체크리스트 공유합니다',
  ]},
  { category: '약국운영', titles: [
    '조제료 수익 극대화 노하우 공유',
    '약국 직원 관리 꿀팁 (5년차 경험담)',
    '자동조제기 도입 후기 - 생각보다 만족',
    '일일 처방전 200건 넘기는 비결',
    '약국 위치 선정, 병원 종류별 차이점',
    '온라인 판매 시작했는데 수익 괜찮네요',
    '약국 인수 vs 신규 개국, 뭐가 나을까요?',
    '편의점 약국 가능할까요? 경험담',
    '약국 마케팅, SNS 활용법 공유',
    '직원 채용 시 꼭 확인해야 할 것들',
  ]},
  { category: '매물후기', titles: [
    '여기서 매물 보고 계약했습니다 (솔직후기)',
    '3개월 만에 좋은 자리 찾았어요!',
    '매물 문의 팁 공유 (이렇게 하면 답변 빨리 옴)',
    '서초구 약국 인수 완료 - 과정 공유',
    '메디컬빌딩 입주 후기 (장단점)',
    '권리금 협상 성공 노하우',
    '건물주와 직거래 vs 중개 어떤게 나을까요',
    '강남 메디컬빌딩 비교 후기',
    '분당 약국 인수 성공기',
    '송파구 개원 후기 - 6개월 차',
  ]},
  { category: '질문답변', titles: [
    '처음 개원하는데 보증보험 꼭 필요한가요?',
    '약국 권리금 적정 수준이 어느 정도인가요?',
    '의료기기 리스 vs 구매 뭐가 유리할까요?',
    '간호사 채용 어디서 하시나요?',
    '처방전 예상 매출 계산하는 방법 있나요?',
    'EMR 프로그램 추천 부탁드립니다',
    '개원 전 수련 기간 얼마나 필요할까요?',
    '약국 POS 시스템 추천해주세요',
    '의료광고 규정 질문드립니다',
    '건물 계약 시 주의사항이 뭔가요?',
  ]},
  { category: '업계소식', titles: [
    '2024년 수가 인상 소식 정리',
    '비급여 진료 트렌드 변화 분석',
    '신규 메디컬빌딩 입점 정보 모음',
    '의료광고 규제 변경 사항 안내',
    '약사 인력난 심각해지고 있네요',
    '원격의료 관련 최신 동향',
    '건강보험 정책 변화가 개원에 미치는 영향',
    '의원급 폐업률 통계 분석',
    '약국 수가 인상 논의 현황',
    'AI 진료 보조 시스템 도입 사례',
  ]},
  { category: '세무/법률', titles: [
    '개원의 절세 전략 총정리 (세무사 칼럼)',
    '약국 사업자등록 절차 A to Z',
    '의료기관 개설 신고 시 주의사항',
    '공동개원 계약서 체크포인트',
    '임대차 계약 시 꼭 확인해야 할 조항들',
    '의료분쟁 예방을 위한 법적 조언',
    '약국 권리금 계약서 작성 가이드',
    '종합소득세 신고 팁 (의사편)',
    '부가세 환급 극대화하는 방법',
    '의료법인 설립 절차 안내',
  ]},
  { category: '장비/인테리어', titles: [
    '내과 필수 의료장비 리스트 및 가격대',
    '약국 인테리어 비용 절감 꿀팁',
    '조제실 동선 최적화 사례 공유',
    '진료실 인테리어 트렌드 2024',
    '중고 의료장비 구매 후기 (주의사항)',
    'LED 조명 교체 전후 비교 (사진有)',
    '대기실 설계, 이것만은 꼭 고려하세요',
    '의료장비 AS 업체 추천',
    '약국 디스플레이 최적화 팁',
    '스마트 진료실 구축 사례',
  ]},
]

const authorNames = {
  doctor: ['강남내과의사', '정형외과개원의', '피부과원장', '치과의사A', '개원준비중의사', '서울의사', '병원장B', '외과전문의', '내과3년차', '피부과개원의'],
  pharmacist: ['약사김OO', '10년차약사', '분당약국장', '조제약사', '약국인수희망', '서초약사', '개국준비약사', '약국원장', '체인약국장', '조제실장'],
  landlord: ['메디컬빌딩관리자', '강남건물주', '상가임대인', '부동산전문', '빌딩관리사', '상가분양담당'],
  expert: ['의료컨설턴트', '세무사박OO', '인테리어전문가', '의료법률전문', '병원마케팅전문', '개원컨설팅', '약국컨설턴트', '의료경영전문'],
}

const authorBadges = ['베스트 작성자', '전문가 인증', '10년+ 경력', '활발한 기여자', '인기 작성자']

export function generateCommunityPosts(count: number = 150): CommunityPost[] {
  const posts: CommunityPost[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const categoryData = randomChoice(sampleTitles)
    const title = randomChoice(categoryData.titles)
    const authorType = randomChoice(['doctor', 'pharmacist', 'landlord', 'expert'] as const)
    const isPopular = Math.random() > 0.8
    const createdHoursAgo = randomInt(0, 90 * 24)
    const isNew = createdHoursAgo < 12
    const commentCount = isPopular ? randomInt(15, 80) : randomInt(2, 15)

    posts.push({
      id: `post-${generateId()}`,
      category: categoryData.category,
      title: title + (Math.random() > 0.7 ? ` (${randomInt(1, 5)}탄)` : ''),
      content: '내용은 로그인 후 확인하실 수 있습니다.',
      authorType,
      authorName: randomChoice(authorNames[authorType]),
      viewCount: isPopular ? randomInt(500, 3000) : randomInt(50, 500),
      likeCount: isPopular ? randomInt(30, 150) : randomInt(5, 30),
      commentCount,
      createdAt: new Date(now - createdHoursAgo * 60 * 60 * 1000).toISOString(),
      isPinned: i < 3,
      tags: randomChoices(['꿀팁', '후기', '질문', '정보공유', '경험담', '추천', '필독'], randomInt(1, 3)),
      isHot: isPopular,
      isNew,
      lastCommentTime: commentCount > 0 ? getRelativeTime(randomInt(1, 60)) : undefined,
      authorBadge: Math.random() > 0.7 ? randomChoice(authorBadges) : undefined,
    })
  }

  // 고정글 먼저, 그 다음 최신순
  return posts.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

// 상대 시간 생성 (예: "3분 전", "1시간 전")
function getRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return '방금 전'
  if (minutesAgo < 60) return `${minutesAgo}분 전`
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}시간 전`
  return `${Math.floor(minutesAgo / 1440)}일 전`
}

// 통계 데이터 (현실적인 숫자들)
export const platformStats = {
  totalListings: 470,
  activePharmacyListings: 120,
  activeBuildingListings: 350,
  monthlyMatches: 47,
  totalMembers: 8742,
  todayNewListings: randomInt(3, 8),
  weeklyInquiries: randomInt(120, 180),
  successfulMatches: 847,
  averageMatchTime: '12.5일',
  todayActiveUsers: randomInt(120, 280),
  onlineNow: randomInt(15, 45),
  todayPosts: randomInt(8, 18),
  weeklyNewMembers: randomInt(40, 80),
}

// 실시간 활동 피드
export interface ActivityFeed {
  id: string
  type: 'new_listing' | 'inquiry' | 'match' | 'new_member' | 'new_post'
  message: string
  region?: string
  timeAgo: string
}

export function generateActivityFeed(count: number = 20): ActivityFeed[] {
  const activities: ActivityFeed[] = []
  const messages = {
    new_listing: [
      '새로운 매물이 등록되었습니다',
      '신규 약국 매물이 추가되었습니다',
      '메디컬빌딩 매물이 등록되었습니다',
    ],
    inquiry: [
      '매물 문의가 접수되었습니다',
      '관심 표시가 등록되었습니다',
      '상세 정보 요청이 있습니다',
    ],
    match: [
      '매칭이 성사되었습니다',
      '계약이 진행 중입니다',
      '성공적으로 매칭되었습니다',
    ],
    new_member: [
      '새로운 회원이 가입했습니다',
      '의사 회원이 가입했습니다',
      '약사 회원이 가입했습니다',
    ],
    new_post: [
      '새 게시글이 등록되었습니다',
      '질문글이 올라왔습니다',
      '후기가 공유되었습니다',
    ],
  }

  const types: ActivityFeed['type'][] = ['new_listing', 'inquiry', 'match', 'new_member', 'new_post']

  for (let i = 0; i < count; i++) {
    const type = randomChoice(types)
    const region = randomChoice(regions)

    activities.push({
      id: `activity-${generateId()}`,
      type,
      message: randomChoice(messages[type]),
      region: type !== 'new_member' ? region.name : undefined,
      timeAgo: getRelativeTime(randomInt(1, 120)),
    })
  }

  return activities
}

// 최근 매칭 성공 사례 (더 많은 스토리)
export const recentSuccessStories = [
  { region: '서울 강남구', type: '약국', days: 8, date: '2024.01.25', testimonial: '빠른 매칭에 감사드립니다!' },
  { region: '경기 분당구', type: '내과', days: 15, date: '2024.01.24', testimonial: '원하던 조건 그대로였어요' },
  { region: '서울 송파구', type: '약국', days: 11, date: '2024.01.23', testimonial: '익명 시스템이 좋았습니다' },
  { region: '부산 해운대구', type: '피부과', days: 22, date: '2024.01.22', testimonial: '상담이 정말 친절했어요' },
  { region: '서울 마포구', type: '약국', days: 6, date: '2024.01.21', testimonial: '일주일만에 계약!' },
  { region: '인천 연수구', type: '치과', days: 18, date: '2024.01.20', testimonial: '검증된 매물이라 안심됐어요' },
  { region: '경기 수원시', type: '약국', days: 14, date: '2024.01.19', testimonial: '권리금 협상도 도와주셨어요' },
  { region: '서울 서초구', type: '정형외과', days: 9, date: '2024.01.18', testimonial: '완벽한 입지였습니다' },
  { region: '대구 수성구', type: '약국', days: 12, date: '2024.01.17', testimonial: '지방도 매물이 많아서 좋아요' },
  { region: '서울 영등포구', type: '내과', days: 7, date: '2024.01.16', testimonial: '여의도 개원 성공!' },
  { region: '경기 고양시', type: '약국', days: 10, date: '2024.01.15', testimonial: '일산 좋은 자리 잡았습니다' },
  { region: '서울 강동구', type: '한의원', days: 16, date: '2024.01.14', testimonial: '상세한 매물 정보가 도움됐어요' },
]

// 회원 후기/추천글
export interface Testimonial {
  id: string
  authorType: 'doctor' | 'pharmacist'
  authorName: string
  content: string
  rating: number
  region: string
  date: string
  verified: boolean
}

export const memberTestimonials: Testimonial[] = [
  {
    id: 'test-1',
    authorType: 'doctor',
    authorName: '김OO 원장',
    content: '개원 준비 중에 여기서 좋은 매물을 찾았습니다. 익명으로 문의할 수 있어서 부담 없이 여러 곳을 알아볼 수 있었어요.',
    rating: 5,
    region: '서울 강남구',
    date: '2024.01.20',
    verified: true,
  },
  {
    id: 'test-2',
    authorType: 'pharmacist',
    authorName: '이OO 약사',
    content: '약국 인수 과정이 순조로웠습니다. 권리금 협상부터 계약까지 전문적인 도움을 받았어요.',
    rating: 5,
    region: '경기 분당구',
    date: '2024.01.18',
    verified: true,
  },
  {
    id: 'test-3',
    authorType: 'doctor',
    authorName: '박OO 원장',
    content: '커뮤니티에서 실제 개원 선배들의 조언을 많이 얻었습니다. 정말 유용한 정보가 많아요.',
    rating: 5,
    region: '서울 서초구',
    date: '2024.01.15',
    verified: true,
  },
  {
    id: 'test-4',
    authorType: 'pharmacist',
    authorName: '최OO 약사',
    content: 'AI 매칭 시스템이 정말 편리했어요. 제 조건에 맞는 매물만 추천받을 수 있었습니다.',
    rating: 5,
    region: '부산 해운대구',
    date: '2024.01.12',
    verified: true,
  },
  {
    id: 'test-5',
    authorType: 'doctor',
    authorName: '정OO 원장',
    content: '메디컬빌딩 비교가 한눈에 되어서 좋았습니다. 결국 여기서 본 매물로 개원했어요.',
    rating: 5,
    region: '인천 연수구',
    date: '2024.01.10',
    verified: true,
  },
]

// 오늘의 인기 매물 (Hot Listings)
export function getHotListings(buildings: BuildingListing[], pharmacies: PharmacyListing[]) {
  const hotBuildings = buildings.filter(b => b.isHot).slice(0, 5)
  const hotPharmacies = pharmacies.filter(p => p.isHot).slice(0, 5)
  return { hotBuildings, hotPharmacies }
}

// 새로 등록된 매물 (New Listings)
export function getNewListings(buildings: BuildingListing[], pharmacies: PharmacyListing[]) {
  const newBuildings = buildings.filter(b => b.isNew).slice(0, 10)
  const newPharmacies = pharmacies.filter(p => p.isNew).slice(0, 10)
  return { newBuildings, newPharmacies }
}
