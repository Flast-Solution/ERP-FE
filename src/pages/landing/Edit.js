import { useLocation } from 'react-router-dom'
import { EditorApp } from '@/containers/Landing/EditorApp'
import { MicroFrontendEditor } from '@/containers/Landing/MicroFrontendEditor'
import { getLandingPage, WEB_CONTENT_TYPES } from '@/containers/Landing/landingRepository'

const LandingEdit = () => {
  const { search } = useLocation()
  const pageId = new URLSearchParams(search).get('id')
  const page = getLandingPage(pageId)

  return page?.contentType === WEB_CONTENT_TYPES.MICRO_FRONTEND
    ? <MicroFrontendEditor pageId={pageId} />
    : <EditorApp />
}

export default LandingEdit
