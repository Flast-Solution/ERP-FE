import React, { useCallback } from 'react'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { Breadcrumb } from 'antd'
import WorkflowFormsList from '@/containers/WorkflowForms/List'

const FormListPage = () => {
  const navigate = useNavigate()

  const handleOpenBuilder = useCallback(({ id, template } = {}) => {
    if (id != null) {
      navigate(`/workflow-form/${id}`)
      return
    }
    navigate('/workflow-form', template ? { state: { template } } : undefined)
  }, [navigate])

  return (
    <>
      <Helmet>
        <title>Danh sách form</title>
      </Helmet>
      <Breadcrumb
        style={{ marginBottom: 20, fontWeight: 600 }}
        separator=">"
        items={[{ title: 'Trang chủ' }, { title: 'Danh sách form' }]}
      />
      <WorkflowFormsList onCreate={handleOpenBuilder} />
    </>
  )
}

export default FormListPage
