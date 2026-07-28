export interface Mapper<TSource, TTarget> {
  toDomain(source: TSource): TTarget
  toPersistence(domain: TTarget): TSource
}

export function createMapper<TSource, TTarget>(
  toDomain: (source: TSource) => TTarget,
  toPersistence: (domain: TTarget) => TSource
): Mapper<TSource, TTarget> {
  return { toDomain, toPersistence }
}

export function mapList<TSource, TTarget>(
  sources: TSource[],
  mapper: Mapper<TSource, TTarget>
): TTarget[] {
  return sources.map(mapper.toDomain)
}

export function createSimpleMapper<T>() {
  return createMapper<T, T>(
    (source) => source,
    (domain) => domain
  )
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) result[key] = obj[key]
  }
  return result
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result
}
