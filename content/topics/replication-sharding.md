<!-- level:1 -->
# DB 복제와 샤딩

> **오늘의 질문** · 노트를 복사하는 것과 나눠 맡는 것은 어떻게 다를까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"replication-sharding","view":"explore"}
```

## 익숙한 장면과 연결해요

같은 책을 여러 도서관에 두는 것은 복제입니다. 책을 주제별로 서로 다른 도서관에 나누어 두는 것은 샤딩에 가깝습니다. 사본의 내용이 언제 같아지는지와 어느 자료가 어느 곳에 있는지는 다른 문제입니다.

## 선생님과 한 번 정리해요

한 서버가 고장 나도 자료를 읽고 싶거나, 자료량이 한 서버 용량을 넘을 수 있습니다. 고장 대비와 용량 확장은 서로 다른 목적의 설계를 요구합니다.

**한 줄로 말하면:** 복제는 같은 자료의 사본을 만들고, 샤딩은 자료를 기준에 따라 여러 곳에 나눠 보관합니다.

```learning
{"slug":"replication-sharding","view":"words"}
```

**비유의 한계도 알아둘까요?** 사본이 있다고 항상 최신 읽기나 무손실 전환이 보장되지 않습니다. 자료를 나누면 여러 저장소에 걸친 조회와 변경이 더 복잡해질 수 있습니다.

```learning
{"slug":"replication-sharding","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **같은 자료 복사 → 자료 나눠 맡기 → 장애·이동 대응** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"replication-sharding","view":"trace"}
```

## 여기서 연결해 봐요

복제는 같은 자료의 사본을 만들고, 샤딩은 자료를 기준에 따라 여러 곳에 나눠 보관합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
PostgreSQL 물리 복제는 WAL 등을 사용해 사본을 갱신한다. 동기 복제와 비동기 복제의 쓰기 확인 시점이 다르고, 장애 시 손실·지연 계약도 달라진다. 사본 승격에는 이전 primary의 쓰기를 차단하는 fencing이 중요하다.

교육용 Python 라우팅 예제다. 운영 hash를 이대로 사용하지 않는다.

```python
import hashlib
def shard(key, count):
    digest = hashlib.sha256(key.encode()).digest()
    return int.from_bytes(digest[:8], "big") % count
assert shard("tenant-7", 4) == shard("tenant-7", 4)
print([shard(f"tenant-{i}", 4) for i in range(8)])
```

샤드 개수가 바뀌면 단순 modulo는 많은 키의 위치를 바꾼다. consistent hashing·가상 샤드·directory 기반 라우팅은 이동 비용과 제어를 다르게 제공한다. row partitioning과 여러 독립 DB로의 sharding도 구분한다. 하나의 DB 파티셔닝이 여러 서버 쓰기 확장을 자동 제공하지 않는다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"replication-sharding","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 시스템이 tenant ID로 분할했는데 거대 tenant 하나가 대부분의 쓰기를 만든다. 평균 행 수가 고르더라도 작업 비용은 편중될 수 있다. 샤드별 읽기·쓰기·p95·CPU·저장량과 핫키를 확인한다.

**수정:** 큰 tenant의 별도 샤드, 더 세밀한 키, 가상 샤드 이동을 검토한다. 분산 키를 바꾸면 범위 조회와 같은 tenant의 원자성이 어려워질 수 있다. 이행은 복사·변경 추적·검증·라우팅 전환·rollback을 설계한다.

**재검증:** 데이터 수만 아니라 처리량 분포와 복제 지연을 비교한다. 장애 승격·오래된 라우팅·이동 중 쓰기·중복 처리에서 무결성과 복구 시간을 확인한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"replication-sharding","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 선택 | 이득 | 부담 |
|---|---|---|
| 단일 DB 최적화 | 운영·트랜잭션 단순 | 단일 노드 자원 한계 |
| 읽기 복제 | 읽기 부하 분산·복구 옵션 | stale read·승격 |
| 샤딩 | 저장·쓰기 분산 가능 | cross-shard·이동·전역 제약 |

샤딩은 인덱스·쿼리·연결·배치 최적화로 해결하지 못하는 실제 한도에서 검토한다. 전역 unique, 조인, 집계, 트랜잭션과 backup restore가 복잡해진다. RPO는 허용 데이터 손실, RTO는 복구 시간 목표이며 실제 복구 훈련으로 확인한다.

**판단 연습:** 모든 사용자 데이터를 tenant별로 묶을 때 거대 tenant와 전역 검색을 어떻게 처리할까? 키 선택의 이득과 비용을 기록하자.

참고: [PostgreSQL High Availability](https://www.postgresql.org/docs/17/high-availability.html), [Table Partitioning](https://www.postgresql.org/docs/17/ddl-partitioning.html).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"복제와 샤딩의 차이는?","choices":["둘 다 같은 데이터 분할만 의미","복제는 항상 모든 쓰기를 분산","복제는 사본, 샤딩은 키에 따른 데이터 분할","샤딩은 백업과 동일"],"answer_index":2,"explanation":"사본을 추가하는 것과 저장 책임을 나누는 것은 다릅니다. 읽기 replica만으로 primary 쓰기 병목이 사라지지는 않습니다."},{"level":2,"question":"단순 key hash modulo에서 샤드 개수를 바꾸면 어떤 일이 생길 수 있나요?","choices":["많은 키의 라우팅 위치가 달라짐","모든 키가 반드시 같은 위치","데이터 이동 필요 없음","복제 지연이 자동 0"],"answer_index":0,"explanation":"분모가 바뀌면 매핑이 달라집니다. 가상 샤드·consistent hash·directory 등의 이동 관리 대안을 검토합니다."},{"level":3,"question":"샤드 행 수는 고른데 한 노드만 느리면 확인할 것은?","choices":["사이트 제목","작업 비용과 핫키·tenant별 부하 분포","모든 데이터를 즉시 삭제","평균 행 수만 재확인"],"answer_index":1,"explanation":"같은 행 수가 같은 부하를 의미하지 않습니다. 읽기·쓰기·핫키·지연 분포와 복제 상태를 함께 확인해야 합니다."},{"level":4,"question":"샤딩 도입에서 추가되는 중요한 운영 책임은?","choices":["전역 unique가 자동 쉬워짐","모든 조인이 공짜","backup이 불필요","cross-shard 질의·이동·전역 제약·복구"],"answer_index":3,"explanation":"분할은 자원 확장 가능성을 주지만 여러 노드의 계약과 복구를 복잡하게 합니다. 실제 한도와 비용을 근거로 도입합니다."}]
