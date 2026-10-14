import styled, { css } from 'styled-components';
import { color, font } from './tokens';

export const Avatar = styled.span`
  width: ${p => p.$size || 40}px;
  height: ${p => p.$size || 40}px;
  flex: none;
  border-radius: 9999px;
  background: ${p => (p.$unknown ? color.surfaceSunken : color.primarySoft)};
  color: ${p => (p.$unknown ? color.ink3 : color.onPrimarySoft)};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: 700 ${p => Math.round((p.$size || 40) * 0.38)}px/1 ${font};
`;

export const StatusTag = styled.span`
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 9999px;
  font: 600 11px/1 ${font};
  background: ${p => (p.$status === 'customer' ? color.customerBg : color.unknownBg)};
  color: ${p => (p.$status === 'customer' ? color.customerFg : color.unknownFg)};
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: 700 11px/14px ${font};
  letter-spacing: .05em;
  text-transform: uppercase;
  color: ${color.ink3};

  .link {
    font: 600 12px/1 ${font};
    text-transform: none;
    letter-spacing: 0;
    color: ${color.primary};
    cursor: pointer;
  }
`;

export const Hero = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  .hero__body {
    flex: 1;
    min-width: 0;
  }
  .hero__name {
    font: 700 17px/22px ${font};
    color: ${color.ink};
  }
  .hero__meta {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 2px;
    font: 400 12px/16px ${font};
    color: ${color.ink3};
  }
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  > div {
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid ${color.border};
    font: 500 11px/14px ${font};
    color: ${color.ink3};
  }
  b {
    display: block;
    font: 700 16px/21px ${font};
    color: ${color.ink};
    font-variant-numeric: tabular-nums;
  }
  .warn b {
    color: ${color.highFg};
  }
`;

const rowTone = {
  critical: css`
    border-color: ${color.criticalBg};
    background: linear-gradient(90deg, ${color.criticalBg}, ${color.surface} 40%);
  `,
  high: css`
    border-color: ${color.highBg};
    background: linear-gradient(90deg, ${color.highBg}, ${color.surface} 40%);
  `,
};

export const OpenRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${color.border};
  font: 500 13px/18px ${font};
  color: ${color.ink};
  ${p => rowTone[p.$type] || ''}

  > div {
    flex: 1;
    min-width: 0;
  }
  small {
    display: block;
    font: 400 11px/14px ${font};
    color: ${color.ink3};
  }
`;

const sevTone = {
  critical: [color.criticalBg, color.criticalFg],
  high: [color.highBg, color.highFg],
  task: [color.mediumBg, color.mediumFg],
};

export const SeverityTag = styled.span`
  flex: none;
  padding: 2px 8px;
  border-radius: 6px;
  font: 600 11px/16px ${font};
  background: ${p => (sevTone[p.$type] || sevTone.task)[0]};
  color: ${p => (sevTone[p.$type] || sevTone.task)[1]};
`;

export const Pill = styled.span`
  flex: none;
  padding: 2px 8px;
  border-radius: 9999px;
  font: 600 11px/16px ${font};
  background: ${color.surfaceSunken};
  color: ${color.ink2};
`;

const tlTone = {
  g: [color.customerBg, color.customerFg],
  p: [color.primarySoft, color.onPrimarySoft],
  a: [color.highBg, color.highFg],
  t: [color.mediumBg, color.mediumFg],
};

export const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .tl__row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font: 400 12px/16px ${font};
    color: ${color.ink2};
  }
  .tl__body {
    flex: 1;
    min-width: 0;
  }
  b {
    display: block;
    font: 600 13px/18px ${font};
    color: ${color.ink};
  }
  small {
    white-space: nowrap;
    color: ${color.ink3};
    font-size: 11px;
  }
`;

export const TimelineIcon = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => (tlTone[p.$tone] || [color.surfaceSunken])[0]};
  color: ${p => (tlTone[p.$tone] || [null, color.ink2])[1]};
`;

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: ${p => (p.$small ? 30 : 36)}px;
  padding: 0 ${p => (p.$small ? 10 : 14)}px;
  border-radius: 8px;
  border: 1px solid ${p => (p.$primary ? color.primary : color.borderStrong)};
  background: ${p => (p.$primary ? color.primary : color.surface)};
  color: ${p => (p.$primary ? '#fff' : color.ink)};
  font: 600 ${p => (p.$small ? 12 : 13)}px/1 ${font};
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    opacity: .88;
  }
  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }
`;

export const EmptyBox = styled.div`
  padding: 14px;
  border-radius: 14px;
  border: 1px dashed ${color.borderStrong};
  text-align: center;
  font: 400 13px/19px ${font};
  color: ${color.ink2};

  b {
    display: block;
    color: ${color.ink};
    font: 600 14px/20px ${font};
    margin-bottom: 2px;
  }
`;
