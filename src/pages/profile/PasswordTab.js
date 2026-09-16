import React, { useState } from 'react'
import { Button, Form, Input, message } from 'antd'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import useGetMe from '@/hooks/useGetMe'
import { getTokenPayload } from '@/utils/authUtils'
import {
  PageTitle,
  PageDescription,
  PageHeaderDivider,
  ProfilePanel,
  ProfileSection,
  SectionAside,
  SectionTitle,
  SectionDescription,
  PasswordSectionBody,
  ProfileActions,
  ProfileActionsNote,
  ProfileActionsButtons,
  FieldLabel,
  FieldHelp,
} from './styles'

const CHANGE_PASSWORD_API = '/auth/change-password'

const PasswordTab = () => {
  const { user: profile } = useGetMe()
  const [passwordForm] = Form.useForm()
  const [passwordSaving, setPasswordSaving] = useState(false)

  const handlePasswordCancel = () => {
    passwordForm.resetFields()
  }

  const handlePasswordSave = async () => {
    try {
      setPasswordSaving(true)
      const values = await passwordForm.validateFields()
      const uId = profile?.id ?? profile?.userId ?? profile?.user_id ?? getTokenPayload()?.id ?? null

      if (uId == null || uId === '') {
        message.error('Không xác định được tài khoản để đổi mật khẩu')
        return
      }

      const response = await RequestUtils.Post(CHANGE_PASSWORD_API, {
        oldPass: values.currentPassword,
        newPass: values.newPassword,
        uId: Number(uId) || uId,
      })

      if (response?.errorCode && response.errorCode !== SUCCESS_CODE) {
        message.error(response?.message || 'Đổi mật khẩu thất bại')
        return
      }

      message.success(response?.message || 'Đã cập nhật mật khẩu')
      passwordForm.resetFields()
    } catch (error) {
      if (error?.errorFields) return
      message.error(error?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <>
      <PageTitle>Mật khẩu</PageTitle>
      <PageDescription>
        Quản lý mật khẩu đăng nhập và bảo mật tài khoản.
      </PageDescription>
      <PageHeaderDivider />

      <Form
        form={passwordForm}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }}
      >
        <ProfilePanel>
          <ProfileSection>
            <SectionAside>
              <SectionTitle>Đổi mật khẩu</SectionTitle>
              <SectionDescription>
                Mật khẩu mạnh giúp bảo vệ tài khoản và các trang đã xuất bản.
              </SectionDescription>
            </SectionAside>

            <PasswordSectionBody>
              <Form.Item
                name="currentPassword"
                label={<FieldLabel>Mật khẩu hiện tại</FieldLabel>}
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label={<FieldLabel>Mật khẩu mới</FieldLabel>}
                style={{ marginBottom: 4 }}
                dependencies={['currentPassword']}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 8, message: 'Mật khẩu mới cần ít nhất 8 ký tự' },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: 'Mật khẩu mới cần gồm chữ và số',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value !== getFieldValue('currentPassword')) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
              <FieldHelp>Ít nhất 8 ký tự, gồm chữ và số.</FieldHelp>

              <Form.Item
                name="confirmPassword"
                label={<FieldLabel>Xác nhận mật khẩu mới</FieldLabel>}
                style={{ marginTop: 22, marginBottom: 0 }}
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value === getFieldValue('newPassword')) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Xác nhận mật khẩu mới không khớp'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
            </PasswordSectionBody>
          </ProfileSection>
        </ProfilePanel>

        <ProfileActions>
          <ProfileActionsNote>Thay đổi sẽ áp dụng ngay sau khi lưu.</ProfileActionsNote>
          <ProfileActionsButtons>
            <Button type="text" onClick={handlePasswordCancel}>
              Huỷ
            </Button>
            <Button type="primary" loading={passwordSaving} onClick={handlePasswordSave}>
              Hoàn thành
            </Button>
          </ProfileActionsButtons>
        </ProfileActions>
      </Form>
    </>
  )
}

export default PasswordTab
