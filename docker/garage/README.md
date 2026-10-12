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

# Grant that key read+write+owner on the bucket (owner is required for
# admin operations like the CORS policy the backend applies on every boot
# — see "CORS is automatic" below; --read --write alone is not enough)
docker compose exec garage /garage bucket allow --read --write --owner futbolio-uploads --key <AWS_ACCESS_KEY_ID>
```

Re-running these is safe (idempotent) except `layout apply` — if you ever
re-assign the layout, bump `--version` each time.

## CORS is automatic

Bucket CORS (needed for the frontend's direct-to-storage presigned uploads)
is no longer a manual step here — the backend container runs
`python manage.py configure_storage_cors` on every boot (see the `backend`
service's `command:` in docker-compose.yml/docker-compose.prod.yml), which
idempotently applies the policy from `CORS_ALLOWED_ORIGINS`. Nothing to do
in this bootstrap beyond the bucket/key steps above.

## The public endpoint (required for uploads to work at all)

Every presigned URL the backend hands to a browser (upload PUTs, admin
file views/downloads, exports) is signed against
`AWS_S3_PUBLIC_ENDPOINT_URL`, which must be a host the **browser** can
reach — never `AWS_S3_ENDPOINT_URL`'s compose-internal hostname
(`http://garage:3900`), which only resolves between containers on the
compose network. Getting this wrong doesn't error loudly: presign
requests still succeed, but every resulting URL's host is unreachable
from outside the server, so uploads/downloads just silently fail in the
browser.

Local dev: `docker-compose.yml` publishes Garage's port to the host
(`GARAGE_PORT`, default 3900), so `AWS_S3_PUBLIC_ENDPOINT_URL=http://localhost:3900`
just works.

Production: publish the same port on the host (already wired via
`GARAGE_PORT` in `docker-compose.yml`, defaults to 3900 bound to
`127.0.0.1` only) and point a public hostname at it through whatever
reverse proxy/tunnel already fronts `futbolio.az`/`api.futbolio.az` (e.g.
a Cloudflare Tunnel "Public Hostname" entry: `storage.futbolio.az` →
`http://localhost:3900`, the same pattern already used for the frontend
and backend ports). Then set `AWS_S3_PUBLIC_ENDPOINT_URL=https://storage.futbolio.az`
in the production `.env` and restart `backend`.

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
