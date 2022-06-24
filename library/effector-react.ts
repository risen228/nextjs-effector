import * as effector from 'effector-react/scope'

export type EffectorReactImports = typeof effector

export const EffectorReact = {} as EffectorReactImports

export function setEffectorReact(entities: EffectorReactImports) {
  Object.assign(EffectorReact, entities)
}
