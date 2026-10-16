<!-- level:1 -->
# Kubernetes 오케스트레이션 기초

> **오늘의 질문** · 원하는 앱 세 개 중 하나가 멈추면 누가 다시 채울까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"kubernetes-basics","view":"explore"}
```

## 익숙한 장면과 연결해요

매장 관리자가 ‘영업 가능한 창구 세 개를 유지하자’고 정했다고 생각해 보세요. 한 창구가 멈추면 다른 창구를 마련합니다. 목표와 실제 상태를 계속 비교하는 관리가 Kubernetes controller의 기본 관점입니다.

## 선생님과 한 번 정리해요

서버가 여러 대이고 앱이 자주 교체되면 사람이 매번 실행 위치와 재시작을 관리하기 어렵습니다. 준비 상태와 원하는 실행 수를 반복해서 확인할 관리 체계가 필요합니다.

**한 줄로 말하면:** 앱의 실행 개수와 상태를 선언하면 관리자가 실제 상태를 관찰하며 그 목표에 맞추도록 조정합니다.

```learning
{"slug":"kubernetes-basics","view":"words"}
```

**비유의 한계도 알아둘까요?** 목표를 선언한다고 앱의 버그나 자료 정합성이 자동 해결되지는 않습니다. 환경이 목표를 충족할 자원이 있는지와 앱의 준비·종료·저장 규칙도 필요합니다.

```learning
{"slug":"kubernetes-basics","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **원하는 상태 → 실제 상태 → 차이 줄이기** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"kubernetes-basics","view":"trace"}
```

## 여기서 연결해 봐요

앱의 실행 개수와 상태를 선언하면 관리자가 실제 상태를 관찰하며 그 목표에 맞추도록 조정합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

<!-- classroom-reference:start -->
아래 YAML은 격리된 학습 클러스터용 최소 Deployment다. 운영에는 검증된 이미지 digest·보안·노출·관측 정책을 더한다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-lab
spec:
  replicas: 2
  selector:
    matchLabels: {app: web-lab}
  template:
    metadata:
      labels: {app: web-lab}
    spec:
      containers:
        - name: web
          image: nginx:alpine
          ports: [{containerPort: 80}]
          resources:
            requests: {cpu: 100m, memory: 32Mi}
            limits: {cpu: 500m, memory: 128Mi}
          readinessProbe:
            httpGet: {path: /, port: 80}
```

request는 스케줄링과 자원 분배 판단에, limit는 사용 상한과 관련된다. readiness는 요청을 받을 준비, liveness는 재시작 판단, startup probe는 초기 준비를 다룬다. 외부 DB 실패를 liveness에 그대로 연결하면 불필요한 재시작 폭주가 생길 수 있다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"kubernetes-basics","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 배포에서 Pod는 Running이지만 readiness가 실패하거나 Service selector가 label과 맞지 않는다. Running 상태만으로 업무 준비를 증명할 수 없다.

```bash
kubectl get pods -o wide
kubectl describe pod POD_NAME
kubectl get services,endpointslices
kubectl logs POD_NAME --previous
```

대상 namespace와 권한을 확인해 읽기 명령으로 상태를 조사한다. Pending이면 request와 노드 자원·정책, CrashLoopBackOff면 종료 원인과 설정, 연결 실패면 포트·selector·네트워크 정책을 나눠 본다.

**수정과 재검증:** 원인에 맞춰 label·port·probe·자원을 수정한다. rolling 배포 중 준비 상태·drain·종료 기한과 사용자 오류율을 확인한다. Pod 수만 늘려 잘못된 설정을 복제하지 않는다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"kubernetes-basics","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

<!-- classroom-reference:start -->
| 선택 | 이득 | 부담 |
|---|---|---|
| 단순 VM/컨테이너 배포 | 운영 요소 적음 | 확장·복구 자동화 직접 구성 |
| managed Kubernetes | 표준 선언·정책·확장 생태계 | RBAC·네트워크·업그레이드·온콜 |
| PaaS/serverless | 배포 운영 축소 | 플랫폼 제약·비용·이식성 |

HPA는 특정 지표로 replicas를 조정하지만 DB·큐·이미지 시작 비용까지 자동 해결하지 않는다. PDB는 자발적 중단의 조건을 다루며 모든 노드 장애를 막는 장치가 아니다. Secret 리소스를 사용해도 저장·로그·권한·암호화 정책을 검토한다.

**판단 연습:** 작은 팀의 API와 여러 팀의 다종 워크로드에 같은 플랫폼이 합리적일까? 배포 독립성·SLO·운영 인력·보안 정책을 기준으로 선택하자.

참고: [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), [Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"Kubernetes controller의 핵심 동작은?","choices":["업무 트랜잭션을 모두 자동 구현","원하는 상태와 실제 상태를 반복 조정","Pod 주소를 영구 고정","DB 오류를 모두 제거"],"answer_index":1,"explanation":"선언된 상태를 관측하고 조정합니다. 수렴 실패와 업무 데이터·멱등성 책임은 별도로 관리해야 합니다."},{"level":2,"question":"readiness와 liveness의 차이는?","choices":["완전히 동일","readiness가 모든 장애에서 재시작","요청 받을 준비와 재시작 판단을 구분","probe는 자원 제한"],"answer_index":2,"explanation":"준비되지 않은 Pod로 요청을 보내지 않는 판단과 재시작 필요성은 다릅니다. 잘못 연결하면 재시작 폭주가 생길 수 있습니다."},{"level":3,"question":"Running Pod인데 Service 연결이 없을 때 확인할 것은?","choices":["readiness·selector·대상 포트·EndpointSlice","replica만 무제한 증가","모든 정책 제거","로그 삭제"],"answer_index":0,"explanation":"실행 상태와 요청 준비·라우팅은 다릅니다. 대상 집합과 포트·정책을 단계별로 확인해야 합니다."},{"level":4,"question":"PDB의 보장 범위로 정확한 것은?","choices":["모든 물리 장애 방지","DB 데이터 복제","영구 주소 제공","자발적 중단 시 허용 disruption 조건"],"answer_index":3,"explanation":"PDB는 자발적 중단 관리에 쓰입니다. 예기치 않은 노드 장애나 모든 가용성을 자동 보장하지 않습니다."}]
