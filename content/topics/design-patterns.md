<!-- level:1 -->
# 핵심 디자인 패턴

> **오늘의 질문** · 물건 만들기와 새 소식 알리기는 같은 문제일까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"design-patterns","view":"explore"}
```

## 익숙한 장면과 연결해요

음식점에서 음식 조리 담당, 주문 변경 알림 담당, 공용 설정 관리자를 따로 생각해 보세요. Factory는 만드는 곳을 모으고, Observer는 알림을 받을 사람을 등록하고, Singleton은 정해진 범위에서 인스턴스를 하나로 관리하는 방식에 가깝습니다.

## 선생님과 한 번 정리해요

객체를 어디서 만들지, 여러 기능에 변경을 어떻게 알릴지 같은 문제는 반복됩니다. 검토할 수 있는 해결 방법과 공통 설명 언어가 있으면 팀이 설계를 이야기하기 쉽습니다.

**한 줄로 말하면:** 자주 만나는 생성·상태·알림 문제에 이름 붙인 설계 방법을 참고해 코드를 구성합니다.

```learning
{"slug":"design-patterns","view":"words"}
```

**비유의 한계도 알아둘까요?** 패턴 이름을 많이 쓰면 좋은 설계가 되는 것은 아닙니다. 작은 문제는 간단한 함수로 충분할 수 있고, Singleton은 여러 서버의 공유 데이터 일관성을 자동으로 보장하지 않습니다.

```learning
{"slug":"design-patterns","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **문제 찾기 → 책임 나누기 → 실제 조건 확인** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"design-patterns","view":"trace"}
```

## 여기서 연결해 봐요

자주 만나는 생성·상태·알림 문제에 이름 붙인 설계 방법을 참고해 코드를 구성합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
Factory는 설정·환경에 따른 생성 로직을 사용 코드 밖으로 이동시킬 수 있다. 객체 수명을 누가 소유하고 닫는지 함께 정한다. Observer는 상태 변경 이후 어떤 이벤트를 누구에게 어떤 보장으로 전달하는지 정의한다.

Python 3 예제는 Factory의 최소 형태다.

```python
class JsonWriter:
    def write(self, value):
        import json
        return json.dumps(value)
class TextWriter:
    def write(self, value): return str(value)
def writer(kind):
    factories = {"json": JsonWriter, "text": TextWriter}
    if kind not in factories: raise ValueError("unsupported format")
    return factories[kind]()
assert writer("json").write({"ok": True}) == '{"ok": true}'
```

단순한 생성 함수만으로 요구가 해결되면 복잡한 Factory 계층을 만들 필요가 없다. Singleton 초기화의 스레드 안전성과 테스트 격리는 별도 문제다. Observer에서는 콜백 실행 중 구독 목록 변경, 재진입, 예외 전파를 처리해야 한다. 네트워크 이벤트 버스는 메모리 안 콜백과 달리 전달 중복·지연·손실을 다룬다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"design-patterns","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 UI가 화면 마운트마다 구독하지만 닫을 때 해제하지 않는다. 발행자는 이전 화면의 콜백과 상태를 붙잡고 있어 중복 알림과 메모리 증가가 발생한다.

**진단:** 화면 열기·닫기를 반복하며 구독자 수와 콜백 호출 수를 확인한다. 힙 스냅샷의 참조 경로와 이벤트 등록 지점을 연결한다. 비동기 콜백이 화면 종료 후 실행되는 경로도 확인한다.

**수정:** subscribe가 해제 함수를 반환하도록 하고 수명주기에 맞춰 실행한다. 콜백 실패 정책·순서·중복 등록을 명시한다. Singleton 공유 상태 때문에 테스트가 서로 영향을 주면 상태를 주입하거나 테스트별 수명을 분리한다.

**재검증:** 반복 마운트·해제, 예외 콜백, 구독 중 등록 변경을 테스트하고 구독자 수가 초기 수준으로 돌아오는지 확인한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"design-patterns","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 구조 | 쓰기 좋은 상황 | 비용 |
|---|---|---|
| Factory | 생성 정책이 여러 곳에서 바뀜 | 설정과 수명 소유권 |
| Observer | 변화와 소비자 결합을 줄임 | 순서·예외·해제·재진입 |
| Singleton | 명확한 프로세스 내부 공유 자원 | 전역 상태·테스트·동시성 |

분산 유일성 요구를 Singleton으로 해결하려 하지 않는다. 여러 서버가 하나의 작업을 수행해야 한다면 DB 제약·리더 선출·작업 lease 등 다른 계약이 필요하다. 패턴은 처음부터 일반화하기보다 실제 중복과 변경 압력을 발견했을 때 도입한다.

**판단 연습:** 한 프로세스의 설정 객체와 전 세계 한 번만 실행해야 하는 정산 작업을 같은 “하나”로 설명할 수 있을까? 범위·수명·실패 보장을 명시하자.

참고: [Python logging의 Logger 관리](https://docs.python.org/3/library/logging.html), [MDN EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"프로세스 내부 Singleton의 보장 범위는?","choices":["전 세계 서버 모두 하나","분산 DB가 자동 잠김","모든 사용자별 하나","해당 구현이 정의한 프로세스·모듈 수명 범위"],"answer_index":3,"explanation":"Singleton은 분산 유일성을 자동 제공하지 않습니다. 실행 프로세스와 모듈 수명에 따라 인스턴스 범위를 명시해야 합니다."},{"level":2,"question":"Factory가 직접 분리하는 책임은?","choices":["구현 객체를 생성·선택하는 결정","모든 업무 오류","네트워크 전달 보장","모든 상태 동기화"],"answer_index":0,"explanation":"생성 로직을 사용 코드 밖으로 옮길 수 있습니다. 객체의 수명과 실패 계약은 여전히 설계해야 합니다."},{"level":3,"question":"Observer 중복 알림과 참조 누수의 수정 출발점은?","choices":["구독을 무제한 추가","구독 해제와 수명주기 연결","GC 주기를 무조건 증가","모든 이벤트를 전역 공개"],"answer_index":1,"explanation":"발행자가 콜백 참조를 보유할 수 있습니다. 등록과 해제를 맞추고 중복·재진입·예외 정책도 정의합니다."},{"level":4,"question":"패턴 선택의 기준으로 적절한 것은?","choices":["패턴 이름 수 최대화","모든 코드에 동일 패턴","실제 문제·변경 축·수명·실패 계약","라이브러리 이름만 보고 선택"],"answer_index":2,"explanation":"패턴에는 관리 비용이 있습니다. 실제 반복 문제와 계약을 확인해 가장 단순하게 요구를 충족하는 구조를 선택합니다."}]
