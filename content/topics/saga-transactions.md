<!-- level:1 -->
# Saga — 여러 서비스의 일을 복구 가능한 단계로

여행 예약에서 항공권·호텔·렌터카를 순서대로 잡았는데 마지막 단계가 실패하면 앞 예약을 취소해야 할 수 있다. Saga는 여러 로컬 트랜잭션과 보상 동작을 연결해 긴 업무를 진행하는 패턴이다. DB 전체 rollback과 같은 원자 격리를 자동 제공하지 않는다.

```mermaid
flowchart LR
  A["주문 생성"] --> B["재고 확보"] --> C["결제"]
  C -->|"실패"| D["재고 해제 보상"] --> E["주문 실패 상태"]
```

보상은 과거를 지우는 것이 아니라 새 업무 행동이다. 메일 발송·외부 송금처럼 완전히 되돌릴 수 없는 효과도 있다. 다른 요청은 진행 중인 상태를 볼 수 있어 중간 상태와 경쟁 규칙을 설계해야 한다.

**비유의 한계:** 취소가 반드시 성공한다는 보장은 없다. 보상도 실패·중복·재시도하며 수동 복구가 필요할 수 있다.
<!-- level:2 -->
# 상태 머신과 멱등 전이

orchestration은 조정자가 단계와 복구를 관리하고 choreography는 이벤트 반응으로 협력한다. 두 방식 모두 durable 상태, 멱등 키, 기한과 재처리를 필요로 한다.

Python 3의 **교육용 상태 전이 모델**이다. 실제 서비스는 DB 조건 갱신과 이벤트 발행 경계를 연결한다.

```python
allowed = {"pending": {"reserved", "failed"},
           "reserved": {"paid", "compensating"},
           "compensating": {"failed"}, "paid": set(), "failed": set()}
state = "pending"
def transition(next_state):
    global state
    if next_state == state: return  # 같은 상태 재적용
    if next_state not in allowed[state]: raise ValueError("invalid transition")
    state = next_state
transition("reserved"); transition("compensating"); transition("failed")
```

동일 상태 허용만으로 외부 결제 중복을 막지는 않는다. 단계별 효과의 멱등 키와 결과 저장이 필요하다. outbox는 로컬 저장과 발행 이행을 연결하고 inbox·unique 기록은 중복 소비를 관리할 수 있다.
<!-- level:3 -->
# 가상 장애 — 결제 성공 뒤 응답이 없어 보상한다

가상 조정자가 결제 timeout을 실패로 확정하고 재고를 풀지만 실제 결제는 완료됐다. 응답 없음과 확정 실패는 다르다. step ID·외부 거래 ID·상태 조회와 기한을 대조한다.

**수정:** 불확실 상태를 모델에 포함하고 외부 결과를 조회·조정한다. 보상은 단계별 멱등·재시도·실패 상태를 갖게 한다. 오래된 이벤트가 완료된 업무를 다시 바꾸지 않도록 버전·조건 전이를 적용한다.

**재검증:** 각 단계의 처리 후 응답 손실, 조정자 재시작, 중복·지연 이벤트, 보상 실패를 주입한다. 누락·중복 결제와 미해결 Saga 수, 복구 시간·수동 조치율을 확인한다.
<!-- level:4 -->
# 분산 업무의 선택과 한계

| 방식 | 이득 | 부담 |
|---|---|---|
| 단일 DB 트랜잭션 | 원자 경계 단순 | 한 저장 경계에 제한 |
| 2PC 계열 | 참여자 계약에 따른 원자 commit | 지원·블로킹·운영 비용 |
| Saga | 로컬 자율성과 긴 흐름 | 중간 상태·보상·비격리 |

Saga는 일반적인 rollback 버튼이 아니다. 업무가 보상 가능한지, 경쟁 요청이 중간 상태를 어떻게 해석할지, 완료 확정 시점을 사용자에게 어떻게 알릴지 정한다. choreography는 중앙 결합을 줄일 수 있지만 흐름 발견·순환·추적이 어렵다. orchestration은 흐름이 보이지만 조정자 수명과 병목을 관리한다.

**판단 연습:** 이미 배송된 물건의 결제 실패를 기술적 취소만으로 해결할 수 있을까? 환불·회수·수동 조정이라는 업무 정책을 먼저 정의하자.

참고: [Microservices.io — Saga](https://microservices.io/patterns/data/saga.html), [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html).
<!-- quizzes -->
[{"level":1,"question":"Saga 보상에 대한 정확한 설명은?","choices":["항상 원래 세계로 완벽히 되돌림","새 업무 행동이며 실패·중복 가능성도 있음","DB 격리를 자동 제공","모든 이메일을 회수"],"answer_index":1,"explanation":"보상은 외부 효과의 의미를 복구하는 행동입니다. 완전한 역연산이 아닐 수 있고 자체 복구 정책이 필요합니다."},{"level":2,"question":"Saga 단계의 안전한 재처리에 필요한 것은?","choices":["메모리 변수 하나만","모든 이벤트 순서 가정","durable 상태·멱등 키·조건 전이","보상 로그 제거"],"answer_index":2,"explanation":"재시작과 중복 전달을 고려해 상태와 업무 결과를 지속적으로 기록해야 합니다. 상태 전이와 외부 효과 경계도 검증합니다."},{"level":3,"question":"결제 timeout을 받은 조정자의 올바른 판단은?","choices":["실행 여부가 불확실할 수 있어 거래 상태 확인","무조건 결제 안 됨","즉시 무한 결제 반복","항상 모든 작업 삭제"],"answer_index":0,"explanation":"응답 손실은 확정 실패가 아닙니다. 외부 거래 ID와 멱등성·상태 조회로 결과를 조정해야 합니다."},{"level":4,"question":"Saga를 선택할 때 중요한 업무 전제는?","choices":["모든 단계는 격리됨","보상이 절대 실패하지 않음","사용자 상태는 숨겨도 됨","중간 상태와 보상 가능한 의미·복구 정책"],"answer_index":3,"explanation":"Saga는 비격리 중간 상태와 보상 비용을 갖습니다. 업무 규칙과 관측·수동 복구까지 설계해야 합니다."}]
