import { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";
import { RequestUtils } from "@flast-erp/core/utils";
import { USER_LIST_API, USER_PAGE_SIZE } from "../constants";
import { mergeUsers } from "../utils";

export const useConfirmUsers = () => {
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userHasMore, setUserHasMore] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const userLoadingRef = useRef(false);

  const loadUsers = useCallback(async (nextPage, append) => {
    if (userLoadingRef.current) return;

    userLoadingRef.current = true;
    setUserLoading(true);
    try {
      const response = await RequestUtils.Get(USER_LIST_API, {
        limit: USER_PAGE_SIZE,
        page: nextPage,
      });
      const nextUsers = Array.isArray(response?.data?.embedded)
        ? response.data.embedded
        : [];
      setUsers((currentUsers) =>
        append ? mergeUsers(currentUsers, nextUsers) : nextUsers,
      );
      setUserPage(nextPage);
      setUserHasMore(nextUsers.length >= USER_PAGE_SIZE);
    } catch (error) {
      message.error(
        error?.message || "Không tải được danh sách người xác nhận.",
      );
    } finally {
      userLoadingRef.current = false;
      setUserLoading(false);
    }
  }, []);

  const handleUserDropdownOpen = useCallback(
    (open) => {
      if (open && userPage === 0) {
        loadUsers(1, false);
      }
    },
    [loadUsers, userPage],
  );

  const handleUserPopupScroll = useCallback(
    (event) => {
      const target = event.currentTarget;
      const isAtBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
      if (isAtBottom && userHasMore && !userLoadingRef.current) {
        loadUsers(userPage + 1, true);
      }
    },
    [loadUsers, userHasMore, userPage],
  );

  useEffect(() => {
    loadUsers(1, false);
  }, [loadUsers]);

  return {
    users,
    userLoading,
    handleUserDropdownOpen,
    handleUserPopupScroll,
  };
};
