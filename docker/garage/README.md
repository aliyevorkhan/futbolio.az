# Garage bootstrap (one-time, per environment)

Garage (the S3-compatible object storage used instead of MinIO — see the
comment in `docker-compose.yml`'s `garage` service for why) has no
"root user" bootstrap env vars the way MinIO did. A fresh environment needs
these one-time steps run once the `garage` container is up and healthy.

## 1. Generate the config

```
cd docker/garage
cp garage.toml.example garage.toml   # gitignored — never commit this file
```

Fill in `rpc_secret` (64 hex chars), `admin_token`, and `metrics_token` with
real random values, e.g.:

```
python3 -c "import secrets; print(secrets.token_hex(32))"   # rpc_secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"   # admin_token / metrics_token
```

## 2. Bring the stack up

```
docker compose up -d garage
docker compose logs -f garage   # wait for "Database is ready"
```

## 3. Bootstrap the layout, bucket, and key

Pick the SAME access key id / secret you put in `.env`'s
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, then:

```
# Find this node's id
docker compose exec garage /garage node id -q
# -> e.g. 1a2b3c4d...@127.0.0.1:3901, use just the part before the first "@"

# Assign it a zone + capacity (single-node dev/small-prod setup)
docker compose exec garage /garage layout assign -z dc1 -c 5G <node_id>
docker compose exec garage /garage layout apply --version 1

# Create the bucket the app uses
docker compose exec garage /garage bucket create futbolio-uploads

# Import a deterministic key (matches AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY in .env)
docker compose exec garage /garage key import <AWS_ACCESS_KEY_ID> <AWS_SECRET_ACCESS_KEY> -n futbolio-app --yes

# Grant that key read+write on the bucket
docker compose exec garage /garage bucket allow --read --write futbolio-uploads --key <AWS_ACCESS_KEY_ID>
```

Re-running these is safe (idempotent) except `layout apply` — if you ever
re-assign the layout, bump `--version` each time.

## 4. Verify

```
docker compose up -d backend
docker compose exec backend python manage.py shell -c "
from common.storage import presign_put, presign_get
url = presign_put('smoke-test.txt', 'text/plain')
print(url)
"
```
Then `curl -X PUT -T somefile.txt "<that url>"` from the host and confirm it
succeeds (200/204) — that's the whole presigned-upload path working
end-to-end against Garage.
