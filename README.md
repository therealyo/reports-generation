## PREPARATIONS

Before you start deploying it to your own aws account you need:

1. Create lambda layer for generating pdf:

   - Create or you can use already created S3 bucket. We will need it further.
   - Go to nodejs/node16 folder and run:
     ```bash
     npm install
     ```
   - Zip **nodejs/node16/node_modules** folder and upload it to S3 bucket from step 1.
   - Go to AWS Lambda Console and create layer here using uploaded zip from previous step.
   - Copy its ARN and put it in environment

2. Verify domain that you own in AWS SES Console. Put domain name to _*.env*_
3. Verify email that will receive reports in AWS SES. Put it to _*.env*_ in **SEND_TO** variable

## DEPLOYMENT

To deploy application run following commands:

```bash
    npm install
    npm run sst:deploy
```

## POST-DEPLOYMENT

After successful deployment secret with database credentials will appear at AWS Secrets Manager.

To run migration:

1. Go to AWS Secrets Manager and retrieve database credentials from newly created secret.
2. Set values from secret to _.env_:
   - **DB_USERNAME** to username value of the secret
   - **DB_PORT** to port value of the secret
   - **DB_HOST** to host value of the secret
   - **DB_NAME** to dbname value of the secret
   - **DB_PASSWORD** to password value of the secret
3. Run:

```bash
npm run migrate-database
```

<!-- Run migrations from migrations folder. -->

## ENVIRONMENT

### `LAMBDA_LAYER_ARN`

ARN of created lambda layer

### `ACCESS_KEY`

access_key of the IAM user with required permissions

### `SECRET_ACCESS_KEY`

secret_access_key of the IAM user with required permissions

### `SEND_TO`

Email that will receive reports. Must be verified in AWS SES or belong to verified domain name

### `SOURCE_EMAIL`

Email that will send reports. Must be verified in AWS SES or belong to verified domain name

### `DOMAIN_NAME`

Name of domain that you own. Must be verified in AWS SES

### `BUCKET_NAME`

Name of bucket that will store incoming user data(XLSX files)

### `AUTHENTICATION`

Authentication for AroFlo api

### `AUTHORIZATION`

Authorization for AroFlo api

## DONT FORGET TO ADD IT TO .ENV

### `DB_USERNAME`

### `DB_PASSWORD`

### `DB_HOST`

### `DB_PORT`

### `DB_NAME`
