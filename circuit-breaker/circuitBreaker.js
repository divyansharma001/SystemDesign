import redis from 'ioredis';

const redis = new redis();

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 10000; 

async function callServiceWithCircuitBreaker(serviceName, serviceCall){
    const circuitKey = `circuit:${serviceName}`

    const circuitState = await getCircuitState(circuitKey);

    switch(circuitState.state){
        case 'OPEN':
            if(Date.now() - circuitState.openedAt > RESET_TIMEOUT_MS){
                  console.log(`[${serviceName}] Timeout passed. Moving to HALF-OPEN.`);
                  await changeCircuitState(circuitKey, 'HALF-OPEN');
                  return await attemptCall(circuitKey, serviceCall);
            }else{
                    console.log(`[${serviceName}] Circuit is OPEN. Rejecting call.`);
                    throw new Error(`Circuit for ${serviceName} is open.`);

            }
        
        case 'HALF-OPEN':
                console.log(`[${serviceName}] Circuit is HALF-OPEN. Attempting one call.`);
                return await attemptCall(circuitKey, serviceCall);

         case 'CLOSED':
            default:
            return await attemptCall(circuitKey, serviceCall);
    }
}


async function attemptCall(circuitKey, serviceCall) {
  try {
    const result = await serviceCall();
    await onCallSuccess(circuitKey);
    return result;
  } catch (error) {
    await onCallFailure(circuitKey);
    throw error; 
  }
}

async function getCircuitState(circuitKey) {
  const stateData = await redis.hgetall(circuitKey);
  return {
    state: stateData.state || 'CLOSED',
    failures: parseInt(stateData.failures, 10) || 0,
    openedAt: parseInt(stateData.openedAt, 10) || 0,
  };
}

async function changeCircuitState(circuitKey, newState) {
  const multi = redis.multi();
  multi.hset(circuitKey, 'state', newState);
  if (newState === 'OPEN') {
    multi.hset(circuitKey, 'openedAt', Date.now());
  }
  if (newState === 'CLOSED') {
    multi.hset(circuitKey, 'failures', 0);
  }
  await multi.exec();
}

async function onCallSuccess(circuitKey) {
  console.log(`[${circuitKey}] Call Succeeded. Resetting to CLOSED.`);
  await changeCircuitState(circuitKey, 'CLOSED');
}

async function onCallFailure(circuitKey) {
  console.log(`[${circuitKey}] Call Failed.`);
  const newFailureCount = await redis.hincrby(circuitKey, 'failures', 1);

  if (newFailureCount >= FAILURE_THRESHOLD) {
    console.log(`[${circuitKey}] Failure threshold reached. Tripping circuit to OPEN.`);
    await changeCircuitState(circuitKey, 'OPEN');
  }
}

module.exports = { callServiceWithCircuitBreaker };