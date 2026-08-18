import { useEffect, useState } from 'react';
import UserService from '@/services/UserService';

const getUserLabel = (user) => {
  const fullName = user.fullName || user.name || '';
  const ssoId = user.ssoId || user.username || '';

  if (fullName && ssoId) return `${fullName} - ${ssoId}`;
  return fullName || ssoId || user.email || `Người dùng #${user.id}`;
};

const useUserOptions = (enabled) => {
  const [userOptions, setUserOptions] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userLoadError, setUserLoadError] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;
    setUserLoading(true);
    setUserLoadError(false);

    UserService.loadBusinessUsers()
      .then((users) => {
        if (!active) return;

        const options = (Array.isArray(users) ? users : [])
          .filter((user) => (
            user?.id !== undefined
            && user?.id !== null
            && user?.status !== 0
          ))
          .map((user) => ({
            value: user.id,
            label: getUserLabel(user),
            user,
          }));

        setUserOptions(options);
      })
      .catch(() => {
        if (active) {
          setUserOptions([]);
          setUserLoadError(true);
        }
      })
      .finally(() => {
        if (active) setUserLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { userLoadError, userLoading, userOptions };
};

export default useUserOptions;
