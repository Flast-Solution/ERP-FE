const SNOWFLAKE_EPOCH = 1704067200000n // 01/01/2024 UTC
const WORKER_ID_BITS = 10n
const SEQUENCE_BITS = 12n
const MAX_WORKER_ID = (1n << WORKER_ID_BITS) - 1n
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n

const createWorkerId = () => {
  if (window.crypto?.getRandomValues) {
    const randomValue = new Uint16Array(1)
    window.crypto.getRandomValues(randomValue)
    return BigInt(randomValue[0]) & MAX_WORKER_ID
  }

  return BigInt(Math.floor(Math.random() * Number(MAX_WORKER_ID + 1n)))
}

const workerId = createWorkerId()
let lastTimestamp = -1n
let sequence = 0n

export const createSnowflakeId = () => {
  let timestamp = BigInt(Date.now())

  // Giữ ID tăng dần ngay cả khi đồng hồ hệ thống bị lùi hoặc sequence tràn.
  if (timestamp < lastTimestamp) timestamp = lastTimestamp

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & MAX_SEQUENCE
    if (sequence === 0n) timestamp = lastTimestamp + 1n
  } else {
    sequence = 0n
  }

  lastTimestamp = timestamp
  return (
    ((timestamp - SNOWFLAKE_EPOCH) << (WORKER_ID_BITS + SEQUENCE_BITS))
    | (workerId << SEQUENCE_BITS)
    | sequence
  ).toString()
}
/* global BigInt */

