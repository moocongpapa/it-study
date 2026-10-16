<!-- level:1 -->
# LLM 인프라와 벡터 데이터베이스 기초

> **오늘의 질문** · AI에게 우리 반 규칙을 찾아 보여 준다면?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"llm-vector-infra","view":"explore"}
```

## 익숙한 장면과 연결해요

도서관에서 사서가 질문과 관련된 책을 찾아 주고 답변자가 그 책을 읽는 상황을 떠올려 보세요. 벡터 검색은 관련 자료의 후보를 찾는 도구, LLM은 주어진 맥락에서 답변 문장을 만드는 모델에 가깝습니다. 비슷한 책을 찾았다고 책 내용이 사실이거나 답이 맞다는 보장은 없습니다.

## 선생님과 한 번 정리해요

AI 모델이 회사의 최신 문서나 바뀐 제품 정보를 모두 알고 있다고 기대할 수는 없습니다. 필요한 자료를 찾아 주고 답이 실제 근거에 맞는지 확인하는 과정이 필요합니다.

**한 줄로 말하면:** 질문과 관련된 문서를 먼저 찾고 AI에 참고로 주면 답변의 자료 근거를 연결할 수 있습니다.

```learning
{"slug":"llm-vector-infra","view":"words"}
```

**비유의 한계도 알아둘까요?** LLM은 사람이 책을 읽듯 진위를 판단하는 사서가 아닙니다. 자료를 줘도 잘못 해석하거나 없는 답을 만들 수 있습니다. 문서 안의 지시를 시스템 명령으로 취급하면 안 됩니다.

```learning
{"slug":"llm-vector-infra","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **문서의 숫자 표현 → 후보 검색·권한 → 근거로 답하기** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"llm-vector-infra","view":"trace"}
```

## 여기서 연결해 봐요

질문과 관련된 문서를 먼저 찾고 AI에 참고로 주면 답변의 자료 근거를 연결할 수 있습니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
prefill은 입력 맥락을 처리하고 decode는 출력 토큰을 순차 생성한다. KV cache는 이전 토큰의 attention 상태를 재사용하지만 요청 길이·동시성에 따라 메모리를 소비한다. 모델 가중치뿐 아니라 KV cache·런타임·배치 여유까지 GPU 예산에 포함한다.

아래 Python 3 예제는 **의미 embedding이 아닌 교육용 숫자 벡터**의 cosine 검색이다.

```python
from math import sqrt
def cosine(a, b):
    norm = sqrt(sum(x*x for x in a)) * sqrt(sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector")
    return sum(x*y for x,y in zip(a,b)) / norm
docs = {"a": [1,0], "b": [0,1], "c": [1,1]}
query = [1,0]
print(sorted(docs, key=lambda key: cosine(query,docs[key]), reverse=True))
```

실제 RAG는 수집→정제→chunk→embedding→권한·버전 metadata 저장→검색→rerank→맥락 구성→답변 평가를 잇는다. HNSW·IVF 같은 ANN은 정확도·메모리·검색 비용을 바꾼다. exact 검색 결과와 recall을 비교하고 filter와 인덱스의 상호작용을 측정한다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"llm-vector-infra","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 서비스가 긴 문서를 무제한 넣어 prefill·KV cache가 커지고 관련 없는 chunk가 답변을 흐린다. TTFT(time to first token), 토큰 간 지연, 전체 기한, 입력·출력 길이, 검색 recall, 문서 신선도와 권한을 각각 관측한다.

**수정:** 토큰·동시성·큐 상한을 두고 chunk·검색·rerank·맥락 예산을 평가셋으로 조정한다. continuous batching은 처리량을 높일 수 있지만 개별 지연과 메모리를 검증한다. 권한은 검색 전후에 서버가 적용하고 출력에 민감 정보가 섞이지 않도록 확인한다.

**재검증:** 긴 입력·동시 부하·없는 답·오래된 문서·다른 tenant·문서 내 악성 지시를 포함한다. 근거 정확성·거절·보안·지연·비용을 함께 평가한다. 벡터 유사도 점수만으로 정답을 선언하지 않는다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"llm-vector-infra","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 선택 | 이득 | 부담 |
|---|---|---|
| 관리형 모델 API | 초기 운영과 모델 접근 용이 | 토큰 비용·외부 의존·보관 정책 |
| 자체 서빙 | 용량·데이터·튜닝 통제 | GPU·운영·업데이트·안전 평가 |
| RAG | 자료 신선도·근거 연결 | 검색·권한·문서 품질 |
| fine-tuning | 특정 행동·형식 개선 | 데이터·평가·학습 운영 |

양자화는 가중치 메모리·속도를 바꿀 수 있지만 모델별 정확성·지원 커널·KV 예산을 다시 평가한다. tensor/pipeline/data parallelism의 병렬 대상과 통신 비용을 구분한다. 모델 크기만으로 품질이나 GPU 수를 결정하지 않는다.

**판단 연습:** 문서 검색형 튜터의 성공을 무엇으로 평가할까? 정답·근거·유도 질문·권한·TTFT·비용과 회귀 평가셋을 정하고 모델·검색·프롬프트 변경마다 비교하자.

참고: [vLLM Parallelism and Scaling](https://docs.vllm.ai/en/latest/serving/parallelism_scaling/), [PagedAttention 원 논문](https://arxiv.org/abs/2309.06180), [pgvector 공식 저장소](https://github.com/pgvector/pgvector), [OWASP LLM Prompt Injection](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"벡터 유사도가 직접 보장하지 못하는 것은?","choices":["벡터 거리 비교","가까운 후보 선택","검색 모델의 점수","문서 진실성·사용자 권한·최종 정답"],"answer_index":3,"explanation":"유사도는 검색 신호입니다. 자료 품질·권한·근거와 최종 답변 정확성은 별도 검증해야 합니다."},{"level":2,"question":"LLM GPU 메모리 예산에 포함할 것은?","choices":["가중치뿐 아니라 KV cache·동시 요청·런타임 여유","가중치 파일 크기만","출력 문자열 길이만","모델 이름 길이"],"answer_index":0,"explanation":"토큰과 동시성에 따른 KV 상태도 메모리를 사용합니다. 서빙 구조·배치·런타임 비용을 함께 계산해야 합니다."},{"level":3,"question":"RAG 튜터 회귀 평가에 필요한 사례는?","choices":["관련 질문 한 개만","없는 답·오래된 문서·다른 tenant·악성 문서 지시","유사도 최고값만","성공 출력만 저장"],"answer_index":1,"explanation":"검색과 생성뿐 아니라 권한·신선도·prompt injection·거절 경계를 검증해야 실제 운영 품질을 평가할 수 있습니다."},{"level":4,"question":"자가 LLM 서빙 선택에서 비교할 기준은?","choices":["항상 GPU가 가장 저렴","모델 파라미터 수만","평가 품질·토큰 부하·지연·보안·운영·총비용","양자화하면 품질 동일 보장"],"answer_index":2,"explanation":"서빙은 모델 크기 외에 KV·부하·통신·운영과 정확성의 선택입니다. 실제 평가와 용량 계획으로 판단합니다."}]
