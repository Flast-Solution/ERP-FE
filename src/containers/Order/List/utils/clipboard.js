import { message } from 'antd'

export const copyToClipboard = (text, setCopiedIndex, index) => {
  navigator.clipboard.writeText(text).then(() => {
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    message.success('Đã copy vào lệnh Ctrl+C')
  })
}
