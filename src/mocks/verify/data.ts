import rawVerify from './verify.json'
import type { VerifyDaily, VerifyEntry } from '#/types/verify'

/**
 * 예측 검증 탭 전용 더미 데이터. 실 백엔드에 해당 API가 없어 verify.json을
 * 정적으로 읽어 쓴다 — apis/verify/queries.ts가 API를 거치지 않고 이 데이터를
 * 클라이언트에서 직접 가공한다.
 */

export const VERIFY_ENTRIES: VerifyEntry[] = rawVerify.entries as VerifyEntry[]

const DAILY_HIT_RATES: number[] = rawVerify.dailyHitRates

/** 최근 30거래일(=최근 30일, 어제까지)에 적중률을 매핑. 실행 시점 기준으로 계산해 데모가 언제 열려도 날짜가 맞는다. */
export function buildVerifyDaily(): VerifyDaily[] {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return DAILY_HIT_RATES.map((hitRate, i) => {
    const d = new Date(yesterday)
    d.setDate(d.getDate() - (DAILY_HIT_RATES.length - 1 - i))
    return { date: d.toISOString().slice(0, 10), hitRate }
  })
}
