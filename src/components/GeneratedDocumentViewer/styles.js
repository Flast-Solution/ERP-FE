import styled from 'styled-components'

export const ViewerShell = styled.div`
  height: calc(100vh - 132px);
  min-height: 0;
  overflow: hidden;
  background: #eef1f5;
`

export const ViewerModeBar = styled.div`
  height: 52px;
  padding: 9px 16px;
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #d8dee8;

  .ant-segmented {
    width: 100%;
    max-width: 420px;
  }

  .ant-segmented-item {
    flex: 1;
    text-align: center;
  }
`

export const DocumentPane = styled.section`
  height: 100%;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  border-right: 1px solid #d8dee8;

  .document-pane-spin,
  .document-pane-spin > .ant-spin-container {
    flex: 1;
    min-height: 0;
    height: 100%;
  }
`

export const DocumentToolbar = styled.div`
  min-height: 58px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fff;
  border-bottom: 1px solid #d8dee8;
`

export const FileInfo = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #344054;

  .file-dot {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 50%;
    background: #c54b43;
  }

  .file-name {
    max-width: 360px;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .page-count {
    color: #7b8494;
    white-space: nowrap;
  }
`

export const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .zoom-control {
    padding: 3px 6px;
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: 10px;
    background: #eef1f5;
  }

  .zoom-value {
    min-width: 52px;
    color: #475467;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
`

export const DocumentCanvas = styled.div`
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 22px 8px 36px;
`

export const PageZoom = styled.div`
  width: ${props => (props.$orientation === 'landscape' ? 1123 : 794) * props.$zoom}px;
  min-height: ${props => (props.$orientation === 'landscape' ? 794 : 1123) * props.$zoom}px;
  margin: 0 auto;

  .generated-document-page {
    margin: 0;
    transform: scale(${props => props.$zoom});
    transform-origin: top left;
  }
`

export const DiscussionPane = styled.aside`
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
`

export const DiscussionHeader = styled.div`
  min-height: 104px;
  padding: 22px 24px;
  border-bottom: 1px solid #e4e7ec;

  h3 {
    margin: 0 0 4px;
    color: #172033;
    font-size: 18px;
  }

  span {
    color: #7b8494;
  }
`

export const DiscussionList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
`

export const EmptyDiscussion = styled.div`
  height: 100%;
  min-height: 220px;
  display: grid;
  place-items: center;
  color: #98a2b3;
  text-align: center;
`

export const CommentCard = styled.article`
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;

  .comment-avatar {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #fff;
    background: ${props => props.$internal ? '#29796d' : '#cf8014'};
    font-weight: 700;
  }

  .comment-body {
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid #d9e0e9;
    border-radius: 14px;
    background: #fff;
  }

  .comment-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #667085;
    font-size: 12px;
  }

  .comment-author {
    color: #172033;
    font-size: 14px;
    font-weight: 700;
  }

  .comment-role {
    padding: 1px 7px;
    border-radius: 999px;
    color: ${props => props.$internal ? '#246b60' : '#ad6800'};
    background: ${props => props.$internal ? '#e5f5f1' : '#fff1d6'};
    font-weight: 600;
  }

  .comment-time {
    margin-left: auto;
  }

  .comment-content {
    margin: 8px 0 0;
    color: #344054;
    line-height: 1.5;
  }
`

export const DiscussionComposer = styled.div`
  padding: 16px 24px 20px;
  border-top: 1px solid #e4e7ec;

  .composer-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }

  textarea {
    resize: none;
  }
`

export const DrawerTitle = styled.div`
  min-width: 0;
  color: #fff;

  .drawer-title {
    overflow: hidden;
    font-size: 18px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .drawer-subtitle {
    margin-top: 3px;
    overflow: hidden;
    color: #b8c3d3;
    font-size: 13px;
    font-weight: 400;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`
