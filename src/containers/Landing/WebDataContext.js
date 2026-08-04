import { createContext, useContext } from 'react'

export const WebDataContext = createContext({
  components: {},
  page: null,
  route: {},
  query: {},
  currentUser: null,
})

export const useWebData = () => useContext(WebDataContext)
