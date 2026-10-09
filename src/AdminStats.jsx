import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { ESTIMATE_SNAPSHOT_AT, estimateDays } from './statsEstimates';

const KST_OFFSET = 9 * 60 * 60 * 1000;
const PAGE = 1000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toKst(iso) {
  const d = new Date(new Date(iso).getTime() + KST_OFFSET);
  return {
    date: d.toISOString().slice(0, 10),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
    time: d.toISOString().slice(11, 19),
  };
}

function dateLabel(date) {
  const [, m, d] = date.split('-').map(Number);
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return `${m}/${d}(${WEEKDAYS[weekday]})`;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '-';
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`;
}

const ESTIMATES = estimateDays();
const ESTIMATE_TOTAL = ESTIMATES.reduce((s, d) => s + d.total, 0);

const pct = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '-');

async function fetchAllEvents() {
  const rows = [];
  for (let from = 0; from < 200000; from += PAGE) {
    const { data, error } = await supabase
      .from('quiz_events')
      .select('id, created_at, event_type, round_id, device_id, question_id, question_index, is_correct, score, result_level, stage, elapsed_ms')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

function buildRounds(events) {
  const map = new Map();
  events.forEach((event) => {
    let round = map.get(event.round_id);
    if (!round) {
      round = { id: event.round_id, device: event.device_id, startedAt: null, completedAt: null, score: null, durationMs: null, qr: false, answers: 0, exitStage: null };
      map.set(event.round_id, round);
    }
    if (event.event_type === 'start') round.startedAt = event.created_at;
    if (event.event_type === 'answer') round.answers += 1;
    if (event.event_type === 'complete') {
      round.completedAt = event.created_at;
      round.score = event.score;
      round.durationMs = event.elapsed_ms;
    }
    if (event.event_type === 'qr_open') round.qr = true;
    if (event.event_type === 'home') round.exitStage = event.stage;
    if (!round.startedAt) round.startedAt = event.created_at;
  });
  return [...map.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

function downloadCsv(rounds) {
  const header = ['시작일', '시작시각(KST)', '오전/오후', '결과확인', '점수', '소요(초)', 'QR열람', '이탈단계', '기기'];
  const lines = rounds.map((round) => {
    const k = toKst(round.startedAt);
    return [
      k.date,
      k.time,
      k.hour < 12 ? '오전' : '오후',
      round.completedAt ? 'Y' : 'N',
      round.score ?? '',
      round.durationMs ? Math.round(round.durationMs / 1000) : '',
      round.qr ? 'Y' : 'N',
      round.completedAt ? '' : (round.exitStage === 'quiz' ? '문제 중 홈으로' : '미완료'),
      (round.device || '').slice(0, 8),
    ].join(',');
  });
  const blob = new Blob([`﻿${[header.join(','), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pi-quiz-rounds-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminStats({ questions }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [selectedDate, setSelectedDate] = useState('all');
  const [device, setDevice] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchAllEvents();
      setEvents(rows);
      setError('');
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message?.includes('quiz_events')
        ? '통계 테이블(quiz_events)이 아직 준비되지 않았습니다.'
        : `통계를 불러오지 못했습니다: ${err.message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const devices = useMemo(() => [...new Set(events.map((e) => e.device_id).filter(Boolean))], [events]);
  const scopedEvents = useMemo(
    () => (device === 'all' ? events : events.filter((e) => e.device_id === device)),
    [events, device],
  );
  const allRounds = useMemo(() => buildRounds(scopedEvents), [scopedEvents]);
  const dates = useMemo(() => [...new Set(allRounds.map((r) => toKst(r.startedAt).date))].sort(), [allRounds]);
  const rounds = useMemo(
    () => (selectedDate === 'all' ? allRounds : allRounds.filter((r) => toKst(r.startedAt).date === selectedDate)),
    [allRounds, selectedDate],
  );
  const completed = rounds.filter((r) => r.completedAt);

  const summary = useMemo(() => {
    const durations = completed.map((r) => r.durationMs).filter((v) => v > 0).sort((a, b) => a - b);
    return {
      starts: rounds.length,
      completes: completed.length,
      qr: rounds.filter((r) => r.qr).length,
      perfect: completed.filter((r) => r.score === 2).length,
      median: durations.length ? durations[Math.floor(durations.length / 2)] : null,
    };
  }, [rounds, completed]);

  const daily = useMemo(() => dates.map((date) => {
    const dayRounds = allRounds.filter((r) => toKst(r.startedAt).date === date);
    const done = dayRounds.filter((r) => r.completedAt);
    const am = done.filter((r) => toKst(r.completedAt).hour < 12).length;
    return { date, starts: dayRounds.length, completes: done.length, am, pm: done.length - am, qr: dayRounds.filter((r) => r.qr).length };
  }), [dates, allRounds]);

  const hourly = useMemo(() => {
    const doneAll = allRounds.filter((r) => r.completedAt);
    const counts = {};
    doneAll.forEach((r) => {
      const k = toKst(r.completedAt);
      const key = `${k.date}|${k.hour}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const columns = [
      ...ESTIMATES.map((e) => ({ key: `est-${e.date}`, label: `${dateLabel(e.date)} 추정`, estimate: true, cell: (h) => e.hours[h] || 0 })),
      ...dates.map((date) => ({ key: date, label: dateLabel(date), estimate: false, cell: (h) => counts[`${date}|${h}`] || 0 })),
    ];
    const usedHours = [
      ...doneAll.map((r) => toKst(r.completedAt).hour),
      ...ESTIMATES.flatMap((e) => Object.keys(e.hours).map(Number)),
    ];
    const minH = Math.min(9, ...usedHours);
    const maxH = Math.max(18, ...usedHours);
    const hours = [];
    for (let h = minH; h <= maxH; h += 1) hours.push(h);
    const max = Math.max(1, ...columns.flatMap((c) => hours.map((h) => c.cell(h))));
    return { hours, columns, max };
  }, [allRounds, dates]);

  const slots = useMemo(() => {
    if (selectedDate === 'all') return [];
    const counts = {};
    completed.forEach((r) => {
      const k = toKst(r.completedAt);
      const key = `${String(k.hour).padStart(2, '0')}:${k.minute < 30 ? '00' : '30'}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const keys = Object.keys(counts).sort();
    if (!keys.length) return [];
    const result = [];
    const [h0] = keys[0].split(':').map(Number);
    const [h1] = keys[keys.length - 1].split(':').map(Number);
    for (let h = h0; h <= h1; h += 1) {
      ['00', '30'].forEach((m) => {
        const key = `${String(h).padStart(2, '0')}:${m}`;
        result.push({ key, count: counts[key] || 0 });
      });
    }
    return result;
  }, [completed, selectedDate]);
  const slotMax = Math.max(1, ...slots.map((s) => s.count));

  const scoreDist = [0, 1, 2].map((score) => completed.filter((r) => r.score === score).length);

  const questionStats = useMemo(() => {
    const roundIds = new Set(rounds.map((r) => r.id));
    const stats = {};
    scopedEvents.forEach((e) => {
      if (e.event_type !== 'answer' || !roundIds.has(e.round_id)) return;
      const s = stats[e.question_id] || { total: 0, correct: 0 };
      s.total += 1;
      if (e.is_correct) s.correct += 1;
      stats[e.question_id] = s;
    });
    return Object.entries(stats)
      .map(([id, s]) => ({ id, ...s, text: questions.find((q) => String(q.id) === id)?.question_text?.replace(/\n/g, ' ') || id }))
      .sort((a, b) => b.total - a.total);
  }, [scopedEvents, rounds, questions]);

  const recent = [...rounds].reverse().slice(0, 40);

  if (error) {
    return (
      <section className="admin-stats">
        <p className="admin-feedback" role="status">{error}</p>
        <button type="button" className="admin-stats-refresh" onClick={load}>다시 시도</button>
      </section>
    );
  }

  return (
    <section className="admin-stats" aria-label="참여 통계">
      <div className="admin-stats-toolbar">
        <div className="admin-stats-chips" role="tablist" aria-label="날짜 선택">
          <button type="button" className={selectedDate === 'all' ? 'is-selected' : ''} onClick={() => setSelectedDate('all')}>전체 기간</button>
          {dates.map((date) => (
            <button type="button" key={date} className={selectedDate === date ? 'is-selected' : ''} onClick={() => setSelectedDate(date)}>{dateLabel(date)}</button>
          ))}
        </div>
        <div className="admin-stats-actions">
          {devices.length > 1 && (
            <select value={device} onChange={(e) => setDevice(e.target.value)} aria-label="기기 선택">
              <option value="all">모든 기기 ({devices.length}대)</option>
              {devices.map((id, i) => <option key={id} value={id}>기기 {i + 1} · {id.slice(0, 6)}</option>)}
            </select>
          )}
          <span>{loading ? '불러오는 중…' : updatedAt ? `${updatedAt.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })} 기준 · 1분마다 자동 갱신` : ''}</span>
          <button type="button" onClick={load} disabled={loading}>새로고침</button>
          <button type="button" onClick={() => downloadCsv(rounds)} disabled={!rounds.length}>CSV 다운로드</button>
        </div>
      </div>

      <div className="admin-stats-cards">
        <article className="is-primary"><span>결과 확인</span><strong>{summary.completes.toLocaleString()}<small>회</small></strong><p>2문제를 모두 풀고 결과 화면까지 본 판 수{selectedDate === 'all' && ESTIMATE_TOTAL > 0 ? ` · 기록 전 추정 약 ${ESTIMATE_TOTAL}판 별도` : ''}</p></article>
        <article><span>게임 시작</span><strong>{summary.starts.toLocaleString()}<small>회</small></strong><p>완료율 {pct(summary.completes, summary.starts)}</p></article>
        <article><span>앱 QR 열람</span><strong>{summary.qr.toLocaleString()}<small>회</small></strong><p>결과 확인 대비 {pct(summary.qr, summary.completes)}</p></article>
        <article><span>한 판 소요시간</span><strong>{formatDuration(summary.median)}</strong><p>결과 확인까지 걸린 시간(중앙값)</p></article>
        <article><span>2문제 모두 정답</span><strong>{pct(summary.perfect, summary.completes)}</strong><p>{summary.perfect.toLocaleString()}회</p></article>
      </div>

      <div className="admin-stats-panel">
        <h2>일자별 결과 확인 횟수</h2>
        <p className="admin-stats-note">오전 = 12시 이전, 오후 = 12시 이후 (한국 시간 · 결과 화면이 뜬 시각 기준)</p>
        <div className="admin-stats-table-wrap">
          <table className="admin-stats-table">
            <thead><tr><th>날짜</th><th>오전</th><th>오후</th><th>결과 확인 합계</th><th>게임 시작</th><th>완료율</th><th>QR 열람</th></tr></thead>
            <tbody>
              {ESTIMATES.map((e) => (
                <tr key={`est-${e.date}`} className="is-estimate">
                  <th>{dateLabel(e.date)} <span className="admin-stats-pill is-estimate">추정</span></th><td>약 {e.am}</td><td>약 {e.pm}</td><td><strong>약 {e.total}</strong></td><td>-</td><td>-</td><td>-</td>
                </tr>
              ))}
              {daily.map((d) => (
                <tr key={d.date} className={selectedDate === d.date ? 'is-selected' : ''} onClick={() => setSelectedDate(d.date)}>
                  <th>{dateLabel(d.date)}</th><td>{d.am}</td><td>{d.pm}</td><td><strong>{d.completes}</strong></td><td>{d.starts}</td><td>{pct(d.completes, d.starts)}</td><td>{d.qr}</td>
                </tr>
              ))}
              {ESTIMATES.length > 0 && (
                <tr className="is-total">
                  <th>추정 포함 합계</th>
                  <td>약 {ESTIMATES.reduce((s, e) => s + e.am, 0) + daily.reduce((s, d) => s + d.am, 0)}</td>
                  <td>약 {ESTIMATES.reduce((s, e) => s + e.pm, 0) + daily.reduce((s, d) => s + d.pm, 0)}</td>
                  <td><strong>약 {ESTIMATE_TOTAL + daily.reduce((s, d) => s + d.completes, 0)}</strong></td>
                  <td>-</td><td>-</td><td>-</td>
                </tr>
              )}
              {daily.length > 1 && (
                <tr className="is-total">
                  <th>합계</th>
                  <td>{daily.reduce((s, d) => s + d.am, 0)}</td>
                  <td>{daily.reduce((s, d) => s + d.pm, 0)}</td>
                  <td><strong>{daily.reduce((s, d) => s + d.completes, 0)}</strong></td>
                  <td>{daily.reduce((s, d) => s + d.starts, 0)}</td>
                  <td>{pct(daily.reduce((s, d) => s + d.completes, 0), daily.reduce((s, d) => s + d.starts, 0))}</td>
                  <td>{daily.reduce((s, d) => s + d.qr, 0)}</td>
                </tr>
              )}
              {!daily.length && <tr><td colSpan="7" className="admin-stats-empty">{loading ? '불러오는 중…' : '아직 기록된 게임이 없습니다.'}</td></tr>}
            </tbody>
          </table>
        </div>
        {ESTIMATES.length > 0 && (
          <p className="admin-stats-estimate-note">
            <strong>추정</strong> 행은 기록 기능이 생기기 전(10/8 ~ 10/9 {ESTIMATE_SNAPSHOT_AT.slice(11)}, TV 새로고침 전) 구간입니다.
            Supabase 접속 기록에서 TV가 문제를 불러온 요청 수(시작·홈 이동 때 1회씩)를 2로 나눈 <strong>게임 시작 추정치</strong>로,
            결과 확인 횟수와 정확히 같지 않고 오차가 있을 수 있습니다.
          </p>
        )}
      </div>

      {hourly.columns.length > 0 && (
        <div className="admin-stats-panel">
          <h2>시간대별 결과 확인 횟수</h2>
          <p className="admin-stats-note">진한 칸일수록 많이 참여한 시간대입니다. ‘추정’ 열(~숫자)은 기록 전 게임 시작 추정치입니다.</p>
          <div className="admin-stats-table-wrap">
            <table className="admin-stats-table admin-stats-heat">
              <thead><tr><th>시간</th>{hourly.columns.map((c) => <th key={c.key} className={c.estimate ? 'is-estimate' : ''}>{c.label}</th>)}</tr></thead>
              <tbody>
                {hourly.hours.map((h) => (
                  <tr key={h} className={h === 12 ? 'is-noon' : ''}>
                    <th>{String(h).padStart(2, '0')}시</th>
                    {hourly.columns.map((c) => {
                      const v = c.cell(h);
                      return <td key={c.key} className={c.estimate ? 'is-estimate' : ''} style={{ '--heat': v / hourly.max }}>{v ? (c.estimate ? `~${v}` : v) : ''}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedDate !== 'all' && slots.length > 0 && (
        <div className="admin-stats-panel">
          <h2>{dateLabel(selectedDate)} 30분 단위 결과 확인</h2>
          <div className="admin-stats-bars">
            {slots.map((s) => (
              <div key={s.key} className="admin-stats-bar-row">
                <span>{s.key}</span>
                <div><i style={{ width: `${(s.count / slotMax) * 100}%` }} /></div>
                <b>{s.count}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-stats-split">
        <div className="admin-stats-panel">
          <h2>맞힌 문제 수 분포</h2>
          <div className="admin-stats-bars">
            {scoreDist.map((count, score) => (
              <div key={score} className="admin-stats-bar-row">
                <span>{score}문제</span>
                <div><i style={{ width: `${(count / Math.max(1, ...scoreDist)) * 100}%` }} /></div>
                <b>{count} · {pct(count, completed.length)}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-stats-panel">
          <h2>문제별 정답률</h2>
          <ul className="admin-stats-questions">
            {questionStats.map((q) => (
              <li key={q.id}><p>{q.text}</p><span>{q.total}회 출제 · 정답률 <strong>{pct(q.correct, q.total)}</strong></span></li>
            ))}
            {!questionStats.length && <li className="admin-stats-empty">아직 데이터가 없습니다.</li>}
          </ul>
        </div>
      </div>

      <div className="admin-stats-panel">
        <h2>최근 게임 기록</h2>
        <p className="admin-stats-note">최근 40판 · 전체 목록은 CSV로 받을 수 있습니다.</p>
        <div className="admin-stats-table-wrap">
          <table className="admin-stats-table">
            <thead><tr><th>날짜</th><th>시작 시각</th><th>결과</th><th>맞힌 수</th><th>소요시간</th><th>QR</th></tr></thead>
            <tbody>
              {recent.map((r) => {
                const k = toKst(r.startedAt);
                return (
                  <tr key={r.id}>
                    <th>{dateLabel(k.date)}</th>
                    <td>{k.time}</td>
                    <td>{r.completedAt ? <span className="admin-stats-pill is-done">결과 확인</span> : <span className="admin-stats-pill">{r.exitStage === 'quiz' ? '중간 이탈' : '진행 중/미완료'}</span>}</td>
                    <td>{r.score ?? '-'}</td>
                    <td>{formatDuration(r.durationMs)}</td>
                    <td>{r.qr ? '열람' : ''}</td>
                  </tr>
                );
              })}
              {!recent.length && <tr><td colSpan="6" className="admin-stats-empty">아직 기록된 게임이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
