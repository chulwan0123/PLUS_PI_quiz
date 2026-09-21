import { useRef } from 'react';

const levels = ['파이 첫걸음', '파이 새싹', '파이 탐험가', '파이 실력자', '파이 전문가', '파이 마스터'];
const levelMessages = [
  '파이를 알아가는 첫걸음을 뗐어요!',
  '우리 아이 자산에 대한 관심이 싹텄어요!',
  '우리 아이의 자산공식을 탐험하고 있어요!',
  '이제 파이를 꽤 잘 알고 있어요!',
  '우리 아이 자산을 준비할 지식이 탄탄해요!',
  '당신은 진정한 파이 마스터예요!',
];

export default function ResultScreen({ questions, answers, score, onRestart, onHome }) {
  const dialog = useRef(null);
  const level = levels[score];
  return (
    <main className="browser-stage">
      <section className="quiz-screen result-page" aria-label="PLUS 파이 퀴즈 완료 및 정답">
        <div className="result-scroll" tabIndex={0} aria-label="퀴즈 결과와 전체 해설">
          <div className="home-brand-row result-brand-row" aria-label="PI와 PLUS">
            <button className="result-home-button" type="button" onClick={onHome} aria-label="시작 페이지로 이동">
              <img src="/assets/pi-logo-home-v2.svg" alt="PI" draggable="false" />
            </button>
            <img src="/assets/plus-logo-home-v2.svg" alt="PLUS" draggable="false" />
          </div>
          <header className="result-hero">
            <p className="result-eyebrow">나의 파이 레벨</p>
            <h1><span>{score}점</span><br />{level}</h1>
            <div className="result-character-slot" role="img" aria-label="수리 캐릭터가 들어갈 자리"><span>수리 캐릭터</span></div>
            <p className="result-message">{levelMessages[score]}</p>
          </header>
          <section className="result-answers" aria-label="전체 5문제 정답과 해설">
            <h2>총 {questions.length}문제 중<br /><strong>{score}문제</strong>를 맞혔어요!</h2>
            <p className="result-guide">맞힌 문제도 한 번 더 확인해 보세요.</p>
            <ol>
              {questions.map((item, index) => {
                const correct = answers[index] === item.answer;
                return (
                  <li key={index}>
                    <div className="result-question-meta">
                      <span className="result-question-number">QUIZ {index + 1}</span>
                      <span className={`result-status-mark ${correct ? 'is-correct' : 'is-incorrect'}`} role="img" aria-label={correct ? '맞혔어요' : '틀렸어요'} />
                    </div>
                    <h3>{item.lines.join(' ')}</h3>
                    <div className="result-answer-pair"><strong>정답 {item.answer ? 'O' : 'X'}</strong><span>내 답 {answers[index] ? 'O' : 'X'}</span></div>
                    <p className="result-explanation">{item.explanation}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
        <footer className="result-action-bar">
          <button className="result-install" onClick={() => dialog.current.showModal()}>파이 앱 시작해보기</button>
          <button className="result-retry" onClick={onRestart}>퀴즈 다시 풀기</button>
        </footer>
        <dialog ref={dialog} className="install-dialog" aria-labelledby="install-title" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
          <button className="install-close" aria-label="설치 안내 닫기" onClick={() => dialog.current.close()}>×</button>
          <p className="result-eyebrow">PLUS 파이</p>
          <h2 id="install-title">파이를 만나보세요</h2>
          <div className="install-qr-placeholder" role="img" aria-label="설치 QR 코드 준비 중"><strong>QR</strong><span>준비 중</span></div>
          <p>설치 QR을 준비하고 있어요.<br />조금만 기다려 주세요!</p>
          <button className="install-confirm" onClick={() => dialog.current.close()}>확인</button>
        </dialog>
      </section>
    </main>
  );
}
