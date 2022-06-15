import '@fontsource/acme'
import '@fontsource/fira-mono'
import '@app/shared/ui/globals.css'
import { Provider } from 'effector-react/scope'
import App from 'next/app'
import { withEffector } from 'nextjs-effector'

export default withEffector(App, { Provider })
