
import styled from 'styled-components';

export const LayoutWrapper = styled.div`
  .fc-toolbar-title {
    text-transform: capitalize;
  }
  .fc-event {
    min-height: 40px !important;
  }
  .fc-event-main {
    height: auto !important;
    min-height: inherit !important;
  }
`

export const EventContainer = styled.div`
  padding: 2px 4px;
  height: 100%;
  min-height: 36px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;

export const EventTitle = styled.div`
  font-weight: 500;
  font-size: 12px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  line-height: 1.3;
  flex-shrink: 0;
  text-overflow: ellipsis;
`;

export const EventTime = styled.div`
  font-size: 11px;
  opacity: 0.75;
  margin-top: auto;
  flex-shrink: 0;
`;