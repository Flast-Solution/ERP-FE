import styled from 'styled-components'

export const PermissionPage = styled.div`
  --permission-primary: #1890ff;
  --permission-border: #e5e7eb;
  --permission-muted: #6b7280;

  padding-bottom: 84px;

  .permission-intro,
  .permission-copy,
  .permission-panel {
    border: 1px solid var(--permission-border);
    border-radius: 8px;
    background: #fff;
  }

  .permission-intro {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
    padding: 14px 16px;
  }

  .permission-intro__text { color: var(--permission-muted); font-size: 13px; }
  .permission-legend { display: flex; flex-wrap: wrap; gap: 14px; }
  .permission-legend span { display: inline-flex; align-items: center; gap: 6px; color: var(--permission-muted); font-size: 12px; }
  .permission-legend i { width: 9px; height: 9px; border-radius: 50%; }
  .permission-legend .inherited { background: #1677ff; }
  .permission-legend .custom { background: #52c41a; }
  .permission-legend .revoked { background: #ff4d4f; }
  .permission-legend .none { background: #d1d5db; }

  .permission-copy {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px 16px;
  }
  .permission-copy__label { color: var(--permission-muted); white-space: nowrap; }
  .permission-copy .ant-select { flex: 1; max-width: 520px; }

  .permission-workspace {
    display: grid;
    grid-template-columns: minmax(240px, .8fr) minmax(300px, 1fr) minmax(360px, 1.25fr);
    gap: 16px;
    align-items: start;
  }

  .permission-panel { overflow: hidden; }
  .permission-panel__head {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 11px 14px;
    border-bottom: 1px solid var(--permission-border);
  }
  .permission-panel__head h3 { margin: 0; font-size: 14px; font-weight: 700; }
  .permission-panel__count { color: var(--permission-muted); font-size: 12px; }
  .permission-panel__search { padding: 12px; border-bottom: 1px solid #f1f3f5; }
  .permission-panel__body { height: 570px; overflow: auto; }

  .permission-user {
    width: 100%;
    padding: 10px 14px;
    border: 0;
    border-bottom: 1px solid #f1f3f5;
    background: #fff;
    text-align: left;
    cursor: pointer;
  }
  .permission-user:hover { background: #f7faff; }
  .permission-user.active { padding-left: 11px; border-left: 3px solid var(--permission-primary); background: #e6f4ff; }
  .permission-user__name { overflow: hidden; color: #111827; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .permission-user__meta { display: flex; align-items: center; gap: 7px; margin-top: 4px; color: var(--permission-muted); font-size: 12px; }

  .permission-group { padding: 11px 14px 5px; color: #8c8c8c; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .permission-menu {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: start;
    padding: 9px 14px;
    border-bottom: 1px solid #f1f3f5;
    cursor: pointer;
  }
  .permission-menu:hover { background: #f7faff; }
  .permission-menu.active { background: #e6f4ff; }
  .permission-menu__name { color: #111827; line-height: 1.35; }
  .permission-menu__path { overflow: hidden; color: #8c8c8c; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .permission-menu__count { color: #8c8c8c; font-size: 11px; white-space: nowrap; }

  .permission-function__context { padding: 11px 14px 0; color: var(--permission-muted); font-size: 12px; }
  .permission-function__toolbar { display: flex; gap: 8px; padding: 10px 14px; }
  .permission-function__list { padding: 0 14px 16px; }
  .permission-function {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    min-height: 45px;
    padding: 7px 6px;
    border-bottom: 1px solid #f1f3f5;
  }
  .permission-function.revoked { border-radius: 5px; background: #fff1f0; }
  .permission-function__label { min-width: 0; }
  .permission-function__code { overflow: hidden; color: #8c8c8c; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .permission-empty { padding: 56px 20px; color: #8c8c8c; text-align: center; }
  .permission-locked { margin: 0 14px 10px; padding: 9px 11px; border: 1px solid #ffe58f; border-radius: 6px; background: #fffbe6; color: #ad6800; font-size: 12px; }

  .permission-savebar {
    position: fixed;
    z-index: 20;
    right: 24px;
    bottom: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 12px 10px 16px;
    border: 1px solid var(--permission-border);
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, .12);
  }
  .permission-savebar__status { color: #d48806; font-size: 13px; }

  @media (max-width: 1180px) {
    .permission-workspace { grid-template-columns: 1fr 1fr; }
    .permission-workspace .permission-panel:last-child { grid-column: 1 / -1; }
    .permission-panel__body { height: 420px; }
  }
  @media (max-width: 720px) {
    .permission-intro, .permission-copy { align-items: stretch; flex-direction: column; }
    .permission-copy .ant-select { max-width: none; }
    .permission-workspace { grid-template-columns: 1fr; }
    .permission-workspace .permission-panel:last-child { grid-column: auto; }
    .permission-panel__body { height: 360px; }
    .permission-savebar { right: 12px; bottom: 12px; left: 12px; justify-content: space-between; }
  }
`

