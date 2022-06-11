import { createEvent } from 'effector'
import { PageContext } from '@app/shared/lib/effector'

export const pageStarted = createEvent<PageContext>()
