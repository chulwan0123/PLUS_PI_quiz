import { useState } from 'react';

const initialVideos = [
  { id: 'coin', level: '0', name: '코인 수리', type: '세로형', size: '544×720', src: '/assets/suri-coin.mp4', scale: 0.9, x: 50, y: 50 },
  { id: 'sprout', level: '1', name: '새싹 수리', type: '가로형', size: '832×464', src: '/assets/suri-sprout.mp4', scale: 0.92, x: 50, y: 50 },
  { id: 'explorer', level: '2', name: '탐험가 수리', type: '정사각형', size: '624×624', src: '/assets/suri-explorer.mp4', scale: 1.19, x: 50, y: 50 },
  { id: 'calculator', level: '3', name: '계산왕 수리', type: '세로형', size: '544×720', src: '/assets/suri-calculator.mp4', scale: 1.27, x: 50, y: 50 },
  { id: 'asset-doctor', level: '4', name: '자산박사 수리', type: '세로형', size: '544×720', src: '/assets/suri-asset-doctor.mp4', scale: 1.23, x: 50, y: 50 },
  { id: 'master', level: '5', name: '파이 마스터 수리', type: '세로형', size: '544×720', src: '/assets/suri-master.mp4', scale: 1.1, x: 50, y: 50 },
];

function Control({ label, value, min, max, step = 1, onChange }) {
  return (
    <label className="suri-review-control">
      <span>{label}<output>{value}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function SuriVideoReview() {
  const [videos, setVideos] = useState(initialVideos);

  const update = (id, key, value) => {
    setVideos((current) => current.map((video) => video.id === id ? { ...video, [key]: value } : video));
  };

  return (
    <main className="browser-stage">
      <section className="suri-review-page" aria-label="결과용 수리 동영상 검수">
        <header className="suri-review-header">
          <p>RESULT CHARACTER MASK TEST</p>
          <h1>수리 동영상<br />정사각형 크롭 검수</h1>
          <span>모든 프레임은 결과 페이지와 동일한 정사각형 비율입니다.</span>
        </header>

        <div className="suri-review-list">
          {videos.map((video) => (
            <article className="suri-review-card" key={video.id}>
              <div className="suri-review-title">
                <div><b>{video.level}</b><h2>{video.name}</h2></div>
                <p>{video.type} · {video.size}</p>
              </div>

              <div className="suri-video-frame">
                <video
                  aria-label={`${video.name} 동영상`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  src={video.src}
                  style={{ objectPosition: `${video.x}% ${video.y}%`, transform: `scale(${video.scale})` }}
                />
                <i className="suri-frame-axis suri-frame-axis-x" aria-hidden="true" />
                <i className="suri-frame-axis suri-frame-axis-y" aria-hidden="true" />
              </div>

              <div className="suri-review-controls">
                <Control label="확대" value={video.scale} min={0.7} max={1.5} step={0.01} onChange={(value) => update(video.id, 'scale', value)} />
                <Control label="가로 중심" value={video.x} min={0} max={100} onChange={(value) => update(video.id, 'x', value)} />
                <Control label="세로 중심" value={video.y} min={0} max={100} onChange={(value) => update(video.id, 'y', value)} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
