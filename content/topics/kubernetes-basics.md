<!-- level:1 -->
# Kubernetes — 원하는 실행 상태를 계속 맞춰 주기

> **한 문장으로:** 앱의 실행 개수와 상태를 선언하면 관리자가 실제 상태를 관찰하며 그 목표에 맞추도록 조정합니다.

## 왜 필요한가요?

서버가 여러 대이고 앱이 자주 교체되면 사람이 매번 실행 위치와 재시작을 관리하기 어렵습니다. 준비 상태와 원하는 실행 수를 반복해서 확인할 관리 체계가 필요합니다.

## 일상에서 떠올려 보기

매장 관리자가 ‘영업 가능한 창구 세 개를 유지하자’고 정했다고 생각해 보세요. 한 창구가 멈추면 다른 창구를 마련합니다. 목표와 실제 상태를 계속 비교하는 관리가 Kubernetes controller의 기본 관점입니다.

## 순서대로 따라가기

1. 실행할 앱과 원하는 복제 수 같은 목표 상태를 선언합니다.
2. 관리자가 실제 실행 상태를 관찰해 목표와 비교합니다.
3. 필요한 실행을 만들거나 교체하며 차이를 줄입니다. 앱이 실제 업무를 받을 준비가 됐는지도 별도로 확인합니다.

```mermaid
flowchart LR
 A["원하는 상태: 실행 3개"] --> B["실제 상태 확인"] --> C["차이 조정"] --> B
```

## 작은 예로 확인하기

목표가 3개인데 하나가 종료되면 관리 체계가 다시 3개에 맞추려 합니다. 하지만 살아 있는 프로세스가 데이터베이스 연결까지 준비됐다는 뜻은 아닙니다. 요청을 받을 준비 상태를 별도 검사해야 합니다.

## 처음 만나는 용어

| 용어 | 쉬운 뜻 |
|---|---|
| 클러스터 | 함께 관리하는 여러 실행 서버의 묶음입니다. |
| Pod | 함께 실행하고 관리하는 컨테이너의 기본 단위입니다. |
| Deployment | Pod의 원하는 수와 교체 방식을 관리하는 선언입니다. |
| controller | 원하는 상태와 실제 상태의 차이를 반복해서 조정하는 관리 부분입니다. |

**비유의 한계:** 목표를 선언한다고 앱의 버그나 자료 정합성이 자동 해결되지는 않습니다. 환경이 목표를 충족할 자원이 있는지와 앱의 준비·종료·저장 규칙도 필요합니다.

## 스스로 확인

Kubernetes 관리자가 목표 세 개와 실제 두 개를 보고 하는 기본 동작은 무엇일까요?

**답과 이유:** 차이를 줄이도록 실행 상태를 조정하는 것입니다. 목표와 실제 상태를 반복 비교합니다.
<!-- level:2 -->
# Deployment, probe, resource의 계약

<!-- beginner-guide:start -->
## 읽기 전 길잡이

YAML에서는 앱 이미지, 복제 수, 검사 방식, 자원 설정을 먼저 찾으세요. 운영용 설정 전체가 아닌 학습용 선언입니다. 준비 검사와 생존 검사가 다른 질문을 한다는 점에 집중하세요.

## 이 단계에서 만날 말

| 용어 | 쉬운 뜻 |
|---|---|
| node | Pod를 실행하는 서버입니다. |
| probe | 앱의 상태를 확인하는 검사입니다. |
| readiness·liveness | 요청을 받을 준비 상태와 프로그램 생존 상태입니다. |
| requests·limits | 자원 배치에 참고하는 요청량과 사용 제한값입니다. |
| Service | 변하는 Pod들에 안정적으로 접근하도록 돕는 연결 방식입니다. |
| rolling update | 실행들을 순차적으로 새 버전으로 교체하는 방식입니다. |

<!-- beginner-guide:end -->

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
<!-- level:3 -->
# 가상 장애 — Service에 요청했는데 응답이 없다

<!-- beginner-guide:start -->
## 읽기 전 길잡이

새 버전 교체 중 요청이 실패하면 Pod가 준비 전에 요청을 받았는지, 종료 전에 기존 요청을 끝낼 시간을 가졌는지 따라가세요.

<!-- beginner-guide:end -->

가상 배포에서 Pod는 Running이지만 readiness가 실패하거나 Service selector가 label과 맞지 않는다. Running 상태만으로 업무 준비를 증명할 수 없다.

```bash
kubectl get pods -o wide
kubectl describe pod POD_NAME
kubectl get services,endpointslices
kubectl logs POD_NAME --previous
```

대상 namespace와 권한을 확인해 읽기 명령으로 상태를 조사한다. Pending이면 request와 노드 자원·정책, CrashLoopBackOff면 종료 원인과 설정, 연결 실패면 포트·selector·네트워크 정책을 나눠 본다.

**수정과 재검증:** 원인에 맞춰 label·port·probe·자원을 수정한다. rolling 배포 중 준비 상태·drain·종료 기한과 사용자 오류율을 확인한다. Pod 수만 늘려 잘못된 설정을 복제하지 않는다.
<!-- level:4 -->
# 오케스트레이션 도입의 비용

<!-- beginner-guide:start -->
## 읽기 전 길잡이

자동 관리가 주는 이득과 클러스터 운영·설정·관측 비용을 비교합니다. 단순한 배포 환경으로 충분한지, 여러 서비스의 조정 요구가 실제로 있는지를 기준으로 선택하세요.

<!-- beginner-guide:end -->

| 선택 | 이득 | 부담 |
|---|---|---|
| 단순 VM/컨테이너 배포 | 운영 요소 적음 | 확장·복구 자동화 직접 구성 |
| managed Kubernetes | 표준 선언·정책·확장 생태계 | RBAC·네트워크·업그레이드·온콜 |
| PaaS/serverless | 배포 운영 축소 | 플랫폼 제약·비용·이식성 |

HPA는 특정 지표로 replicas를 조정하지만 DB·큐·이미지 시작 비용까지 자동 해결하지 않는다. PDB는 자발적 중단의 조건을 다루며 모든 노드 장애를 막는 장치가 아니다. Secret 리소스를 사용해도 저장·로그·권한·암호화 정책을 검토한다.

**판단 연습:** 작은 팀의 API와 여러 팀의 다종 워크로드에 같은 플랫폼이 합리적일까? 배포 독립성·SLO·운영 인력·보안 정책을 기준으로 선택하자.

참고: [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), [Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).
<!-- quizzes -->
[{"level":1,"question":"Kubernetes controller의 핵심 동작은?","choices":["업무 트랜잭션을 모두 자동 구현","원하는 상태와 실제 상태를 반복 조정","Pod 주소를 영구 고정","DB 오류를 모두 제거"],"answer_index":1,"explanation":"선언된 상태를 관측하고 조정합니다. 수렴 실패와 업무 데이터·멱등성 책임은 별도로 관리해야 합니다."},{"level":2,"question":"readiness와 liveness의 차이는?","choices":["완전히 동일","readiness가 모든 장애에서 재시작","요청 받을 준비와 재시작 판단을 구분","probe는 자원 제한"],"answer_index":2,"explanation":"준비되지 않은 Pod로 요청을 보내지 않는 판단과 재시작 필요성은 다릅니다. 잘못 연결하면 재시작 폭주가 생길 수 있습니다."},{"level":3,"question":"Running Pod인데 Service 연결이 없을 때 확인할 것은?","choices":["readiness·selector·대상 포트·EndpointSlice","replica만 무제한 증가","모든 정책 제거","로그 삭제"],"answer_index":0,"explanation":"실행 상태와 요청 준비·라우팅은 다릅니다. 대상 집합과 포트·정책을 단계별로 확인해야 합니다."},{"level":4,"question":"PDB의 보장 범위로 정확한 것은?","choices":["모든 물리 장애 방지","DB 데이터 복제","영구 주소 제공","자발적 중단 시 허용 disruption 조건"],"answer_index":3,"explanation":"PDB는 자발적 중단 관리에 쓰입니다. 예기치 않은 노드 장애나 모든 가용성을 자동 보장하지 않습니다."}]
