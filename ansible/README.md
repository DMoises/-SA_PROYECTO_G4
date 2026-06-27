# Gestión de Configuración — Ansible (Quetxal TV · Fase 3)

> Tarea 8 del reparto. Aprovisiona de forma **agentless** (sólo SSH, sin instalar agentes) las VMs
> creadas por Terraform: instala Docker y dependencias, monta el disco persistente y levanta las
> bases de datos. Reemplaza los `startup-scripts` en bash de la Fase 2 por Playbooks declarativos e idempotentes.

## 1. ¿Qué es y cómo funciona?

Ansible automatiza la configuración de servidores conectándose por **SSH** y ejecutando módulos de Python
de forma temporal en el host remoto: **no requiere agentes** instalados. La unidad de trabajo es el
**Playbook** (YAML), que aplica **Roles** (conjuntos reutilizables de *tasks*) sobre los hosts de un
**Inventario**. Las tareas son **idempotentes**: aplicar el playbook varias veces converge al mismo estado.

## 2. Estructura

```
ansible/
├── ansible.cfg                     # inventario por defecto, SSH, become
├── inventory/
│   ├── hosts.gen.ini               # GENERADO por Terraform (IPs reales) — gitignored
│   └── hosts.example.ini           # ejemplo manual
├── group_vars/
│   ├── all.yml                     # variables comunes (no secretas)
│   ├── db_secrets.example.yml      # plantilla de contraseñas -> copiar a db_secrets.yml
│   ├── dev_gateway.yml / dev_services.yml
├── roles/
│   ├── common/                     # apt, paquetes base, timezone, logrotate
│   ├── docker/                     # disco persistente + Docker CE + Compose plugin
│   ├── db_server/                  # 7 Postgres + Redis vía docker-compose.db.yml + systemd
│   └── dev_vm/                     # repo + .env.cloud + systemd (gateway/services)
└── playbooks/
    ├── site.yml                    # db.yml + dev.yml
    ├── db.yml                      # VM de Base de Datos
    └── dev.yml                     # VMs de desarrollo
```

## 3. Requisitos previos

```bash
pip install ansible            # o: sudo apt install ansible
# Terraform ya generó inventory/hosts.gen.ini y dejó tu llave SSH en las VMs.
cp group_vars/db_secrets.example.yml group_vars/db_secrets.yml
$EDITOR group_vars/db_secrets.yml                 # pon las contraseñas reales
ansible-vault encrypt group_vars/db_secrets.yml   # (recomendado) cifrar
# Edita group_vars/all.yml -> dockerhub_username
```

## 4. Uso paso a paso

```bash
cd ansible

# Verificar conectividad SSH (agentless):
ansible all -m ping

# Provisionar SÓLO la VM de base de datos:
ansible-playbook playbooks/db.yml --ask-vault-pass        # 📸 captura del log

# Provisionar las VMs de desarrollo:
ansible-playbook playbooks/dev.yml --ask-vault-pass

# Todo de una vez:
ansible-playbook playbooks/site.yml --ask-vault-pass

# Simulación sin aplicar cambios (dry-run):
ansible-playbook playbooks/db.yml --check --diff --ask-vault-pass
```

## 5. Qué hace cada rol

- **common**: actualiza apt, instala utilidades base, fija la zona horaria y configura `logrotate` para los logs de Docker.
- **docker**: en la VM de BD formatea y monta el disco persistente `quetxal-db-data` en `/var/lib/docker`
  (así los volúmenes de las BD sobreviven al ciclo de los contenedores), luego instala Docker CE + el plugin de Compose.
- **db_server**: renderiza `.env` (secretos), copia `docker-compose.db.yml`, hace `docker compose pull && up -d`
  con las 7 Postgres + Redis e instala una unidad `systemd` para el arranque automático.
- **dev_vm**: clona el repo, renderiza `.env.cloud` apuntando a la IP interna de la VM de BD e instala la unidad `systemd`.

## 6. Notas

- 🔒 Los secretos viven en `group_vars/db_secrets.yml` (gitignored, idealmente cifrado con `ansible-vault`).
  Nunca se suben al repositorio (requisito de la tarea 10).
- La VM de servicios es privada: el inventario generado por Terraform añade `ProxyJump` por la VM gateway.
- 📸 **Capturas obligatorias** para el documento: salida de `ansible all -m ping` y de los `ansible-playbook` (logs de las tasks).
