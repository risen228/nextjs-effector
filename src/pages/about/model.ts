import { createEvent } from 'effector'
import { StaticPageContext } from '@app/shared/lib/effector'

export const pageStarted = createEvent<StaticPageContext>()
