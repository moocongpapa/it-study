<!-- level:1 -->
# 웹 인증: 쿠키·세션·JWT·OAuth2

> **오늘의 질문** · 학생증이 있어도 모든 사물함을 열 수 있을까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"web-auth","view":"explore"}
```

## 익숙한 장면과 연결해요

건물 로비에서 신분증을 확인하는 것과 특정 사무실 출입을 허용하는 것은 다른 판단입니다. 출입증을 갖고 있다고 모든 방에 들어갈 수 있는 것은 아닙니다.

## 선생님과 한 번 정리해요

내 주문을 보기 위해 로그인했어도 다른 사람의 주문까지 볼 수 있으면 안 됩니다. 신원 확인과 자료별 권한 확인을 모두 해야 합니다.

**한 줄로 말하면:** 로그인은 사용자를 확인하고, 권한 검사는 그 사용자가 특정 자료와 행동에 접근해도 되는지 판단합니다.

```learning
{"slug":"web-auth","view":"words"}
```

**비유의 한계도 알아둘까요?** 출입증이 유효한지와 사용할 권한은 매번 적절히 확인해야 합니다. JWT는 그 자체로 암호화된 비밀 상자가 아니며 OAuth2만으로 로그인 신원이 자동 확인되는 것도 아닙니다.

```learning
{"slug":"web-auth","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **누구인지 → 로그인 상태 → 이 자료의 권한** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"web-auth","view":"trace"}
```

## 여기서 연결해 봐요

로그인은 사용자를 확인하고, 권한 검사는 그 사용자가 특정 자료와 행동에 접근해도 되는지 판단합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
서버 세션 쿠키에는 Secure·HttpOnly·적절한 SameSite, 경로·도메인·만료 정책을 둔다. HttpOnly는 JavaScript의 읽기를 막지만 XSS가 사용자 대신 요청하는 모든 문제를 없애지는 않는다. CSRF 보호도 요청의 형태와 인증 방식에 맞춰 설계한다.

다음은 **프레임워크 중립 의사코드**다.

```text
handleRequest(request):
  identity = validateSessionOrToken(request)
  require(identity != null)
  resource = loadTopicProgress(request.topicId)
  require(resource.userId == identity.userId)
  validateInput(request.body)
  persistAllowedChange(resource)
```

JWT 검증은 허용 알고리즘·서명·issuer·audience·만료 등을 포함하고 단순 decode와 다르다. 브라우저 OAuth 흐름은 authorization code와 PKCE, state·정확한 redirect 검증을 사용하며 OIDC에는 nonce와 ID token 검증을 포함한다. 최신 보안 권고와 라이브러리 문서를 따른다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"web-auth","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 API가 로그인 여부만 확인하고 path의 user ID로 DB를 조회한다. 인증은 됐지만 소유권 인가가 빠진 BOLA/IDOR다. 사용자가 직접 요청 ID를 바꿀 수 있다는 전제로 테스트해야 한다.

**수정:** user ID는 검증된 세션에서 유도하고 리소스 소유권을 서버·DB RLS에서 확인한다. Supabase RLS의 `TO authenticated`만으로 소유권은 제한되지 않는다. `auth.uid() = user_id` 등의 조건을 사용하고 user-editable metadata를 권한 근거로 쓰지 않는다.

**재검증:** 별도 테스트 사용자 두 명의 읽기·갱신·RPC를 검사한다. 토큰 만료·갱신·세션 종료도 확인하되 운영 사용자 진도를 임의 변경하지 않는다. 응답 캐시가 사용자 데이터를 섞지 않는지도 점검한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"web-auth","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 방식 | 이득 | 비용 |
|---|---|---|
| 서버 세션 | 중앙 revoke·상태 제어 | 저장소·고가용성 |
| 짧은 access token | 검증 분산 가능 | revoke·claim 신선도·키 회전 |
| refresh 세션 | 짧은 토큰과 재인증 균형 | 회전·재사용 탐지·기기 관리 |

권한 변경이 즉시 반영되어야 하는 작업에는 JWT claim만 믿는 정책의 신선도를 검토한다. 세션 저장·캐시·CDN·감사 로그를 사용자별로 격리한다. service role 키는 브라우저에 넣지 않는다. 외부 로그인 제공자가 성공해도 앱의 계정 연결·조직 권한·탈퇴 처리는 별도다.

참고: [OAuth Security BCP RFC 9700](https://www.rfc-editor.org/rfc/rfc9700), [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"인증과 인가의 관계로 정확한 것은?","choices":["로그인하면 모든 리소스에 권한","쿠키는 항상 인가 규칙","JWT payload는 항상 암호화","신원 확인 뒤 리소스·행위별 권한을 별도 검증"],"answer_index":3,"explanation":"인증은 신원, 인가는 허용 행위를 다룹니다. 토큰과 쿠키 형식만으로 소유권·업무 권한이 생기지 않습니다."},{"level":2,"question":"JWT decode와 검증의 차이는?","choices":["검증은 서명·issuer·audience·만료 등 계약을 확인","decode만으로 신뢰 가능","JWT는 알고리즘 확인 불필요","payload 읽기는 암호 해제"],"answer_index":0,"explanation":"decode는 내용 읽기일 뿐입니다. 신뢰할 발급자·대상·알고리즘·유효기간과 서명을 검증해야 합니다."},{"level":3,"question":"Supabase TO authenticated만 있는 RLS의 한계는?","choices":["로그인도 불가능","행의 사용자 소유권을 자동 제한하지 않음","모든 사용자 행이 암호화","service role을 브라우저에 제공"],"answer_index":1,"explanation":"역할 제한은 인증 조건이지 소유권 조건이 아닙니다. auth.uid와 user_id 같은 행별 인가를 함께 적용합니다."},{"level":4,"question":"짧은 JWT 기반 권한에서 추가 검토할 것은?","choices":["토큰 길이만","모든 로그에 토큰 공개","revoke·claim 신선도·키 회전·세션 정책","권한 변경은 무관"],"answer_index":2,"explanation":"서명 토큰은 만료까지 유효할 수 있고 claim도 낡을 수 있습니다. 업무의 즉시 권한 변경 요구에 맞는 세션 검증을 설계합니다."}]
