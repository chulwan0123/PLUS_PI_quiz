import { useEffect, useRef, useState } from 'react';
import SuriMascot, { QuizSuriPeek } from './SuriMascot';
import ResultScreen from './ResultScreen';

const questions = [
  {
    lines: ['미성년 자녀는 직계존속에게', '10년간 2천만 원까지', '증여재산공제를 받을 수 있다.'],
    answer: true,
    explanation: '미성년 자녀는 직계존속 증여 시 10년간 합산해 2천만 원까지 공제받을 수 있어요.',
  },
  {
    lines: ['자녀에게 증여하려면', '큰 목돈을 한 번에', '준비해야 한다.'],
    answer: false,
    explanation: '목돈을 한 번에 증여하거나 매달 나눠 증여하는 계획을 세울 수 있어요.',
  },
  {
    lines: ['PLUS 파이는 증여 계획만', '세우는 앱이라 투자와는', '연결되지 않는다.'],
    answer: false,
    explanation: 'PLUS 파이는 증여 계획을 세우고 증여금을 투자와 연결하도록 도와줘요.',
  },
  {
    lines: ['PLUS 파이에서는 증여금을', '미국 ETF 투자와', '연결할 수 있다.'],
    answer: true,
    explanation: '증여금을 미국 대표 기업에 분산 투자하는 ETF와 연결할 수 있어요.',
  },
  {
    lines: ['PLUS 파이 패키지를 이용해도', '신고 서류는 모두', '직접 준비해야 한다.'],
    answer: false,
    explanation: '거래내역서와 증여금 평가 명세서 등 신고에 필요한 서류 준비를 도와줘요.',
  },
];

export function App() {
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [completed, setCompleted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef(null);

  const question = questions[questionIndex];
  const selected = answers[questionIndex];
  const progress = ((questionIndex + 1) / questions.length) * 100;
  const score = answers.reduce((total, answer, index) => total + Number(answer === questions[index].answer), 0);

  useEffect(() => () => clearTimeout(transitionTimer.current), []);

  const selectAnswer = (value) => {
    if (transitioning) return;
    setAnswers((current) => current.map((answer, index) => index === questionIndex ? value : answer));
    setTransitioning(true);
    transitionTimer.current = setTimeout(() => {
      if (questionIndex === questions.length - 1) {
        setCompleted(true);
      } else {
        setQuestionIndex((current) => current + 1);
      }
      setTransitioning(false);
    }, 700);
  };

  const goBack = () => {
    if (transitioning) return;
    if (questionIndex > 0) {
      setQuestionIndex((current) => current - 1);
    } else {
      setStarted(false);
    }
  };

  const startQuiz = () => {
    setQuestionIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setCompleted(false);
    setTransitioning(false);
    setStarted(true);
  };

  const restart = () => {
    setQuestionIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setCompleted(false);
    setTransitioning(false);
  };

  const goHome = () => {
    restart();
    setStarted(false);
  };

  if (!started) {
    return (
      <main className="browser-stage">
        <section
          className="quiz-screen home-screen"
          aria-label="PLUS 파이 OX 퀴즈 홈"
        >
          <div className="home-copy">
            <div className="home-brand-row" aria-label="PI와 PLUS">
              <img src="/assets/pi-logo-home-v2.svg" alt="PI" draggable="false" />
              <img src="/assets/plus-logo-home-v2.svg" alt="PLUS" draggable="false" />
            </div>
            <div className="home-tagline" role="img" aria-label="앞서가는 부모들의 자산공식">
              <div className="home-tagline-line home-tagline-top">
                <img src="/assets/home-tagline-top.png" alt="" draggable="false" />
              </div>
              <div className="home-tagline-line home-tagline-bottom">
                <img src="/assets/home-tagline-bottom.png" alt="" draggable="false" />
              </div>
            </div>
            <h1 className="home-promo">
              <span>PLUS 파이 OX퀴즈 맞추고</span>
              <span className="home-promo-reward">경품 받아가세요!</span>
            </h1>
          </div>
          <SuriMascot />
          <button className="home-start-button" type="button" onClick={startQuiz}>시작하기</button>
        </section>
      </main>
    );
  }

  if (completed) {
    return <ResultScreen questions={questions} answers={answers} score={score} onRestart={restart} onHome={goHome} />;
  }

  return (
    <main className="browser-stage">
      <section className="quiz-screen" data-transitioning={transitioning} aria-label={`PLUS 파이 퀴즈 ${questionIndex + 1}번째 문제`}>
        <div className="question-paper" aria-hidden="true" />
        <div className="question-icon-slot" aria-hidden="true">QUIZ {questionIndex + 1}</div>
        <button className="back-button" type="button" onClick={goBack} aria-label={questionIndex === 0 ? '홈으로' : '이전 문제'} disabled={transitioning}>
          <img src="/assets/arrow-back.svg" alt="" />
        </button>

        <QuizSuriPeek />

        <div className="progress-row" aria-label={`퀴즈 진행률 5문제 중 ${questionIndex + 1}번째`}>
          <div className="progress-track" aria-hidden="true"><span className="progress-value" style={{ width: `${progress}%` }} /></div>
          <p className="remaining">{questionIndex + 1} / {questions.length}</p>
        </div>

        <div className="question-copy ox-question">
          <h1>{question.lines.map((line) => {
            const [before, after] = line.split('PLUS 파이');
            return (
              <span key={line}>
                {before}
                {after !== undefined && <><strong className="product-name">PLUS 파이</strong>{after}</>}
              </span>
            );
          })}</h1>
        </div>

        <div className="choices ox-choices" role="group" aria-label="O 또는 X 선택">
          {[true, false].map((value) => (
            <button
              className="choice-button ox-button"
              data-state={selected === value ? 'selected' : 'idle'}
              aria-label={value ? 'O, 맞다' : 'X, 아니다'}
              aria-pressed={selected === value}
              disabled={transitioning}
              key={String(value)}
              onClick={() => selectAnswer(value)}
              type="button"
            >
              {value ? 'O' : 'X'}
            </button>
          ))}
        </div>

        <button className="plus-logo" type="button" onClick={goHome} aria-label="시작 페이지로 이동">
          <img src="/assets/plus-logo.svg" alt="" draggable="false" />
        </button>
      </section>
    </main>
  );
}
