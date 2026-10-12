// 신청서 자동 넘김 공용 로직.
// 모바일 사파리는 사용자 동작(탭·입력) 처리 중에 준 포커스에만 키보드를 띄우므로,
// 호출하는 쪽은 값을 flushSync 로 먼저 반영해 다음 칸을 화면에 올린 뒤 같은 흐름에서 focusField 를 부른다.

/** root 안에서 data-af=key 인 칸으로 포커스(또는 시트 열기)를 옮긴다 */
export function focusFieldIn(root: HTMLElement | null | undefined, key: string) {
  const el = root?.querySelector<HTMLElement>(`[data-af="${key}"]`);
  if (!el) return;
  if (el.dataset.afOpen !== undefined) {
    (document.activeElement as HTMLElement | null)?.blur?.();
    el.click();
    return;
  }
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus({ preventScroll: true });
  } else {
    // 버튼 묶음(성별 등)은 포커스 대신 키보드를 내리고 보이는 곳으로 끌어온다
    (document.activeElement as HTMLElement | null)?.blur?.();
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/** 오류 문구가 붙은 첫 항목을 화면 가운데로 올리고, 입력 칸이면 포커스까지 준다 */
export function scrollToFirstError(root: HTMLElement | null | undefined) {
  const first = root?.querySelector<HTMLElement>('[data-field-error]');
  const target = first?.parentElement ?? first;
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target?.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
}
