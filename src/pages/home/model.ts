import { createEvent } from 'effector'
import { SharedNextContext } from '@app/shared/lib/effector'

export const pageStarted = createEvent<SharedNextContext>()
