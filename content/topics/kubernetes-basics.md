<!-- level:1 -->
# Kubernetes — 원하는 상태와 실제 상태를 맞추기

관리자가 “앱 세 개를 항상 실행”이라고 정하면 시스템은 실제 상태를 관측하고 부족한 것을 만들려고 한다. Kubernetes는 선언한 원하는 상태를 controller가 반복 조정하는 오케스트레이션 시스템이다. Pod는 함께 스케줄되는 컨테이너 단위, Deployment는 주로 stateless Pod 복제를 관리하고 Service는 접근을 추상화한다.

```mermaid
flowchart LR
  D["원하는 replicas"] --> C["Controller reconciliation"]
  C --> P["Pod 실제 상태"] --> C
```

Pod가 새로 만들어져도 주소가 같다고 기대하지 않는다. Service와 label selector로 대상 집합을 찾는다. scheduler는 요청 자원·정책에 맞는 노드를 고른다. Kubernetes가 앱의 업무 데이터 복구나 멱등성을 자동 구현하지는 않는다.

**비유의 한계:** 선언 후 즉시 모든 상태가 맞는 것은 아니다. 이미지 pull·자원 부족·설정 오류·장애 때문에 수렴하지 못할 수 있고 관측·알림이 필요하다.
<!-- level:2 -->
# Deployment, probe, resource의 계약

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
