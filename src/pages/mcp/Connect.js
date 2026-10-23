import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Result, Skeleton, Space, Typography } from 'antd';
import { useLocation } from 'react-router-dom';
import { getTokenPayload } from '@/utils/authUtils';

/*
 * Xác nhận kết nối Claude / ChatGPT với MCP (OAuth).
 * MCP chuyển tới /mcp/connect?request=...; route yêu cầu đăng nhập nên người dùng đã có JWT.
 * Cho phép → POST {MCP}/oauth/approve kèm JWT, MCP trả { redirect } về lại Claude/GPT.
 * Địa chỉ MCP lấy từ REACT_APP_MCP_URL, không lấy từ query để JWT không bị gửi tới server lạ.
 */

const MCP_URL = String(process.env.REACT_APP_MCP_URL || '').replace(/\/+$/, '');

const readJson = async (response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error_description || body.error || `HTTP ${response.status}`);
  }
  return body;
};

export const fetchRequestInfo = (request) =>
  fetch(`${MCP_URL}/oauth/request?request=${encodeURIComponent(request)}`).then(readJson);

export const submitDecision = (request, deny) =>
  fetch(`${MCP_URL}/oauth/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${window.localStorage.getItem('jwt_access_token') ?? ''}`,
    },
    body: JSON.stringify(deny ? { request, deny: true } : { request }),
  }).then(readJson);

const McpConnectPage = () => {
  const { search } = useLocation();
  const request = new URLSearchParams(search).get('request');
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = getTokenPayload();

  useEffect(() => {
    let active = true;
    if (!MCP_URL) {
      setError('Chưa cấu hình REACT_APP_MCP_URL.');
      return () => {
        active = false;
      };
    }
    if (!request) {
      setError('Thiếu yêu cầu kết nối. Hãy bắt đầu lại từ Claude hoặc ChatGPT.');
      return () => {
        active = false;
      };
    }
    fetchRequestInfo(request)
      .then((data) => {
        if (active) {
          setInfo(data);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message);
        }
      });
    return () => {
      active = false;
    };
  }, [request]);

  const decide = async (deny) => {
    setSubmitting(true);
    try {
      const { redirect } = await submitDecision(request, deny);
      window.location.href = redirect;
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  };

  if (error) {
    return <Result status="warning" title="Không thể kết nối" subTitle={error} />;
  }
  if (!info) {
    return <Skeleton active style={{ maxWidth: 480, margin: '80px auto' }} />;
  }

  const account = user.ssoId;
  return (
    <Card style={{ maxWidth: 480, margin: '80px auto' }} title="Kết nối trợ lý AI">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Paragraph>
          <Typography.Text strong>{info.client}</Typography.Text> ({info.redirectHost}) muốn truy
          cập ERP bằng <Typography.Text strong>{account}</Typography.Text>
          {user.bizId ? ` (đơn vị ${user.bizId})` : ''}.
        </Typography.Paragraph>
        <Alert
          type="info"
          showIcon
          message="Trợ lý có cùng quyền với tài khoản của bạn. Mọi thao tác ghi dữ liệu đều hỏi lại bạn trước khi thực hiện."
        />
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button disabled={submitting} onClick={() => decide(true)}>
            Từ chối
          </Button>
          <Button type="primary" loading={submitting} onClick={() => decide(false)}>
            Cho phép
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default McpConnectPage;
