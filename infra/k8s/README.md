# Kubernetes — Stub (Phase 7)

Platzhalter. In Phase 7 entstehen hier:

- `namespace.yaml`
- `postgres.yaml` (oder externer Managed-DB-Verweis), `redis.yaml`, `minio.yaml`
- `api-deployment.yaml` + `api-service.yaml` + HPA
- `web-deployment.yaml` + `web-service.yaml`
- `ingress.yaml` (TLS via cert-manager)
- `configmap.yaml` / `secret.yaml` (extern verwaltet, z.B. Sealed Secrets)

Ziel: horizontale Skalierung von API (WS via Redis-Adapter) und Web,
Rolling-Updates, Health-Probes auf `/api/v1/health`.
