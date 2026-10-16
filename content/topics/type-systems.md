<!-- level:1 -->
# 정적 타입 vs 동적 타입

> **오늘의 질문** · 이 칸에는 숫자를 넣어야 한다는 약속을 언제 확인할까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"type-systems","view":"explore"}
```

## 익숙한 장면과 연결해요

신청서에서 나이는 숫자, 연락처는 문자열, 동의 여부는 체크 표시로 받는다고 생각해 보세요. 설계할 때 칸의 종류를 확인하는 일과 실제 제출된 내용이 맞는지 검사하는 일은 구분해야 합니다.

## 선생님과 한 번 정리해요

가격에 글자를 더하거나 없는 필드를 읽으면 프로그램이 실패할 수 있습니다. 값의 종류와 상태를 명확히 표현하면 이런 실수를 더 일찍 찾기 쉽습니다.

**한 줄로 말하면:** 타입은 값에 어떤 형태와 작업이 허용되는지 설명하고, 잘못된 조합을 찾도록 돕습니다.

```learning
{"slug":"type-systems","view":"words"}
```

**비유의 한계도 알아둘까요?** 타입 검사가 모든 업무 오류와 보안 문제를 막지는 않습니다. 숫자 타입인 잔액이 잘못 계산되거나 허용 범위를 넘을 수 있으며 외부 입력의 검증도 필요합니다.

```learning
{"slug":"type-systems","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **값의 형태 → 사용 방식 검사 → 외부 입력 검증** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"type-systems","view":"trace"}
```

## 여기서 연결해 봐요

타입은 값에 어떤 형태와 작업이 허용되는지 설명하고, 잘못된 조합을 찾도록 돕습니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
유니언 타입은 여러 가능성을, 태그가 있는 유니언은 상태별 유효 필드를 표현한다. 검사기는 분기에서 타입을 좁힐 수 있다. null 가능성과 오류 상태를 계약에 포함하면 누락된 경로를 발견하기 쉽다.

TypeScript 예제는 `tsc` 검사 또는 tsx 실행이 필요하다.

```typescript
type Result = { ok: true; value: number } | { ok: false; error: string };
function parseCount(input: unknown): Result {
  if (typeof input !== "number" || !Number.isInteger(input) || input < 0)
    return { ok: false, error: "nonnegative integer required" };
  return { ok: true, value: input };
}
const result = parseCount(3);
if (result.ok) console.log(result.value + 1); // 4
else console.log(result.error);
```

TypeScript 타입은 일반적으로 실행 JS에서 지워지므로 `as SomeType`은 데이터 변환·검증이 아니다. Zod 같은 런타임 스키마는 실제 값을 확인할 수 있지만 업무 관계 전체를 자동 검증하는 것도 아니다. 정적·동적은 검사 시점이고 strong/weak 같은 비공식 분류와 동일 축이 아니다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"type-systems","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 API 코드가 `await response.json() as User`로 받아 이메일 문자열을 바로 사용한다. 실제 응답은 오류 객체여서 실패한다. 컴파일러가 외부 응답을 검사한 것이 아니라 개발자가 검사를 건너뛴 것이다.

**진단:** HTTP 상태·콘텐츠 타입·응답 스키마·버전과 실제 필드의 경계 조건을 확인한다. 민감한 사용자 응답 전체를 로그에 남기지 않는다. 성공 응답 fixture만으로 테스트하면 오류·null·빈 값 경로를 놓친다.

**수정:** 외부 경계에서 unknown으로 받아 스키마를 검증하고 성공·실패 상태를 구분한다. 타입 단언과 any를 최소화하고 엄격한 null 검사를 활성화한다. DB 제약과 입력 검증은 서로 보완한다.

**재검증:** 필드 누락·잘못된 타입·추가 필드·경계 숫자·호환 버전을 검사한다. 과도한 엄격성이 합법적인 확장 필드를 거절하는지도 계약에 맞춰 판단한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"type-systems","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 방식 | 이득 | 한계 |
|---|---|---|
| 정적 타입 | 개발 중 계약 오류 발견 | 외부 값·업무 진실성은 별도 |
| 런타임 스키마 | 입력 구조·범위 확인 | 검증 비용·버전 관리 |
| DB 제약 | 저장된 상태의 규칙 보호 | 앱 오류 설명·이행 설계 |

크고 오래가는 코드베이스에서는 타입이 리팩터링 안전망이 될 수 있지만 무리한 제네릭·단언은 가독성을 해칠 수 있다. 동적 언어에서도 명확한 계약·테스트·검증은 중요하다. 네트워크 경계의 타입 생성은 원천 스키마와 버전 이행 정책을 함께 관리한다.

**판단 연습:** 새 필드를 추가하는 API에서 구버전 클라이언트와 DB 제약을 어떻게 유지할까? optional, default, 버전, 런타임 검증의 책임을 나눠 설명하자.

참고: [TypeScript Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), [TypeScript Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"정적 타입이 있는 API 코드에도 런타임 검증이 필요한 이유는?","choices":["모든 타입은 암호화","외부 데이터가 선언한 구조를 실제로 만족하는지 별도 확인 필요","컴파일러는 HTTP 내용을 항상 미리 조회","JSON에는 오류가 없음"],"answer_index":1,"explanation":"외부 값은 실행 시점에 들어옵니다. 정적 선언만으로 실제 JSON의 구조·범위가 검증되지는 않습니다."},{"level":2,"question":"TypeScript의 as User 단언이 하는 일은?","choices":["데이터를 자동 변환","HTTP 상태 검증","컴파일러에게 타입 해석을 알리며 런타임 검사하지 않음","DB에 제약 자동 생성"],"answer_index":2,"explanation":"타입 단언은 실제 검증이 아닙니다. 신뢰하지 않는 값은 unknown으로 받아 런타임 스키마 등으로 확인해야 합니다."},{"level":3,"question":"외부 응답 필드 누락 장애의 개선 출발점은?","choices":["경계에서 상태·스키마 검증과 오류 경로 테스트","any를 모든 곳에 사용","응답 로그를 민감 정보째 공개","성공 fixture만 유지"],"answer_index":0,"explanation":"외부 계약 실패를 분리하고 누락·null·잘못된 타입을 검증해야 합니다. 민감 데이터 로그는 최소화합니다."},{"level":4,"question":"정적 타입·런타임 검증·DB 제약의 관계는?","choices":["하나가 있으면 나머지 모두 불필요","같은 검사 시점","전부 인가를 자동 보장","서로 다른 경계의 규칙을 보완"],"answer_index":3,"explanation":"개발 단계·입력 단계·저장 단계의 보호 범위가 다릅니다. 업무 불변식과 인가도 별도 설계가 필요합니다."}]
