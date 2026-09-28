import { useEffect, useMemo, useState } from 'react';
import { isAllowedAdminEmail, isSupabaseConfigured, supabase } from './supabase';

const emptyQuestion = {
  question_text: '',
  display_lines: ['', '', ''],
  correct_answer: true,
  explanation: '',
  hint_text: '',
  hint_image_url: '',
  hint_image_path: '',
  is_active: true,
  sort_order: 0,
};

function normalizeQuestion(question) {
  return {
    ...emptyQuestion,
    ...question,
    display_lines: Array.isArray(question.display_lines)
      ? [...question.display_lines, '', '', ''].slice(0, 3)
      : ['', '', ''],
  };
}

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const adminEmail = session?.user?.email ?? '';
  const allowed = isAllowedAdminEmail(adminEmail);
  const activeCount = useMemo(
    () => questions.filter(({ is_active }) => is_active).length,
    [questions],
  );

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!allowed) return;
    loadQuestions();
  }, [allowed]);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      setMessage(`문제를 불러오지 못했습니다: ${error.message}`);
      return;
    }
    setQuestions(data ?? []);
  };

  const login = async () => {
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
        queryParams: { hd: 'hanwha.plus', prompt: 'select_account' },
      },
    });
    if (error) setMessage(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setEditor(null);
    setQuestions([]);
  };

  const updateEditor = (key, value) => {
    setEditor((current) => ({ ...current, [key]: value }));
  };

  const updateLine = (index, value) => {
    setEditor((current) => ({
      ...current,
      display_lines: current.display_lines.map((line, lineIndex) => lineIndex === index ? value : line),
    }));
  };

  const uploadHintImage = async (file) => {
    if (!file || !editor) return;
    if (!file.type.startsWith('image/')) {
      setMessage('힌트 이미지는 이미지 파일만 등록할 수 있습니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('힌트 이미지는 5MB 이하로 등록해 주세요.');
      return;
    }

    setBusy(true);
    setMessage('이미지를 업로드하고 있습니다.');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from('hint-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) {
      setMessage(`이미지 업로드에 실패했습니다: ${error.message}`);
      setBusy(false);
      return;
    }

    const { data } = supabase.storage.from('hint-images').getPublicUrl(path);
    setEditor((current) => ({
      ...current,
      hint_image_path: path,
      hint_image_url: data.publicUrl,
    }));
    setMessage('힌트 이미지가 업로드되었습니다. 저장 버튼을 눌러 반영해 주세요.');
    setBusy(false);
  };

  const saveQuestion = async (event) => {
    event.preventDefault();
    if (!editor) return;

    const lines = editor.display_lines.map((line) => line.trim()).filter(Boolean);
    const questionText = editor.question_text.trim() || lines.join(' ');
    if (!questionText || lines.length === 0 || !editor.explanation.trim()) {
      setMessage('문제 문구, 화면 문장, 정답 해설을 모두 입력해 주세요.');
      return;
    }

    setBusy(true);
    setMessage('저장하고 있습니다.');
    const payload = {
      question_text: questionText,
      display_lines: lines,
      correct_answer: editor.correct_answer,
      explanation: editor.explanation.trim(),
      hint_text: editor.hint_text.trim(),
      hint_image_url: editor.hint_image_url || null,
      hint_image_path: editor.hint_image_path || null,
      is_active: editor.is_active,
      sort_order: Number(editor.sort_order) || 0,
      updated_by: session.user.id,
    };

    const query = editor.id
      ? supabase.from('questions').update(payload).eq('id', editor.id)
      : supabase.from('questions').insert({ ...payload, created_by: session.user.id });
    const { error } = await query;

    if (error) {
      setMessage(`저장하지 못했습니다: ${error.message}`);
      setBusy(false);
      return;
    }

    await loadQuestions();
    setEditor(null);
    setMessage('문제를 저장했습니다.');
    setBusy(false);
  };

  const deleteQuestion = async (question) => {
    if (question.is_active && activeCount <= 2) {
      setMessage('퀴즈에는 활성 문제가 최소 2개 필요합니다. 다른 문제를 활성화한 뒤 삭제해 주세요.');
      return;
    }
    if (!window.confirm('이 문제를 삭제할까요? 삭제한 문제는 복구할 수 없습니다.')) return;

    setBusy(true);
    const { error } = await supabase.from('questions').delete().eq('id', question.id);
    if (!error && question.hint_image_path) {
      await supabase.storage.from('hint-images').remove([question.hint_image_path]);
    }
    if (error) setMessage(`삭제하지 못했습니다: ${error.message}`);
    else {
      setMessage('문제를 삭제했습니다.');
      await loadQuestions();
    }
    setBusy(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="admin-page admin-centered">
        <section className="admin-setup-card">
          <span className="admin-kicker">PLUS 파이</span>
          <h1>어드민 연결 준비 완료</h1>
          <p>Supabase 프로젝트 연결 값이 필요합니다. 프로젝트 생성 후 환경변수를 등록하면 Google 로그인을 사용할 수 있습니다.</p>
          <code>VITE_SUPABASE_URL</code>
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>
          <a href="/">퀴즈 홈으로</a>
        </section>
      </main>
    );
  }

  if (!authReady) return <main className="admin-page admin-centered">로그인 상태를 확인하고 있습니다.</main>;

  if (!session || !allowed) {
    return (
      <main className="admin-page admin-centered">
        <section className="admin-login-card">
          <span className="admin-kicker">PLUS 파이</span>
          <h1>퀴즈 어드민</h1>
          <p><strong>@hanwha.plus</strong> Google 계정으로 로그인해 주세요.</p>
          {session && !allowed && <p className="admin-error">허용되지 않은 계정입니다: {adminEmail}</p>}
          <button type="button" onClick={session ? logout : login}>{session ? '다른 계정으로 로그인' : 'Google로 로그인'}</button>
          {message && <p className="admin-feedback">{message}</p>}
          <a href="/">퀴즈 홈으로</a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="admin-kicker">PLUS 파이</span>
          <h1>퀴즈 어드민</h1>
          <p>활성 문제 중 매번 2문제가 무작위로 출제됩니다.</p>
        </div>
        <div className="admin-account">
          <span>{adminEmail}</span>
          <button type="button" onClick={logout}>로그아웃</button>
        </div>
      </header>

      <section className="admin-toolbar">
        <div><strong>{questions.length}</strong>개 문제 · 활성 <strong>{activeCount}</strong>개</div>
        <button type="button" onClick={() => setEditor(normalizeQuestion({ sort_order: questions.length + 1 }))}>문제 추가</button>
      </section>

      {message && <p className="admin-feedback" role="status">{message}</p>}

      <section className="admin-question-list" aria-label="문제 목록">
        {questions.map((question, index) => (
          <article className="admin-question-card" key={question.id}>
            <div className="admin-question-index">QUIZ {index + 1}</div>
            <div className="admin-question-copy">
              <div className="admin-question-state">
                <span className={question.is_active ? 'is-active' : 'is-inactive'}>{question.is_active ? '사용 중' : '미사용'}</span>
                <strong>정답 {question.correct_answer ? 'O' : 'X'}</strong>
              </div>
              <h2>{question.question_text}</h2>
              <p>{question.explanation}</p>
              {(question.hint_text || question.hint_image_url) && <small>힌트 등록됨</small>}
            </div>
            <div className="admin-card-actions">
              <button type="button" onClick={() => setEditor(normalizeQuestion(question))}>수정</button>
              <button type="button" className="is-danger" onClick={() => deleteQuestion(question)} disabled={busy}>삭제</button>
            </div>
          </article>
        ))}
        {questions.length === 0 && <p className="admin-empty">등록된 문제가 없습니다. 첫 문제를 추가해 주세요.</p>}
      </section>

      {editor && (
        <div className="admin-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
          <form className="admin-editor" onSubmit={saveQuestion}>
            <div className="admin-editor-header">
              <div>
                <span className="admin-kicker">문제 편집</span>
                <h2>{editor.id ? '문제 수정' : '새 문제 추가'}</h2>
              </div>
              <button type="button" className="admin-editor-close" onClick={() => setEditor(null)} aria-label="편집 닫기">×</button>
            </div>

            <label>문제 전체 문구<textarea value={editor.question_text} onChange={(event) => updateEditor('question_text', event.target.value)} rows="3" /></label>
            <fieldset>
              <legend>퀴즈 화면 줄바꿈</legend>
              {editor.display_lines.map((line, index) => <input key={index} value={line} onChange={(event) => updateLine(index, event.target.value)} placeholder={`${index + 1}번째 줄`} />)}
            </fieldset>
            <fieldset className="admin-answer-field">
              <legend>정답</legend>
              <label><input type="radio" name="answer" checked={editor.correct_answer === true} onChange={() => updateEditor('correct_answer', true)} /> O</label>
              <label><input type="radio" name="answer" checked={editor.correct_answer === false} onChange={() => updateEditor('correct_answer', false)} /> X</label>
            </fieldset>
            <label>정답 해설<textarea value={editor.explanation} onChange={(event) => updateEditor('explanation', event.target.value)} rows="3" /></label>
            <label>힌트 문구<textarea value={editor.hint_text} onChange={(event) => updateEditor('hint_text', event.target.value)} rows="3" /></label>
            <label className="admin-file-field">힌트 이미지<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadHintImage(event.target.files?.[0])} disabled={busy} /></label>
            {editor.hint_image_url && (
              <div className="admin-hint-preview">
                <img src={editor.hint_image_url} alt="힌트 미리보기" />
                <button type="button" onClick={() => setEditor((current) => ({ ...current, hint_image_url: '', hint_image_path: '' }))}>이미지 연결 해제</button>
              </div>
            )}
            <div className="admin-editor-row">
              <label>노출 순서<input type="number" min="0" value={editor.sort_order} onChange={(event) => updateEditor('sort_order', event.target.value)} /></label>
              <label className="admin-switch"><input type="checkbox" checked={editor.is_active} onChange={(event) => updateEditor('is_active', event.target.checked)} /> 이 문제 사용</label>
            </div>
            <div className="admin-editor-actions">
              <button type="button" onClick={() => setEditor(null)}>취소</button>
              <button type="submit" disabled={busy}>{busy ? '처리 중…' : '저장'}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

