  █ THRESHOLDS 
    http_req_duration
    ✗ 'p(95)<500' p(95)=2.41s
      {endpoint:marketAssets}
      ✗ 'p(95)<400' p(95)=998.13ms
      {endpoint:portfolioTrade}
      ✗ 'p(95)<500' p(95)=2.34s
    http_req_failed
    ✗ 'rate<0.01' rate=45.48%
  █ TOTAL RESULTS 
    checks_total.......: 4934   11.596627/s
    checks_succeeded...: 55.95% 2761 out of 4934
    checks_failed......: 44.04% 2173 out of 4934
    ✗ login status 200
      ↳  47% — ✓ 795 / ✗ 877
    ✗ login has token
      ↳  47% — ✓ 795 / ✗ 877
    ✗ trade success
      ↳  73% — ✓ 1171 / ✗ 419
    HTTP
    http_req_duration...............: avg=957.4ms  min=185.44ms med=690.57ms max=11.56s p(90)=1.81s    p(95)=2.41s   
      { endpoint:marketAssets }.....: avg=473.37ms min=189.71ms med=414.65ms max=1.68s  p(90)=860.57ms p(95)=998.13ms
      { endpoint:portfolioTrade }...: avg=1.2s     min=211.96ms med=1.16s    max=3.7s   p(90)=2.05s    p(95)=2.34s   
      { expected_response:true }....: avg=1.2s     min=185.44ms med=883.66ms max=11.56s p(90)=2.33s    p(95)=3.01s   
    http_req_failed.................: 45.48% 8354 out of 18367
    http_reqs.......................: 18367  43.168877/s
    EXECUTION
    iteration_duration..............: avg=11s      min=212.43ms med=1.25s    max=38.45s p(90)=27.75s   p(95)=31.48s  
    iterations......................: 1672   3.929785/s
    vus.............................: 1      min=1             max=50
    vus_max.........................: 50     min=50            max=50
    NETWORK
    data_received...................: 75 MB  176 kB/s
    data_sent.......................: 1.7 MB 4.1 kB/s
running (7m05.5s), 00/50 VUs, 1672 complete and 0 interrupted iterations
default ✓ [ 100% ] 00/50 VUs  7m0s
time="2026-09-03T23:12:56Z" level=error msg="thresholds on metrics 'http_req_duration, http_req_duration{endpoint:marketAssets}, http_req_duration{endpoint:portfolioTrade}, http_req_failed' have been crossed"