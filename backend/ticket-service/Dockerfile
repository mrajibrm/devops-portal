# Build Stage
FROM golang:1.20-alpine AS builder

WORKDIR /app

COPY . .
RUN go mod tidy
RUN go build -o ticket-service main.go

# Runtime Stage
FROM alpine:latest
WORKDIR /root/

COPY --from=builder /app/ticket-service .

EXPOSE 8080

CMD ["./ticket-service"]
