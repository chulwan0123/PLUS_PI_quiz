import { useEffect, useRef, useState } from 'react';
import SuriMascot, { QuizSuriPeek } from './SuriMascot';
import ResultScreen from './ResultScreen';
import SuriVideoReview from './SuriVideoReview';
import AdminPage from './AdminPage';
import { isSupabaseConfigured, supabase } from './supabase';

const fallbackQuestions = [
  {
    id: 'gift-tax-deduction',
    lines: ['미성년 자녀는 직계존속에게', '10년간 2천만 원까지', '증여재산공제를 받을 수 있다.'],
    answer: true,
    explanation: '미성년 자녀는 직계존속 증여 시 10년간 합산해 2천만 원까지 공제받을 수 있어요.',
  },
  {
    id: 'gift-lump-sum',
    lines: ['자녀에게 증여하려면', '큰 목돈을 한 번에', '준비해야 한다.'],
    answer: false,
    explanation: '목돈을 한 번에 증여하거나 매달 나눠 증여하는 계획을 세울 수 있어요.',
  },
  {
    id: 'pi-investment-link',
    lines: ['PLUS 파이는 증여 계획만', '세우는 앱이라 투자와는', '연결되지 않는다.'],
    answer: false,
    explanation: 'PLUS 파이는 증여 계획을 세우고 증여금을 투자와 연결하도록 도와줘요.',
  },
  {
    id: 'pi-us-etf',
    lines: ['PLUS 파이에서는 증여금을', '미국 ETF 투자와', '연결할 수 있다.'],
    answer: true,
    explanation: '증여금을 미국 대표 기업에 분산 투자하는 ETF와 연결할 수 있어요.',
  },
  {
    id: 'pi-filing-documents',
    lines: ['PLUS 파이 패키지를 이용해도', '신고 서류는 모두', '직접 준비해야 한다.'],
    answer: false,
    explanation: '거래내역서와 증여금 평가 명세서 등 신고에 필요한 서류 준비를 도와줘요.',
  },
];

const quizLength = 2;

function pickRandomQuestions(questionPool, previousQuestions = []) {
  const previousSet = new Set(previousQuestions.map(({ id }) => id));
  const shuffled = [...questionPool];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  const picked = shuffled.slice(0, quizLength);
  if (
    questionPool.length > quizLength
    &&
    previousSet.size === quizLength
    && picked.every(({ id }) => previousSet.has(id))
  ) {
    picked[1] = shuffled.find(({ id }) => !previousSet.has(id));
  }

  return picked;
}

function pickResultLevel(score) {
  if (score === 0) return 0;
  if (score === 1) return Math.floor(Math.random() * 3);
  return 3 + Math.floor(Math.random() * 3);
}

export function App() {
  const [started, setStarted] = useState(false);
  const [questionPool, setQuestionPool] = useState(fallbackQuestions);
  const [quizQuestions, setQuizQuestions] = useState(() => pickRandomQuestions(fallbackQuestions));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(quizLength).fill(null));
  const [completed, setCompleted] = useState(false);
  const [resultLevel, setResultLevel] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const transitionTimer = useRef(null);
  const hintDialog = useRef(null);

  const question = quizQuestions[questionIndex];
  const selected = answers[questionIndex];
  const progress = (questionIndex / quizQuestions.length) * 100;
  const score = answers.reduce((total, answer, index) => total + Number(answer === quizQuestions[index].answer), 0);

  useEffect(() => () => clearTimeout(transitionTimer.current), []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let active = true;
    supabase
      .from('questions')
      .select('id, question_text, display_lines, correct_answer, explanation, hint_enabled, hint_text, hint_image_url, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active || error || !data || data.length < quizLength) return;
        const normalized = data.map((item) => ({
          id: item.id,
          lines: item.display_lines,
          answer: item.correct_answer,
          explanation: item.explanation,
          hintEnabled: item.hint_enabled,
          hintText: item.hint_text,
          hintImageUrl: item.hint_image_url,
        }));
        setQuestionPool(normalized);
        if (!started) setQuizQuestions(pickRandomQuestions(normalized));
      });

    return () => { active = false; };
  }, [started]);

  useEffect(() => {
    if (!started || completed) return undefined;
    const animationFrame = requestAnimationFrame(() => setDisplayProgress(progress));
    return () => cancelAnimationFrame(animationFrame);
  }, [started, completed, questionIndex, progress]);

  if (window.location.pathname === '/suri-review') {
    return <SuriVideoReview />;
  }

  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  const selectAnswer = (value) => {
    if (transitioning) return;
    const nextAnswers = answers.map((answer, index) => index === questionIndex ? value : answer);
    setAnswers(nextAnswers);
    setTransitioning(true);
    if (questionIndex === quizQuestions.length - 1) {
      setDisplayProgress(100);
    }
    transitionTimer.current = setTimeout(() => {
      if (questionIndex === quizQuestions.length - 1) {
        const finalScore = nextAnswers.reduce((total, answer, index) => total + Number(answer === quizQuestions[index].answer), 0);
        setResultLevel(pickResultLevel(finalScore));
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
    setQuizQuestions((current) => pickRandomQuestions(questionPool, current));
    setQuestionIndex(0);
    setAnswers(Array(quizLength).fill(null));
    setCompleted(false);
    setResultLevel(0);
    setTransitioning(false);
    setDisplayProgress(0);
    setStarted(true);
  };

  const restart = () => {
    setQuestionIndex(0);
    setAnswers(Array(quizLength).fill(null));
    setCompleted(false);
    setResultLevel(0);
    setTransitioning(false);
    setDisplayProgress(0);
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
    return <ResultScreen questions={quizQuestions} answers={answers} score={score} levelIndex={resultLevel} onHome={goHome} />;
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

        <div className="progress-row" aria-label={`퀴즈 진행률 ${quizQuestions.length}문제 중 ${questionIndex + 1}번째`}>
          <div className="progress-track" aria-hidden="true"><span className="progress-value" style={{ width: `${displayProgress}%` }} /></div>
          <p className="remaining">{questionIndex + 1} / {quizQuestions.length}</p>
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

        {question.hintEnabled && (
          <button className="hint-button" type="button" onClick={() => hintDialog.current?.showModal()}>
            <span>힌트보기</span>
            <svg className="hint-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        )}

        <button className="plus-logo" type="button" onClick={goHome} aria-label="시작 페이지로 이동">
          <img src="/assets/plus-logo.svg" alt="" draggable="false" />
        </button>

        {question.hintEnabled && (
          <dialog ref={hintDialog} className="install-dialog hint-dialog" aria-labelledby="hint-title" onClick={event => { if (event.target === hintDialog.current) hintDialog.current.close(); }}>
            <button className="install-close" type="button" aria-label="힌트 닫기" onClick={() => hintDialog.current?.close()}>×</button>
            <h2 id="hint-title">힌트</h2>
            {question.hintImageUrl && <img className="hint-image" src={question.hintImageUrl} alt="퀴즈 힌트" />}
            <p className="hint-copy">{question.hintText || '힌트가 준비 중이에요.'}</p>
          </dialog>
        )}
      </section>
    </main>
  );
}
