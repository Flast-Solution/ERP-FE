import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Button,
  Checkbox,
  Empty,
  Input,
  message,
  Modal,
  Result,
  Select,
  Spin,
  Tag,
  Tooltip,
} from 'antd'
import {
  CheckOutlined,
  CopyOutlined,
  ExclamationCircleFilled,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { BreadcrumbCustom } from '@flast-erp/core/components'
import useGetMe from '@/hooks/useGetMe'
import { SUCCESS_CODE } from '@/configs'
import { canManagePermissions } from '@/utils/authUtils'
import { ALL_PERMISSION_CODES, PERMISSION_MENUS } from './permissionCatalog'
import { findSystemUsers, updateSystemUserPermissions } from './service'
import { PermissionPage } from './styles'

const emptyAssignment = () => ({ inherited: [], grants: [], revokes: [] })

const collectCodes = (...sources) => Array.from(new Set(sources
  .flatMap(source => Array.isArray(source) ? source : source ? [source] : [])
  .flatMap(item => {
    if (typeof item === 'string') return item.split(/[\s,]+/)
    return [item?.code, item?.permission, item?.authority, item?.name].filter(Boolean)
  })
  .filter(code => ALL_PERMISSION_CODES.includes(code))))

const getAssignment = (user = {}) => {
  const override = user.permissionOverrides ?? user.permissionsOverride ?? user.overrides ?? {}
  const profilePermissions = (user.userProfiles ?? user.profiles ?? [])
    .flatMap(profile => profile?.permissions ?? profile?.authorities ?? [])
  const inherited = collectCodes(user.rolePermissions, user.inheritedPermissions, profilePermissions)
  const revokes = collectCodes(
    user.revokedPermissions,
    user.deniedPermissions,
    override.revoke,
    override.revokes,
  )
  const explicitGrants = collectCodes(
    user.grantedPermissions,
    user.directPermissions,
    override.grant,
    override.grants,
  )
  const effective = collectCodes(user.permissionsClient, user.permissions, user.authorities)
  const grants = explicitGrants.length
    ? explicitGrants
    : effective.filter(code => !inherited.includes(code))

  return { inherited, grants, revokes }
}

const normalizeAssignment = value => ({
  inherited: [...new Set(value.inherited)].sort(),
  grants: [...new Set(value.grants)].sort(),
  revokes: [...new Set(value.revokes)].sort(),
})

const isEffective = (assignment, code) => (
  (assignment.inherited.includes(code) && !assignment.revokes.includes(code))
  || assignment.grants.includes(code)
)

const permissionState = (assignment, code) => {
  if (assignment.revokes.includes(code) && assignment.inherited.includes(code)) return 'revoked'
  if (assignment.grants.includes(code)) return 'custom'
  if (assignment.inherited.includes(code)) return 'inherited'
  return 'none'
}

const getUserId = user => user?.id ?? user?.userId ?? user?.ssoId
const getUserName = user => user?.fullName ?? user?.name ?? user?.username ?? user?.ssoId ?? 'Chưa có tên'
const getUserRole = user => {
  const profileRole = (user?.userProfiles ?? user?.profiles ?? [])
    .map(profile => profile?.type ?? profile?.role ?? profile?.name ?? profile?.code)
    .find(Boolean)
  const directRole = (Array.isArray(user?.roles) ? user.roles : [user?.role, user?.type])
    .flatMap(role => typeof role === 'string' ? role.split(/[\s,]+/) : [role])
    .map(role => typeof role === 'string'
      ? role
      : role?.type ?? role?.role ?? role?.name ?? role?.code)
    .find(Boolean)
  return profileRole ?? directRole ?? 'CHƯA GÁN ROLE'
}

const confirmInheritedRevoke = ({ count = 1, menuName, role }) => new Promise(resolve => {
  Modal.confirm({
    title: 'Thu hồi quyền kế thừa từ role?',
    icon: <ExclamationCircleFilled />,
    content: `${count} quyền của menu “${menuName}” đang được kế thừa từ ${role}. Thu hồi sẽ tạo ngoại lệ riêng cho tài khoản này.`,
    okText: 'Vẫn thu hồi',
    okButtonProps: { danger: true },
    cancelText: 'Giữ quyền',
    onOk: () => resolve(true),
    onCancel: () => resolve(false),
  })
})

const UserPermissionsPage = () => {
  const { user: currentUser } = useGetMe()
  const canAccess = canManagePermissions(currentUser)
  const [users, setUsers] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedMenuCode, setSelectedMenuCode] = useState(null)
  const [assignment, setAssignment] = useState(emptyAssignment)
  const [savedAssignment, setSavedAssignment] = useState(emptyAssignment)
  const [copyUserId, setCopyUserId] = useState(null)
  const [saving, setSaving] = useState(false)
  const requestId = useRef(0)

  const selectedUser = useMemo(
    () => users.find(item => String(getUserId(item)) === String(selectedUserId)),
    [selectedUserId, users],
  )
  const selectedMenu = useMemo(
    () => PERMISSION_MENUS.find(item => item.viewPermission === selectedMenuCode),
    [selectedMenuCode],
  )
  const dirty = useMemo(
    () => JSON.stringify(normalizeAssignment(assignment)) !== JSON.stringify(normalizeAssignment(savedAssignment)),
    [assignment, savedAssignment],
  )

  const loadUsers = useCallback(async search => {
    const activeRequest = ++requestId.current
    setLoadingUsers(true)
    try {
      const result = await findSystemUsers(search)
      if (activeRequest !== requestId.current) return
      setUsers(result)
      setSelectedUserId(previous => (
        result.some(item => String(getUserId(item)) === String(previous))
          ? previous
          : getUserId(result[0]) ?? null
      ))
    } catch (error) {
      if (activeRequest === requestId.current) {
        setUsers([])
        message.error(error?.message || 'Không thể tải danh sách tài khoản')
      }
    } finally {
      if (activeRequest === requestId.current) setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    if (!canAccess) return undefined
    const timer = window.setTimeout(() => loadUsers(keyword), 350)
    return () => window.clearTimeout(timer)
  }, [canAccess, keyword, loadUsers])

  useEffect(() => {
    const next = normalizeAssignment(getAssignment(selectedUser))
    setAssignment(next)
    setSavedAssignment(next)
    setCopyUserId(null)
    setSelectedMenuCode(previous => previous ?? PERMISSION_MENUS[0]?.viewPermission)
  }, [selectedUser])

  const applyPermission = useCallback((code, checked) => {
    setAssignment(previous => {
      const next = normalizeAssignment(previous)
      const inherited = next.inherited.includes(code)
      next.grants = next.grants.filter(item => item !== code)
      next.revokes = next.revokes.filter(item => item !== code)
      if (checked && !inherited) next.grants.push(code)
      if (!checked && inherited) next.revokes.push(code)
      return normalizeAssignment(next)
    })
  }, [])

  const togglePermission = useCallback(async (code, checked, menuItem) => {
    if (!checked && assignment.inherited.includes(code) && !assignment.revokes.includes(code)) {
      const accepted = await confirmInheritedRevoke({
        menuName: menuItem.name,
        role: getUserRole(selectedUser),
      })
      if (!accepted) return
    }
    applyPermission(code, checked)
  }, [applyPermission, assignment, selectedUser])

  const setAllForSelectedMenu = useCallback(() => {
    if (!selectedMenu) return
    setAssignment(previous => {
      const next = normalizeAssignment(previous)
      selectedMenu.functions.forEach(fn => {
        next.revokes = next.revokes.filter(code => code !== fn.code)
        if (!next.inherited.includes(fn.code) && !next.grants.includes(fn.code)) next.grants.push(fn.code)
      })
      return normalizeAssignment(next)
    })
  }, [selectedMenu])

  const setViewOnly = useCallback(async () => {
    if (!selectedMenu) return
    const nonView = selectedMenu.functions.filter(fn => fn.code !== selectedMenu.viewPermission)
    const inheritedCount = nonView.filter(fn => (
      assignment.inherited.includes(fn.code) && isEffective(assignment, fn.code)
    )).length
    if (inheritedCount) {
      const accepted = await confirmInheritedRevoke({
        count: inheritedCount,
        menuName: selectedMenu.name,
        role: getUserRole(selectedUser),
      })
      if (!accepted) return
    }
    setAssignment(previous => {
      const next = normalizeAssignment(previous)
      selectedMenu.functions.forEach(fn => {
        const shouldCheck = fn.code === selectedMenu.viewPermission
        next.grants = next.grants.filter(code => code !== fn.code)
        next.revokes = next.revokes.filter(code => code !== fn.code)
        if (shouldCheck && !next.inherited.includes(fn.code)) next.grants.push(fn.code)
        if (!shouldCheck && next.inherited.includes(fn.code)) next.revokes.push(fn.code)
      })
      return normalizeAssignment(next)
    })
  }, [assignment, selectedMenu, selectedUser])

  const copyPermissions = useCallback(async () => {
    const source = users.find(item => String(getUserId(item)) === String(copyUserId))
    if (!source || !selectedUser) return
    const sourceAssignment = getAssignment(source)
    const desired = new Set(ALL_PERMISSION_CODES.filter(code => isEffective(sourceAssignment, code)))
    const inheritedToRevoke = assignment.inherited.filter(code => !desired.has(code) && isEffective(assignment, code))
    if (inheritedToRevoke.length) {
      const accepted = await confirmInheritedRevoke({
        count: inheritedToRevoke.length,
        menuName: 'toàn bộ hệ thống',
        role: getUserRole(selectedUser),
      })
      if (!accepted) return
    }
    setAssignment(previous => normalizeAssignment({
      inherited: previous.inherited,
      grants: [...desired].filter(code => !previous.inherited.includes(code)),
      revokes: previous.inherited.filter(code => !desired.has(code)),
    }))
    message.success(`Đã sao chép quyền từ ${getUserName(source)}. Nhấn “Lưu thay đổi” để xác nhận.`)
  }, [assignment, copyUserId, selectedUser, users])

  const save = useCallback(async () => {
    if (!selectedUser || !dirty) return
    setSaving(true)
    try {
      const next = normalizeAssignment(assignment)
      const permissionsClient = ALL_PERMISSION_CODES.filter(code => isEffective(next, code))
      const response = await updateSystemUserPermissions(selectedUser, permissionsClient)
      const succeeded = response?.success === true
        || Number(response?.errorCode) === SUCCESS_CODE
      if (!succeeded) throw new Error(response?.message || 'Lưu phân quyền không thành công')
      setSavedAssignment(next)
      setUsers(previous => previous.map(item => (
        String(getUserId(item)) === String(getUserId(selectedUser))
          ? {
            ...item,
            permissionsClient,
            permissionOverrides: {
              ...(item?.permissionOverrides ?? {}),
              grant: next.grants,
              revoke: next.revokes,
            },
          }
          : item
      )))
      message.success('Đã lưu thay đổi phân quyền')
    } catch (error) {
      message.error(error?.message || 'Không thể lưu thay đổi phân quyền')
    } finally {
      setSaving(false)
    }
  }, [assignment, dirty, selectedUser])

  if (!canAccess) {
    return (
      <div>
        <Helmet><title>Phân quyền</title></Helmet>
        <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Tài khoản' }, { title: 'Phân quyền' }]} />
        <Result
          status="403"
          title="Không có quyền truy cập"
          subTitle="Chỉ ROLE_SUPER_ADMIN hoặc ROLE_ADMIN được phép mở màn quản trị phân quyền."
        />
      </div>
    )
  }

  const groupedMenus = PERMISSION_MENUS.reduce((result, item) => {
    if (!result[item.group]) result[item.group] = []
    result[item.group].push(item)
    return result
  }, {})
  const menuEnabled = selectedMenu && isEffective(assignment, selectedMenu.viewPermission)

  return (
    <PermissionPage className="my__content">
      <Helmet><title>Phân quyền</title></Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Tài khoản' }, { title: 'Phân quyền' }]} />
{/* 
      <div className="permission-intro">
        <div className="permission-intro__text">
          Checkbox của mỗi menu tương ứng trực tiếp với permission <strong>view</strong>.
        </div>
        <div className="permission-legend" aria-label="Chú thích trạng thái quyền">
          <span><i className="inherited" />Kế thừa từ role</span>
          <span><i className="custom" />Cấp riêng</span>
          <span><i className="revoked" />Đã thu hồi</span>
          <span><i className="none" />Chưa cấp</span>
        </div>
      </div> */}

      <div className="permission-copy">
        <span className="permission-copy__label">Sao chép quyền từ tài khoản</span>
        <Select
          showSearch
          allowClear
          value={copyUserId}
          optionFilterProp="label"
          placeholder="Chọn tài khoản nguồn"
          options={users
            .filter(item => String(getUserId(item)) !== String(selectedUserId))
            .map(item => ({ value: getUserId(item), label: `${getUserName(item)} · ${getUserRole(item)}` }))}
          onChange={setCopyUserId}
        />
        <Button icon={<CopyOutlined />} disabled={!selectedUser || !copyUserId} onClick={copyPermissions}>Áp dụng</Button>
      </div>

      <div className="permission-workspace">
        <section className="permission-panel">
          <div className="permission-panel__head">
            <h3>Tài khoản</h3><span className="permission-panel__count">{users.length} tài khoản</span>
          </div>
          <div className="permission-panel__search">
            <Input
              allowClear
              value={keyword}
              prefix={<SearchOutlined />}
              suffix={<Tooltip title="Tải lại"><ReloadOutlined onClick={() => loadUsers(keyword)} /></Tooltip>}
              placeholder="Tìm theo tên hoặc tài khoản"
              onChange={event => setKeyword(event.target.value)}
            />
          </div>
          <div className="permission-panel__body">
            <Spin spinning={loadingUsers}>
              {users.length ? users.map(item => {
                const id = getUserId(item)
                return (
                  <button
                    type="button"
                    key={id}
                    className={`permission-user ${String(id) === String(selectedUserId) ? 'active' : ''}`}
                    onClick={() => setSelectedUserId(id)}
                  >
                    <div className="permission-user__name">{getUserName(item)}</div>
                    <div className="permission-user__meta">
                      <span>{item.ssoId || item.email || '—'}</span>
                      <Tag color={getUserRole(item) === 'ROLE_SUPER_ADMIN' ? 'blue' : undefined}>{getUserRole(item).replace('ROLE_', '')}</Tag>
                    </div>
                  </button>
                )
              }) : <Empty className="permission-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy tài khoản" />}
            </Spin>
          </div>
        </section>

        <section className="permission-panel">
          <div className="permission-panel__head">
            <h3>Menu</h3>
            <span className="permission-panel__count">
              {PERMISSION_MENUS.filter(item => isEffective(assignment, item.viewPermission)).length}/{PERMISSION_MENUS.length} được mở
            </span>
          </div>
          <div className="permission-panel__body">
            {!selectedUser ? <div className="permission-empty">Chọn tài khoản để cấu hình menu</div> : Object.entries(groupedMenus).map(([group, items]) => (
              <React.Fragment key={group}>
                <div className="permission-group">{group}</div>
                {items.map(item => {
                  const checked = isEffective(assignment, item.viewPermission)
                  const activeCount = item.functions.filter(fn => isEffective(assignment, fn.code)).length
                  const hasRevoked = item.functions.some(fn => permissionState(assignment, fn.code) === 'revoked')
                  return (
                    <div
                      key={item.viewPermission}
                      className={`permission-menu ${item.viewPermission === selectedMenuCode ? 'active' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedMenuCode(item.viewPermission)}
                      onKeyDown={event => event.key === 'Enter' && setSelectedMenuCode(item.viewPermission)}
                    >
                      <Checkbox
                        checked={checked}
                        onClick={event => event.stopPropagation()}
                        onChange={event => togglePermission(item.viewPermission, event.target.checked, item)}
                      />
                      <div>
                        <div className="permission-menu__name">{item.name}</div>
                        <div className="permission-menu__path">{item.path}</div>
                      </div>
                      <div className="permission-menu__count">
                        {activeCount}/{item.functions.length} {hasRevoked ? <Tooltip title="Có quyền kế thừa đã bị thu hồi">⚠</Tooltip> : null}
                      </div>
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="permission-panel">
          <div className="permission-panel__head"><h3>Chức năng</h3></div>
          {!selectedMenu || !selectedUser ? <div className="permission-empty">Chọn tài khoản và menu để cấu hình chức năng</div> : (
            <>
              <div className="permission-function__context">
                <strong>{getUserName(selectedUser)}</strong> · {getUserRole(selectedUser)} · {selectedMenu.name}
              </div>
              <div className="permission-function__toolbar">
                <Button size="small" icon={<CheckOutlined />} disabled={!menuEnabled} onClick={setAllForSelectedMenu}>Chọn tất cả</Button>
                <Button size="small" disabled={!menuEnabled} onClick={setViewOnly}>Chỉ xem</Button>
              </div>
              {!menuEnabled ? (
                <div className="permission-locked">Bật checkbox menu “{selectedMenu.name}” để cấu hình các chức năng.</div>
              ) : null}
              <div className="permission-panel__body permission-function__list">
                {selectedMenu.functions.map(fn => {
                  const state = permissionState(assignment, fn.code)
                  return (
                    <div key={fn.code} className={`permission-function ${state === 'revoked' ? 'revoked' : ''}`}>
                      <Checkbox
                        checked={isEffective(assignment, fn.code)}
                        disabled={!menuEnabled && fn.code !== selectedMenu.viewPermission}
                        onChange={event => togglePermission(fn.code, event.target.checked, selectedMenu)}
                      />
                      <div className="permission-function__label">
                        <div>{fn.label}</div><div className="permission-function__code">{fn.code}</div>
                      </div>
                      {state === 'inherited' ? <Tag color="blue">Kế thừa</Tag> : null}
                      {state === 'custom' ? <Tag color="green">Cấp riêng</Tag> : null}
                      {state === 'revoked' ? <Tag color="red">Đã thu hồi</Tag> : null}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {dirty ? (
        <div className="permission-savebar">
          <span className="permission-savebar__status">Có thay đổi chưa lưu</span>
          <Button onClick={() => setAssignment(savedAssignment)}>Hủy thay đổi</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>Lưu thay đổi</Button>
        </div>
      ) : null}
    </PermissionPage>
  )
}

export default UserPermissionsPage
