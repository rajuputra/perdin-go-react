FROM node:24-alpine AS frontend
WORKDIR /src
COPY perdin/package.json perdin/package-lock.json ./
RUN npm ci
COPY perdin/ ./
RUN npm run build

FROM golang:1.26.11-alpine AS backend
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /out/dinasflow .

FROM alpine:3.24 AS api
WORKDIR /app
COPY --from=backend /out/dinasflow /app/dinasflow
USER 65534:65534
ENTRYPOINT ["/app/dinasflow"]

FROM caddy:2.11.8-alpine AS web
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend /src/dist /srv
