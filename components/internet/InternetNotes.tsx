'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// 아정당의 긴 "필독사항" 대신, 정책표 공통 시트에서 고객에게 꼭 필요한 것만 접어 둔다.
const NOTES = [
  { t: '약정은 3년이에요', d: '재약정·무약정·1~2년 약정은 접수할 수 없어요.' },
  { t: '설치비는 첫 달 요금에 합산돼요', d: '통신사 설치비가 첫 달 청구서에 함께 나와요.' },
  { t: '중도 해지하면 사은품이 환수될 수 있어요', d: '개통 후 1년 이내 해지·명의변경·상품 하향 시 통신사 규정에 따라 환수돼요.' },
  { t: '휴대폰 결합은 설치 후 직접 신청해요', d: '인터넷 설치가 끝나면 통신사 고객센터에서 결합 할인을 등록할 수 있어요.' },
];

const FAQ = [
  { q: '요금과 품질은 통신사에 직접 가입할 때와 같나요?', a: '같아요. 통신사 정식 상품을 그대로 접수하고, 혜택연구소는 신청만 대신 전달해요. 결제는 통신사에 직접 하세요.' },
  { q: '사은품은 언제 받나요?', a: '개통이 완료되면 상품권은 1주일 안에 모바일로, 현금 사은품은 통신사별 일정에 맞춰 안내드린 날짜에 지급돼요.' },
  { q: '명의자와 납부 계좌가 달라도 되나요?', a: '명의자·납부 계좌·사은품 계좌는 같은 사람이어야 접수가 돼요. 자동이체는 필수예요.' },
  { q: '신청서를 쓰다가 모르는 항목이 있으면요?', a: '건너뛰고 제출하면 돼요. 해피콜(확인 전화)에서 부족한 내용을 함께 채워 드려요.' },
  { q: '사업자(가게·사무실)도 신청할 수 있나요?', a: 'LG U+ 소호 상품으로 신청할 수 있어요. 070 전화·CCTV 결합도 함께 고를 수 있어요.' },
];

export default function InternetNotes({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [openNote, setOpenNote] = useState<number | null>(null);
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-[17px] font-bold text-[#333d4b]">꼭 알아두세요</h2>
        <ul className="mt-3 rounded-2xl bg-[#f4f5f7] divide-y divide-white" data-testid="internet-notes">
          {NOTES.slice(0, compact ? 3 : NOTES.length).map((n, i) => (
            <li key={n.t}>
              <button
                type="button"
                onClick={() => setOpenNote(openNote === i ? null : i)}
                aria-expanded={openNote === i}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="text-[14px] font-semibold text-[#333d4b]">{n.t}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openNote === i ? 'rotate-180' : ''}`} />
              </button>
              {openNote === i && <p className="px-4 pb-3.5 -mt-1 text-[13px] text-gray-500 leading-relaxed">{n.d}</p>}
            </li>
          ))}
        </ul>
      </section>
      {!compact && (
        <section>
          <h2 className="text-[17px] font-bold text-[#333d4b]">자주 묻는 질문</h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {FAQ.map((f, i) => (
              <li key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="w-full flex items-center justify-between gap-3 py-3.5 text-left"
                >
                  <span className="text-[14px] font-medium text-[#333d4b]">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                </button>
                {open === i && <p className="pb-4 text-[13px] text-gray-500 leading-relaxed">{f.a}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
