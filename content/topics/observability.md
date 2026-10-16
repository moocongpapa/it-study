<!-- level:1 -->
# 모니터링·로깅과 가시성

> **오늘의 질문** · 느리다는 말만 듣고 어디가 막혔는지 알 수 있을까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"observability","view":"explore"}
```

## 익숙한 장면과 연결해요

병원 접수 과정의 사건 기록, 대기 인원 숫자, 한 환자가 거친 창구 순서를 구분해 보세요. 사건 기록은 로그, 반복 측정값은 지표, 한 요청의 경로는 추적에 가깝습니다. 이 자료를 연결하면 어느 단계에서 기다렸는지 알 수 있습니다.

## 선생님과 한 번 정리해요

사용자는 ‘느리다’고 말하지만 원인은 서버·DB·네트워크 등 여러 곳일 수 있습니다. 결과만 보는 대신 요청이 지나간 과정과 증거를 남겨야 합니다.

**한 줄로 말하면:** 로그·지표·요청 추적을 연결해 느린 이유와 실패한 위치를 설명할 수 있게 합니다.

```learning
{"slug":"observability","view":"words"}
```

**비유의 한계도 알아둘까요?** 기록을 많이 모으는 것만으로 원인을 찾을 수 있지는 않습니다. 의미와 연결 기준이 필요하고, 개인 정보·비밀값을 과도하게 기록하면 안 됩니다.

```learning
{"slug":"observability","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **사건 기록 → 변화 관찰 → 요청 경로 추적** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"observability","view":"trace"}
```

## 여기서 연결해 봐요

로그·지표·요청 추적을 연결해 느린 이유와 실패한 위치를 설명할 수 있게 합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
로그에는 시각·severity·서비스·요청/trace ID·사건 종류·결과를 구조화한다. metrics label에는 제한된 차원을 사용한다. 사용자 ID나 요청 ID를 label로 넣으면 시계열이 폭증할 수 있다. 그 정보는 적절히 보호된 로그·trace에 둘 수 있다.

Python 3의 구조화 로그 학습 예제다. 실제 사용자 데이터는 포함하지 않는다.

```python
import json, time
started = time.perf_counter()
# 예제 작업
result = sum(range(1000))
print(json.dumps({
    "event": "calculation_complete", "status": "ok",
    "duration_ms": (time.perf_counter()-started)*1000,
    "result": result,
}))
```

분산 trace는 컨텍스트를 호출 경계로 전파하고 span 수명·오류를 기록한다. trace ID를 인증 권한으로 사용하지 않는다. latency histogram의 bucket/집계 방식과 quantile 의미를 확인하고 서로 다른 호스트의 quantile을 단순 평균내지 않는다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"observability","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 서비스의 일부 tenant가 느린 DB 쿼리를 만나 p99가 악화된다. 평균만 보면 정상처럼 보인다. 지연 분포와 endpoint·지역·의존성·배포 버전을 제한된 차원으로 비교하고 trace에서 critical path를 찾는다.

**수정:** 느린 경로와 포화 자원을 개선하고 에러·SLO burn rate 알림을 사용자 영향에 연결한다. 알림마다 담당·심각도·runbook·조치 가능성을 정한다. 임계치만 낮춰 알림을 늘리면 대응 품질이 떨어질 수 있다.

**재검증:** 부하·부분 장애·배포 변화에서 지표와 trace가 실제 원인을 가리키는지 확인한다. 수집기 장애와 텔레메트리 비용도 관측한다. 로그에 토큰·전체 본문이 남는지 검사한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"observability","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 자료 | 강점 | 비용 |
|---|---|---|
| metrics | 저비용 추세·알림 | 차원·분포 표현 제한 |
| logs | 사건 상세·감사 단서 | 저장·검색·민감 정보 |
| traces | 여러 의존성의 지연 경로 | 전파·샘플링·수집 비용 |

SLO는 사용자가 기대하는 성공·지연의 목표와 측정 창이다. error budget은 실패 허용량을 운영 판단에 연결한다. 모니터링 지표를 전부 늘리기보다 빠진 질문과 실패 복구에 필요한 정보를 고른다. 고가치 오류 trace 보관, 정상 요청 샘플링, retention과 redaction을 계획한다.

**판단 연습:** 로그인 실패 증가가 앱 결함인지 외부 인증 장애인지 설명하려면 어떤 지표·로그·trace를 연결해야 할까?

참고: [OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/), [Google SRE Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"평균 지연만으로 놓칠 수 있는 것은?","choices":["모든 CPU 명령","모든 코드 줄","일부 사용자의 큰 꼬리 지연","응답의 존재 자체"],"answer_index":2,"explanation":"평균은 분포의 극단을 숨길 수 있습니다. p95·p99와 오류·포화를 사용자 흐름과 함께 봅니다."},{"level":2,"question":"metric label에 요청 ID를 넣을 때의 주요 문제는?","choices":["카디널리티와 시계열 비용 폭증","항상 모든 성능 개선","로그가 불필요","trace가 자동 인증"],"answer_index":0,"explanation":"요청마다 고유 label은 시계열 수를 크게 늘립니다. 제한된 차원과 로그·trace의 적절한 연결을 설계합니다."},{"level":3,"question":"알림 품질을 높이는 요소는?","choices":["무조건 임계치 최소","사용자 영향·담당·runbook·조치 가능성","모든 요청 본문 공개","정상 trace 무한 저장"],"answer_index":1,"explanation":"실제 대응 가능한 알림이어야 합니다. SLO와 원인 조사 자료를 연결하고 잡음과 민감 데이터 비용을 통제합니다."},{"level":4,"question":"observability 설계의 올바른 기준은?","choices":["도구 개수 최대","지표는 많을수록 항상 좋음","샘플링은 항상 금지","답할 질문·실패 복구·SLO와 저장·보안 비용"],"answer_index":3,"explanation":"관측은 시스템 상태를 추론하고 대응하기 위한 것입니다. 수집·보관·권한·비용을 실제 질문에 맞춰 선택합니다."}]
