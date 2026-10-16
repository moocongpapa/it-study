<!-- level:1 -->
# 메시지 큐와 비동기 처리

> **오늘의 질문** · 주문표를 남겨 두면 요리사와 손님이 동시에 기다리지 않아도 될까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"message-queues","view":"explore"}
```

## 익숙한 장면과 연결해요

식당에서 주문표를 전달대에 올리고 주방이 차례로 받아 조리하는 모습을 떠올려 보세요. 안내 직원과 주방은 서로 다른 속도로 일할 수 있습니다. 주문표를 처리했는지 확인하는 기록도 필요합니다.

## 선생님과 한 번 정리해요

사용자가 주문할 때 이메일과 영상 변환까지 모두 기다리면 응답이 늦습니다. 일시적으로 많은 일이 들어와도 처리할 작업을 보관하고 나중에 나눠 수행할 수 있어야 합니다.

**한 줄로 말하면:** 요청한 일의 기록을 전달 통로에 남기고 다른 작업자가 자기 속도로 처리하게 합니다.

```learning
{"slug":"message-queues","view":"words"}
```

**비유의 한계도 알아둘까요?** 주문표 전달은 모든 메시지 제품의 순서와 저장 보장을 설명하지 못합니다. 큐를 넣어도 일의 양이 처리 능력을 계속 넘으면 대기가 쌓입니다.

```learning
{"slug":"message-queues","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **할 일 남기기 → 작업자가 처리 → 완료·재시도** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"message-queues","view":"trace"}
```

## 여기서 연결해 봐요

요청한 일의 기록을 전달 통로에 남기고 다른 작업자가 자기 속도로 처리하게 합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
소비자는 메시지를 읽고 업무 상태를 변경한 뒤 ACK 또는 offset commit을 한다. 상태 변경 후 확인 전에 죽으면 다시 전달돼 중복이 생길 수 있다. 먼저 확인하고 업무를 하면 장애 때 누락될 수 있다. 외부 효과와 확인의 경계가 핵심이다.

Python 3의 **교육용 멱등 소비자 모델**이다. 실제 DB에는 같은 트랜잭션과 unique 제약으로 구현해야 한다.

```python
processed, total = set(), 0
def consume(event_id, amount):
    global total
    if event_id in processed: return
    total += amount
    processed.add(event_id)
consume("e-1", 10); consume("e-1", 10)
assert total == 10
```

메모리 set만으로 프로세스 재시작이나 여러 워커의 경쟁을 막을 수 없다. durable event ID와 업무 저장을 연결한다. 순서 보장은 Kafka에서 일반적으로 파티션 단위이며 전역 순서가 아니다. 큐에서 여러 소비자의 완료 순서도 전달 순서와 다를 수 있다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"message-queues","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 소비자가 잘못된 스키마 메시지를 무한 재시도해 처리량을 소모한다. transient 오류와 영구 입력 오류를 구분하고 재시도 횟수·처리 시간·lag·DLQ 원인을 본다.

**수정:** 기한·지수 backoff·지터·재시도 상한을 두고 영구 실패를 quarantine/DLQ에 보낸다. DLQ는 폐기함이 아니라 원인·수정·재처리 절차가 필요한 운영 큐다. 메시지 스키마 버전과 호환성을 검증한다.

**재검증:** 처리 후 ACK 전 장애, 중복, 순서 변경, poison payload, 재처리에서 업무 결과가 한 번의 의미를 유지하는지 확인한다. backlog가 감소할 여유 처리량과 복구 시간도 측정한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"message-queues","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 선택 | 장점 | 비용 |
|---|---|---|
| 작업 큐 | 작업 분배와 확인 | 중복·재시도·가시성 |
| 보관 로그 | 재읽기·여러 소비자 | 파티션·보존·offset 운영 |
| 동기 호출 | 즉시 결과 계약 | 의존 지연·실패 전파 |

업무 DB 변경과 메시지 발행의 dual-write를 피하려면 outbox나 CDC를 검토한다. 메시지를 보냈지만 DB rollback되거나 반대 상황을 다룬다. 큐 저장량과 소비 속도, 최대 이벤트 크기, retention, replay 부하를 계획한다. 전달 보장·업무 멱등성·사용자 확인을 각각 명시한다.

참고: [Kafka Design and Delivery Semantics](https://kafka.apache.org/41/design/design/), [RabbitMQ Consumer Acknowledgements](https://www.rabbitmq.com/docs/confirms).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"at-least-once 소비에서 필요한 전제는?","choices":["중복 가능성을 처리","모든 외부 효과 자동 정확히 한 번","큐가 무한 용량","ACK 순서는 무관"],"answer_index":0,"explanation":"확인 전 장애 등으로 메시지가 다시 전달될 수 있습니다. 업무 효과의 멱등성과 durable 처리 기록이 필요합니다."},{"level":2,"question":"업무 저장 후 ACK 전에 죽으면 무엇이 발생할 수 있나요?","choices":["항상 메시지 영구 삭제","동일 메시지 재전달과 중복 효과","전역 순서 자동 보장","DB가 자동 rollback된다는 보장"],"answer_index":1,"explanation":"저장은 됐지만 확인되지 않아 다시 전달될 수 있습니다. ACK와 외부 효과의 경계를 설계해야 합니다."},{"level":3,"question":"영구적으로 잘못된 메시지의 무한 재시도 개선은?","choices":["오류 로그만 삭제","worker 무제한 증가","오류 분류·상한·DLQ와 재처리 절차","항상 성공 ACK"],"answer_index":2,"explanation":"복구 불가능한 입력은 반복해도 낫지 않습니다. 격리·원인 분석·수정 후 통제된 재처리 정책이 필요합니다."},{"level":4,"question":"DB 변경과 메시지 발행의 불일치를 다룰 패턴은?","choices":["운에 맡기기","두 작업을 무조건 동시에 시작","로그를 없애기","outbox 또는 CDC와 멱등 소비"],"answer_index":3,"explanation":"dual-write의 부분 실패를 관리하려면 저장 경계와 발행 이행을 연결합니다. 발행·소비의 중복도 처리해야 합니다."}]
