import { useEffect, useRef, useState } from 'react';

const candyImages = ['/assets/img_candy1.png', '/assets/img_candy2.png'];
const bagImages = ['/assets/img_bag.png'];

export default function RewardDialog({ score }) {
  const dialog = useRef(null);
  const [seconds, setSeconds] = useState(10);
  const [closed, setClosed] = useState(false);
  const [closing, setClosing] = useState(false);
  const perfect = score === 2;
  const images = perfect ? bagImages : candyImages;
  const [particles] = useState(() => Array.from({ length: 42 }, (_, index) => ({
    image: index % images.length,
    start: 8 + ((index * 5) % 14) * (84 / 13),
    drift: -65 + Math.random() * 130,
    rise: 280 + Math.random() * 460,
    size: (22 + Math.random() * 30) * 1.3 * 1.4,
    rotation: -300 + Math.random() * 600,
    delay: Math.floor(index / 14) * 0.4 + Math.random() * 0.18,
    duration: 1.7 + Math.random() * 0.8,
  })));

  useEffect(() => {
    if (closed) return undefined;
    const modal = dialog.current;
    modal.showModal();
    const deadline = Date.now() + 10000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        setClosing(true);
      }
    }, 100);
    return () => {
      clearInterval(timer);
      modal.close();
    };
  }, [closed]);

  useEffect(() => {
    if (!closing) return undefined;
    const timer = setTimeout(() => setClosed(true), 420);
    return () => clearTimeout(timer);
  }, [closing]);

  if (closed) return null;

  return (
    <dialog ref={dialog} className={`reward-dialog${closing ? ' is-closing' : ''}`} aria-labelledby="reward-title" aria-describedby="reward-description" onCancel={(event) => { event.preventDefault(); setClosing(true); }}>
      <div className="reward-fireworks" aria-hidden="true">
        {particles.map((particle, index) => (
          <img key={index} src={images[particle.image]} alt="" style={{
            '--start': `${particle.start}%`, '--drift': `${particle.drift}px`,
            '--rise': `${particle.rise}px`, '--size': `${particle.size}px`,
            '--rotation': `${particle.rotation}deg`, '--delay': `${particle.delay}s`,
            '--duration': `${particle.duration}s`,
          }} />
        ))}
      </div>
      <section className="reward-sheet">
        <div className={`reward-images ${perfect ? 'reward-bag' : 'reward-candy'}`}>
          <img src={images[0]} alt={perfect ? '선물 타포린백' : '선물 캔디'} />
        </div>
        <p className="reward-eyebrow">{perfect ? '모두 정답! 축하해요' : '퀴즈 참여 선물'}</p>
        <h2 id="reward-title">{perfect ? <>파이 퀴즈 모두 맞혔어요!<br />타포린백 받아가세요</> : <>파이 퀴즈 잘 풀었어요!<br />달콤한 캔디 받아가세요</>}</h2>
        <p id="reward-description">{perfect ? '두 문제를 모두 맞힌 당신께 타포린백을 드려요.' : '즐겁게 참여해 주신 당신께 캔디를 드려요.'}<br />현장 스태프에게 선물을 받아가세요!</p>
        <button className="reward-close" type="button" disabled={closing} onClick={() => setClosing(true)}>{seconds}초 후 닫혀요</button>
      </section>
    </dialog>
  );
}
