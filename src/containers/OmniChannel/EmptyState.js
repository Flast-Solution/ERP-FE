/**************************************************************************/
/*  @/containers/OmniChannel/EmptyState.js                                */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Khuôn chung cho các trạng thái rỗng của ba cột.                        */
/* Dùng một component để ba cột không trôi lệch nhau khi sửa sau này.     */
/**************************************************************************/

import styled from 'styled-components'

const Wrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 28px;
  text-align: center;

  .icon {
    width: 52px;
    height: 52px;
    margin-bottom: 18px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #bfbfbf;
    font-size: 21px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .desc {
    margin-top: 8px;
    max-width: 280px;
    font-size: 13px;
    line-height: 1.6;
    color: #8c8c8c;
  }

  .action {
    margin-top: 18px;
  }
`

const EmptyState = ({ icon, title, description, action }) => (
  <Wrapper>
    <div className="icon">{icon}</div>
    <div className="title">{title}</div>
    {description && <div className="desc">{description}</div>}
    {action && <div className="action">{action}</div>}
  </Wrapper>
)

export default EmptyState