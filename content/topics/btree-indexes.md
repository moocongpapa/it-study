<!-- level:1 -->
# B-Tree 인덱스 동작 원리

> **오늘의 질문** · 두꺼운 사전에서 단어를 처음부터 읽어 찾아야 할까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"btree-indexes","view":"explore"}
```

## 익숙한 장면과 연결해요

두꺼운 책 뒤의 색인에서 단어와 페이지를 찾는 상황을 떠올려 보세요. 색인을 만들면 읽을 페이지를 좁힐 수 있습니다. 하지만 책 내용이 바뀌면 색인도 고쳐야 하고 색인을 보관할 공간도 듭니다.

## 선생님과 한 번 정리해요

주문 수백만 건에서 한 고객의 최근 주문을 찾으려고 모든 행을 읽으면 비용이 큽니다. 자주 찾는 조건에 맞는 안내 구조가 필요합니다.

**한 줄로 말하면:** 데이터와 별도로 정렬된 찾기 구조를 만들어 전체 내용을 덜 훑고 필요한 위치에 접근합니다.

```learning
{"slug":"btree-indexes","view":"words"}
```

**비유의 한계도 알아둘까요?** 색인이 있어도 읽을 자료가 대부분이면 전체를 훑는 편이 나을 수 있습니다. 인덱스를 늘릴수록 저장 공간과 갱신 비용이 늘며 실제 계획을 확인해야 합니다.

```learning
{"slug":"btree-indexes","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **정렬된 키 → 구간 좁히기 → 자료 위치** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"btree-indexes","view":"trace"}
```

## 여기서 연결해 봐요

데이터와 별도로 정렬된 찾기 구조를 만들어 전체 내용을 덜 훑고 필요한 위치에 접근합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
복합 B-Tree `(tenant_id, created_at)`는 앞 키의 조건과 뒤 키 범위가 조합되는 조회를 지원할 수 있다. 모든 조건에서 같은 효율을 보장하지 않으며 옵티마이저의 선택은 통계·버전·조건에 따른다. 함수·타입 변환·콜레이션이 조건과 인덱스의 관계를 바꿀 수 있다.

PostgreSQL 17 학습용 실행 예제다. `EXPLAIN ANALYZE`는 쿼리를 실제 실행한다.

```sql
CREATE TEMP TABLE events_demo AS
SELECT i AS id, i % 100 AS tenant_id, i AS created_at
FROM generate_series(1,10000) i;
CREATE INDEX ON events_demo(tenant_id,created_at);
ANALYZE events_demo;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM events_demo
WHERE tenant_id=7 AND created_at>=9000;
```

작은 데이터에서는 다른 계획도 합리적일 수 있다. 예상 행 수와 실제 행 수, 읽은 buffer, 실행 시간을 확인한다. index-only scan은 필요한 컬럼이 인덱스에 있고 가시성 조건 등이 맞아야 하며 항상 heap 접근이 0인 것은 아니다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"btree-indexes","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 조회가 대부분 행을 반환하거나 통계가 낡아 인덱스 선택이 기대와 다르다. 계획의 estimated rows와 actual rows를 비교하고 필터·정렬·조인 중 어디가 비용을 쓰는지 본다. 운영의 쓰기 쿼리에 ANALYZE를 붙이면 실제 변경되므로 읽기 또는 격리 환경에서 검증한다.

**수정:** 워크로드에 맞는 키 순서·부분 인덱스·표현식 인덱스를 검토하고 통계·쿼리 조건을 정렬한다. 강제로 인덱스 스캔을 택하게 하는 설정을 영구 해결로 삼지 않는다. 큰 LIMIT 없는 응답과 불필요한 컬럼 전송도 줄인다.

**재검증:** 대표 tenant·핫키·희소 조건·넓은 범위와 동시 쓰기 부하를 비교한다. 읽기 p95뿐 아니라 삽입 지연·인덱스 크기·vacuum 운영도 확인한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"btree-indexes","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 선택 | 장점 | 부담 |
|---|---|---|
| B-Tree | 동등·정렬·범위 조회 | 갱신·분할·저장 공간 |
| covering 인덱스 | 조회에 필요한 값 포함 | 크기·쓰기 증폭 |
| 부분 인덱스 | 특정 행 집합에 집중 | 쿼리 조건과 predicate 일치 |
| BRIN | 물리 순서와 연관된 대형 데이터 | 정밀도가 낮아 재검사 |

인덱스 도입은 조회 패턴과 데이터 분포의 계약이다. 사용되지 않는다고 생성 직후 삭제하지 않는다. 반대로 드물게 쓰는 넓은 인덱스가 모든 쓰기의 비용을 늘리는지도 본다. 운영 생성에는 잠금·디스크·복제 지연과 concurrent 생성의 제약을 계획한다.

참고: [PostgreSQL B-Tree](https://www.postgresql.org/docs/17/btree.html), [Multicolumn Indexes](https://www.postgresql.org/docs/17/indexes-multicolumn.html), [Using EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"인덱스에 대한 정확한 설명은?","choices":["모든 읽기가 반드시 빨라짐","쓰기 비용이 없음","특정 읽기를 돕지만 유지·저장 비용이 있음","항상 자식이 둘뿐"],"answer_index":2,"explanation":"인덱스는 키 탐색을 돕지만 행 변경 때 유지됩니다. 넓은 결과에서는 순차 스캔이 합리적일 수 있습니다."},{"level":2,"question":"EXPLAIN ANALYZE 사용 시 중요한 사실은?","choices":["쿼리를 실제 실행한다","계획만 보고 절대 실행하지 않음","항상 index scan 보장","통계는 필요 없음"],"answer_index":0,"explanation":"ANALYZE 옵션은 실제 실행 정보를 수집합니다. 변경 쿼리나 큰 부하의 운영 실행에 특히 주의해야 합니다."},{"level":3,"question":"예상 행 수와 실제 행 수가 크게 다르면 조사할 것은?","choices":["화면 색상","통계·데이터 분포·조건 선택도","항상 인덱스 전부 삭제","HTTP 메서드만"],"answer_index":1,"explanation":"옵티마이저의 추정은 통계와 조건에 의존합니다. 실제 분포를 반영하는지 확인해 계획 차이를 설명합니다."},{"level":4,"question":"covering 인덱스 도입 때 비교할 비용은?","choices":["저장 공간이 사라짐","모든 heap 읽기 자동 제거","쓰기 영향은 없음","인덱스 크기·쓰기 증폭·가시성 조건"],"answer_index":3,"explanation":"필요 컬럼을 포함하면 일부 읽기가 개선되지만 크기와 갱신 비용이 늘어납니다. index-only scan 조건도 확인해야 합니다."}]
