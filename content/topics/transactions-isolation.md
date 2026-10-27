<!-- level:1 -->
# 트랜잭션과 ACID·격리 수준

> **먼저 한 문장:** 관련된 데이터 변경을 한 묶음으로 처리하고 다른 작업이 그 중간 상태를 어떻게 볼지 정합니다.

재고는 줄었는데 주문이 저장되지 않으면 자료가 어긋납니다. 여러 변경의 성공·실패를 연결하고 동시에 처리하는 요청의 관계도 관리해야 합니다.

## 먼저 알아둘 말

```learning
{"slug":"transactions-isolation","view":"words"}
```

## 작은 예로 이해하기

주문 저장 도중 고객에게 이메일을 이미 보냈다면 DB rollback으로 그 메일을 회수할 수 없습니다. 데이터베이스 안의 변경 범위와 바깥 효과의 범위는 다릅니다. 메일 발송 시점과 재처리 규칙을 별도로 정해야 합니다.

## 익숙한 장면과 연결하기

예약 장부에서 좌석을 줄이고 예약자 이름을 적는 두 행동을 하나의 예약 업무로 생각해 보세요. 둘 다 끝내거나 장부 변경을 되돌려야 합니다. 다른 직원이 진행 중인 장부를 언제 볼지도 규칙으로 정합니다.

**비유의 한계 — 이 점은 달라요:** 트랜잭션을 쓴다고 모든 업무 규칙과 외부 효과가 자동으로 보호되지는 않습니다. 선택한 격리 수준, 제약, 실패 재시도 범위를 함께 설계해야 합니다.

## 직접 확인하기

묶어서 시작 → 검사·변경 → 확정·되돌리기 순서로 읽어 보세요. 뒤의 과정에서 필요한 것이 앞에서 어떻게 준비되는지 찾습니다. 숫자는 읽는 순서이며 모든 상황이 정확히 세 단계라는 뜻은 아닙니다.

```learning
{"slug":"transactions-isolation","view":"explore"}
```

```learning
{"slug":"transactions-isolation","view":"recall"}
```
<!-- level:2 -->
# 트랜잭션과 ACID·격리 수준 · 작동 원리

아래 SQL은 서로 다른 세션에서 무엇을 볼 수 있는지 확인하는 학습 예제입니다. 읽는 시점과 값이 바뀌는 시점을 분리해 적어 보세요. 충돌 실패가 발생하면 전체 업무 재시도가 필요할 수 있습니다.

## 전체 흐름부터 보기

```learning
{"slug":"transactions-isolation","view":"trace"}
```

## 예제와 내부 동작

아래 자료를 읽을 때 **입력 → 바뀌는 값이나 상태 → 결과**를 찾아보세요. 모르는 말은 밑줄 표시를 눌러 뜻을 확인할 수 있어요.

<!-- classroom-reference:start -->
Read Committed는 일반적으로 문장별 스냅샷을 사용한다. PostgreSQL의 Read Uncommitted는 Read Committed처럼 동작한다. Repeatable Read는 안정된 스냅샷을 제공하고 PostgreSQL에서는 phantom도 방지하지만 모든 serialization anomaly를 막지는 않는다. Serializable은 충돌을 감지해 일부 트랜잭션을 실패시키므로 앱이 전체 트랜잭션을 재시도해야 한다.

학습용 테이블을 두 SQL 세션에서 준비한다.

```sql
CREATE TABLE inventory_lab(id integer PRIMARY KEY, stock integer CHECK(stock>=0));
INSERT INTO inventory_lab VALUES(1,1);
-- 각 세션에서 실행: 확인과 차감을 한 문장으로 연결
BEGIN;
UPDATE inventory_lab SET stock=stock-1 WHERE id=1 AND stock>0
RETURNING stock;
COMMIT;
```

반환 행 0개는 재고 확보 실패로 처리한다. 앱에서 SELECT 후 조건 없는 UPDATE를 하면 경쟁을 놓칠 수 있다. 행 잠금은 충돌하는 변경을 직렬화하는 도구이고, 여러 행의 업무 규칙에는 명시적 잠금·제약·Serializable 등의 검토가 필요하다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 트랜잭션과 ACID·격리 수준 · 문제 해결

같은 재고를 동시에 바꾸는 재현을 봅니다. 최종 값만 보지 말고 각 요청이 어떤 값을 읽었고 어느 변경을 확정했는지 순서대로 조사하세요.

## 구체적인 사례와 확인 방법

같은 증상에도 원인이 여럿일 수 있어요. 먼저 발생 조건을 기록하고 증상을 재현할 수 있는지 확인하세요. **관찰한 증상 → 확인할 자료 → 수정 → 수정 후 확인(같은 조건으로 재검증)**을 연결해서 읽습니다.

<!-- classroom-reference:start -->
가상 Serializable 작업이 충돌로 rollback되어 다시 실행됐다. 트랜잭션 안에서 이미 발송한 이메일은 DB rollback으로 취소되지 않는다. `40001` 같은 serialization 실패와 업무 중복을 함께 조사한다.

**수정:** 재시도는 전체 트랜잭션을 새로 시작하고 횟수·지터·기한을 제한한다. 외부 효과는 commit 이후 또는 outbox로 연결하고 소비자의 멱등성을 설계한다. deadlock 오류와 serialization 실패를 무조건 같은 원인으로 설명하지 않는다.

**재검증:** 동시 차감, 충돌, commit 후 응답 손실, 재시도 실패를 재현한다. 재고 불변식·중복 효과·트랜잭션 지연·실패율을 확인한다. 긴 트랜잭션과 잠금 획득 순서도 개선한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 트랜잭션과 ACID·격리 수준 · 실무 선택

강한 격리를 얻는 대신 기다림이나 충돌 재시도가 늘 수 있습니다. 반드시 지켜야 할 데이터 규칙, 요청량, 허용 지연을 기준으로 격리와 잠금 방법을 비교하세요.

## 선택지를 비교해 보기

방법을 하나 고르면 이득과 부담을 함께 볼 수 있어요. 어떤 조건을 중요하게 보는지에 따라 선택이 달라집니다.

```learning
{"slug":"transactions-isolation","view":"decide"}
```

## 판단 근거와 상세 비교

“이 조건에서는 이 방법을 쓰고, 대신 이 부담을 감수한다”라고 설명할 수 있는지 확인해 보세요.

<!-- classroom-reference:start -->
| 접근 | 이득 | 비용 |
|---|---|---|
| Read Committed + 원자 문장·제약 | 흔한 단일 행 변경에 효율적 | 복합 불변식 검토 |
| 명시적 행 잠금 | 충돌 변경 경계 명확 | 대기·deadlock·긴 보유 |
| Serializable | 직렬 실행과 같은 결과 계약 | abort와 전체 재시도 |

격리 수준만 올려 외부 시스템의 원자성을 얻을 수는 없다. DB 연결 풀, 트랜잭션 길이, 핫키, 잠금 순서, 재시도 폭주를 함께 설계한다. DB 제품별 실제 격리 보장은 같은 이름이어도 다를 수 있어 프로젝트 버전 문서로 확인한다.

**판단 연습:** 한 상품 재고와 서로 다른 의사 두 명의 근무 규칙을 같은 조건 UPDATE만으로 보장할까? 읽기 집합과 불변식을 먼저 정하자.

참고: [PostgreSQL 17 Isolation](https://www.postgresql.org/docs/17/transaction-iso.html), [Explicit Locking](https://www.postgresql.org/docs/17/explicit-locking.html).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"DB 트랜잭션의 rollback이 직접 취소하지 못하는 것은?","choices":["그 트랜잭션의 미커밋 행 변경","이미 외부로 발송한 이메일","해당 DB 쓰기","DB 내부 원자 작업"],"answer_index":1,"explanation":"외부 시스템의 효과는 DB rollback 경계 밖입니다. outbox·commit 후 처리·멱등성 등 연결 계약이 필요합니다."},{"level":2,"question":"PostgreSQL Repeatable Read에 대한 정확한 설명은?","choices":["모든 serialization anomaly 방지","dirty read 허용","안정 스냅샷과 phantom 방지를 제공하지만 직렬성은 별도","문장마다 항상 새 스냅샷"],"answer_index":2,"explanation":"PostgreSQL 구현은 phantom을 방지하지만 snapshot isolation의 직렬성 이상은 남을 수 있습니다. Serializable과 구분합니다."},{"level":3,"question":"serialization 실패 후 올바른 재시도는?","choices":["전체 트랜잭션을 새로 제한된 정책으로 재시도","실패한 마지막 SQL만 항상 반복","외부 효과를 무제한 중복 실행","오류를 성공 처리"],"answer_index":0,"explanation":"새 스냅샷으로 전체 업무를 다시 실행해야 합니다. 횟수·기한·외부 부작용의 멱등성을 함께 제어합니다."},{"level":4,"question":"격리 수준을 선택하는 핵심 기준은?","choices":["항상 가장 약한 수준","제품 이름만","모든 업무에 똑같은 수준","보호할 불변식·읽기 집합·충돌과 재시도 비용"],"answer_index":3,"explanation":"업무 규칙이 어떤 동시 실행을 허용하는지 정의하고 실제 보장과 운영 비용을 비교해야 합니다."}]
