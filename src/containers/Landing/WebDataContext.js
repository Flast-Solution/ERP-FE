import { createContext, useContext } from 'react'

export const WebDataContext = createContext({
  components: {},
  customComponents: {},
  data: {},
  dataSources: {},
  actions: {},
  mode: 'runtime',
  page: null,
  route: {},
  query: {},
  currentUser: null,
})

export const useWebData = () => useContext(WebDataContext)
