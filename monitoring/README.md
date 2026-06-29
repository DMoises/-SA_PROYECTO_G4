# Monitoreo — Prometheus & Grafana

Artefactos de la tarea 12 de Fase 3:

- `docker-compose.monitoring.yml`: stack alternativo para una VM con Docker.
- `monitoring/prometheus/prometheus.yml`: scraping de host, contenedores y probes HTTP.
- `monitoring/grafana/`: datasource y dashboard provisionados.
- `k8s/monitoring/`: despliegue recomendado para GKE.

## GKE

```bash
kubectl apply -k k8s/monitoring
kubectl -n monitoring get pods
kubectl -n monitoring port-forward svc/grafana 3001:3000
```

Abrir `http://localhost:3001` y entrar con `admin/admin` si no se creó el secreto
`grafana-admin`.

## VM con Docker

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Abrir Grafana en `http://<IP_VM>:3001` o por túnel SSH:

```bash
ssh -L 3001:localhost:3001 usuario@IP_VM
```
