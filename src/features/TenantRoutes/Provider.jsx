import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import useGetMe from '@/hooks/useGetMe';
import { fetchConfig } from './service';
const Context = createContext(null);
export function TenantRouteProvider({ children }) {
  const { user } = useGetMe(); const identity = `${user?.id}:${user?.bizId}`; const generation = useRef(0); const current = useRef(identity); current.current = identity;
  const [state, setState] = useState({ identity: '', status: 'loading' });
  const refresh = useCallback(async () => { const seq = ++generation.current; setState({ identity, status: 'loading' }); if (!user?.id || !user?.bizId) return; try { const config = await fetchConfig(user.bizId); if (seq === generation.current && identity === current.current) setState({ identity, status: 'ready', config }); } catch (error) { if (seq === generation.current && identity === current.current) setState({ identity, status: 'error', error: error.message }); } }, [identity, user?.id, user?.bizId]);
  useEffect(() => { const counter = generation; refresh(); return () => { counter.current++; }; }, [refresh]);
  return <Context.Provider value={{ ...(state.identity === identity ? state : { status: 'loading' }), refresh }}>{children}</Context.Provider>;
}
export function useTenantRoutes() { const value = useContext(Context); if (!value) throw new Error('Thiếu TenantRouteProvider'); return value; }
