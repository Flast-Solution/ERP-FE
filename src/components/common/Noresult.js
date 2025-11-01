import React from 'react';
import styled from 'styled-components';

const StyledNotFound = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 170px);
  background-color: #f5f8fa;
  text-align: center;
`;

const NotFoundImage = styled.img`
  width: 300px;
  margin-bottom: 24px;
`;

const NotFoundSubtitle = styled.p`
  font-size: 20px;
  color: #333;
`;

const NotFoundDescription = styled.p`
  font-size: 16px;
  color: #666;
`;

const BackHomeButton = styled.a`
  background-color: #007bff;
  color: white;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 8px;
  &:hover {
    background-color: #0056b3;
  }
`;

const NotFoundPage = ({message}) => {
  return (
    <StyledNotFound>
      <NotFoundImage src="/img/404.png" alt="404 Image" />
      <NotFoundSubtitle>Yêu cầu không tìm thấy</NotFoundSubtitle>
      <NotFoundDescription>
        {message || 'Trang yêu cầu không tìm thấy. Vui lòng tìm kiếm lại.'}
      </NotFoundDescription>
      <BackHomeButton href="/">
        Về trang chủ
      </BackHomeButton>
    </StyledNotFound>
  );
};

export default NotFoundPage;