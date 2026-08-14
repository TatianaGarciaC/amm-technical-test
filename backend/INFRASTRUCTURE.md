# Infraestructura de PurchaseFlow

El [README principal](../README.md) es la fuente oficial. `serverless.yml` define HTTP API, Lambda, DynamoDB, S3 privado e IAM mediante Serverless Framework y CloudFormation.

## Requisitos de despliegue

- Node.js y npm.
- AWS CLI con un perfil autorizado.
- Permisos para desplegar el stack CloudFormation.
- Autenticación o licencia de Serverless Framework cuando corresponda.

```bash
aws sts get-caller-identity
npm run deploy -- --stage dev --region us-east-1
```

La política CORS abierta y `/mock-mail` existen para la demostración técnica. En producción deben restringirse al origen del frontend y protegerse o eliminarse. La consulta de correo por solicitud usa actualmente DynamoDB Scan; una evolución productiva debería incorporar una clave o GSI apropiado.
