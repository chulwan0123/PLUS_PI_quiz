export default function SuriMascot() {
  return (
    <svg className="home-mascot" viewBox="-50 0 700 470" role="img" aria-label="수리가 원래 양쪽 날개로 왼쪽 O 팻말과 오른쪽 X 팻말을 번갈아 듭니다">
      <ellipse cx="300" cy="429" rx="135" ry="15" fill="#141415" opacity="0.08" />
      <g className="suri-bounce">
        {/* Pivot at the original wings; original artwork covers the grips. */}
        <g className="suri-paddle suri-paddle-o">
          <path d="M180 248 L126 155" stroke="#141415" strokeWidth="19" strokeLinecap="round" />
          <path d="M180 248 L126 155" stroke="var(--color-orange-400)" strokeWidth="12" strokeLinecap="round" />
          <rect x="55" y="57" width="142" height="116" rx="30" fill="var(--color-orange-200)" stroke="#141415" strokeWidth="4" />
          <circle cx="126" cy="115" r="32" fill="none" stroke="#141415" strokeWidth="12" />
        </g>
        <g className="suri-paddle suri-paddle-x">
          <path d="M437 342 L516 243" stroke="#141415" strokeWidth="19" strokeLinecap="round" />
          <path d="M437 342 L516 243" stroke="var(--color-orange-400)" strokeWidth="12" strokeLinecap="round" />
          <rect x="445" y="141" width="142" height="116" rx="30" fill="var(--color-orange-600)" stroke="#141415" strokeWidth="4" />
          <path d="M493 176 L539 222 M539 176 L493 222" fill="none" stroke="#141415" strokeWidth="12" strokeLinecap="round" />
        </g>
        <image href="/assets/pi-suri-no-coin.svg" x="113" y="96" width="374" height="320" />
        <g className="suri-blink" aria-hidden="true">
          <ellipse cx="255" cy="244" rx="17" ry="18" fill="white" />
          <ellipse cx="383" cy="274" rx="17" ry="18" fill="white" />
          <path d="M242 245 Q255 252 268 245 M370 275 Q383 282 396 275" fill="none" stroke="#141415" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export function QuizSuriPeek() {
  return (
    <svg className="quiz-suri-peek" viewBox="0 0 132 82" aria-hidden="true">
      <g className="quiz-peek-paddle quiz-peek-paddle-o">
        <path d="M28 48 L7 33" stroke="#141415" strokeWidth="5" strokeLinecap="round" />
        <path d="M28 48 L7 33" stroke="var(--color-orange-400)" strokeWidth="3" strokeLinecap="round" />
        <rect x="-12" y="7" width="35" height="29" rx="7" fill="var(--color-orange-200)" stroke="#141415" strokeWidth="1.5" />
        <circle cx="5.5" cy="21.5" r="8" fill="none" stroke="#141415" strokeWidth="3.5" />
      </g>
      <g className="quiz-peek-paddle quiz-peek-paddle-x">
        <path d="M109 78 L128 47" stroke="#141415" strokeWidth="5" strokeLinecap="round" />
        <path d="M109 78 L128 47" stroke="var(--color-orange-400)" strokeWidth="3" strokeLinecap="round" />
        <rect x="110" y="20" width="34" height="29" rx="7" fill="var(--color-orange-600)" stroke="#141415" strokeWidth="1.5" />
        <path d="M121 29 L133 41 M133 29 L121 41" fill="none" stroke="#141415" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <image href="/assets/pi-suri-no-coin.svg" x="7" width="118" height="101" />
    </svg>
  );
}
