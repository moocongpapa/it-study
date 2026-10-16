<!-- level:1 -->
# 트랜잭션과 ACID·격리 수준

> **오늘의 질문** · 돈을 빼기만 하고 보내지 못했다면?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"transactions-isolation","view":"explore"}
```

## 익숙한 장면과 연결해요

예약 장부에서 좌석을 줄이고 예약자 이름을 적는 두 행동을 하나의 예약 업무로 생각해 보세요. 둘 다 끝내거나 장부 변경을 되돌려야 합니다. 다른 직원이 진행 중인 장부를 언제 볼지도 규칙으로 정합니다.

## 선생님과 한 번 정리해요

재고는 줄었는데 주문이 저장되지 않으면 자료가 어긋납니다. 여러 변경의 성공·실패를 연결하고 동시에 처리하는 요청의 관계도 관리해야 합니다.

**한 줄로 말하면:** 관련된 데이터 변경을 한 묶음으로 처리하고 다른 작업이 그 중간 상태를 어떻게 볼지 정합니다.

```learning
{"slug":"transactions-isolation","view":"words"}
```

**비유의 한계도 알아둘까요?** 트랜잭션을 쓴다고 모든 업무 규칙과 외부 효과가 자동으로 보호되지는 않습니다. 선택한 격리 수준, 제약, 실패 재시도 범위를 함께 설계해야 합니다.

```learning
{"slug":"transactions-isolation","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **묶어서 시작 → 검사·변경 → 확정·되돌리기** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"transactions-isolation","view":"trace"}
```

## 여기서 연결해 봐요

관련된 데이터 변경을 한 묶음으로 처리하고 다른 작업이 그 중간 상태를 어떻게 볼지 정합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

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
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"transactions-isolation","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 Serializable 작업이 충돌로 rollback되어 다시 실행됐다. 트랜잭션 안에서 이미 발송한 이메일은 DB rollback으로 취소되지 않는다. `40001` 같은 serialization 실패와 업무 중복을 함께 조사한다.

**수정:** 재시도는 전체 트랜잭션을 새로 시작하고 횟수·지터·기한을 제한한다. 외부 효과는 commit 이후 또는 outbox로 연결하고 소비자의 멱등성을 설계한다. deadlock 오류와 serialization 실패를 무조건 같은 원인으로 설명하지 않는다.

**재검증:** 동시 차감, 충돌, commit 후 응답 손실, 재시도 실패를 재현한다. 재고 불변식·중복 효과·트랜잭션 지연·실패율을 확인한다. 긴 트랜잭션과 잠금 획득 순서도 개선한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"transactions-isolation","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

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
