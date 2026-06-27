; ===========================================================================
; Inventario de Ansible — GENERADO por Terraform (no editar a mano).
; Origen: terraform/outputs.tf -> local_file.ansible_inventory
; Regenerar: terraform apply
; ===========================================================================

[db]
quetxal-db ansible_host=${db_host}

[db:vars]
ansible_user=${ssh_user}
db_internal_ip=${db_internal_ip}
%{ if enable_dev ~}

[dev_gateway]
quetxal-dev-gateway ansible_host=${gateway_host}

[dev_services]
quetxal-dev-services ansible_host=${services_host} ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ProxyCommand="ssh -W %h:%p -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${ssh_user}@${gateway_host}"'

[dev:children]
dev_gateway
dev_services

[dev:vars]
ansible_user=${ssh_user}
%{ endif ~}

[all:vars]
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
