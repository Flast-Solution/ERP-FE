import { RequestUtils } from '@flast-erp/core/utils';
import { USER_ACCOUNT_UPDATE_API } from '@/pages/userPermissions/service';

export const saveCallCenterExtension = async (user, value) => {
  const id = user?.id ?? user?.userId;
  const sipExt = String(value ?? '').trim();
  if (id == null) throw new Error('Không xác định được tài khoản hiện tại');
  if (!sipExt) throw new Error('Vui lòng nhập máy nhánh');
  const fields = [
    'fullName',
    'phone',
    'email',
    'ssoId',
    'branchId',
    'idUser',
    'status',
    'layout',
    'avatar',
    'bizId',
  ];
  const payload = { id, sipExt };
  fields.forEach((key) => {
    if (user[key] !== undefined) payload[key] = user[key];
  });
  if (Array.isArray(user.userProfiles))
    payload.userProfiles = user.userProfiles
      .map((profile) => ({ id: typeof profile === 'object' ? profile.id : profile }))
      .filter((profile) => profile.id != null);
  const response = await RequestUtils.Post(USER_ACCOUNT_UPDATE_API, payload, { id });
  if (
    response?.success === false ||
    !(response?.success === true || Number(response?.errorCode) === 200)
  )
    throw new Error(response?.message || 'Không lưu được máy nhánh tổng đài');
  return sipExt;
};
